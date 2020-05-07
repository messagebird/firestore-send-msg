"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = __importDefault(require("./config"));
function logInfo(msg) {
    var rest = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        rest[_i - 1] = arguments[_i];
    }
    if (msg && config_1.default.logLevel === "info") {
        console.info.apply(console, __spreadArrays(["INFO: firestore-send-sms: " + msg], rest));
    }
}
exports.logInfo = logInfo;
function logWarn(msg) {
    var rest = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        rest[_i - 1] = arguments[_i];
    }
    if (msg && (config_1.default.logLevel === "warn" || config_1.default.logLevel === "info")) {
        console.warn.apply(console, __spreadArrays(["WARN: firestore-send-sms: " + msg], rest));
    }
}
exports.logWarn = logWarn;
