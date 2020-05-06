"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
    log_1.logInfo('initializing app...');
    admin.initializeApp();
    log_1.logInfo('initializing db...');
    db = admin.firestore();
    log_1.logInfo('initializing messagebird client...');
    mb = messagebird_1.default(config_1.default.accessKey);
    log_1.logInfo('initialization finished successfuly');
}
function deliver(payload, ref) {
    return __awaiter(this, void 0, void 0, function* () {
        const update = {
            "delivery.attempts": admin.firestore.FieldValue.increment(1),
            "delivery.endTime": admin.firestore.FieldValue.serverTimestamp(),
            "delivery.error": null,
            "delivery.leaseExpireTime": null,
        };
        try {
            if (!payload.recipients.length) {
                throw new Error("Failed to deliver sms. Expected at least 1 recipient.");
            }
            payload.originator = payload.originator || config_1.default.defaultOriginator;
            yield new Promise((resolve, reject) => {
                mb.messages.create(payload, function (err, response) {
                    if (err) {
                        return reject(err);
                    }
                    // TODO: update delivery state when message delivered or delivery failed, we may need to use status URL for this
                    log_1.logInfo(`send successfully scheduled, got response: `, response);
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
        return admin.firestore().runTransaction((transaction) => {
            transaction.update(ref, update);
            return Promise.resolve();
        });
    });
}
function processCreate(snap) {
    return __awaiter(this, void 0, void 0, function* () {
        log_1.logInfo('new msg added, init delivery object for it');
        return admin.firestore().runTransaction((transaction) => {
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
        log_1.logInfo('processing write');
        if (!change.after.exists) {
            log_1.logInfo('ignoring delete');
            return null;
        }
        if (!change.before.exists && change.after.exists) {
            log_1.logInfo('process create');
            return processCreate(change.after);
        }
        log_1.logInfo('processing update');
        const payload = change.after.data();
        switch (payload.delivery.state) {
            case "SUCCESS":
            case "ERROR":
                log_1.logInfo('current state is SUCCESS/ERROR');
                return null;
            case "PROCESSING":
                log_1.logInfo('current state is PROCESSING');
                if (payload.delivery.leaseExpireTime && payload.delivery.leaseExpireTime.toMillis() < Date.now()) {
                    return admin.firestore().runTransaction((transaction) => {
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
                log_1.logInfo('current state is PENDING/RETRY');
                yield admin.firestore().runTransaction((transaction) => {
                    transaction.update(change.after.ref, {
                        "delivery.state": "PROCESSING",
                        "delivery.leaseExpireTime": admin.firestore.Timestamp.fromMillis(Date.now() + 60000),
                    });
                    return Promise.resolve();
                });
                log_1.logInfo('record set to PROCESSING state, trying to deliver the message');
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
        log_1.logWarn('unexpected error during execution: ', err);
        return null;
    }
}));
