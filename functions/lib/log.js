"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWarn = exports.logInfo = void 0;
const config_1 = __importDefault(require("./config"));
function logInfo(msg, ...rest) {
    if (msg && config_1.default.logLevel === "info") {
        console.info(`INFO: firestore-messagebird-send-msg: ${msg}`, ...rest);
    }
}
exports.logInfo = logInfo;
function logWarn(msg, ...rest) {
    if (msg && (config_1.default.logLevel === "warn" || config_1.default.logLevel === "info")) {
        console.warn(`WARN: firestore-messagebird-send-msg: ${msg}`, ...rest);
    }
}
exports.logWarn = logWarn;
