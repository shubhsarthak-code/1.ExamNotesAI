import Razorpay from "razorpay";
import crypto from "crypto";
import UserModel from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const CREDIT_MAP = {
  100: 50,
  200: 120,
  500: 300,
};

// Create Razorpay Order
export const createCreditsOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount } = req.body;

    if (!CREDIT_MAP[amount]) {
      return res.status(400).json({
        message: "Invalid credit plan",
      });
    }

    const options = {
      amount: amount * 100, // paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
        credits: CREDIT_MAP[amount],
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      credits: CREDIT_MAP[amount],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Unable to create Razorpay order",
    });
  }
};

// Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);

    const userId = order.notes.userId;
    const creditsToAdd = Number(order.notes.credits);

    await UserModel.findByIdAndUpdate(
      userId,
      {
        $inc: {
          credits: creditsToAdd,
        },
        $set: {
          isCreditAvailable: true,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};