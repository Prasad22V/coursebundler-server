import { catchAsynchError } from "../middlewares/catchAsynchError.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import { instance } from "../server.js";
import ErrorHandler from "../utils/errorHandler.js";
import crypto from "crypto";

export const buySubscription = catchAsynchError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.role === "admin")
    return next(
      new ErrorHandler("Admin can't allowed to buy subscription", 400)
    );
  const plan_id = process.env.PLAN_ID || "plan_P8svxFFDKx4EU9";

  const subscription = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    total_count: 12,
  });

  user.subscription.id = subscription.id;

  user.subscription.status = subscription.status;

  await user.save();

  res.status(201).json({
    success: true,
    subscriptionId: subscription.id,
  });
});

export const paymentVerification = catchAsynchError(async (req, res, next) => {
  const { razorpay_signature, razorpay_subscription_id, razorpay_payment_id } =
    req.body;

  const user = await User.findById(req.user._id);

  const subscription_id = user.subscription.id;

  const genrated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

  const isAuthentic = genrated_signature == razorpay_signature;

  if (!isAuthentic)
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfailed`);

  // database comes here
  await Payment.create({
    razorpay_signature,
    razorpay_payment_id,
    razorpay_subscription_id,
  });

  user.subscription.status = "active";
  await user.save();

  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});

export const getRazorPayKey = catchAsynchError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});

export const cancelSubscription = catchAsynchError(async (req, res, next) => {
  try {
    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const subscriptionId = user.subscription.id;

    // Cancel the Razorpay subscription
    console.log("Cancelling subscription with ID:", subscriptionId);
    await instance.subscriptions.cancel(subscriptionId);

    // Find the associated payment record
    const payment = await Payment.findOne({
      razorpay_subscription_id: subscriptionId,
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    console.log("Found payment:", payment._id);

    const gap = Date.now() - payment.createdAt;
    const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;
    let refund = false;

    // Process refund if applicable
    if (refundTime > gap) {
      console.log("Refunding payment ID:", payment.razorpay_payment_id);
      await instance.payments.refund(payment.razorpay_payment_id);
      refund = true;
    }

    // Delete the payment record
    console.log("Deleting payment with ID:", payment._id);
    await Payment.findByIdAndDelete(payment._id);

    // Clear the user's subscription details
    user.subscription.id = undefined;
    user.subscription.status = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: refund
        ? "Subscription cancelled. You will receive a full refund within 7 days."
        : "Subscription cancelled. Refund initiated as it was after 7 days.",
    });
  } catch (error) {
    console.error("Error during subscription cancellation:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error during subscription cancellation",
    });
  }
});