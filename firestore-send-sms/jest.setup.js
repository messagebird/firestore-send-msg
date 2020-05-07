module.exports = async function () {
  process.env = Object.assign(process.env, {
    LOCATION: "europe-west1",
    ACCESS_KEY: "aaa",
    SMS_COLLECTION: "sms",
    DEFAULT_ORIGINATOR: "Marcel",
    LOG_LEVEL: "warn",
  });
};
