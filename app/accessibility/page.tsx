import Link from 'next/link';

const features = [
  'Screen reader optimized labels',
  'Keyboard navigation and large touch targets',
  'Voice command hints and gentle feedback',
  'Low contrast-safe dark theme'
];

export default function AccessibilityPage() {
  return (
    <main className="flex min-h-screen flex-col gap-6 px-5 py-8 sm:px-8">
      <section className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-teal/80">Accessibility</p>
          <h1 className="text-3xl font-semibold leading-tight text-soft">A calm accessible experience.</h1>
          <p className="text-base leading-7 text-white/70">
            Voice navigation, broad contrast, clear focus states, and thoughtful layout for assistive users.
          </p>
        </div>
        <ul className="space-y-3 text-base leading-7 text-white/70">
          {features.map((feature) => (
            <li key={feature} className="rounded-3xl border border-white/10 bg-midnight/60 px-4 py-3">
              {feature}
            </li>
          ))}
        </ul>
        <Link
          href="/"
          className="inline-flex w-full justify-center rounded-3xl bg-teal px-6 py-4 text-base font-semibold text-midnight transition hover:bg-teal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
        >
          Return to main screen
        </Link>
      </section>
    </main>
  );
}
