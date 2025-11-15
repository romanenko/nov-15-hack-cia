import { Insight } from '../lib/mockData';

interface InsightCardProps {
  insight: Insight;
}

export default function InsightCard({ insight }: InsightCardProps) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-white dark:bg-zinc-900/50">
      <h3 className="text-base font-semibold text-zinc-500 dark:text-zinc-400 mb-2 italic">
        {insight.question}
      </h3>
      <p className="text-base font-semibold text-black dark:text-white leading-relaxed">
        {insight.answer}
      </p>
    </div>
  );
}
