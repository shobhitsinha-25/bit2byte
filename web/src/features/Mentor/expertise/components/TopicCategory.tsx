
import type { Topic } from "../types/mentor.types";

interface TopicCategoryProps {
  category: Topic;
  selectedTopicIds: Set<string>;
  onToggle: (topicId: string) => void;
}

const TopicCategory = ({
  category,
  selectedTopicIds,
  onToggle,
}: TopicCategoryProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {category.name}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Select the specific topics you can teach.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(category.children ?? []).map((topic) => {
          const isSelected = selectedTopicIds.has(topic.id);

          return (
            <label
              key={topic.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                isSelected
                  ? "border-violet-500 bg-violet-50"
                  : "border-slate-200 hover:border-violet-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(topic.id)}
                className="h-4 w-4 accent-violet-600"
              />

              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-violet-700" : "text-slate-700"
                }`}
              >
                {topic.name}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default TopicCategory;
