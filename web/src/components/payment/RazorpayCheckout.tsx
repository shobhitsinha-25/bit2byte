
import { useRef, useState } from "react";
import { toast } from "sonner";
import axios from "axios";

import { createPaymentOrder } from "../../services/payment.api";
import { loadRazorpayScript } from "../../services/razorpay-checkout";

interface RazorpayCheckoutProps {
  bookingId: string;
  studentName?: string;
  studentEmail?: string;
}

interface RazorpayPaymentFailure {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    source?: string;
    step?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

const RazorpayCheckout = ({
  bookingId,
  studentName,
  studentEmail,
}: RazorpayCheckoutProps) => {
  const [loading, setLoading] = useState(false);

  const idempotencyKeyRef = useRef<string | null>(null);

  // Get the same key for this booking, even after a page refresh.
  const getIdempotencyKey = () => {
    if (idempotencyKeyRef.current) {
      return idempotencyKeyRef.current;
    }

    const storageKey = `bit2byte:payment-idempotency:${bookingId}`;

    let key = sessionStorage.getItem(storageKey);

    if (!key) {
      key = crypto.randomUUID();
      sessionStorage.setItem(storageKey, key);
    }

    idempotencyKeyRef.current = key;

    return key;
  };

  const handlePayment = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // 1. Load Razorpay Checkout.
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout");
      }

      // 2. Get or generate the idempotency key.
      const idempotencyKey = getIdempotencyKey();

      // 3. Create or retrieve the existing Razorpay order.
      const orderResponse = await createPaymentOrder(
        bookingId,
        idempotencyKey
      );

      const order = orderResponse.data;

      // 4. Configure Razorpay Checkout.
      const options: RazorpayCheckoutOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,

        name: "Bit2Byte",
        description: "Mentorship Session",

        order_id: order.orderId,

        prefill: {
          name: studentName,
          email: studentEmail,
        },

        theme: {
          color: "#2563EB",
        },

        // Razorpay returns payment details after checkout.
        handler: (response) => {
          console.log("Razorpay payment response:", response);

          toast.info(
            "Payment submitted. Waiting for server verification."
          );

          // Server-side payment verification will be handled separately.
          // Keep the idempotency key until payment is resolved.
        },

        modal: {
          ondismiss: () => {
            console.log("Razorpay Checkout closed");

            // Keep the same key for a retry.
          },
        },
      };

      // 5. Open Razorpay Checkout.
      const razorpay = new window.Razorpay(options);

      // 6. Handle payment failure safely.
      razorpay.on("payment.failed", (response: unknown) => {
        if (
          typeof response !== "object" ||
          response === null ||
          !("error" in response)
        ) {
          console.error("Unknown Razorpay payment failure:", response);
          toast.error("Payment failed. Please try again.");
          return;
        }

        const failure = response as RazorpayPaymentFailure;
        const description = failure.error?.description;

        console.error("Payment failed:", failure.error);

        toast.error(
          description || "Payment failed. Please try again."
        );

        // Keep the same idempotency key for a retry.
      });

      razorpay.open();
    } catch (error: unknown) {
      console.error("Payment initialization error:", error);

      let message = "Unable to initialize payment";

      if (axios.isAxiosError(error)) {
        message =
          error.response?.data?.message ||
          error.message ||
          message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Initializing Payment..." : "Pay Now"}
    </button>
  );
};

export default RazorpayCheckout;
