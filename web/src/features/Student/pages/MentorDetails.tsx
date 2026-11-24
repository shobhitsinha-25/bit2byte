
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  GraduationCap,
  LoaderCircle,
  UserRound,
} from "lucide-react";

import {
  getMentorDetails,
  getMentorAvailability,
  type MentorDetails as MentorDetailsType,
  type MentorAvailability,
} from "../services/mentor.api";
import DashboardLayout from "../../../layout/DashboardLayout";


export default function MentorDetails() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();

  const [mentor, setMentor] = useState<MentorDetailsType | null>(null);
  const [availability, setAvailability] = useState<MentorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useEffect(() => {
    if (!mentorId) {
      setError("Invalid mentor ID.");
      setLoading(false);
      return;
    }

    const fetchMentorData = async () => {
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

        setMentor(mentorResponse.data.mentor);
        setAvailability(availabilityResponse.data.availability);
      } catch (err: unknown) {
        console.error("Failed to fetch mentor details:", err);
        setError("Unable to load mentor details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMentorData();
  }, [mentorId]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
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

  const formatFee = (fee: string | number, currency: string) => {
    const amount = Number(fee);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
  return (
    <DashboardLayout role="STUDENT">
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-violet-600" size={32} />
      </div>
    </DashboardLayout>
  );
}

 if (error || !mentor) {
  return (
    <DashboardLayout role="STUDENT">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <button
          onClick={() => navigate("/student/mentors")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-700"
        >
          <ArrowLeft size={18} />
          Back to mentors
        </button>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-600">
            {error || "Mentor not found."}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

  const initials = mentor.name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DashboardLayout role="STUDENT">
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back navigation */}
        <button
          onClick={() => navigate("/student/mentors")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-violet-700"
        >
          <ArrowLeft size={18} />
          Back to mentors
        </button>

        {/* Mentor profile */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-3xl font-bold text-violet-700">
              {initials}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {mentor.name}
                </h1>

                {mentor.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck size={15} />
                    Verified mentor
                  </span>
                )}
              </div>

              <p className="mt-2 text-lg font-medium text-violet-700">
                {mentor.headline || "Mentor"}
              </p>

              <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <GraduationCap size={18} />
                  {mentor.yearsOfExperience}{" "}
                  {mentor.yearsOfExperience === 1 ? "year" : "years"} experience
                </span>

                <span className="flex items-center gap-2">
                  <UserRound size={18} />
                  Mentor
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="text-lg font-semibold text-slate-900">
              About the mentor
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
              {mentor.bio || "No introduction has been added yet."}
            </p>
          </div>
        </section>

        {/* Expertise */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">
            Areas of expertise
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Topics this mentor can help you learn.
          </p>

          {mentor.expertise.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {mentor.expertise.map((topic) => (
                <span
                  key={topic.id}
                  className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700"
                  title={topic.description || topic.name}
                >
                  {topic.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No expertise information available.
            </p>
          )}
        </section>

        {/* Availability */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Available sessions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a time that works for you.
              </p>
            </div>

            <span className="text-sm font-medium text-slate-500">
              {availability.length}{" "}
              {availability.length === 1 ? "slot" : "slots"} available
            </span>
          </div>

          {availability.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
              <CalendarDays
                size={36}
                className="mx-auto text-slate-400"
              />
              <h3 className="mt-4 font-semibold text-slate-800">
                No sessions available right now
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                This mentor hasn't published any available sessions yet.
                Please check back later.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {availability.map((slot) => {
                const isSelected = selectedSlotId === slot.id;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() =>
                      setSelectedSlotId(isSelected ? null : slot.id)
                    }
                    className={`rounded-xl border p-5 text-left transition ${
                      isSelected
                        ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {slot.topic.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          One-to-one mentoring session
                        </p>
                      </div>

                      <span className="rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-bold text-violet-700">
                        {formatFee(slot.sessionFee, slot.currency)}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={17} className="text-violet-600" />
                        {formatDate(slot.startAt)}
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock3 size={17} className="text-violet-600" />
                        {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-3">
                      <span
                        className={`text-sm font-semibold ${
                          isSelected ? "text-violet-700" : "text-slate-500"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select this session"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedSlotId && (
  <div className="mt-5 flex flex-col gap-4 rounded-xl bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="font-semibold text-violet-900">
        Session selected
      </p>
      <p className="mt-1 text-sm text-violet-700">
        Continue to review your booking details.
      </p>
    </div>

    <button
      type="button"
      onClick={() =>
        navigate(
          `/student/mentors/${mentor.id}/book/${selectedSlotId}`
        )
      }
      className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
    >
      Continue to Booking
    </button>
  </div>
)}
        </section>
      </div>
    </div>
    </DashboardLayout>
  );
}
