
import api from "../../../services/api";

export interface CreateBookingRequest {
  availabilityId: string;
}

export interface CreatedBooking {
  id: string;
  studentId: string;
  availabilityId: string;
  amount: string;
  currency: string;
  status:
    | "PENDING_PAYMENT"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED"
    | "PAYMENT_FAILED";
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;

  availability: {
    id: string;
    startAt: string;
    endAt: string;
    topic: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface CreateBookingResponse {
  success: boolean;
  message: string;
  data: {
    booking: CreatedBooking;
  };
}

export const createBooking = async (
  payload: CreateBookingRequest
): Promise<CreateBookingResponse> => {
  const response = await api.post<CreateBookingResponse>(
    "/student/bookings",
    payload
  );

  return response.data;
};
