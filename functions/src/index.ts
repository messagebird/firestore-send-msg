import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import messagebird, {
  StartConversationParameter,
  MessageBird,
} from "messagebird";

import config from "./config";
import { logInfo, logWarn } from "./log";

interface QueuePayload extends StartConversationParameter {
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
  logInfo("initializing app...");
  admin.initializeApp();
  logInfo("initializing db...");
  db = admin.firestore();
  logInfo("initializing mb api client...");
  mb = messagebird(config.accessKey, undefined, ["ENABLE_FIREBASE_PLUGIN"]);
  logInfo("initialization finished successfully");
}

async function deliver(
  payload: QueuePayload,
  ref: FirebaseFirestore.DocumentReference
): Promise<void> {
  const update = {
    "delivery.attempts": admin.firestore.FieldValue.increment(1),
    "delivery.endTime": admin.firestore.FieldValue.serverTimestamp(),
    "delivery.error": null,
    "delivery.leaseExpireTime": null,
  };
  logInfo("delivery attempt");

  try {
    if (!payload.channelId) {
      throw new Error("Failed to deliver message. ChannelId is not defined.");
    }

    if (!payload.to) {
      throw new Error(
        "Failed to deliver message. Recipient of the message should be filled."
      );
    }

    if (!payload.content) {
      throw new Error("Failed to deliver message. Message content is empty.");
    }

    logInfo(`sending message to channelId: ${payload.channelId}`);
    logInfo(`with content:`, payload.content);

    await new Promise<void>((resolve, reject) => {
      mb.conversations.start(payload, function (err, response) {
        if (err) {
          logWarn(`send failed, got error: ${err}`);
          return reject(err);
        }
        logInfo(`send successfully scheduled, got response: ${response}`);
        update["messageId"] = response.id;
        update["delivery.state"] = "SUCCESS";
        resolve();
      });
    });
  } catch (e) {
    logInfo(`updating delivery record with error message`);
    update["delivery.state"] = "ERROR";
    update["delivery.error"] = e.toString();
  }

  return db.runTransaction((transaction) => {
    transaction.update(ref, update);
    return Promise.resolve();
  });
}

async function processCreate(snap: FirebaseFirestore.DocumentSnapshot) {
  logInfo("new msg added, init delivery object for it");
  return db.runTransaction((transaction) => {
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

async function processWrite(
  change: functions.Change<functions.firestore.DocumentSnapshot>
) {
  logInfo("processing write");
  if (!change.after.exists) {
    logInfo("ignoring delete");
    return null;
  }

  if (!change.before.exists && change.after.exists) {
    logInfo("process create");
    return processCreate(change.after);
  }

  const payload = change.after.data() as QueuePayload;
  logInfo("processing update");

  if (!payload.delivery) {
    logInfo("ignoring empty delivery update");
    return null;
  }

  switch (payload.delivery.state) {
    case "SUCCESS":
    case "ERROR":
      logInfo("current state is SUCCESS/ERROR");
      return null;
    case "PROCESSING":
      logInfo("current state is PROCESSING");
      if (payload.delivery.leaseExpireTime.toMillis() < Date.now()) {
        return db.runTransaction((transaction) => {
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
      logInfo("current state is PENDING/RETRY");
      await db.runTransaction((transaction) => {
        transaction.update(change.after.ref, {
          "delivery.state": "PROCESSING",
          "delivery.leaseExpireTime": admin.firestore.Timestamp.fromMillis(
            Date.now() + 60000
          ),
        });
        return Promise.resolve();
      });
      logInfo("record set to PROCESSING state, trying to deliver the message");
      return deliver(payload, change.after.ref);
  }
}

export const processQueue = functions.handler.firestore.document.onWrite(
  async (change) => {
    initialize();
    try {
      await processWrite(change);
    } catch (err) {
      logWarn("unexpected error during execution: ", err);
      return null;
    }
  }
);
