module.exports = async function() {
  delete process.env.LOCATION;
  delete process.env.ACCESS_KEY;
  delete process.env.MSG_COLLECTION;
  delete process.env.DEFAULT_ORIGINATOR;
};
