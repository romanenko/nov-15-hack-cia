'use client';

import { useState, useEffect } from 'react';
import { Feature } from '../lib/types';

interface InsightCardProps {
  feature: Feature;
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export default function InsightCard({ feature }: InsightCardProps) {
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    // Remove the "new" animation after 1 second
    const timer = setTimeout(() => setIsNew(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const discoveredTime = feature.created_at
    ? formatRelativeTime(new Date(feature.created_at))
    : null;

  return (
    <div
      className={`
        border border-zinc-200 dark:border-zinc-800 rounded-lg p-6
        bg-white dark:bg-zinc-900/50 transition-all duration-500
        ${isNew ? 'animate-slideIn opacity-0' : 'opacity-100'}
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-base font-semibold text-zinc-500 dark:text-zinc-400 italic">
          {feature.question_text}
        </h3>
        {discoveredTime && (
          <span className="text-xs text-zinc-400 dark:text-zinc-600 whitespace-nowrap ml-2">
            {discoveredTime}
          </span>
        )}
      </div>
      <p className="text-base font-semibold text-black dark:text-white leading-relaxed">
        {feature.answer || 'No data available'}
      </p>
    </div>
  );
}
