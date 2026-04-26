/**
 * Synthèse vocale via Web Speech API.
 * Les iPhones et Androids modernes le supportent nativement.
 */

let voice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;
const queue: string[] = [];
let speaking = false;

function pickFrenchVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Préférences : voix française naturelle
  const preferred = voices.find((v) => /fr[-_]FR/i.test(v.lang) && /(google|amelie|thomas|audrey)/i.test(v.name));
  if (preferred) return preferred;

  const fr = voices.find((v) => /^fr/i.test(v.lang));
  return fr || voices[0] || null;
}

function loadVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    if (voicesLoaded) return resolve();

    const setVoice = () => {
      voice = pickFrenchVoice();
      voicesLoaded = true;
      resolve();
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
      // Fallback timeout
      setTimeout(setVoice, 1500);
    }
  });
}

function processQueue() {
  if (typeof window === 'undefined') return;
  if (speaking || queue.length === 0) return;
  const text = queue.shift()!;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = 1.0;
  u.pitch = 1.0;
  u.volume = 1.0;
  if (voice) u.voice = voice;
  speaking = true;
  u.onend = () => {
    speaking = false;
    processQueue();
  };
  u.onerror = () => {
    speaking = false;
    processQueue();
  };
  window.speechSynthesis.speak(u);
}

/** Énonce un texte en français. Met en file d'attente si déjà en train de parler. */
export async function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  await loadVoices();
  queue.push(text);
  processQueue();
}

/** Stoppe immédiatement et vide la file. */
export function stopSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  queue.length = 0;
  speaking = false;
  window.speechSynthesis.cancel();
}

/** Test rapide pour valider que la voix marche (utile pour iOS qui demande un user gesture). */
export async function primeSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  await loadVoices();
  // Phrase courte pour "réveiller" le moteur vocal sur iOS
  const u = new SpeechSynthesisUtterance(' ');
  u.lang = 'fr-FR';
  u.volume = 0;
  window.speechSynthesis.speak(u);
}
