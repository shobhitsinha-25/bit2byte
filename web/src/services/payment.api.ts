
import api from "./api";

export interface CreatePaymentOrderResponse {
  success: boolean;
  message: string;
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data: {
    paymentId: string;
    bookingId: string;
    paymentStatus: string;
    bookingStatus: string;
    alreadyVerified: boolean;
  };
}

export const createPaymentOrder = async (
  bookingId: string,
  idempotencyKey: string
): Promise<CreatePaymentOrderResponse> => {
  const response = await api.post<CreatePaymentOrderResponse>(
    "/student/payments/create-order",
    { bookingId },
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );

  return response.data;
};

export const verifyPayment = async (
  payload: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  const response = await api.post<VerifyPaymentResponse>(
    "/student/payments/verify",
    payload
  );

  return response.data;
};
