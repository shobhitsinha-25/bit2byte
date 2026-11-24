import { Search, X } from "lucide-react";

export interface TopicFilterOption {
  id: string;
  name: string;
  categoryName: string;
}

interface MentorFiltersProps {
  search: string;
  selectedTopicId: string;
  topics: TopicFilterOption[];
  onSearchChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onClear: () => void;
}

const MentorFilters = ({
  search,
  selectedTopicId,
  topics,
  onSearchChange,
  onTopicChange,
  onClear,
}: MentorFiltersProps) => {
  const hasFilters = search.trim().length > 0 || selectedTopicId.length > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px_auto]">
        {/* Search */}
        <div>
          <label
            htmlFor="mentor-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Search mentors
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="mentor-search"
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by mentor name or expertise..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Topic filter */}
        <div>
          <label
            htmlFor="mentor-topic"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Filter by topic
          </label>

          <select
            id="mentor-topic"
            value={selectedTopicId}
            onChange={(event) => onTopicChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All topics</option>

            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name} — {topic.categoryName}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasFilters}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
          >
            <X size={16} />
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorFilters;