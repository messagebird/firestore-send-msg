import { logger } from "firebase-functions";

import config from "./config";

export function logInfo(msg: string, ...rest) {
  if (msg && config.logLevel === "info") {
    logger.info(`INFO: firestore-messagebird-send-msg: ${msg}`, ...rest);
  }
}

export function logWarn(msg: string, ...rest) {
  if (msg && (config.logLevel === "warn" || config.logLevel === "info")) {
    logger.warn(`WARN: firestore-messagebird-send-msg: ${msg}`, ...rest);
  }
}
