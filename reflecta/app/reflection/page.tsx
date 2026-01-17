// src/app/reflection/page.tsx
import ReflectionView from "./_components/reflection-view";

export default function ReflectionPage() {
  return (
    <main className="min-h-screen bg-[#FFE8D6]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Reflection
          </h1>
          <p className="mt-2 text-sm text-neutral-700">
            A calm view of movement over time - not good or bad, just change.
          </p>
        </header>

        <ReflectionView />
      </div>
    </main>
  );
}
