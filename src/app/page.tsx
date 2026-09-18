'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  Radio,
  Copy,
  Check,
  Bell,
  BellRing,
  AlertTriangle,
  Shield,
  ChevronRight,
  Info,
  Volume2,
  VolumeX,
  FileText,
  Megaphone,
  CheckCircle2,
  Circle,
  ArrowRight,
  Timer,
  ListChecks,
  BookOpen,
  Building2,
} from 'lucide-react';

import {
  getRecommendedSets,
  getNextBroadcastSlot,
  getMoscowNow,
  formatCountdown,
  SLOT_STATUS_LABELS,
  type SlotSet,
  type SlotStatus,
  type TimeSlot,
} from '@/lib/waveCalculator';      
import {
  GNEWS_TEMPLATES,
  buildAskCommand,
  buildOccupyCommand,
  TOOK_WAVE_COMMAND,
  REPORT_COMMAND,
  RELEASE_WAVE_COMMAND,
  type GnewsTemplateId,
} from '@/lib/waveTemplates';
import { playBeep, playAlarm, playBroadcastNow } from '@/lib/sound';

// ============================================================
// УТИЛИТЫ
// ============================================================

function useClipboard() {
  const { toast } = useToast();
  const [lastCopied, setLastCopied] = React.useState<string | null>(null);

  const copy = React.useCallback(
    async (text: string, label?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setLastCopied(text);
        playBeep();
        toast({
          title: 'Скопировано в буфер',
          description: label ?? 'Команда готова к вставке в чат',
        });
        setTimeout(() => setLastCopied((prev) => (prev === text ? null : prev)), 1500);
      } catch {
        toast({
          title: 'Не удалось скопировать',
          description: 'Скопируйте текст вручную',
          variant: 'destructive',
        });
      }
    },
    [toast],
  );

  return { copy, lastCopied };
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/15 border border-primary/30">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent" />
    </div>
  );
}

// ============================================================
// HEADER (ШАПКА)
// ============================================================

function Header({
  faction,
  onFactionChange,
  soundEnabled,
  onToggleSound,
}: {
  faction: string;
  onFactionChange: (v: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  return (
    <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/15 border border-primary/40">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">
              ГОС. ВОЛНЫ
              <span className="text-primary ml-2">·</span>
              <span className="text-primary ml-2 font-medium">КОМАНДНЫЙ ПУНКТ</span>
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight uppercase tracking-wider">
              Помощник дежурного по вещанию · ст. 8
            </p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <label htmlFor="faction" className="text-xs text-muted-foreground uppercase tracking-wider">
            Фракция
          </label>
          <Input
            id="faction"
            value={faction}
            onChange={(e) => onFactionChange(e.target.value)}
            className="w-32 h-8 font-mono uppercase"
            maxLength={12}
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSound}
          title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
          className="border-primary/30"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}

// ============================================================
// TIME BOARD (ТАБЛО ВРЕМЕНИ)
// ============================================================

function TimeBoard({ now }: { now: Date }) {
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');

  const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const monthNames = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ];
  const dayName = dayNames[now.getDay()];
  const monthName = monthNames[now.getMonth()];
  const dateStr = `${now.getDate()} ${monthName} ${now.getFullYear()}`;

  const nextSlot = getNextBroadcastSlot(now);
  const countdown = formatCountdown(nextSlot.timestamp, now.getTime());

  return (
    <Card className="border-primary/30 gold-glow">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Местное время
            </div>
            <div className="mono-tabular text-6xl md:text-7xl font-bold tracking-tight leading-none">
              <span className="text-primary">{hh}</span>
              <span className="text-muted-foreground/60">:</span>
              <span className="text-primary">{mm}</span>
              <span className="text-muted-foreground/40 text-3xl ml-2">:{ss}</span>
            </div>
            <div className="mt-3 text-sm text-muted-foreground capitalize">
              {dayName}, {dateStr}
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block h-24 bg-primary/20" />

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Radio className="w-3 h-3 text-primary" />
              Следующий слот вещания
            </div>
            <div className="mono-tabular text-4xl font-bold text-primary">{nextSlot.time}</div>
            <div className="flex items-center gap-2 text-sm">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">через</span>
              <span className="mono-tabular font-semibold text-foreground">{countdown}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// STATUS CARDS (ТРИ СТАТУС-КАРТОЧКИ)
// ============================================================

type Phase =
  | { kind: 'idle'; label: string }
  | { kind: 'asking'; label: string }
  | { kind: 'waiting'; label: string; remaining: number }
  | { kind: 'occupied'; label: string; nextSlot: string; countdown: string }
  | { kind: 'broadcast'; label: string }
  | { kind: 'released'; label: string };

function StatusCards({
  now,
  availableSlots,
  phase,
}: {
  now: Date;
  availableSlots: TimeSlot[];
  phase: Phase;
}) {
  const nextSlot = getNextBroadcastSlot(now);

  const phaseColor = {
    idle: 'text-muted-foreground',
    asking: 'text-yellow-400',
    waiting: 'text-yellow-400',
    occupied: 'text-primary',
    broadcast: 'text-red-400',
    released: 'text-emerald-400',
  }[phase.kind];

  const phaseIcon = {
    idle: Circle,
    asking: AlertTriangle,
    waiting: Timer,
    occupied: Shield,
    broadcast: Megaphone,
    released: CheckCircle2,
  }[phase.kind];

  const PhaseIcon = phaseIcon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Ближайший слот */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardDescription className="uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Radio className="w-3 h-3" />
            Ближайший слот
          </CardDescription>
          <CardTitle className="mono-tabular text-3xl text-primary">{nextSlot.time}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Обратный отсчёт:{' '}
            <span className="mono-tabular font-semibold text-foreground">
              {formatCountdown(nextSlot.timestamp, now.getTime())}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Окно бронирования */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardDescription className="uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Окно 10–120 мин
          </CardDescription>
          <CardTitle className="text-3xl">
            <span className="text-primary">{availableSlots.length}</span>
            <span className="text-muted-foreground text-base ml-2">слотов свободно</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Можно занять до <span className="text-foreground font-semibold">3</span> слотов
          </div>
        </CardContent>
      </Card>

      {/* Текущая фаза */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardDescription className="uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <PhaseIcon className="w-3 h-3" />
            Текущая фаза
          </CardDescription>
          <CardTitle className={`text-2xl ${phaseColor}`}>{phase.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {phase.kind === 'waiting' && (
            <div className="text-sm">
              <span className="text-muted-foreground">Осталось:</span>{' '}
              <span className="mono-tabular font-semibold text-yellow-400">
                {Math.max(0, Math.ceil(phase.remaining / 1000))}с
              </span>
            </div>
          )}
          {phase.kind === 'occupied' && (
            <div className="text-sm">
              <span className="text-muted-foreground">До вещания</span>{' '}
              <span className="mono-tabular font-semibold text-primary">{phase.countdown}</span>
            </div>
          )}
          {phase.kind === 'idle' && (
            <div className="text-sm text-muted-foreground">Выберите набор слотов ниже</div>
          )}
          {(phase.kind === 'asking' || phase.kind === 'broadcast' || phase.kind === 'released') && (
            <div className="text-sm text-muted-foreground">Следуйте шагам алгоритма</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// RECOMMENDED SETS (РЕКОМЕНДУЕМЫЕ НАБОРЫ)
// ============================================================

function RecommendedSets({
  sets,
  selectedSetId,
  onSelect,
  now,
}: {
  sets: SlotSet[];
  selectedSetId: string | null;
  onSelect: (set: SlotSet) => void;
  now: Date;
}) {
  return (
    <Card>
      <CardHeader>
        <SectionHeader
          icon={ListChecks}
          title="Доступные наборы слотов"
          subtitle="Авто-расчёт по правилам: 10-е минуты, окно 10–120 мин, интервал 20 мин, 3 слота на организацию"
        />
      </CardHeader>
      <CardContent>
        {sets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-sm">
              Нет валидных наборов в текущем окне. Обновится автоматически через несколько минут.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sets.map((set, idx) => {
              const isSelected = set.id === selectedSetId;
              const isRecommended = idx === 0;
              return (
                <button
                  key={set.id}
                  onClick={() => onSelect(set)}
                  className={`relative text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 gold-glow'
                      : isRecommended
                        ? 'border-primary/50 bg-primary/5 hover:border-primary'
                        : 'border-border hover:border-primary/40 hover:bg-accent/30'
                  }`}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider">
                      Рекомендуемый
                    </Badge>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Набор {idx + 1}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    {set.slots.map((slot, i) => (
                      <React.Fragment key={slot.timestamp}>
                        <div className="flex flex-col items-center">
                          <span className="mono-tabular text-2xl font-bold text-primary">
                            {slot.time}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            вещание {i + 1}
                          </span>
                        </div>
                        {i < set.slots.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                    Интервал 20 мин · до {formatCountdown(set.slots[0].timestamp, now.getTime())} до начала
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// ALGORITHM STEPS (ПОШАГОВЫЙ АЛГОРИТМ)
// ============================================================

interface AlgorithmStep {
  num: number;
  title: string;
  description: string;
  command?: string;
  commandLabel?: string;
  action?: string;
  done: boolean;
  active: boolean;
  urgent?: boolean;
}

function AlgorithmSteps({
  selectedSet,
  faction,
  slotStatuses,
  waitStartedAt,
  now,
  onCopy,
  onMarkAsked,
  onOccupy,
  onAdvanceSlot,
  soundEnabled,
}: {
  selectedSet: SlotSet | null;
  faction: string;
  slotStatuses: SlotStatus[];
  waitStartedAt: number | null;
  now: Date;
  onCopy: (text: string, label?: string) => void;
  onMarkAsked: () => void;
  onOccupy: () => void;
  onAdvanceSlot: () => void;
  soundEnabled: boolean;
}) {
  const { copy, lastCopied } = useCopyInline(onCopy);

  if (!selectedSet) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center">
          <ListChecks className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Выберите набор слотов выше, чтобы запустить пошаговый алгоритм
          </p>
        </CardContent>
      </Card>
    );
  }

  const times = selectedSet.slots.map((s) => s.time);
  const askCommand = buildAskCommand(times);
  const occupyCommand = buildOccupyCommand(faction || 'SANG', times);

  // Текущий активный слот — первый не отпущенный
  const activeSlotIdx = slotStatuses.findIndex((s) => s !== 'released');
  const activeSlot = activeSlotIdx >= 0 ? selectedSet.slots[activeSlotIdx] : null;
  const activeStatus = activeSlotIdx >= 0 ? slotStatuses[activeSlotIdx] : 'released';

  // Расчёт оставшегося времени ожидания (5 мин = 300000 мс)
  const waitRemaining = waitStartedAt ? Math.max(0, 5 * 60 * 1000 - (now.getTime() - waitStartedAt)) : 0;
  const waitDone = waitStartedAt !== null && waitRemaining === 0;

  // Расчёт времени до вещания активного слота
  const msToBroadcast = activeSlot ? activeSlot.timestamp - now.getTime() : 0;
  const isUrgent = activeSlot && msToBroadcast > 0 && msToBroadcast <= 2 * 60 * 1000 && activeStatus === 'occupied';

  // Шаги
  const steps: AlgorithmStep[] = [
    {
      num: 1,
      title: 'Запрос свободности в /dep',
      description: 'Перед занятием гос. волны обязательно спросите в /dep, свободно ли время. Скопируйте команду и отправьте в чат депа.',
      command: askCommand,
      commandLabel: '/dep — запрос свободности',
      action: 'Спросил в /dep',
      done: slotStatuses[0] !== 'planned',
      active: slotStatuses[0] === 'planned',
    },
    {
      num: 2,
      title: 'Ожидание ответа (5–7 минут)',
      description: 'Если в течение 5–7 минут ответа не поступило — переходите к занятию волны. Таймер запустится автоматически.',
      action: waitDone ? 'Ответа нет — занимаю' : 'Запустить таймер',
      done: slotStatuses[0] === 'occupied' || slotStatuses[0] === 'broadcast' || slotStatuses[0] === 'released',
      active: slotStatuses[0] === 'asked' || (slotStatuses[0] === 'planned' && waitStartedAt !== null),
    },
    {
      num: 3,
      title: 'Занятие гос. волны',
      description: 'Отправьте в /dep объявление о занятии волны вашей фракцией. После этого следите за депом — отвечайте на вопросы о времени.',
      command: occupyCommand,
      commandLabel: '/dep — занятие волны',
      action: 'Занял волну',
      done: slotStatuses[0] === 'broadcast' || slotStatuses[0] === 'released',
      active: slotStatuses[0] === 'occupied' || (slotStatuses[0] === 'asked' && waitDone),
    },
    {
      num: 4,
      title: 'Подача вещания /gnews',
      description: 'За 2 минуты до слота: отправьте «Занял гос.волну», затем /gnews с текстом набора, затем /report для одобрения. Будильник сработает автоматически.',
      command: TOOK_WAVE_COMMAND,
      commandLabel: '/dep — занял гос.волну',
      action: 'Подал вещание',
      done: activeSlotIdx === -1,
      active: activeStatus === 'occupied' || activeStatus === 'broadcast',
      urgent: isUrgent,
    },
    {
      num: 5,
      title: 'Освобождение гос. волны',
      description: 'После завершения вещания отправьте в /dep освобождение волны. Повторите шаги 4–5 для каждого слота из набора.',
      command: RELEASE_WAVE_COMMAND,
      commandLabel: '/dep — освободил гос.волну',
      action: 'Освободил волну',
      done: activeSlotIdx === -1,
      active: activeStatus === 'broadcast',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          icon={ListChecks}
          title="Пошаговый алгоритм"
          subtitle={`Набор: ${times.join(' · ')} · Фракция: ${faction || 'SANG'}`}
        />
      </CardHeader>
      <CardContent>
        {/* Текущий активный слот */}
        {activeSlot && (
          <div className={`mb-4 p-3 rounded-lg border ${isUrgent ? 'border-red-500 pulse-red' : 'border-primary/30 bg-primary/5'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-primary/40 text-primary">
                  Слот {activeSlotIdx + 1} из 3
                </Badge>
                <span className="mono-tabular text-2xl font-bold text-primary">{activeSlot.time}</span>
                <Badge variant="secondary">{SLOT_STATUS_LABELS[activeStatus]}</Badge>
              </div>
              {activeStatus === 'occupied' && msToBroadcast > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  {isUrgent ? <BellRing className="w-4 h-4 text-red-400" /> : <Bell className="w-4 h-4 text-primary" />}
                  <span className="text-muted-foreground">до вещания:</span>
                  <span className={`mono-tabular font-bold ${isUrgent ? 'text-red-400' : 'text-primary'}`}>
                    {formatCountdown(activeSlot.timestamp, now.getTime())}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Шаги */}
        <div className="space-y-3">
          {steps.map((step) => (
            <StepRow key={step.num} step={step} now={now} onCopy={copy} lastCopied={lastCopied}
              onMarkAsked={onMarkAsked} onOccupy={onOccupy} onAdvanceSlot={onAdvanceSlot}
              waitRemaining={waitRemaining} waitStartedAt={waitStartedAt} soundEnabled={soundEnabled}
              activeSlot={activeSlot} activeStatus={activeStatus} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function useCopyInline(onCopy: (text: string, label?: string) => void) {
  const [lastCopied, setLastCopied] = React.useState<string | null>(null);
  const copy = React.useCallback(
    async (text: string, label?: string) => {
      await onCopy(text, label);
      setLastCopied(text);
      setTimeout(() => setLastCopied(null), 1500);
    },
    [onCopy],
  );
  return { copy, lastCopied };
}

function StepRow({
  step,
  now,
  onCopy,
  lastCopied,
  onMarkAsked,
  onOccupy,
  onAdvanceSlot,
  waitRemaining,
  waitStartedAt,
  soundEnabled,
  activeSlot,
  activeStatus,
}: {
  step: AlgorithmStep;
  now: Date;
  onCopy: (text: string, label?: string) => void;
  lastCopied: string | null;
  onMarkAsked: () => void;
  onOccupy: () => void;
  onAdvanceSlot: () => void;
  waitRemaining: number;
  waitStartedAt: number | null;
  soundEnabled: boolean;
  activeSlot: TimeSlot | null;
  activeStatus: SlotStatus;
}) {
  const stepNum = (
    <div
      className={`flex items-center justify-center w-9 h-9 rounded-full border-2 shrink-0 ${
        step.done
          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
          : step.active
            ? step.urgent
              ? 'border-red-500 text-red-400 pulse-red'
              : 'border-primary text-primary'
            : 'border-muted-foreground/30 text-muted-foreground/50'
      }`}
    >
      {step.done ? <Check className="w-5 h-5" /> : step.num}
    </div>
  );

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border transition-all ${
        step.active
          ? step.urgent
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-primary/40 bg-primary/5'
          : step.done
            ? 'border-emerald-500/20 bg-emerald-500/5 opacity-70'
            : 'border-border opacity-60'
      }`}
    >
      {stepNum}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-semibold text-sm">{step.title}</h3>
          {step.urgent && (
            <Badge variant="destructive" className="text-[10px] uppercase">
              <BellRing className="w-3 h-3" />
              Срочно
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{step.description}</p>

        {/* Команда для копирования */}
        {step.command && (
          <div className="mb-2">
            <div className="flex items-start gap-2">
              <code className="flex-1 px-3 py-2 rounded bg-background/50 border border-border text-[11px] mono-tabular break-all">
                {step.command}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCopy(step.command!, step.commandLabel)}
                className="shrink-0 border-primary/30"
                disabled={!step.active && !step.done}
              >
                {lastCopied === step.command ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span className="ml-1">{lastCopied === step.command ? 'OK' : 'Копировать'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Спец-контент для шага 2: таймер ожидания */}
        {step.num === 2 && step.active && (
          <div className="mb-2 p-3 rounded border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-yellow-400 flex items-center gap-1.5">
                <Timer className="w-3 h-3" />
                Таймер ожидания ответа
              </span>
              <span className="mono-tabular text-lg font-bold text-yellow-400">
                {waitStartedAt ? formatCountdown(Date.now() + waitRemaining, Date.now()) : '05:00'}
              </span>
            </div>
            {waitStartedAt === null ? (
              <Button size="sm" variant="outline" onClick={onMarkAsked} className="border-yellow-500/40 text-yellow-400">
                Запустить таймер (я спросил в /dep)
              </Button>
            ) : waitRemaining > 0 ? (
              <p className="text-xs text-muted-foreground">Ждём ответа из /dep…</p>
            ) : (
              <Button size="sm" variant="default" onClick={onOccupy} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <BellRing className="w-3 h-3" />
                5 минут прошло — занимаю волну
              </Button>
            )}
          </div>
        )}

        {/* Спец-контент для шага 4: будильник и 3 команды */}
        {step.num === 4 && step.active && activeSlot && (
          <div className="mb-2 space-y-2">
            <BroadcastCommands
              onCopy={onCopy}
              lastCopied={lastCopied}
              msToBroadcast={activeSlot.timestamp - now.getTime()}
              activeStatus={activeStatus}
              soundEnabled={soundEnabled}
            />
          </div>
        )}

        {/* Кнопка действия */}
        {step.action && step.active && step.num !== 2 && (step.num !== 4 || activeStatus === 'occupied') && (
          <Button
            size="sm"
            variant={step.urgent ? 'destructive' : 'default'}
            onClick={() => {
              if (step.num === 1) onMarkAsked();
              else if (step.num === 3) onOccupy();
              else if (step.num === 4 || step.num === 5) onAdvanceSlot();
            }}
          >
            <Check className="w-3 h-3" />
            {step.action}
          </Button>
        )}
      </div>
    </div>
  );
}

function BroadcastCommands({
  onCopy,
  lastCopied,
  msToBroadcast,
  activeStatus,
  soundEnabled,
}: {
  onCopy: (text: string, label?: string) => void;
  lastCopied: string | null;
  msToBroadcast: number;
  activeStatus: SlotStatus;
  soundEnabled: boolean;
}) {
  const isUrgent = msToBroadcast > 0 && msToBroadcast <= 2 * 60 * 1000;

  return (
    <div className={`p-3 rounded border ${isUrgent ? 'border-red-500/50 bg-red-500/5' : 'border-primary/30 bg-primary/5'}`}>
      {isUrgent && soundEnabled && (
        <div className="flex items-center gap-2 mb-2 text-red-400 text-xs font-medium pulse-red px-2 py-1 rounded bg-red-500/10 w-fit">
          <BellRing className="w-3 h-3" />
          ПОДАЧА ЧЕРЕЗ {formatCountdown(Date.now() + msToBroadcast, Date.now())}!
        </div>
      )}
      <div className="space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Три команды вещания:</div>
        <BroadcastRow label="1. /dep — занял" command={TOOK_WAVE_COMMAND} onCopy={onCopy} copied={lastCopied === TOOK_WAVE_COMMAND} />
        <BroadcastRow label="2. /gnews — текст набора" command="↓ выберите шаблон ниже ↓" onCopy={() => {}} copied={false} isPlaceholder />
        <BroadcastRow label="3. /report — одобрение" command={REPORT_COMMAND} onCopy={onCopy} copied={lastCopied === REPORT_COMMAND} />
      </div>
      {activeStatus === 'broadcast' && (
        <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Вещание подано. Не забудьте освободить волну после окончания.
        </div>
      )}
    </div>
  );
}

function BroadcastRow({
  label,
  command,
  onCopy,
  copied,
  isPlaceholder = false,
}: {
  label: string;
  command: string;
  onCopy: (text: string, label?: string) => void;
  copied: boolean;
  isPlaceholder?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] text-muted-foreground w-32 shrink-0 pt-1.5">{label}</span>
      <code className={`flex-1 px-2 py-1.5 rounded text-[11px] mono-tabular break-all ${isPlaceholder ? 'bg-muted/30 border border-dashed border-muted-foreground/30 text-muted-foreground italic' : 'bg-background/50 border border-border'}`}>
        {command}
      </code>
      {!isPlaceholder && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(command, label)}
          className="shrink-0 h-7 px-2 border-primary/30"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </Button>
      )}
    </div>
  );
}

// ============================================================
// GNEWS TEMPLATES (ШАБЛОНЫ ВЕЩАНИЯ)
// ============================================================

function GnewsTemplates({
  onCopy,
}: {
  onCopy: (text: string, label?: string) => void;
}) {
  const [active, setActive] = React.useState<GnewsTemplateId>('normal');
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const template = GNEWS_TEMPLATES[active];

  const handleCopy = React.useCallback(
    async (text: string, label?: string) => {
      await onCopy(text, label);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 1500);
    },
    [onCopy],
  );

  const charCount = template.text.length;

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          icon={Megaphone}
          title="Шаблоны /gnews вещания"
          subtitle="Готовые тексты набора в SANG. Нажмите на таб и скопируйте команду."
        />
      </CardHeader>
      <CardContent>
        <Tabs value={active} onValueChange={(v) => setActive(v as GnewsTemplateId)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="normal">
              <FileText className="w-3 h-3 mr-1.5" />
              Обычный набор
            </TabsTrigger>
            <TabsTrigger value="blat">
              <FileText className="w-3 h-3 mr-1.5" />
              День блата
            </TabsTrigger>
          </TabsList>

          <TabsContent value={active} className="mt-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  {template.title}
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>

              <div className="relative">
                <pre className="p-3 rounded-lg bg-background/50 border border-border text-[11px] mono-tabular whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                  {`/gnews ${template.text}`}
                </pre>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Символов: <span className="mono-tabular font-semibold text-foreground">{charCount}</span>
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>
                    Команда: <code className="text-primary">/gnews</code>
                  </span>
                </div>
                <Button
                  size="lg"
                  onClick={() => handleCopy(`/gnews ${template.text}`, `/gnews — ${template.title}`)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {copiedText === `/gnews ${template.text}` ? (
                    <>
                      <Check className="w-4 h-4" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Копировать /gnews
                    </>
                  )}
                </Button>
              </div>

              <Separator className="my-2" />

              {/* Дополнительные быстрые команды */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <QuickCommand
                  label="/report"
                  command={REPORT_COMMAND}
                  onCopy={handleCopy}
                  copied={copiedText === REPORT_COMMAND}
                />
                <QuickCommand
                  label="Занял гос.волну"
                  command={TOOK_WAVE_COMMAND}
                  onCopy={handleCopy}
                  copied={copiedText === TOOK_WAVE_COMMAND}
                />
                <QuickCommand
                  label="Освободил"
                  command={RELEASE_WAVE_COMMAND}
                  onCopy={handleCopy}
                  copied={copiedText === RELEASE_WAVE_COMMAND}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function QuickCommand({
  label,
  command,
  onCopy,
  copied,
}: {
  label: string;
  command: string;
  onCopy: (text: string, label?: string) => void;
  copied: boolean;
}) {
  return (
    <Button
      variant="outline"
      onClick={() => onCopy(command, label)}
      className="h-auto flex-col items-start py-2 px-3 border-primary/30"
    >
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <code className="text-[10px] mono-tabular text-foreground truncate w-full text-left">
        {copied ? '✓ Скопировано' : command}
      </code>
    </Button>
  );
}

// ============================================================
// SLOT CHECKLIST (ЧЕК-ЛИСТ СТАТУСОВ)
// ============================================================

function SlotChecklist({
  selectedSet,
  slotStatuses,
  now,
  onSetStatus,
}: {
  selectedSet: SlotSet | null;
  slotStatuses: SlotStatus[];
  now: Date;
  onSetStatus: (idx: number, status: SlotStatus) => void;
}) {
  if (!selectedSet) return null;

  const statusOrder: SlotStatus[] = ['planned', 'asked', 'occupied', 'broadcast', 'released'];
  const nextStatus: Record<SlotStatus, SlotStatus | null> = {
    planned: 'asked',
    asked: 'occupied',
    occupied: 'broadcast',
    broadcast: 'released',
    released: null,
  };

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          icon={ListChecks}
          title="Чек-лист статусов слотов"
          subtitle="Отслеживайте прогресс каждого слота от планирования до освобождения"
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {selectedSet.slots.map((slot, idx) => {
            const status = slotStatuses[idx];
            const msToSlot = slot.timestamp - now.getTime();
            const isPast = msToSlot <= 0;
            const isUpcoming = !isPast && msToSlot <= 2 * 60 * 1000;

            const rowColor = {
              planned: 'border-border',
              asked: 'border-yellow-500/40 bg-yellow-500/5',
              occupied: 'border-primary/50 bg-primary/5',
              broadcast: 'border-red-500/40 bg-red-500/5',
              released: 'border-emerald-500/40 bg-emerald-500/5',
            }[status];

            return (
              <div key={slot.timestamp} className={`p-3 rounded-lg border ${rowColor}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Слот {idx + 1}
                    </span>
                    <span className="mono-tabular text-2xl font-bold text-primary">{slot.time}</span>
                    {isUpcoming && status === 'occupied' && (
                      <Badge variant="destructive" className="text-[10px] pulse-red">
                        <BellRing className="w-3 h-3" />
                        Скоро
                      </Badge>
                    )}
                    {isPast && status !== 'released' && (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="w-3 h-3" />
                        Время прошло
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {isPast ? 'прошло' : 'через'}{' '}
                      <span className="mono-tabular font-semibold text-foreground">
                        {formatCountdown(slot.timestamp, now.getTime())}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Прогресс-бар статусов */}
                <div className="mt-3 flex items-center gap-1">
                  {statusOrder.map((s) => {
                    const currentIdx = statusOrder.indexOf(status);
                    const sIdx = statusOrder.indexOf(s);
                    const isDone = sIdx <= currentIdx;
                    const isCurrent = s === status;
                    return (
                      <React.Fragment key={s}>
                        <button
                          onClick={() => onSetStatus(idx, s)}
                          className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider transition-all ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : isDone
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground hover:bg-muted/70'
                          }`}
                        >
                          {SLOT_STATUS_LABELS[s]}
                        </button>
                        {sIdx < statusOrder.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {nextStatus[status] && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSetStatus(idx, nextStatus[status]!)}
                      className="border-primary/30"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Перевести в «{SLOT_STATUS_LABELS[nextStatus[status]!]}»
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// RULES REFERENCE (СПРАВКА ПРАВИЛ)
// ============================================================

function RulesReference() {
  const rules = [
    {
      num: 'Ст. 8, п. 1',
      title: 'Время вещания',
      body: 'Вещание должно быть в 10-е минуты по местному времени. К десятым минутам относятся: 00:00, 00:10, 00:20, 00:30, 00:40, 00:50. Исключение — экстренные новости о чрезвычайном и военном положении.',
      example: '✓ 18:00, 18:20, 18:40    ✗ 18:05, 18:15, 18:33',
    },
    {
      num: 'Ст. 8, п. 2',
      title: 'Окно бронирования',
      body: 'Занимать государственную волну разрешено заблаговременно, но не ранее чем за 10 минут и не позднее чем за 120 минут до начала вещания.',
      example: 'Сейчас 17:33 → нельзя 17:40 (меньше 10 мин), нельзя 19:40 (больше 120 мин)',
    },
    {
      num: 'Ст. 8, п. 4',
      title: 'Лимит слотов',
      body: 'Разрешено занимать гос. волну на три времени на одну организацию в нынешних 120-ти минутах. Интервал между слотами — 20 минут.',
      example: '✓ 18:00, 18:20, 18:40 (3 слота, интервал 20 мин)',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          icon={BookOpen}
          title="Справка правил"
          subtitle="Глава III. О вещании в государственную волну"
        />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rules.map((rule) => (
            <div key={rule.num} className="p-3 rounded-lg border border-border bg-background/30">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                  {rule.num}
                </Badge>
                <Info className="w-3 h-3 text-muted-foreground" />
              </div>
              <h4 className="font-semibold text-sm mb-2">{rule.title}</h4>
              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{rule.body}</p>
              <div className="text-[11px] mono-tabular text-primary bg-primary/5 p-2 rounded border border-primary/20">
                {rule.example}
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Пример расчёта (сейчас 17:33)</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <span className="text-red-400">17:40</span> — занять нельзя, меньше 10 минут до начала
            </li>
            <li>
              <span className="text-red-400">19:40</span> — занять нельзя, больше 120 минут до начала
            </li>
            <li>
              <span className="text-emerald-400">18:00, 18:20, 18:40</span> — валидный набор
            </li>
            <li>
              <span className="text-emerald-400">17:50, 18:10, 18:30</span> — альтернативный набор
            </li>
            <li>После подачи 18:00 можно бронировать 19:00, если оно свободно</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================================

export default function Home() {
  const [now, setNow] = React.useState<Date>(new Date());
  const [faction, setFaction] = React.useState<string>('SANG');
  const [selectedSetId, setSelectedSetId] = React.useState<string | null>(null);
  const [slotStatuses, setSlotStatuses] = React.useState<SlotStatus[]>(['planned', 'planned', 'planned']);
  const [waitStartedAt, setWaitStartedAt] = React.useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true);
  const [alarmFiredFor, setAlarmFiredFor] = React.useState<number | null>(null);

  const { copy } = useClipboard();

  // Тикер — обновляем время каждую секунду
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Пересчёт рекомендованных наборов (каждые 30 секунд — на случай если слоты ушли)
  const recommendedSets = React.useMemo(() => getRecommendedSets(now), [now]);
  const availableSlots = React.useMemo(() => {
    // Получаем количество доступных слотов из getRecommendedSets (внутри используется getAvailableSlots)
    // Здесь просто покажем count
    const minTime = new Date(now.getTime() + 10 * 60 * 1000);
    const maxTime = new Date(now.getTime() + 120 * 60 * 1000);
    let count = 0;
    const firstMin = Math.ceil(minTime.getMinutes() / 10) * 10;
    const startMin = firstMin >= 60 ? firstMin - 60 : firstMin;
    const start = new Date(minTime);
    start.setMinutes(startMin, 0, 0);
    if (start.getTime() < minTime.getTime()) start.setMinutes(start.getMinutes() + 10);
    let current = new Date(start);
    while (current.getTime() <= maxTime.getTime()) {
      count++;
      current = new Date(current.getTime() + 10 * 60 * 1000);
    }
    return Array.from({ length: count }, (_, i) => ({
      time: '',
      date: new Date(start.getTime() + i * 10 * 60 * 1000),
      timestamp: start.getTime() + i * 10 * 60 * 1000,
    }));
  }, [now]);

  const selectedSet = React.useMemo(
    () => recommendedSets.find((s) => s.id === selectedSetId) ?? null,
    [recommendedSets, selectedSetId],
  );

  // При выборе набора — сбрасываем статусы
  const handleSelectSet = React.useCallback((set: SlotSet) => {
    setSelectedSetId(set.id);
    setSlotStatuses(['planned', 'planned', 'planned']);
    setWaitStartedAt(null);
    setAlarmFiredFor(null);
  }, []);

  // Действия алгоритма
  const handleMarkAsked = React.useCallback(() => {
    setWaitStartedAt(Date.now());
    setSlotStatuses((prev) => {
      const next = [...prev];
      if (next[0] === 'planned') next[0] = 'asked';
      return next;
    });
  }, []);

  const handleOccupy = React.useCallback(() => {
    setWaitStartedAt(null);
    setSlotStatuses((prev) => {
      const next = [...prev];
      // Помечаем все planned как occupied
      for (let i = 0; i < next.length; i++) {
        if (next[i] === 'planned' || next[i] === 'asked') next[i] = 'occupied';
      }
      return next;
    });
  }, []);

  const handleAdvanceSlot = React.useCallback(() => {
    setSlotStatuses((prev) => {
      const next = [...prev];
      const idx = next.findIndex((s) => s !== 'released');
      if (idx >= 0) {
        if (next[idx] === 'occupied') next[idx] = 'broadcast';
        else if (next[idx] === 'broadcast') next[idx] = 'released';
      }
      return next;
    });
    setAlarmFiredFor(null);
  }, []);

  const handleSetStatus = React.useCallback((idx: number, status: SlotStatus) => {
    setSlotStatuses((prev) => {
      const next = [...prev];
      next[idx] = status;
      return next;
    });
  }, []);

  // Будильник: если активный слот занят и до него <= 2 минут — играем сигнал
  React.useEffect(() => {
    if (!selectedSet || !soundEnabled) return;
    const activeIdx = slotStatuses.findIndex((s) => s === 'occupied');
    if (activeIdx < 0) return;
    const slot = selectedSet.slots[activeIdx];
    const ms = slot.timestamp - Date.now();
    if (ms > 0 && ms <= 2 * 60 * 1000 && alarmFiredFor !== slot.timestamp) {
      // Сработает когда останется ровно 2 минуты (или меньше, если только что включились)
      playAlarm();
      setAlarmFiredFor(slot.timestamp);
    }
    // Когда остаётся 30 секунд — играем «пора подавать»
    if (ms > 0 && ms <= 30 * 1000 && alarmFiredFor === slot.timestamp + 1) {
      // ничего, уже сыграли
    }
  }, [now, selectedSet, slotStatuses, soundEnabled, alarmFiredFor]);

  // Определение текущей фазы
  const phase: Phase = React.useMemo(() => {
    if (!selectedSet) return { kind: 'idle', label: 'Ожидание' };
    if (slotStatuses.every((s) => s === 'released')) {
      return { kind: 'released', label: 'Освобождено' };
    }
    const activeIdx = slotStatuses.findIndex((s) => s !== 'released');
    const status = slotStatuses[activeIdx];
    if (status === 'planned') return { kind: 'idle', label: 'Готов к запросу' };
    if (status === 'asked') {
      const remaining = waitStartedAt ? Math.max(0, 5 * 60 * 1000 - (Date.now() - waitStartedAt)) : 0;
      return { kind: 'waiting', label: 'Ожидание ответа', remaining };
    }
    if (status === 'occupied') {
      const slot = selectedSet.slots[activeIdx];
      return {
        kind: 'occupied',
        label: 'Волна занята',
        nextSlot: slot.time,
        countdown: formatCountdown(slot.timestamp, Date.now()),
      };
    }
    if (status === 'broadcast') return { kind: 'broadcast', label: 'Вещание' };
    return { kind: 'idle', label: 'Ожидание' };
  }, [selectedSet, slotStatuses, waitStartedAt, now]);

  return (
    <div className="min-h-screen flex flex-col gov-bg">
      <Header
        faction={faction}
        onFactionChange={setFaction}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        <TimeBoard now={now} />

        <StatusCards now={now} availableSlots={availableSlots} phase={phase} />

        <RecommendedSets
          sets={recommendedSets}
          selectedSetId={selectedSetId}
          onSelect={handleSelectSet}
          now={now}
        />

        <AlgorithmSteps
          selectedSet={selectedSet}
          faction={faction}
          slotStatuses={slotStatuses}
          waitStartedAt={waitStartedAt}
          now={now}
          onCopy={copy}
          onMarkAsked={handleMarkAsked}
          onOccupy={handleOccupy}
          onAdvanceSlot={handleAdvanceSlot}
          soundEnabled={soundEnabled}
        />

        {selectedSet && (
          <SlotChecklist
            selectedSet={selectedSet}
            slotStatuses={slotStatuses}
            now={now}
            onSetStatus={handleSetStatus}
          />
        )}

        <GnewsTemplates onCopy={copy} />

        <RulesReference />
      </main>

      <footer className="mt-auto border-t border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            <span>Гос. Волны · Командный Пункт · Ст. 8</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Фракция: <span className="text-primary font-semibold">{faction || 'SANG'}</span></span>
            <Separator orientation="vertical" className="h-3" />
            <span>Время местное</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
