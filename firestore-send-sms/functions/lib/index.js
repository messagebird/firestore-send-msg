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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var admin = __importStar(require("firebase-admin"));
var functions = __importStar(require("firebase-functions"));
var messagebird_1 = __importDefault(require("messagebird"));
var config_1 = __importDefault(require("./config"));
var log_1 = require("./log");
var db;
var mb;
var initialized = false;
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
    log_1.logInfo("initializing messagebird client...");
    mb = messagebird_1.default(config_1.default.accessKey);
    log_1.logInfo("initialization finished successfuly");
}
function deliver(payload, ref) {
    return __awaiter(this, void 0, void 0, function () {
        var update, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    update = {
                        "delivery.attempts": admin.firestore.FieldValue.increment(1),
                        "delivery.endTime": admin.firestore.FieldValue.serverTimestamp(),
                        "delivery.error": null,
                        "delivery.leaseExpireTime": null,
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    if (!payload.recipients.length) {
                        throw new Error("Failed to deliver sms. Expected at least 1 recipient.");
                    }
                    payload.originator = payload.originator || config_1.default.defaultOriginator;
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            mb.messages.create(payload, function (err, response) {
                                if (err) {
                                    return reject(err);
                                }
                                // TODO: update delivery state when message delivered or delivery failed, we may need to use status URL for this
                                log_1.logInfo("send successfully scheduled, got response: ", response);
                                update["messageId"] = response.id;
                                update["delivery.state"] = "SUCCESS";
                                resolve();
                            });
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    log_1.logInfo("updating delivery record with error message");
                    update["delivery.state"] = "ERROR";
                    update["delivery.error"] = e_1.toString();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, admin.firestore().runTransaction(function (transaction) {
                        transaction.update(ref, update);
                        return Promise.resolve();
                    })];
            }
        });
    });
}
function processCreate(snap) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            log_1.logInfo("new msg added, init delivery object for it");
            return [2 /*return*/, admin.firestore().runTransaction(function (transaction) {
                    transaction.update(snap.ref, {
                        delivery: {
                            startTime: admin.firestore.FieldValue.serverTimestamp(),
                            state: "PENDING",
                            attempts: 0,
                            error: null,
                        },
                    });
                    return Promise.resolve();
                })];
        });
    });
}
function processWrite(change) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    log_1.logInfo("processing write");
                    if (!change.after.exists) {
                        log_1.logInfo("ignoring delete");
                        return [2 /*return*/, null];
                    }
                    if (!change.before.exists && change.after.exists) {
                        log_1.logInfo("process create");
                        return [2 /*return*/, processCreate(change.after)];
                    }
                    log_1.logInfo("processing update");
                    payload = change.after.data();
                    _a = payload.delivery.state;
                    switch (_a) {
                        case "SUCCESS": return [3 /*break*/, 1];
                        case "ERROR": return [3 /*break*/, 1];
                        case "PROCESSING": return [3 /*break*/, 2];
                        case "PENDING": return [3 /*break*/, 3];
                        case "RETRY": return [3 /*break*/, 3];
                    }
                    return [3 /*break*/, 5];
                case 1:
                    log_1.logInfo("current state is SUCCESS/ERROR");
                    return [2 /*return*/, null];
                case 2:
                    log_1.logInfo("current state is PROCESSING");
                    if (payload.delivery.leaseExpireTime &&
                        payload.delivery.leaseExpireTime.toMillis() < Date.now()) {
                        return [2 /*return*/, admin.firestore().runTransaction(function (transaction) {
                                transaction.update(change.after.ref, {
                                    "delivery.state": "ERROR",
                                    error: "Message processing lease expired.",
                                });
                                return Promise.resolve();
                            })];
                    }
                    return [2 /*return*/, null];
                case 3:
                    log_1.logInfo("current state is PENDING/RETRY");
                    return [4 /*yield*/, admin.firestore().runTransaction(function (transaction) {
                            transaction.update(change.after.ref, {
                                "delivery.state": "PROCESSING",
                                "delivery.leaseExpireTime": admin.firestore.Timestamp.fromMillis(Date.now() + 60000),
                            });
                            return Promise.resolve();
                        })];
                case 4:
                    _b.sent();
                    log_1.logInfo("record set to PROCESSING state, trying to deliver the message");
                    return [2 /*return*/, deliver(payload, change.after.ref)];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.processQueue = functions.handler.firestore.document.onWrite(function (change) { return __awaiter(void 0, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                initialize();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, processWrite(change)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                log_1.logWarn("unexpected error during execution: ", err_1);
                return [2 /*return*/, null];
            case 4: return [2 /*return*/];
        }
    });
}); });
