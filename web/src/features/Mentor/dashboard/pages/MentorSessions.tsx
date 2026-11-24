
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  UserRound,
  BookOpen,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Wallet,
} from "lucide-react";

import DashboardLayout from "../../../../layout/DashboardLayout";
import api from "../../../../services/api";

type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "PAYMENT_FAILED";

type PayoutStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "ON_HOLD";

interface MentorSession {
  id: string;
  amount: string;
  currency: string;
  status: BookingStatus;
  createdAt: string;
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
  student: {
    id: string;
    name: string;
  };
  payments: {
    id: string;
    status: string;
    amount: string;
    currency: string;
  }[];
  mentorPayout: {
    amount: string;
    currency: string;
    status: PayoutStatus;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const filters = [
  { label: "All Sessions", value: "" },
  { label: "Upcoming", value: "CONFIRMED" },
  { label: "Pending Payment", value: "PENDING_PAYMENT" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Payment Failed", value: "PAYMENT_FAILED" },
];

const statusStyles: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-red-50 text-red-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  PAYMENT_FAILED: "bg-rose-50 text-rose-700",
};

const payoutStyles: Record<PayoutStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  ON_HOLD: "bg-slate-100 text-slate-600",
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatStatus = (status: string) =>
  status.replaceAll("_", " ");

export default function MentorSessions() {
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/mentor/sessions", {
          params: {
            page,
            limit: 10,
            ...(selectedStatus ? { status: selectedStatus } : {}),
          },
        });

        setSessions(response.data.data.bookings);
        setPagination(response.data.data.pagination);
      } catch (err) {
        console.error("Failed to fetch mentor sessions:", err);
        setError("Unable to load your sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [page, selectedStatus, refreshKey]);

  const handleFilterChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleCompleteSession = async (sessionId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to mark this session as completed?"
    );

    if (!confirmed) return;

    try {
      setCompletingId(sessionId);
      setActionError("");

      await api.patch(`/mentor/sessions/${sessionId}/complete`);

      // Reload the current page so booking and payout status are updated.
      setRefreshKey((current) => current + 1);
    } catch (err: any) {
      console.error("Failed to complete session:", err);

      setActionError(
        err?.response?.data?.message ||
          "Unable to complete this session. Please try again."
      );
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <DashboardLayout role="MENTOR">
      <div className="min-h-screen bg-slate-50 p-5 pb-24 sm:p-8 lg:p-10 lg:pb-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-violet-600">
            Mentor Portal
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            My Sessions
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage your student bookings, track earnings, and complete sessions.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.value || "all"}
              type="button"
              onClick={() => handleFilterChange(filter.value)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                selectedStatus === filter.value
                  ? "bg-violet-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Action Error */}
        {actionError && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError("")}
              className="text-sm font-semibold text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-64 items-center justify-center">
            <RefreshCw className="animate-spin text-violet-600" size={28} />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sessions.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
              <CalendarDays className="text-violet-600" size={26} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No sessions found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Your student bookings will appear here when students book your
              available sessions.
            </p>
          </div>
        )}

        {/* Session Cards */}
        {!loading && !error && sessions.length > 0 && (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {session.availability.topic.name}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[session.status]}`}
                      >
                        {formatStatus(session.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                      <UserRound size={16} className="text-slate-400" />
                      <span>Student: {session.student.name}</span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Session Earnings
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {session.currency}{" "}
                      {Number(session.amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <CalendarDays size={18} className="text-violet-500" />
                    <span>{formatDate(session.availability.startAt)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Clock3 size={18} className="text-violet-500" />
                    <span>
                      {formatTime(session.availability.startAt)} –{" "}
                      {formatTime(session.availability.endAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <BookOpen size={18} className="text-violet-500" />
                    <span>{session.availability.topic.name}</span>
                  </div>
                </div>

                {/* Payment and Payout Status */}
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  {session.payments[0] && (
                    <span className="text-xs text-slate-500">
                      Payment:{" "}
                      <span className="font-semibold text-slate-700">
                        {formatStatus(session.payments[0].status)}
                      </span>
                    </span>
                  )}

                  {session.mentorPayout && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        payoutStyles[session.mentorPayout.status]
                      }`}
                    >
                      <Wallet size={13} className="mr-1 inline" />
                      Payout: {formatStatus(session.mentorPayout.status)}
                    </span>
                  )}
                </div>

                {/* Complete Session */}
                {session.status === "CONFIRMED" && (
                  <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={completingId === session.id}
                      onClick={() => handleCompleteSession(session.id)}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {completingId === session.id ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {completingId === session.id
                        ? "Completing..."
                        : "Complete Session"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
              <span className="hidden sm:inline">
                {" "}· {pagination.total} sessions
              </span>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((current) => current - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
