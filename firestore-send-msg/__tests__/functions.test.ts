
import * as firebase from '@firebase/testing';
import functionsConfig from "../functions/src/config";
import * as exportedFunctions from "../functions/src";

const projectId = 'conversations-example'
const app = firebase.initializeTestApp({
  projectId,
  auth: { uid: "alice", email: "alice@example.com" }
});
const db = app.firestore();

describe("firestore-send-msg", () => {
  beforeEach(async () => {
    // Clean database before each test
    await firebase.clearFirestoreData({ projectId });
  });

  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
  });

  test("functions configuration detected from environment variables", async () => {
    expect(functionsConfig).toMatchSnapshot();
  });

  test("functions are exported", () => {
    expect(exportedFunctions.processQueue).toBeInstanceOf(Function);
  });

  // you need to have emulator runnning for this test
  test("add to msg collection triggers processQueue function", async () => {
    // add new message to collection
    await db.collection('msg').add({
      channelId: '1234567890',
      type: 'text',
      content: {
        text: 'test message content'
      },
      to: '+380971234567',
    });

    // wait for extension to trigger
    await new Promise((r) => setTimeout(r, 2000));

    let allMsgs = await db.collection('msg').get();
    for(const doc of allMsgs.docs){
      console.log(doc.id, '=>', doc.data());
    }
  });
});
