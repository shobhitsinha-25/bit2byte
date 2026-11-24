
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, Clock, IndianRupee, X } from "lucide-react";

import {
  createAvailability,
  updateAvailability,
} from "../services/availability.api";

import {
  getTopics,
  getMentorExpertise,
} from "../../expertise/services/mentor.api";

import type {
  Topic,
  ExpertiseTopic,
} from "../../expertise/types/mentor.types";

import type {
  Availability,
} from "../types/availability.types";

// =====================================
// PROPS
// =====================================

interface AvailabilityFormProps {
  onSaved: () => void;
  onCancel: () => void;
  availability?: Availability;
}

// =====================================
// DATE HELPERS
// =====================================

// Convert ISO date into browser-local YYYY-MM-DD.
const getLocalDate = (value: string) => {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Convert ISO date into browser-local HH:mm.
const getLocalTime = (value: string) => {
  const date = new Date(value);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

// =====================================
// COMPONENT
// =====================================

const AvailabilityForm = ({
  onSaved,
  onCancel,
  availability,
}: AvailabilityFormProps) => {
  const isEditMode = Boolean(availability);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [expertise, setExpertise] = useState<ExpertiseTopic[]>([]);

  const [topicId, setTopicId] = useState(
    availability?.topicId ?? ""
  );

  const [date, setDate] = useState(
    availability ? getLocalDate(availability.startAt) : ""
  );

  const [startTime, setStartTime] = useState(
    availability ? getLocalTime(availability.startAt) : ""
  );

  const [endTime, setEndTime] = useState(
    availability ? getLocalTime(availability.endAt) : ""
  );

  const [sessionFee, setSessionFee] = useState(
    availability ? String(availability.sessionFee) : ""
  );

  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  // =====================================
  // FETCH TOPICS AND MENTOR EXPERTISE
  // =====================================

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoadingTopics(true);
        setError("");

        const [topicsResponse, expertiseResponse] = await Promise.all([
          getTopics(),
          getMentorExpertise(),
        ]);

        setTopics(topicsResponse.data.topics);
        setExpertise(expertiseResponse.data.expertise);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Unable to load your expertise topics"
        );
      } finally {
        setIsLoadingTopics(false);
      }
    };

    fetchFormData();
  }, []);

  // =====================================
  // FILTER MENTOR EXPERTISE TOPICS
  // =====================================

  const availableTopics = useMemo(() => {
    const expertiseIds = new Set(
      expertise.map((item) => item.id)
    );

    const result: Topic[] = [];

    const traverse = (nodes: Topic[]) => {
      for (const node of nodes) {
        if (
          node.level === "TOPIC" &&
          expertiseIds.has(node.id)
        ) {
          result.push(node);
        }

        if (node.children?.length) {
          traverse(node.children);
        }
      }
    };

    traverse(topics);

    return result;
  }, [topics, expertise]);

  // =====================================
  // MINIMUM DATE
  // =====================================

  const today = new Date();

  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // =====================================
  // SUBMIT FORM
  // =====================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!topicId || !date || !startTime || !endTime || !sessionFee) {
      setError("Please fill in all the required fields.");
      return;
    }

    const startAt = new Date(`${date}T${startTime}`);
    const endAt = new Date(`${date}T${endTime}`);

    const fee = Number(sessionFee);

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      setError("Please enter a valid date and time.");
      return;
    }

    if (startAt.getTime() <= Date.now()) {
      setError("Session must be scheduled for a future time.");
      return;
    }

    if (endAt.getTime() <= startAt.getTime()) {
      setError("End time must be later than start time.");
      return;
    }

    if (!Number.isFinite(fee) || fee <= 0) {
      setError("Session fee must be greater than zero.");
      return;
    }

    if (Math.round(fee * 100) !== fee * 100) {
      setError("Session fee can have at most two decimal places.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        topicId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        sessionFee: fee,
      };

      if (availability) {
        await updateAvailability(availability.id, payload);
      } else {
        await createAvailability(payload);
      }

      onSaved();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Unable to ${isEditMode ? "update" : "create"} availability`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* HEADER */}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {isEditMode ? "Edit Availability" : "Add Availability"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {isEditMode
              ? "Update your mentoring session details."
              : "Create a new mentoring session for students."}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          aria-label="Close form"
        >
          <X size={20} />
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoadingTopics ? (
        <div className="py-10 text-center text-sm text-slate-500">
          Loading your expertise topics...
        </div>
      ) : availableTopics.length === 0 ? (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          You haven't selected any expertise topics yet.
          Please select your topics before creating availability.
        </div>
      ) : (

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* TOPIC */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Mentoring Topic
            </label>

            <select
              value={topicId}
              onChange={(event) => setTopicId(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">Select a topic</option>

              {availableTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          {/* DATE */}

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <CalendarDays size={16} className="text-violet-600" />
              Session Date
            </label>

            <input
              type="date"
              value={date}
              min={minDate}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* TIME */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Clock size={16} className="text-violet-600" />
                Start Time
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Clock size={16} className="text-violet-600" />
                End Time
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          {/* SESSION FEE */}

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <IndianRupee size={16} className="text-violet-600" />
              Complete Session Fee
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                ₹
              </span>

              <input
                type="number"
                min="0.01"
                max="99999999.99"
                step="0.01"
                value={sessionFee}
                onChange={(event) => setSessionFee(event.target.value)}
                placeholder="Enter session fee"
                required
                className="w-full rounded-lg border border-slate-300 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <p className="mt-1 text-xs text-slate-500">
              This amount is charged for the entire session, not per hour.
            </p>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Publishing..."
                : isEditMode
                  ? "Save Changes"
                  : "Publish Availability"}
            </button>

          </div>
        </form>
      )}
    </div>
  );
};

export default AvailabilityForm;
