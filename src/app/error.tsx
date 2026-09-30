"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-full place-items-center p-8 text-center">
      <div>
        <h1 className="font-serif text-4xl">Something broke in the channel.</h1>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-[#1a1206]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
