
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  IndianRupee,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  getMentorDetails,
  getMentorAvailability,
  type MentorDetails,
  type MentorAvailability,
} from "../services/mentor.api";

import {
  createPaymentOrder,
  verifyPayment,
} from "../../../../../web/src/services/payment.api";

import { loadRazorpay } from "../../Student/mentors/utils/loadRazorpay";

import {
  createBooking,
  type CreatedBooking,
} from "../services/booking.api";

export default function SessionBooking() {
  const { mentorId, availabilityId } = useParams<{
    mentorId: string;
    availabilityId: string;
  }>();

  const navigate = useNavigate();

  const [mentor, setMentor] = useState<MentorDetails | null>(null);
  const [slot, setSlot] = useState<MentorAvailability | null>(null);
  const [booking, setBooking] = useState<CreatedBooking | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    if (!mentorId || !availabilityId) {
      setError("Invalid booking details.");
      setLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const [mentorResponse, availabilityResponse] = await Promise.all([
          getMentorDetails(mentorId),
          getMentorAvailability(mentorId, {
            page: 1,
            limit: 50,
          }),
        ]);

        const selectedSlot =
          availabilityResponse.data.availability.find(
            (item) => item.id === availabilityId
          );

        if (!selectedSlot) {
          setError(
            "This session is no longer available. Please select another session."
          );
          return;
        }

        setMentor(mentorResponse.data.mentor);
        setSlot(selectedSlot);
      } catch (err) {
        console.error("Failed to fetch booking details:", err);
        setError("Unable to load booking details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [mentorId, availabilityId]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const formatAmount = (amount: string, currency: string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));


const handleConfirmBooking = async () => {
  if (!availabilityId || submitting || paymentVerified) return;

  try {
    setSubmitting(true);
    setError("");

    // Step 1: Create booking only if it doesn't already exist.
    let currentBooking = booking;

    if (!currentBooking) {
      const bookingResponse = await createBooking({
        availabilityId,
      });

      currentBooking = bookingResponse.data.booking;
      setBooking(currentBooking);
    }

    // Step 2: Load Razorpay Checkout.
    const razorpayLoaded = await loadRazorpay();

    if (!razorpayLoaded) {
      throw new Error(
        "Unable to load Razorpay Checkout. Please try again."
      );
    }

    // Step 3: Create Razorpay order.
    // Step 3: Create Razorpay order with an idempotency key.

const storageKey =
  `bit2byte:payment-idempotency:${currentBooking.id}`;

let idempotencyKey = sessionStorage.getItem(storageKey);

if (!idempotencyKey) {
  idempotencyKey = crypto.randomUUID();

  sessionStorage.setItem(storageKey, idempotencyKey);
}

const orderResponse = await createPaymentOrder(
  currentBooking.id,
  idempotencyKey
);

const {
  paymentId,
  orderId,
  amount,
  currency,
  keyId,
} = orderResponse.data;

console.log("Payment order created:", {
  paymentId,
  orderId,
  amount,
  currency,
});

    // Step 4: Configure Razorpay Checkout.
    const options = {
      key: keyId,
      amount,
      currency,
      name: "Bit2Byte",
      description: `Session with ${mentor?.name}`,
      order_id: orderId,

      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          setSubmitting(true);
          setError("");

          // Step 5: Verify payment on our backend.
          const verificationResponse = await verifyPayment({
            razorpay_payment_id:
              response.razorpay_payment_id,
            razorpay_order_id:
              response.razorpay_order_id,
            razorpay_signature:
              response.razorpay_signature,
          });

          if (
            verificationResponse.data.paymentStatus !==
              "SUCCESS" ||
            verificationResponse.data.bookingStatus !==
              "CONFIRMED"
          ) {
            throw new Error(
              "Payment verification could not confirm your booking."
            );
          }

          // Step 6: Update local booking state.
          setBooking((previousBooking) =>
            previousBooking
              ? {
                  ...previousBooking,
                  status: "CONFIRMED",
                }
              : previousBooking
          );

          setPaymentVerified(true);

          console.log(
            "Payment verified:",
            verificationResponse.data
          );
        } catch (error) {
          console.error("Payment verification failed:", error);

          setError(
            error instanceof Error
              ? error.message
              : "Payment verification failed. Please contact support if money was deducted."
          );
        } finally {
          setSubmitting(false);
        }
      },

      modal: {
        ondismiss: () => {
          setSubmitting(false);
          setError(
            "Payment was not completed. You can try again."
          );
        },
      },

      theme: {
        color: "#7C3AED",
      },
    };

    // Step 7: Open Checkout.
    const razorpay = new window.Razorpay(options);

    razorpay.open();

    setSubmitting(false);
  } catch (error) {
    console.error("Booking/payment failed:", error);

    const message =
      typeof error === "object" &&
      error !== null &&
      "response" in error
        ? (
            error as {
              response?: {
                data?: {
                  message?: string;
                };
              };
            }
          ).response?.data?.message
        : undefined;

    setError(
      message ||
        (error instanceof Error
          ? error.message
          : "Unable to proceed with payment. Please try again.")
    );

    setSubmitting(false);
  }
};


  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoaderCircle
          size={32}
          className="animate-spin text-violet-600"
        />
      </div>
    );
  }

  if (error && (!mentor || !slot) && !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-700"
        >
          <ArrowLeft size={18} />
          Go back
        </button>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-600">{error}</p>
          <button
            onClick={() => navigate("/student/mentors")}
            className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Find another mentor
          </button>
        </div>
      </div>
    );
  }

 
if (booking) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              paymentVerified
                ? "bg-emerald-100"
                : "bg-amber-100"
            }`}
          >
            {paymentVerified ? (
              <ShieldCheck
                size={32}
                className="text-emerald-600"
              />
            ) : (
              <Clock3
                size={32}
                className="text-amber-600"
              />
            )}
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            {paymentVerified
              ? "Booking confirmed!"
              : "Booking created!"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {paymentVerified
              ? "Your payment was successful and your session is confirmed."
              : "Your session has been reserved. Complete payment within 15 minutes to confirm your booking."}
          </p>

          <div className="mt-7 rounded-xl bg-slate-50 p-5 text-left">
            <div className="flex justify-between gap-4 py-2 text-sm">
              <span className="text-slate-500">
                Booking ID
              </span>
              <span className="break-all text-right font-medium text-slate-900">
                {booking.id}
              </span>
            </div>

            <div className="flex justify-between gap-4 py-2 text-sm">
              <span className="text-slate-500">Topic</span>
              <span className="text-right font-medium text-slate-900">
                {booking.availability.topic.name}
              </span>
            </div>

            <div className="flex justify-between gap-4 py-2 text-sm">
              <span className="text-slate-500">Amount</span>
              <span className="font-semibold text-slate-900">
                {formatAmount(
                  booking.amount,
                  booking.currency
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4 py-2 text-sm">
              <span className="text-slate-500">Status</span>
              <span
                className={`font-semibold ${
                  paymentVerified
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {paymentVerified
                  ? "CONFIRMED"
                  : booking.status}
              </span>
            </div>

            {!paymentVerified && booking.expiresAt && (
              <div className="flex justify-between gap-4 py-2 text-sm">
                <span className="text-slate-500">
                  Payment deadline
                </span>
                <span className="text-right font-medium text-slate-900">
                  {new Date(
                    booking.expiresAt
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {!paymentVerified && (
            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={submitting}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : (
                "Pay Now"
              )}
            </button>
          )}

          <button
            onClick={() => navigate("/student/sessions")}
            className={`${paymentVerified ? "mt-7" : "mt-3"} w-full rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50`}
          >
            Go to My Sessions
          </button>
        </div>
      </div>
    </div>
  );
}


  if (!mentor || !slot) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-700"
        >
          <ArrowLeft size={18} />
          Back to mentor
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Confirm your session
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review your session details before confirming your booking.
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Session details */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Your mentor
              </h2>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-violet-700">
                  {mentor.name
                    .split(" ")
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {mentor.name}
                    </h3>
                    {mentor.isVerified && (
                      <BadgeCheck
                        size={17}
                        className="text-emerald-600"
                      />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {mentor.headline || "Mentor"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Session details
              </h2>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Selected topic
                </p>
                <h3 className="mt-1 text-lg font-semibold text-violet-700">
                  {slot.topic.name}
                </h3>
              </div>

              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-50 p-2.5">
                    <CalendarDays
                      size={20}
                      className="text-violet-600"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Session date</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formatDate(slot.startAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-50 p-2.5">
                    <Clock3 size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Session time</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Booking summary */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Booking summary
            </h2>

            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-slate-500">Session fee</span>
              <span className="font-semibold text-slate-900">
                {formatAmount(String(slot.sessionFee), slot.currency)}
              </span>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Total amount
                </span>
                <span className="flex items-center font-bold text-slate-900">
                  <IndianRupee size={17} />
                  {Number(slot.sessionFee).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2 rounded-xl bg-emerald-50 p-3">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <p className="text-xs leading-5 text-emerald-700">
                Your session slot will be reserved when you confirm
                the booking. Payment must be completed within 15 minutes.
              </p>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
  <>
    <LoaderCircle size={19} className="animate-spin" />
    Processing...
  </>
) : (
  "Confirm Booking & Pay"
)}
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              You will proceed to payment in the next step.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
