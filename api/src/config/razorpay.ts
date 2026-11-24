
import "dotenv/config";
import Razorpay from "razorpay";

const rawKeyId = process.env.RAZORPAY_KEY_ID;
const rawKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!rawKeyId || !rawKeySecret) {
  throw new Error("Razorpay credentials are not configured");
}

// Explicitly declare validated values as strings.
const keyId: string = rawKeyId;
const keySecret: string = rawKeySecret;

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export { razorpay, keyId, keySecret };
