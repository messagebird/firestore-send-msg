"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./config"));
function logInfo(msg) {
    if (msg && config_1.default.logLevel === 'info') {
        console.log(`INFO: firestore-send-msg: ${msg}`);
    }
}
exports.logInfo = logInfo;
function logWarn(msg) {
    if (msg && (config_1.default.logLevel === 'warn' || config_1.default.logLevel === 'info')) {
        console.log(`WARN: firestore-send-msg: ${msg}`);
    }
}
exports.logWarn = logWarn;
