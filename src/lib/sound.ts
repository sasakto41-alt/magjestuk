/**
 * Простой звуковой сигнал через Web Audio API.
 * Не требует внешних файлов — генерирует тон на лету.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(frequency: number, durationMs: number, startOffsetMs: number = 0, volume: number = 0.3): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  const startTime = ctx.currentTime + startOffsetMs / 1000;
  const endTime = startTime + durationMs / 1000;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.setValueAtTime(volume, endTime - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, endTime);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(endTime);
}

/**
 * Короткий "бип" для уведомлений (копирование и т.п.)
 */
export function playBeep(): void {
  playTone(880, 120, 0, 0.2);
}

/**
 * Сигнал будильника для вещания — три нарастающих тона.
 */
export function playAlarm(): void {
  playTone(660, 200, 0, 0.3);
  playTone(660, 200, 280, 0.3);
  playTone(880, 400, 560, 0.35);
}

/**
 * Сигнал "пора подавать /gnews" — длинный тон.
 */
export function playBroadcastNow(): void {
  playTone(523, 300, 0, 0.35);
  playTone(659, 300, 320, 0.35);
  playTone(784, 600, 640, 0.4);
}
