import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import messagebird, { MessageParameters, MessageBird } from "messagebird";

import config from "./config";
import { logInfo, logWarn } from "./log";

interface QueuePayload extends MessageParameters {
  messageId?: string;
  delivery?: {
    startTime: FirebaseFirestore.Timestamp;
    endTime: FirebaseFirestore.Timestamp;
    leaseExpireTime: FirebaseFirestore.Timestamp;
    state: "PENDING" | "PROCESSING" | "RETRY" | "SUCCESS" | "ERROR";
    attempts: number;
    error?: string;
  };
}

let db: FirebaseFirestore.Firestore;
let mb: MessageBird;
let initialized = false;

/**
 * Initializes Admin SDK & MessageBird client if not already initialized.
 */
function initialize() {
  if (initialized === true) return;
  initialized = true;
  logInfo('initializing app...')
  admin.initializeApp();
  logInfo('initializing db...')
  db = admin.firestore();
  logInfo('initializing messagebird client...')
  mb = messagebird(config.accessKey);
  logInfo('initialization finished successfuly')
}

async function deliver(
  payload: QueuePayload,
  ref: FirebaseFirestore.DocumentReference
): Promise<any> {
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

    payload.originator = payload.originator || config.defaultOriginator;

    await new Promise((resolve, reject) => {
      mb.messages.create(payload, function(err, response) {
        if (err) {
          return reject(err);
        }
        // TODO: update delivery state when message delivered or delivery failed, we may need to use status URL for this
        logInfo(`send successfully scheduled, got response: `, response)
        update["messageId"] = response.id;
        update["delivery.state"] = "SUCCESS";
        resolve();
      });
    })

  } catch (e) {
    logInfo(`updating delivery record with error message`)
    update["delivery.state"] = "ERROR";
    update["delivery.error"] = e.toString();
  }

  return admin.firestore().runTransaction((transaction) => {
    transaction.update(ref, update);
    return Promise.resolve();
  });
}

async function processCreate(snap: FirebaseFirestore.DocumentSnapshot) {
  logInfo('new msg added, init delivery object for it')
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
}

async function processWrite(change: functions.Change<functions.firestore.DocumentSnapshot>) {
  logInfo('processing write')
  if (!change.after.exists) {
    logInfo('ignoring delete')
    return null;
  }

  if (!change.before.exists && change.after.exists) {
    logInfo('process create')
    return processCreate(change.after);
  }

  logInfo('processing update')
  const payload = change.after.data() as QueuePayload;

  switch (payload.delivery.state) {
    case "SUCCESS":
    case "ERROR":
      logInfo('current state is SUCCESS/ERROR')
      return null;
    case "PROCESSING":
      logInfo('current state is PROCESSING')
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
      logInfo('current state is PENDING/RETRY')
      await admin.firestore().runTransaction((transaction) => {
        transaction.update(change.after.ref, {
          "delivery.state": "PROCESSING",
          "delivery.leaseExpireTime": admin.firestore.Timestamp.fromMillis(
            Date.now() + 60000
          ),
        });
        return Promise.resolve();
      });
      logInfo('record set to PROCESSING state, trying to deliver the message')
      return deliver(payload, change.after.ref);
  }
}

export const processQueue = functions.handler.firestore.document.onWrite(
  async (change) => {
    initialize();
    try {
      await processWrite(change);
    } catch (err) {
      logWarn('unexpected error during execution: ', err);
      return null;
    }
  }
);
