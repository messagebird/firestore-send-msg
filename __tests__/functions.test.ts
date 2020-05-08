import * as functions from "firebase-functions";
import functionsTestInit from "firebase-functions-test";

import functionsConfig from "../functions/src/config";
import * as exportedFunctions from "../functions/src";

const functionsTest = functionsTestInit();

const mockQueryResponse = jest.fn();
mockQueryResponse.mockResolvedValue([
  {
    id: 1,
  },
]);
const updateMock = jest.fn();

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  firestore: function firestore() {
    (firestore as any).FieldValue = {
      increment: (v) => v,
      serverTimestamp: () => "serverTimestamp",
    };
    (firestore as any).Timestamp = {
      fromMillis: () => 0,
    };
    return {
      collection: jest.fn((path) => ({
        where: jest.fn((queryString) => ({
          get: mockQueryResponse,
        })),
      })),
      runTransaction: jest.fn((transaction) =>
        transaction({
          update: updateMock,
        })
      ),
    };
  },
}));

jest.mock("messagebird", () => () => ({
  conversations: {
    start: (payload, callback) => {
      callback(null, { id: "fakeConversationsResponse" });
    },
  },
}));

describe("firestore-send-msg", () => {
  beforeEach(() => {
    updateMock.mockReset();
  });

  it("functions configuration detected from environment variables", async () => {
    expect(functionsConfig).toMatchSnapshot();
  });

  it("functions are exported", () => {
    expect(exportedFunctions.processQueue).toBeInstanceOf(Function);
  });

  it("successfully invokes function and ignores delete", async () => {
    const wrapped = functionsTest.wrap(exportedFunctions.processQueue);
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: false,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    expect(await wrapped(change)).toBeUndefined();
  });

  it("successfully invokes function and processes create", async () => {
    const wrapped = functionsTest.wrap(exportedFunctions.processQueue);
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: false,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    expect(await wrapped(change)).toBeUndefined();
    expect(updateMock).toHaveBeenCalledWith(null, {
      delivery: {
        attempts: 0,
        error: null,
        startTime: "serverTimestamp",
        state: "PENDING",
      },
    });
  });

  it("successfully invokes function and ignores update with finished status", async () => {
    const wrapped = functionsTest.wrap(exportedFunctions.processQueue);
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(() => ({
          delivery: {
            state: "SUCCESS",
          },
        })),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    expect(await wrapped(change)).toBeUndefined();
  });

  it("successfully invokes function and processes update in pending state", async () => {
    const wrapped = functionsTest.wrap(exportedFunctions.processQueue);
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(() => ({
          delivery: {
            state: "PENDING",
          },
        })),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    expect(await wrapped(change)).toBeUndefined();
    expect(updateMock).toHaveBeenCalledWith(null, {
      "delivery.state": "PROCESSING",
      "delivery.leaseExpireTime": 0,
    });
    expect(updateMock).toHaveBeenCalledWith(null, {
      "delivery.attempts": 1,
      "delivery.endTime": "serverTimestamp",
      "delivery.leaseExpireTime": null,
      "delivery.state": "ERROR",
      "delivery.error":
        "Error: Failed to deliver message. ChannelId is not defined.",
    });
  });

  it("should send message and write update delivery status with success", async () => {
    const wrapped = functionsTest.wrap(exportedFunctions.processQueue);
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(() => ({
          channelId: "234567",
          content: {
            text: "test msg content",
          },
          type: "text",
          to: "+380975483753",
          delivery: {
            state: "PENDING",
          },
        })),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    expect(await wrapped(change)).toBeUndefined();
    expect(updateMock).toHaveBeenCalledWith(null, {
      "delivery.state": "PROCESSING",
      "delivery.leaseExpireTime": 0,
    });
    expect(updateMock).toHaveBeenCalledWith(null, {
      "delivery.attempts": 1,
      "delivery.endTime": "serverTimestamp",
      "delivery.leaseExpireTime": null,
      "delivery.state": "SUCCESS",
      messageId: "fakeConversationsResponse",
      "delivery.error": null,
    });
  });
});
