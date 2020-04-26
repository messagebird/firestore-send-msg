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
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const config_1 = require("./config");
;
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
    admin.initializeApp();
    db = admin.firestore();
    mb = require('messagebird')(config_1.default.accessKey);
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
            const result = yield mb.messages.create(payload, function (err, response) {
                if (err) {
                    return console.log(err);
                }
                console.log(response);
            });
            update["messageId"] = result.Id;
        }
        catch (e) {
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
        if (!change.after.exists) {
            return null;
        }
        if (!change.before.exists && change.after.exists) {
            return processCreate(change.after);
        }
        const payload = change.after.data();
        switch (payload.delivery.state) {
            case "SUCCESS":
            case "ERROR":
                return null;
            case "PROCESSING":
                if (payload.delivery.leaseExpireTime.toMillis() < Date.now()) {
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
                yield admin.firestore().runTransaction((transaction) => {
                    transaction.update(change.after.ref, {
                        "delivery.state": "PROCESSING",
                        "delivery.leaseExpireTime": admin.firestore.Timestamp.fromMillis(Date.now() + 60000),
                    });
                    return Promise.resolve();
                });
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
        return null;
    }
}));
