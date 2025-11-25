'use client';

import { useEffect, useState } from 'react';

interface ResearchStatusProps {
  username: string;
  onResearchComplete?: () => void;
}

type ResearchState = 'not_started' | 'running' | 'completed' | 'failed';

interface StatusInfo {
  status: ResearchState;
  hours_ago?: number;
  error_message?: string;
  can_retry?: boolean;
}

export default function ResearchStatus({ username, onResearchComplete }: ResearchStatusProps) {
  const [statusInfo, setStatusInfo] = useState<StatusInfo>({ status: 'not_started' });
  const [isTriggering, setIsTriggering] = useState(false);

  // Check research status
  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/research/${username}/status`);
      const data = await response.json();

      if (data.success) {
        const previousStatus = statusInfo.status;
        setStatusInfo({
          status: data.status,
          hours_ago: data.hours_ago,
          error_message: data.error_message,
          can_retry: data.can_retry,
        });

        // If status changed from running to completed, notify parent
        if (previousStatus === 'running' && data.status === 'completed') {
          onResearchComplete?.();
        }
      }
    } catch (error) {
      console.error('Failed to check research status:', error);
    }
  };

  // Trigger research
  const triggerResearch = async () => {
    setIsTriggering(true);
    try {
      const response = await fetch(`/api/research/${username}`);
      const data = await response.json();

      if (data.success) {
        setStatusInfo({ status: 'running' });
        // Start polling for status updates
      } else if (response.status === 429) {
        // Already running or recently completed
        await checkStatus();
      } else {
        console.error('Failed to trigger research:', data.error);
      }
    } catch (error) {
      console.error('Error triggering research:', error);
    } finally {
      setIsTriggering(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const initializeAndPoll = async () => {
      // Initial status check
      await checkStatus();

      // Auto-trigger research if not started
      if (mounted && statusInfo.status === 'not_started' && statusInfo.can_retry !== false) {
        await triggerResearch();
      }

      // Setup polling if research is running
      if (mounted && statusInfo.status === 'running') {
        intervalId = setInterval(checkStatus, 5000);
      }
    };

    initializeAndPoll();

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [username]);

  // Update polling when status changes
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (statusInfo.status === 'running') {
      // Poll every 5 seconds while research is running
      intervalId = setInterval(checkStatus, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [statusInfo.status]);

  if (statusInfo.status === 'not_started') {
    return (
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        <span>No research data</span>
        <button
          onClick={triggerResearch}
          disabled={isTriggering}
          className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {isTriggering ? 'Starting...' : 'Run research'}
        </button>
      </div>
    );
  }

  if (statusInfo.status === 'running') {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        <div className="animate-spin h-3 w-3 border border-zinc-400 border-t-transparent rounded-full"></div>
        <span>Researching...</span>
      </div>
    );
  }

  if (statusInfo.status === 'completed') {
    // Don't show anything when completed - the features speak for themselves
    return null;
  }

  if (statusInfo.status === 'failed') {
    return (
      <div className="flex items-center justify-between text-sm text-red-600 dark:text-red-400 mb-6">
        <span>Research failed</span>
        {statusInfo.can_retry && (
          <button
            onClick={triggerResearch}
            disabled={isTriggering}
            className="hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {isTriggering ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    );
  }

  return null;
}
