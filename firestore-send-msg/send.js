// TODO: move to jest tests

const firebase = require("@firebase/testing");

async function addDoc() {
  const app = firebase.initializeTestApp({
    projectId: "conversations-example",
    auth: { uid: "alice", email: "alice@example.com" }
  });

  const db = app.firestore();

  await db.collection('msg').add({
    body: 'test sms body',
    recipients: ['479056999'],
    originator: 'test'
  });

  console.log('document successfully added...');
  process.exit(-1);
}

addDoc();