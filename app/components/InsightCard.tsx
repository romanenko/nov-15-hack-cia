import { GroupedInsight } from '../lib/types';

interface InsightCardProps {
  insight: GroupedInsight;
}

export default function InsightCard({ insight }: InsightCardProps) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-white dark:bg-zinc-900/50">
      <h3 className="text-base font-semibold text-zinc-500 dark:text-zinc-400 mb-3 italic">
        {insight.question}
      </h3>
      <ul className="list-disc list-inside space-y-1">
        {insight.answers.map((answer, index) => (
          <li
            key={index}
            className="text-base font-semibold text-black dark:text-white leading-relaxed"
          >
            {answer}
          </li>
        ))}
      </ul>
    </div>
  );
}
