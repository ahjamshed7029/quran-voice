import { ReactNode } from 'react';

interface VoiceLessonCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function VoiceLessonCard({ icon, title, description }: VoiceLessonCardProps) {
  return (
    <article className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-teal/50 hover:bg-white/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-teal/10 text-teal">{icon}</div>
      <div>
        <h2 className="text-base font-semibold text-soft">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-white/70">{description}</p>
      </div>
    </article>
  );
}
