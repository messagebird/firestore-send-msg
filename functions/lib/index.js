"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const messagebird_1 = __importDefault(require("messagebird"));
const config_1 = __importDefault(require("./config"));
const log_1 = require("./log");
let db;
let mb;
let initialized = false;
/**
 * Initializes Admin SDK & MessageBird client if not already initialized.
 */
function initialize() {
    if (initialized === true)
        return;
    initialized = true;
    log_1.logInfo("initializing app...");
    admin.initializeApp();
    log_1.logInfo("initializing db...");
    db = admin.firestore();
    log_1.logInfo("initializing mb api client...");
    mb = messagebird_1.default(config_1.default.accessKey, undefined, ["ENABLE_FIREBASE_PLUGIN"]);
    log_1.logInfo("initialization finished successfully");
}
function deliver(payload, ref) {
    return __awaiter(this, void 0, void 0, function* () {
        const update = {
            "delivery.attempts": admin.firestore.FieldValue.increment(1),
            "delivery.endTime": admin.firestore.FieldValue.serverTimestamp(),
            "delivery.error": null,
            "delivery.leaseExpireTime": null,
        };
        log_1.logInfo("delivery attempt");
        try {
            if (!payload.channelId) {
                throw new Error("Failed to deliver message. ChannelId is not defined.");
            }
            if (!payload.to) {
                throw new Error("Failed to deliver message. Recipient of the message should be filled.");
            }
            if (!payload.content) {
                throw new Error("Failed to deliver message. Message content is empty.");
            }
            log_1.logInfo(`sending message to channelId: ${payload.channelId}`);
            log_1.logInfo(`with content:`, payload.content);
            yield new Promise((resolve, reject) => {
                mb.conversations.start(payload, function (err, response) {
                    if (err) {
                        log_1.logWarn(`send failed, got error: ${err}`);
                        return reject(err);
                    }
                    log_1.logInfo(`send successfully scheduled, got response: ${response}`);
                    update["messageId"] = response.id;
                    update["delivery.state"] = "SUCCESS";
                    resolve();
                });
            });
        }
        catch (e) {
            log_1.logInfo(`updating delivery record with error message`);
            update["delivery.state"] = "ERROR";
            update["delivery.error"] = e.toString();
        }
        return db.runTransaction((transaction) => {
            transaction.update(ref, update);
            return Promise.resolve();
        });
    });
}
function processCreate(snap) {
    return __awaiter(this, void 0, void 0, function* () {
        log_1.logInfo("new msg added, init delivery object for it");
        return db.runTransaction((transaction) => {
            transaction.update(snap.ref, {
                delivery: {
                    startTime: admin.firestore.FieldValue.serverTimestamp(),
                    state: "PENDING",
                    attempts: 0,
                    error: null,
                },
            });
            return Promise.resolve();
        });
    });
}
function processWrite(change) {
    return __awaiter(this, void 0, void 0, function* () {
        log_1.logInfo("processing write");
        if (!change.after.exists) {
            log_1.logInfo("ignoring delete");
            return null;
        }
        if (!change.before.exists && change.after.exists) {
            log_1.logInfo("process create");
            return processCreate(change.after);
        }
        const payload = change.after.data();
        log_1.logInfo("processing update");
        if (!payload.delivery) {
            log_1.logInfo("ignoring empty delivery update");
            return null;
        }
        switch (payload.delivery.state) {
            case "SUCCESS":
            case "ERROR":
                log_1.logInfo("current state is SUCCESS/ERROR");
                return null;
            case "PROCESSING":
                log_1.logInfo("current state is PROCESSING");
                if (payload.delivery.leaseExpireTime.toMillis() < Date.now()) {
                    return db.runTransaction((transaction) => {
                        transaction.update(change.after.ref, {
                            "delivery.state": "ERROR",
                            error: "Message processing lease expired.",
                        });
                        return Promise.resolve();
                    });
                }
                return null;
            case "PENDING":
            case "RETRY":
                log_1.logInfo("current state is PENDING/RETRY");
                yield db.runTransaction((transaction) => {
                    transaction.update(change.after.ref, {
                        "delivery.state": "PROCESSING",
                        "delivery.leaseExpireTime": admin.firestore.Timestamp.fromMillis(Date.now() + 60000),
                    });
                    return Promise.resolve();
                });
                log_1.logInfo("record set to PROCESSING state, trying to deliver the message");
                return deliver(payload, change.after.ref);
        }
    });
}
exports.processQueue = functions.handler.firestore.document.onWrite((change) => __awaiter(void 0, void 0, void 0, function* () {
    initialize();
    try {
        yield processWrite(change);
    }
    catch (err) {
        log_1.logWarn("unexpected error during execution: ", err);
        return null;
    }
}));
