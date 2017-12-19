const fs = require("fs");

const content = fs.readFileSync("settings.json");
const storage = JSON.parse(content);
const braintreePrivateKey = storage.braintreePrivateKey;

module.exports.braintreePrivateKey = braintreePrivateKey;