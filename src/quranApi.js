const BASE_URL = 'https://api.alquran.cloud/v1';

export const quranApi = {
  // Получаем суру и возвращаем массив только из аудио-ссылок аятов для непрерывного воспроизведения
  async getSurahAudioUrls(surahNumber, reciter = 'ar.alafasy') {
    const res = await fetch(`${BASE_URL}/surah/${surahNumber}/${reciter}`);
    if (!res.ok) throw new Error('Ошибка сети');
    const json = await res.json();
    
    // Возвращаем чистый массив URL-адресов mp3 файлов
    return json.data.ayahs.map(ayah => ayah.audio);
  }
};