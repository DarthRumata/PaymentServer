const express = require('express');
const stripeRouter = express.Router();
const customerRouter = express.Router();
const storage = require("../secure_storage");
const stripe = require("stripe")(
  storage.stripeSecretKey
);

stripeRouter.use('/customer', customerRouter);

customerRouter.post('/', (req, res, next) => {
  const {firstName, lastName, company, email} = req.body;
  stripe.customers.create(
    {
      metadata: {firstName, lastName, company},
      email,
      account_balance: 15000
    },
    (err, result) => {
      console.log(`err: ${err}, result: ${JSON.stringify(result)}`);
      if (result) {
        res.send(JSON.stringify({data: {customer_id: result.id}}))
      } else {
        next(err);
      }
    });
});

customerRouter.post('/:id/charge', (req, res, next) => {
  const { id } = req.params;
  const { source, amount } = req.body;
  if (!id || !source) {
    res.status(400).end();
    return;
  }

  stripe.charges.create({
    amount,
    currency: 'usd',
    customer: id,
    source
  }, (err, charge) => {
    console.log(`err: ${err}, result: ${JSON.stringify(charge)}`);
    if (charge) {
      res.send(JSON.stringify({data: {success: true}}))
    } else {
      next(err)
    }
  })
});

stripeRouter.post('/token', function (req, res, next) {
  const {api_version, customer_id} = req.body;
  if (!api_version || !customer_id) {
    res.status(400).end();
    return;
  }
  stripe.ephemeralKeys.create(
    {customer: customer_id},
    {stripe_version: api_version}
  ).then((key) => {
    res.status(200).json(key);
  }).catch((err) => {
    next(err);
  });
});

module.exports = stripeRouter;