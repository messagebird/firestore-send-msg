import config from "./config";

export function logInfo(msg: string) {
  if (msg && config.logLevel === 'info') {
    console.log(`INFO: firestore-send-msg: ${msg}`)
  }
}

export function logWarn(msg: string) {
  if (msg && (config.logLevel === 'warn' || config.logLevel === 'info')) {
    console.log(`WARN: firestore-send-msg: ${msg}`)
  }
}