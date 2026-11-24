import { ArrowRight, BadgeCheck, BriefcaseBusiness, UserRound } from "lucide-react";
import type { Mentor } from "../services/mentor.api";

interface MentorCardProps {
  mentor: Mentor;
  onViewProfile: (mentorId: string) => void;
}

const MentorCard = ({ mentor, onViewProfile }: MentorCardProps) => {
  const initials = mentor.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md">
      {/* Mentor identity */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-700">
          {initials || <UserRound size={24} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {mentor.name}
            </h3>

            {mentor.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                <BadgeCheck size={14} />
                Verified
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {mentor.headline || "Mentor"}
          </p>
        </div>
      </div>

      {/* Experience */}
      <div className="mt-5 flex items-center gap-2 text-sm text-gray-600">
        <BriefcaseBusiness size={16} className="text-gray-400" />

        <span>
          {mentor.yearsOfExperience}{" "}
          {mentor.yearsOfExperience === 1 ? "year" : "years"} of experience
        </span>
      </div>

      {/* Bio */}
      <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-5 text-gray-600">
        {mentor.bio || "This mentor has not added a bio yet."}
      </p>

      {/* Expertise */}
      <div className="mt-4 flex-1">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Expertise
        </p>

        <div className="flex flex-wrap gap-2">
          {mentor.expertise.slice(0, 4).map((topic) => (
            <span
              key={topic.id}
              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
            >
              {topic.name}
            </span>
          ))}

          {mentor.expertise.length > 4 && (
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
              +{mentor.expertise.length - 4} more
            </span>
          )}

          {mentor.expertise.length === 0 && (
            <span className="text-xs text-gray-400">
              No expertise added
            </span>
          )}
        </div>
      </div>

      {/* Profile action */}
      <button
        type="button"
        onClick={() => onViewProfile(mentor.id)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        View profile
        <ArrowRight size={16} />
      </button>
    </article>
  );
};

export default MentorCard;