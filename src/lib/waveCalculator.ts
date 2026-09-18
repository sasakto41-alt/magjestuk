/**
 * Калькулятор слотов гос. волн
 *
 * Правила:
 * - Вещание только в 10-е минуты (00, 10, 20, 30, 40, 50)
 * - Занятие не ранее чем за 10 минут и не позднее чем за 120 минут до вещания
 * - 3 слота на организацию в текущих 120 минутах
 * - Интервал между слотами — 20 минут
 *
 * Время всегда московское (UTC+3), независимо от часового пояса пользователя.
 */

/** Часовой пояс — Москва (UTC+3, без перевода на летнее время) */
export const MSK_TZ = 'Europe/Moscow';

/**
 * Возвращает ТЕКУЩЕЕ московское время как объект Date.
 */
export function getMoscowNow(): Date {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MSK_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  const year = parseInt(get('year'), 10);
  const month = parseInt(get('month'), 10) - 1;
  const day = parseInt(get('day'), 10);
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(get('minute'), 10);
  const second = parseInt(get('second'), 10);

  const utc = Date.UTC(year, month, day, hour, minute, second, 0);
  const moscowOffsetMin = 3 * 60;
  const result = new Date(utc - moscowOffsetMin * 60 * 1000);

  return result;
}

export interface TimeSlot {
  time: string;
  date: Date;
  timestamp: number;
}

export interface SlotSet {
  id: string;
  slots: TimeSlot[];
  label: string;
  startsAtRoundHour: boolean;
}

export type SlotStatus =
  | 'planned'
  | 'asked'
  | 'occupied'
  | 'broadcast'
  | 'released';

export const SLOT_STATUS_LABELS: Record<SlotStatus, string> = {
  planned: 'Запланировано',
  asked: 'Спрошено в /dep',
  occupied: 'Занято',
  broadcast: 'Подано /gnews',
  released: 'Отпущено',
};

function roundUpTo10Minutes(date: Date): Date {
  const result = new Date(date);
  result.setSeconds(0, 0);
  const minutes = result.getMinutes();
  if (minutes % 10 === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0) {
    return result;
  }
  const nextSlot = (Math.floor(minutes / 10) + 1) * 10;
  if (nextSlot >= 60) {
    result.setHours(result.getHours() + 1);
    result.setMinutes(nextSlot - 60);
  } else {
    result.setMinutes(nextSlot);
  }
  return result;
}

export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getAvailableSlots(now: Date = getMoscowNow()): TimeSlot[] {
  const minTime = new Date(now.getTime() + 10 * 60 * 1000);
  const maxTime = new Date(now.getTime() + 120 * 60 * 1000);

  let firstSlot = roundUpTo10Minutes(minTime);
  if (firstSlot.getTime() < minTime.getTime()) {
    firstSlot = new Date(firstSlot.getTime() + 10 * 60 * 1000);
  }

  const slots: TimeSlot[] = [];
  let current = new Date(firstSlot);

  while (current.getTime() <= maxTime.getTime()) {
    slots.push({
      time: formatTime(current),
      date: new Date(current),
      timestamp: current.getTime(),
    });
    current = new Date(current.getTime() + 10 * 60 * 1000);
  }

  return slots;
}

export function getRecommendedSets(now: Date = getMoscowNow()): SlotSet[] {
  const slots = getAvailableSlots(now);

  const slotByTimestamp = new Map<number, TimeSlot>();
  for (const s of slots) slotByTimestamp.set(s.timestamp, s);

  const TWENTY_MIN = 20 * 60 * 1000;

  const allSets: SlotSet[] = [];
  for (let i = 0; i < slots.length; i++) {
    const s1 = slots[i];
    const s2 = slotByTimestamp.get(s1.timestamp + TWENTY_MIN);
    if (!s2) continue;
    const s3 = slotByTimestamp.get(s2.timestamp + TWENTY_MIN);
    if (!s3) continue;

    const startMin = s1.date.getMinutes();
    allSets.push({
      id: `set-${i}`,
      slots: [s1, s2, s3],
      label: `${s1.time} · ${s2.time} · ${s3.time}`,
      startsAtRoundHour: startMin === 0,
    });
  }

  const priority = (s: SlotSet) => {
    const m = s.slots[0].date.getMinutes();
    if (m === 0) return 0;
    if (m === 20) return 1;
    if (m === 40) return 2;
    return 3;
  };

  allSets.sort((a, b) => {
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    return a.slots[0].timestamp - b.slots[0].timestamp;
  });

  const result: SlotSet[] = [];
  const usedTimestamps = new Set<number>();
  for (const set of allSets) {
    const overlaps = set.slots.some((s) => usedTimestamps.has(s.timestamp));
    if (!overlaps) {
      result.push(set);
      set.slots.forEach((s) => usedTimestamps.add(s.timestamp));
    }
    if (result.length >= 3) break;
  }

  if (result.length < 3) {
    for (const set of allSets) {
      if (!result.includes(set)) {
        result.push(set);
      }
      if (result.length >= 3) break;
    }
  }

  return result.slice(0, 3);
}

export function formatCountdown(targetTimestamp: number, now: number = Date.now()): string {
  const diff = targetTimestamp - now;
  if (diff <= 0) return '00:00';

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function getNextBroadcastSlot(now: Date = getMoscowNow()): TimeSlot {
  const result = new Date(now);
  result.setSeconds(0, 0);
  const minutes = result.getMinutes();
  const nextSlot = (Math.floor(minutes / 10) + 1) * 10;
  if (nextSlot >= 60) {
    result.setHours(result.getHours() + 1);
    result.setMinutes(nextSlot - 60);
  } else {
    result.setMinutes(nextSlot);
  }
  return {
    time: formatTime(result),
    date: result,
    timestamp: result.getTime(),
  };
}

export type Phase = 'idle' | 'asking' | 'waiting' | 'occupied' | 'broadcast' | 'released';

export const PHASE_LABELS: Record<Phase, string> = {
  idle: 'Ожидание',
  asking: 'Запрос в /dep',
  waiting: 'Ожидание ответа',
  occupied: 'Волна занята',
  broadcast: 'Вещание',
  released: 'Освобождено',
};
