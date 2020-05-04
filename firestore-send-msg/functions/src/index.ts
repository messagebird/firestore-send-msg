import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import messagebird, { StartConversationParameter, MessageBird } from "messagebird";

import config from "./config";

// in https://github.com/messagebird/messagebird-nodejs/blob/master/types/messages.d.ts#L7 there is a better type definition
// we should try to make this plugin a very transparent proxy. Rsing the rest sdk type defs would be a step in that direction.
interface QueuePayload extends StartConversationParameter {
  messageId?: string;
  originator: string | number;
  body: string;
  recipients: string[];

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
  admin.initializeApp();
  db = admin.firestore();
  mb = messagebird(config.accessKey);
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

    // TODO: channel and content should come from payload
    await mb.conversations.start({
      'to': payload.recipients[0],
      'channelId': '6730dba0444b46d7976d44b57a8bb9e3' ,
      'type': 'text',
      'content': { 'text': 'Hello From Firebase extension!'  }
    }, function (err, response) {
      if (err) {
        throw err;
      }
      console.log('got response: ', response);
      update["messageId"] = response.id;
    });

  } catch (e) {
    update["delivery.state"] = "ERROR";
    update["delivery.error"] = e.toString();
  }

  return admin.firestore().runTransaction((transaction) => {
    transaction.update(ref, update);
    return Promise.resolve();
  });
}

async function processCreate(snap: FirebaseFirestore.DocumentSnapshot) {
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

async function processWrite(change) {
  if (!change.after.exists) {
    return null;
  }

  if (!change.before.exists && change.after.exists) {
    return processCreate(change.after);
  }

  const payload = change.after.data() as QueuePayload;

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
      await admin.firestore().runTransaction((transaction) => {
        transaction.update(change.after.ref, {
          "delivery.state": "PROCESSING",
          "delivery.leaseExpireTime": admin.firestore.Timestamp.fromMillis(
            Date.now() + 60000
          ),
        });
        return Promise.resolve();
      });
      return deliver(payload, change.after.ref);
  }
}

export const processQueue = functions.handler.firestore.document.onWrite(
  async (change) => {
    initialize();
    try {
      await processWrite(change);
    } catch (err) {
      return null;
    }
  }
);
