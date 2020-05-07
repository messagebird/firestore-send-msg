import config from "./config";

export function logInfo(msg: string, ...rest) {
  if (msg && config.logLevel === "info") {
    console.info(`INFO: firestore-send-sms: ${msg}`, ...rest);
  }
}

export function logWarn(msg: string, ...rest) {
  if (msg && (config.logLevel === "warn" || config.logLevel === "info")) {
    console.warn(`WARN: firestore-send-sms: ${msg}`, ...rest);
  }
}
