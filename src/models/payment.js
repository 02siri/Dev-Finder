const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    paymentId: {
        type: String,
    },
    productId: {
        type: String,
        required: true,
    },
    priceId: {
        type: String,
        required: true,
    },

    name: {
        type: String,
    },

    description: {
        type: String,
    },

    amount: {
        type: Number, // in cents
        required: true,
    },

    currency: {
        type: String,
        required: true,
    },

    type: {
        type: String, // service / physical
    },

    metadata: {
        type: Object,
        default: {},
    },

    active: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
    },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);