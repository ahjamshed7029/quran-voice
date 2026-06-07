export type QuranVerse = {
  verse_number: number;
  text: string;
  audio_url: string;
};

export type QuranTranslation = {
  language: string;
  text: string;
};

const QURAN_API_BASE = 'https://api.quran.com/api/v4';

export async function fetchSurahList() {
  const response = await fetch(`${QURAN_API_BASE}/surahs`, { cache: 'force-cache' });
  const data = await response.json();
  return data?.data ?? [];
}

export async function fetchVerseAudio(verseKey: string) {
  const response = await fetch(`${QURAN_API_BASE}/quran/verses/indopak?verse_key=${verseKey}`, {
    cache: 'no-cache'
  });
  const data = await response.json();
  return data?.audio ?? null;
}

export async function fetchTranslation(surah: number, verse: number, language: string) {
  const translator = language === 'ru' ? 44 : language === 'uz' ? 131 : 20;
  const response = await fetch(`${QURAN_API_BASE}/quran/translations/${translator}?verse_key=${surah}:${verse}`, {
    cache: 'no-cache'
  });
  const json = await response.json();
  return json?.translations?.[0]?.text ?? null;
}
