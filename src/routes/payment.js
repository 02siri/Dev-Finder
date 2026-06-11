const express = require("express");
const { userAuth } = require("../middlewares/auth");
const paymentRouter = express.Router();
const stripeInstance = require("../utils/stripe");
const Payment = require("../models/payment");
const { membershipAmount } = require("../utils/constants");
const User = require("../models/user");

paymentRouter.post("/payment/createProduct", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, emailId } = req.user;
    const { membershipType } = req.body;
    const currency = "aud";
    const amount = membershipAmount[membershipType.toLowerCase()];

    // 1. Create Stripe Product
    const product = await stripeInstance.products.create({
      name: `${membershipType} Membership`,
      metadata: { firstName, lastName, emailId, membershipType },
    });

    // 2. Create Stripe Price
    const price = await stripeInstance.prices.create({
      unit_amount: amount,
      currency,
      product: product.id,
    });

    // 3. Create Stripe Checkout Session 
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: emailId, // prefill email on Stripe's page
      success_url: `http://localhost:5173/payment-success`,
      cancel_url: `http://localhost:5173/premium`,
    });

    // 4. Save Payment record to DB 
    const payment = new Payment({
      userId,
      paymentId: session.id,   // store Checkout Session ID here for now
      productId: product.id,
      priceId: price.id,
      name: `${membershipType} Membership`,
      description: `${membershipType} plan`,
      amount,
      currency,
      metadata: { membershipType, firstName, lastName, emailId },
      status: "pending",
      active: true,
    });

    await payment.save();

    // 5. Return the Checkout URL to the frontend
    return res.json({ checkoutUrl: session.url });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: err.message || "Internal Server Error" });
  }
});

//Stripe will call this route, so we don't need the 'userAuth' here
paymentRouter.post("/payment/webhook", async(req,res)=>{

//The Stripe-Signature header is a security mechanism that Stripe includes 
// with every webhook request to prove the event actually came from Stripe 
// and wasn't tampered with.
// What it contains:
//a timestamp and one or more cryptographic signatures
const sig = req.headers['stripe-signature'];
 let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
 } catch (err) {

    console.error("Webhook signature verification failed:", err.message);

    return res.status(400).send(
      `Webhook Error: ${err.message}`
    );
  }

  try {

  switch (event.type) {
      case "checkout.session.completed": {
        
        const session = event.data.object;
        console.log("Payment successful for session:",session.id);

        const payment = await Payment.findOne({
          paymentId: session.id,
        });

        if (!payment) {

          console.log("Payment record not found:",session.id);

          return res.status(200).json({
            received: true,
          });
        }

        // Prevent duplicate processing
        if (payment.status === "completed") {

          console.log("Payment already processed:",session.id);

          return res.status(200).json({
            received: true,
          });
        }

        // Update payment status
        payment.status = "completed";

        await payment.save();

        // Upgrade user
        const user = await User.findOne({_id: payment.userId});
        user.isPremium = true;
        user.membershipType = payment.metadata.membershipType;

        console.log(
          `${user.firstName} upgraded to Premium`
        );

        await user.save();
        break;
      }

      default:
        console.log(
          `Unhandled event type: ${event.type}`
        );
    }

    return res.status(200).json({
      received: true,
    });

  }
  
  catch (err) {
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
  
  // // Return a response to acknowledge receipt of the event
  // response.json({received: true});

});

paymentRouter.get("/premium/verify", userAuth, async(req,res)=>{
  const user = req.user.toJSON();
  console.log(user.isPremium);
  if(user.isPremium){
    return res.json({isPremium: true, user});
  }
  return res.json({isPremium: false, user});
});

module.exports = paymentRouter;