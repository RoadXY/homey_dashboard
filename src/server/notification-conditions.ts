export type ScheduleCondition = {
  /** False represents a newly-created Blockly schedule that has not been configured yet. */
  configured?: false;
  weekdays: number[];
  startTime?: string;
  endTime?: string;
  timeZone?: string;
};

export type ConditionResult = {
  state: "active" | "inactive" | "unknown";
  reason?: string;
  /** Unix timestamp (ms) when a pending duration gate must be evaluated again. */
  reevaluateAt?: number;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function parseClockTime(value: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error(`Ongeldige schematijd: ${value}`);
  }
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isValidScheduleCondition(schedule: ScheduleCondition): boolean {
  try {
    if (!Array.isArray(schedule.weekdays) ||
        schedule.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) return false;
    if (schedule.configured === false) {
      return schedule.weekdays.length === 0 && schedule.startTime === undefined && schedule.endTime === undefined && schedule.timeZone === undefined;
    }
    if (schedule.weekdays.length === 0 || typeof schedule.startTime !== "string" || typeof schedule.endTime !== "string") return false;
    const start = parseClockTime(schedule.startTime);
    const end = parseClockTime(schedule.endTime);
    if (start === end) return false;
    if (schedule.timeZone !== undefined) {
      if (typeof schedule.timeZone !== "string" || schedule.timeZone.length === 0) return false;
      new Intl.DateTimeFormat("en-US", { timeZone: schedule.timeZone });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Evaluates a weekly local-time schedule. The selected weekday owns the
 * start of an overnight interval (e.g. Monday 22:00–Tuesday 07:00).
 * Intl handles the selected IANA timezone, including DST transitions.
 */
function createScheduleFormatter(schedule: ScheduleCondition): Intl.DateTimeFormat {
  const timeZone = schedule.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function isScheduleActiveWithFormatter(
  schedule: ScheduleCondition,
  now: Date,
  formatter: Intl.DateTimeFormat,
): boolean {
  if (schedule.configured === false) return false;
  if (!Array.isArray(schedule.weekdays) || schedule.weekdays.length === 0 ||
      schedule.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
      typeof schedule.startTime !== "string" || typeof schedule.endTime !== "string") {
    throw new Error("Een tijdschema moet minimaal één geldige weekdag bevatten.");
  }

  const start = parseClockTime(schedule.startTime);
  const end = parseClockTime(schedule.endTime);
  if (start === end) throw new Error("Begin- en eindtijd van een tijdschema mogen niet gelijk zijn.");

  const parts = formatter.formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = WEEKDAY_INDEX[values.weekday];
  const minuteOfDay = Number(values.hour) * 60 + Number(values.minute);
  const selected = new Set(schedule.weekdays);

  if (start < end) {
    return selected.has(weekday) && minuteOfDay >= start && minuteOfDay < end;
  }

  const previousWeekday = (weekday + 6) % 7;
  return (selected.has(weekday) && minuteOfDay >= start) ||
    (selected.has(previousWeekday) && minuteOfDay < end);
}

export function isScheduleActive(schedule: ScheduleCondition, now: Date): boolean {
  return isScheduleActiveWithFormatter(schedule, now, createScheduleFormatter(schedule));
}

/**
 * Finds the first real-time minute at which this schedule changes state.
 * Scanning actual instants (rather than constructing local dates) naturally
 * handles missing and repeated wall-clock minutes during DST transitions.
 */
export function nextScheduleTransition(schedule: ScheduleCondition, now: Date): number {
  const formatter = createScheduleFormatter(schedule);
  const currentState = isScheduleActiveWithFormatter(schedule, now, formatter);
  const currentMinute = Math.floor(now.getTime() / 60_000) * 60_000;
  const maxMinutes = 8 * 24 * 60;
  for (let minute = 1; minute <= maxMinutes; minute += 1) {
    const candidate = new Date(currentMinute + minute * 60_000);
    if (isScheduleActiveWithFormatter(schedule, candidate, formatter) !== currentState) {
      return candidate.getTime();
    }
  }
  throw new Error("Geen volgende overgang gevonden voor het tijdschema.");
}

/**
 * Stateful gate for "the child condition must remain active for durationMs".
 * A stable key (notification ID + Blockly block ID) is required per gate.
 * Pending duration is reported as inactive, so it never flashes prematurely.
 */
export function evaluateDurationGate(
  key: string,
  child: ConditionResult,
  durationMs: number,
  now: number,
  activeSince: Map<string, number>,
): ConditionResult {
  if (!Number.isSafeInteger(durationMs) || durationMs <= 0) {
    return { state: "unknown", reason: "duration_invalid" };
  }
  if (child.state !== "active") {
    activeSince.delete(key);
    return child;
  }

  const startedAt = activeSince.get(key) ?? now;
  activeSince.set(key, startedAt);
  const durationDeadline = startedAt + durationMs;
  const reevaluateAt = child.reevaluateAt === undefined
    ? durationDeadline
    : Math.min(durationDeadline, child.reevaluateAt);
  if (now >= durationDeadline) {
    return child.reevaluateAt === undefined
      ? { state: "active" }
      : { state: "active", reevaluateAt: child.reevaluateAt };
  }
  return { state: "inactive", reevaluateAt };
}
