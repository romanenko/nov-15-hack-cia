'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeClient() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().replace(/^@/, '');
    if (cleanUsername) {
      router.push(`/${cleanUsername}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove @ if user types it
    if (value.startsWith('@@')) {
      value = value.slice(1);
    }
    setUsername(value.replace(/^@/, ''));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black px-4">
      <main className="flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="text-center space-y-1">
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">
            CIA
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Deep intelligence on any X profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-lg">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={handleChange}
                placeholder="username"
                className="w-full pl-9 pr-4 py-3 text-lg border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!username.trim()}
              className="px-6 py-3 text-lg font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              Analyze
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
