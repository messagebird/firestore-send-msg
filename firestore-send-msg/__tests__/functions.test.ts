
import functionsConfig from "../functions/src/config";
import * as exportedFunctions from "../functions/src";

describe("firestore-send-msg", () => {
  test("functions configuration detected from environment variables", async () => {
    expect(functionsConfig).toMatchSnapshot();
  });

  test("functions are exported", () => {
    expect(exportedFunctions.processQueue).toBeInstanceOf(Function);
  });
});