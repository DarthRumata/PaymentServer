const fs = require("fs");

const content = fs.readFileSync("settings.json");
const storage = JSON.parse(content);
const braintreePrivateKey = storage.braintreePrivateKey;
const stripeSecretKey = storage.stripeSecretKey;

module.exports.braintreePrivateKey = braintreePrivateKey;
module.exports.stripeSecretKey = stripeSecretKey;