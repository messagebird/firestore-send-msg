module.exports = async function () {
  process.env = Object.assign(process.env, {
    LOCATION: "europe-west1",
    ACCESS_KEY: "aaa",
    MSG_COLLECTION: "msg",
    DEFAULT_ORIGINATOR: "Marcel",
  });
};