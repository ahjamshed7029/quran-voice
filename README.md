# Quran Voice Coach

A minimalist voice-first Quran learning PWA built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Features

- Voice commands for lessons: `start lesson`, `repeat`, `next verse`, `slower`, `translate`, `continue`, `pause`
- Calm AI teacher responses and progress-aware guidance
- Quran verse audio playback with translation support
- Language support: English, Russian, Uzbek
- Accessibility-first design for blind, disabled, elderly, and beginner learners
- Installable PWA with offline-ready metadata
- Lightweight interface optimized for low-end Android and slow networks

## Available Pages

- `/`: Main voice lesson screen
- `/splash`: Splash screen gateway
- `/language`: Language selection
- `/settings`: Experience settings
- `/accessibility`: Accessibility feature overview

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local` with your Supabase details

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Run development server

```bash
npm run dev
```

## Notes

- Voice interaction uses the Web Speech API
- Quran data is fetched from the Quran.com API
- The design prioritizes calm dark visuals, large touch areas, and accessible controls
