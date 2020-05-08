module.exports = {
  testPathIgnorePatterns: [
    ".*/bin/",
    ".*/lib/",
  ],
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/exts-test-data/**",
  ],
  maxConcurrency: 10,
  globalSetup: "./jest.setup.js",
  globalTeardown: "./jest.teardown.js",
};
