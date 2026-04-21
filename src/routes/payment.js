const express = require("express");
const {userAuth} = require("../middlewares/auth");
const paymentRouter = express.Router();
const stripeInstance = require("../utils/stripe");
const Payment = require("../models/payment");
const {membershipAmount} = require("../utils/constants");

paymentRouter.post("/payment/createProduct", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const {firstName, lastName, emailId} = req.user;
    const { membershipType } = req.body;
    const currency = "aud";
    const amount = membershipAmount[membershipType.toLowerCase()];;
 
    const product = await stripeInstance.products.create({
      name: `${membershipType} Membership`,
      metadata:{
        firstName,
        lastName,
        emailId,
        membershipType
      },
    });

    const price = await stripeInstance.prices.create({
      unit_amount: amount,
      currency,
      product: product.id,
    });

    const payment = new Payment({
      userId,
      productId: product.id,
      priceId: price.id,
      name: `${membershipType} Membership`,
      description: `${membershipType} plan`,
      amount,
      currency,
      metadata: {
        membershipType,
        firstName,
        lastName,
        emailId,
      },
      status: "pending",
      active: true,
    });

    const savedPayment = await payment.save();

    return res.json({
      ...savedPayment.toJSON()
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: err.message || "Internal Server Error",
    });
  }
});

module.exports = paymentRouter;