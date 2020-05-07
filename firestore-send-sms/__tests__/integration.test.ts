import * as firebase from "@firebase/testing";

const projectId = "sms-example";
const app = firebase.initializeTestApp({
  projectId,
  auth: { uid: "alice", email: "alice@example.com" },
});
const db = app.firestore();

// you need to have firebase emulator runnning for this tests
// firebase ext:dev:emulators:start --test-params=./test-params.env --project=sms-example
describe.skip("firestore-send-sms integration test", () => {
  beforeEach(async () => {
    // Clean database before each test
    await firebase.clearFirestoreData({ projectId });
  });

  afterAll(async () => {
    await Promise.all(firebase.apps().map((app) => app.delete()));
  });

  it("add to sms collection triggers processQueue function", async () => {
    // add new message to collection
    await db.collection("sms").add({
      body: "test message content",
      originator: "JestTest",
      recipients: ["+380973139857"],
    });

    // wait for extension to trigger
    await new Promise((r) => setTimeout(r, 2000));

    // should update delivery with state
    let allMsgs = await db.collection("sms").get();
    for (const doc of allMsgs.docs) {
      const data = doc.data();
      expect(data).toHaveProperty("delivery");
      expect(data.delivery).toHaveProperty("state");
      expect(data.delivery.state).toEqual("SUCCESS");
    }
  });
});
