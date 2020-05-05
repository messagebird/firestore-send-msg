
import * as firebase from '@firebase/testing';
import functionsConfig from "../functions/src/config";
import * as exportedFunctions from "../functions/src";

const projectId = 'conversations-example'
const app = firebase.initializeTestApp({
  projectId,
  auth: { uid: "alice", email: "alice@example.com" }
});
const db = app.firestore();

describe("firestore-send-sms", () => {
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
  test.skip("add to sms collection triggers processQueue function", async () => {
    // add new message to collection
    await db.collection('sms').add({
      originator: 'FunFacts',
      body: 'Fun Fact of the day: Dolly Parton lost in a Dolly Parton look-alike contest',
      recipients: [
        "+31617569806",
      ],
    });

    // wait for extension to trigger
    await new Promise((r) => setTimeout(r, 2000));

    // should update delivery with error state
    let allMsgs = await db.collection('sms').get();
    for(const doc of allMsgs.docs) {
      const data = doc.data()
      expect(data).toHaveProperty('delivery');
      expect(data.delivery).toHaveProperty('state');
      expect(data.delivery.state).toEqual('ERROR');
    }
  });
});
