
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

import TopicCategory from "../components/TopicCategory";

import {
  getTopics,
  getMentorExpertise,
  updateMentorExpertise,
} from "../services/mentor.api";

import type { Topic } from "../types/mentor.types";

const MentorExpertise = () => {
  const [categories, setCategories] = useState<Topic[]>([]);

  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(
    new Set()
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================
  // FETCH TOPICS AND EXISTING EXPERTISE
  // =====================================

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const [topicsResponse, expertiseResponse] = await Promise.all([
        getTopics(),
        getMentorExpertise(),
      ]);

      // Safely extract topics
      const topics = topicsResponse?.data?.topics ?? [];

      // Find Computer Science domain
      const domain = topics.find(
        (topic) => topic.slug === "computer-science"
      );

      if (!domain) {
        throw new Error("Computer Science topic catalogue not found");
      }

      // Safely extract categories
      const domainCategories = domain.children ?? [];

      setCategories(domainCategories);

      // Safely extract existing expertise
      const expertise = expertiseResponse?.data?.expertise ?? [];

      setSelectedTopicIds(
        new Set(expertise.map((topic) => topic.id))
      );
    } catch (err) {
      console.error("Unable to load mentor expertise:", err);

      setCategories([]);
      setSelectedTopicIds(new Set());

      setError(
        "Unable to load topics. Please refresh the page and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // =====================================
  // TOGGLE TOPIC SELECTION
  // =====================================

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds((previous) => {
      const updated = new Set(previous);

      if (updated.has(topicId)) {
        updated.delete(topicId);
      } else {
        updated.add(topicId);
      }

      return updated;
    });

    setSuccess("");
    setError("");
  };

  // =====================================
  // SAVE EXPERTISE
  // =====================================

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const response = await updateMentorExpertise({
        topicIds: Array.from(selectedTopicIds),
      });

      // Safely extract saved expertise
      const savedExpertise = response?.data?.expertise ?? [];

      setSelectedTopicIds(
        new Set(savedExpertise.map((topic) => topic.id))
      );

      setSuccess("Your expertise has been updated successfully.");
    } catch (err) {
      console.error("Unable to update expertise:", err);

      setError(
        "Unable to save your expertise. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================
  // LOADING STATE
  // =====================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />

        <p className="text-sm text-slate-500">
          Loading your expertise...
        </p>
      </div>
    );
  }

  // =====================================
  // MAIN UI
  // =====================================

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">

      {/* HEADER */}

      <div>
        <p className="text-sm font-medium text-violet-600">
          Mentor Profile
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          My Expertise
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Select the Computer Science topics you are confident
          teaching. Students will discover you based on these
          specific topics.
        </p>
      </div>

      {/* SELECTION SUMMARY */}

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-violet-100 bg-violet-50 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-violet-700">
            Selected topics
          </p>

          <p className="mt-1 text-3xl font-bold text-violet-900">
            {selectedTopicIds.size}
          </p>
        </div>

        <p className="max-w-md text-sm text-violet-700">
          Choose only the topics you can confidently explain
          and help students understand.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p>{error}</p>

            <button
              type="button"
              onClick={loadData}
              className="mt-2 inline-flex items-center gap-2 font-semibold text-red-700 hover:text-red-800"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          <CheckCircle2 size={19} />
          {success}
        </div>
      )}

      {/* TOPIC CATEGORIES */}

      <div className="space-y-5">
        {categories.length > 0 ? (
          categories.map((category) => (
            <TopicCategory
              key={category.id}
              category={category}
              selectedTopicIds={selectedTopicIds}
              onToggle={toggleTopic}
            />
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h3 className="font-semibold text-slate-800">
              No topics available
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              We couldn't find any Computer Science topics.
              Please try refreshing the page.
            </p>

            <button
              type="button"
              onClick={loadData}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <RefreshCw size={15} />
              Refresh Topics
            </button>
          </div>
        )}
      </div>

      {/* SAVE BUTTON */}

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {selectedTopicIds.size} topic(s) selected
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || categories.length === 0}
          className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Expertise"}
        </button>
      </div>
    </div>
  );
};

export default MentorExpertise;
