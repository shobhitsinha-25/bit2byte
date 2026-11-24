
import { useRef, useState } from "react";
import { toast } from "sonner";

import { createPaymentOrder } from "../../services/payment.api";
import { loadRazorpayScript } from "../../services/razorpay-checkout";

interface RazorpayCheckoutProps {
  bookingId: string;
  studentName?: string;
  studentEmail?: string;
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
      const options: RazorpayOptions = {
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

          // Keep the idempotency key until payment is resolved.
          // Server-side verification will be integrated separately.
        },

        modal: {
          ondismiss: () => {
            console.log("Razorpay Checkout closed");

            // Do not remove the key.
            // A retry must reuse the same key.
          },
        },
      };

      // 5. Open Razorpay Checkout.
      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);

        toast.error(
          response.error.description || "Payment failed"
        );

        // Keep the same key for a retry of this attempt.
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment initialization error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to initialize payment"
      );
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
