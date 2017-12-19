const express = require('express');
const brainTreeRouter = express.Router();
const customerRouter = express.Router();
const braintree = require("braintree");
const storage = require("../secure_storage");
const gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "t6g7rvhyyy4vkhyw",
  publicKey: "vnms8mms3vx7jx38",
  privateKey: storage.braintreePrivateKey
});

/* GET token. */
brainTreeRouter.get('/token', function (req, res, next) {
  const customerId = req.query.customer_id;
  if (!customerId) {
    next();
    return;
  }
  gateway.clientToken.generate({customerId}, (err, result) => {
    res.send(JSON.stringify({data: {token: result.clientToken}}));
  });
});

brainTreeRouter.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

brainTreeRouter.use('/customer', customerRouter);

customerRouter.post('/:id/payments', (req, res, next) => {
  const customerId = req.params.id;
  const {nonce, amount} = req.body;
  console.log(customerId);
  gateway.paymentMethod.create(
    {
      customerId: customerId,
      paymentMethodNonce: nonce,
      options: {
        verifyCard: true
      }
    }, (err, result) => {
      console.log(`err: ${err}, result: ${JSON.stringify(result)}`);
      if (result && result.success) {
        gateway.transaction.sale({
          paymentMethodToken: result.paymentMethod.token,
          amount
        }, (err, result) => {
          console.log(`err: ${err}, result: ${JSON.stringify(result)}`);
          if (result.success) {
            res.send(JSON.stringify(result.transaction))
          } else if (err) {
            next(err);
          } else {
            next(result.errors)
          }
        })
      } else if (err) {
        next(err);
      } else {
        next(result.errors)
      }
    });
});

customerRouter.post('/:id/subscriptions', (req, res, next) => {
  const customerId = req.params.id;
  const {planId} = req.body;
  gateway.customer.find(customerId, (err, customer) => {
    console.log(`err: ${err}, result: ${JSON.stringify(customer)}`);
    if (customer) {
      const defaultPaymentMethod = customer.paymentMethods.find((elem) => {
        return elem.default === true
      });
      gateway.subscription.create(
        {
          paymentMethodToken: defaultPaymentMethod.token,
          planId
        }, (err, result) => {
          console.log(`err: ${err}, result: ${JSON.stringify(result)}`);
          if (result && result.success) {
            res.send(JSON.stringify({data: {success: true}}))
          } else {
            next(err || result.errors);
          }
        }
      )
    } else {
      next(err)
    }
  })
});

customerRouter.post('/', (req, res, next) => {
  const {firstName, lastName, company, email} = req.body;
  gateway.customer.create({firstName, lastName, company, email}, (err, result) => {
    if (err) {
      console.log(err);
    }
    if (result && result.success === true) {
      res.send(JSON.stringify({data: {customer_id: result.customer.id}}))
    } else {
      next(err || result.errors);
    }
  });
});

customerRouter.post('/:id/paymentMethod', (req, res, next) => {
  const customerId = req.params.id;
  const {nonce} = req.body;
  gateway.paymentMethod.create(
    {
      customerId: customerId,
      paymentMethodNonce: nonce,
      options: {
        verifyCard: true
      }
    }, (err, result) => {
      console.log(`err: ${err}, result: ${JSON.stringify(result)}`);
      if (result && result.success) {
        res.send(JSON.stringify({data: {success: true}}))
      } else {
        next(err || result.errors);
      }
    });
});

customerRouter.get('/:id/transactions', (req, res, next) => {
  const customerId = req.params.id;
  const stream = gateway.transaction.search((search) => {
    search.customerId().is(customerId)
  });
  let transactions = [];
  stream.on("data", (transaction) => {
    transactions.push(transaction);
  });

  stream.on("end", () => {
    res.send(JSON.stringify({data: transactions}))
  });

  stream.on("error", (err) => {
    next(err);
  });
});

brainTreeRouter.post('/transaction/:id/refund', (req, res, next) => {
  const transactionId = req.params.id;

  gateway.transaction.refund(transactionId, (err, result) => {
    console.log(`err: ${err}, result: ${JSON.stringify(result)}`);
    if (result && result.success) {
      res.send(JSON.stringify({data: {success: true}}))
    } else {
      next(err);
    }
  })
});


module.exports = brainTreeRouter;
