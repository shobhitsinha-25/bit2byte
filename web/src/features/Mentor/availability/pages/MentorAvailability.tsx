
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  IndianRupee,
  RefreshCw,
  XCircle,
  Plus,
  Pencil,
  CalendarCheck,
  History,
  CalendarClock,
  LayoutGrid,
} from "lucide-react";

import DashboardLayout from "../../../../layout/DashboardLayout";

import AvailabilityForm from "../components/AvailabilityForm";

import {
  cancelAvailability,
  getMentorAvailability,
} from "../services/availability.api";

import type {
  Availability,
} from "../types/availability.types";

// =====================================
// FILTER TYPES
// =====================================

type AvailabilityFilter = "ALL" | "AVAILABLE" | "BOOKED" | "PAST";

// =====================================
// COMPONENT
// =====================================

const MentorAvailability = () => {
  const [availability, setAvailability] = useState<Availability[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [editingAvailability, setEditingAvailability] =
    useState<Availability | undefined>(undefined);

  const [activeFilter, setActiveFilter] =
    useState<AvailabilityFilter>("ALL");

  // =====================================
  // FETCH AVAILABILITY
  // =====================================

  const fetchAvailability = useCallback(async () => {
    try {
      setError("");

      const response = await getMentorAvailability();

      setAvailability(response.data.availability);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to fetch your availability"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // =====================================
  // OPEN CREATE FORM
  // =====================================

  const handleCreate = () => {
    setEditingAvailability(undefined);
    setShowForm(true);
  };

  // =====================================
  // OPEN EDIT FORM
  // =====================================

  const handleEdit = (item: Availability) => {
    setEditingAvailability(item);
    setShowForm(true);
  };

  // =====================================
  // HANDLE SUCCESSFUL SAVE
  // =====================================

  const handleAvailabilitySaved = async () => {
    setShowForm(false);
    setEditingAvailability(undefined);

    await fetchAvailability();
  };

  // =====================================
  // CLOSE FORM
  // =====================================

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAvailability(undefined);
  };

  // =====================================
  // CANCEL AVAILABILITY
  // =====================================

  const handleCancel = async (availabilityId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this availability slot?"
    );

    if (!confirmed) return;

    try {
      setCancellingId(availabilityId);
      setError("");

      await cancelAvailability(availabilityId);

      setAvailability((previous) =>
        previous.filter((item) => item.id !== availabilityId)
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to cancel this availability"
      );
    } finally {
      setCancellingId(null);
    }
  };

  // =====================================
  // FORMAT DATE
  // =====================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================
  // FORMAT TIME
  // =====================================

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // =====================================
  // CHECK PAST SESSION
  // =====================================

  const isPastSession = (item: Availability) => {
    return new Date(item.endAt).getTime() <= Date.now();
  };

  // =====================================
  // FILTER AVAILABILITY
  // =====================================

  const filteredAvailability = useMemo(() => {
    return availability.filter((item) => {
      const isPast = new Date(item.endAt).getTime() <= Date.now();

      switch (activeFilter) {
        case "AVAILABLE":
          return item.status === "AVAILABLE" && !isPast;

        case "BOOKED":
          return item.status === "BOOKED" && !isPast;

        case "PAST":
          return isPast;

        case "ALL":
        default:
          return true;
      }
    });
  }, [availability, activeFilter]);

  // =====================================
  // FILTER COUNTS
  // =====================================

  const filterCounts = useMemo(() => {
    const now = Date.now();

    return {
      all: availability.length,

      available: availability.filter(
        (item) =>
          item.status === "AVAILABLE" &&
          new Date(item.endAt).getTime() > now
      ).length,

      booked: availability.filter(
        (item) =>
          item.status === "BOOKED" &&
          new Date(item.endAt).getTime() > now
      ).length,

      past: availability.filter(
        (item) => new Date(item.endAt).getTime() <= now
      ).length,
    };
  }, [availability]);

  // =====================================
  // FILTER CONFIGURATION
  // =====================================

  const filters = [
    {
      id: "ALL" as const,
      label: "All Sessions",
      count: filterCounts.all,
      icon: LayoutGrid,
    },
    {
      id: "AVAILABLE" as const,
      label: "Available",
      count: filterCounts.available,
      icon: CalendarClock,
    },
    {
      id: "BOOKED" as const,
      label: "Booked",
      count: filterCounts.booked,
      icon: CalendarCheck,
    },
    {
      id: "PAST" as const,
      label: "Past",
      count: filterCounts.past,
      icon: History,
    },
  ];

  // =====================================
  // UI
  // =====================================

  return (
    <DashboardLayout role="MENTOR">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* PAGE HEADER */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              My Availability
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your mentoring sessions, timings and session fees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={fetchAvailability}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              <Plus size={18} />
              Add Availability
            </button>

          </div>
        </div>

        {/* AVAILABILITY FORM */}

        {showForm && (
          <AvailabilityForm
            availability={editingAvailability}
            onSaved={handleAvailabilitySaved}
            onCancel={handleCloseForm}
          />
        )}

        {/* ERROR */}

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle size={18} />
            {error}
          </div>
        )}

        {/* FILTER TABS */}

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={16} />

                {filter.label}

                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* LOADING */}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <RefreshCw
                size={28}
                className="mx-auto animate-spin text-violet-600"
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading your availability...
              </p>
            </div>
          </div>
        ) : filteredAvailability.length === 0 ? (

          /* EMPTY STATE */

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <CalendarDays
              size={42}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {activeFilter === "ALL"
                ? "No availability added yet"
                : `No ${activeFilter.toLowerCase()} sessions found`}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {activeFilter === "ALL"
                ? "You haven't published any mentoring sessions. Add your availability to let students book sessions with you."
                : "There are no sessions matching this filter right now."}
            </p>

            {activeFilter === "ALL" && (
              <button
                type="button"
                onClick={handleCreate}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <Plus size={17} />
                Create your first session
              </button>
            )}
          </div>

        ) : (

          /* AVAILABILITY LIST */

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {filteredAvailability.map((item) => {
              const past = isPastSession(item);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  {/* CARD HEADER */}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.topic.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Mentoring session
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        past
                          ? "bg-slate-100 text-slate-600"
                          : item.status === "AVAILABLE"
                            ? "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {past
                        ? "PAST"
                        : item.status}
                    </span>
                  </div>

                  {/* SESSION DETAILS */}

                  <div className="mt-5 space-y-3">

                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <CalendarDays
                        size={17}
                        className="text-violet-600"
                      />
                      <span>{formatDate(item.startAt)}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Clock
                        size={17}
                        className="text-violet-600"
                      />
                      <span>
                        {formatTime(item.startAt)} - {formatTime(item.endAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                      <IndianRupee
                        size={17}
                        className="text-violet-600"
                      />

                      <span>
                        {Number(item.sessionFee).toLocaleString("en-IN")}
                      </span>

                      <span className="text-xs font-normal text-slate-500">
                        per session
                      </span>
                    </div>

                  </div>

                  {/* CARD ACTIONS */}

                  {!past && item.status === "AVAILABLE" && (
                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">

                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancel(item.id)}
                        disabled={cancellingId === item.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle size={16} />

                        {cancellingId === item.id
                          ? "Cancelling..."
                          : "Cancel session"}
                      </button>

                    </div>
                  )}

                  {!past && item.status === "BOOKED" && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-500">
                        This session is booked. Editing and cancellation
                        require the booking management workflow.
                      </p>
                    </div>
                  )}

                  {past && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-500">
                        This session has ended.
                      </p>
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default MentorAvailability;
