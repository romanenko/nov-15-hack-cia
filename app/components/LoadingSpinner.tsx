export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-zinc-200 dark:border-zinc-800 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-zinc-600 dark:text-zinc-400 text-lg">
        Analyzing profile...
      </p>
    </div>
  );
}
