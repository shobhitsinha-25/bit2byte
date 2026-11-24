import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, Users, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

import MentorFilters, {
  type TopicFilterOption,
} from "../components/MentorFilters";

import MentorCard from "../components/MentorCard";
import DashboardLayout from "../../../layout/DashboardLayout";

import {
  getMentors,
  getTopics,
  type Mentor,
  type Pagination,
  type Topic,
} from "../services/mentor.api";

const MentorDiscovery = () => {
  const navigate = useNavigate();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 9;

  // Flatten DOMAIN -> CATEGORY -> TOPIC into selectable topic options.
  const topicOptions = useMemo<TopicFilterOption[]>(() => {
    return topics.flatMap((domain) =>
      domain.children.flatMap((category) =>
        category.children
          .filter((topic) => topic.level === "TOPIC")
          .map((topic) => ({
            id: topic.id,
            name: topic.name,
            categoryName: category.name,
          }))
      )
    );
  }, [topics]);

  // Fetch topics once.
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getTopics();
        setTopics(response.data.topics);
      } catch (err) {
        console.error("Failed to fetch topics:", err);
      }
    };

    fetchTopics();
  }, []);

  // Debounce search input.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  // Fetch mentors whenever filters or page change.
  useEffect(() => {
    let isActive = true;

    const fetchMentors = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMentors({
          search: debouncedSearch || undefined,
          topicId: selectedTopicId || undefined,
          page,
          limit,
        });

        if (!isActive) return;

        setMentors(response.data.mentors);
        setPagination(response.data.pagination);
      } catch (err) {
        console.error("Failed to fetch mentors:", err);

        if (isActive) {
          setMentors([]);
          setPagination(null);
          setError("Unable to load mentors. Please try again.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchMentors();

    return () => {
      isActive = false;
    };
  }, [debouncedSearch, selectedTopicId, page]);

  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedTopicId("");
    setPage(1);
  };

  const handleViewProfile = (mentorId: string) => {
    navigate(`/student/mentors/${mentorId}`);
  };

  return (
    <DashboardLayout role="STUDENT">
    <div className="space-y-7">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
          <Users size={17} />
          Mentor Network
        </div>

        <h1 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
          Find your mentor
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Connect with experienced mentors who can help you learn, improve your
          skills, and achieve your career goals.
        </p>
      </div>

      {/* Filters */}
      <MentorFilters
        search={search}
        selectedTopicId={selectedTopicId}
        topics={topicOptions}
        onSearchChange={setSearch}
        onTopicChange={handleTopicChange}
        onClear={handleClearFilters}
      />

      {/* Results heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Available mentors
          </h2>

          {pagination && !loading && (
            <p className="mt-1 text-sm text-gray-500">
              {pagination.total}{" "}
              {pagination.total === 1 ? "mentor" : "mentors"} found
            </p>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[250px] flex-col items-center justify-center gap-3">
          <LoaderCircle size={32} className="animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Finding mentors for you...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && mentors.length === 0 && (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Users size={25} className="text-gray-400" />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No mentors found
          </h3>

          <p className="mt-2 max-w-sm text-sm text-gray-500">
            We couldn't find any mentors matching your search. Try another
            name or select a different topic.
          </p>

          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Mentor cards */}
      {!loading && !error && mentors.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {mentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-5">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((current) => current - 1)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </DashboardLayout>
  );
};

export default MentorDiscovery;