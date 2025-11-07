import { DateTime } from 'luxon';
import { RRule, Weekday, rrulestr } from 'rrule';

export type ScheduleCadence = 'daily' | 'weekly' | 'monthly';

export type ScheduleRequest = {
  timezone: string;
  cadence: ScheduleCadence;
  preferredHour?: number;
  preferredMinute?: number;
  weekdays?: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>; // 0 = Monday
  interval?: number;
  startAt?: string;
};

const WEEKDAY_MAP: Record<number, Weekday> = {
  0: RRule.MO,
  1: RRule.TU,
  2: RRule.WE,
  3: RRule.TH,
  4: RRule.FR,
  5: RRule.SA,
  6: RRule.SU,
};

const freqFromCadence = (cadence: ScheduleCadence) => {
  switch (cadence) {
    case 'weekly':
      return RRule.WEEKLY;
    case 'monthly':
      return RRule.MONTHLY;
    default:
      return RRule.DAILY;
  }
};

export const buildRRule = (req: ScheduleRequest): string => {
  const dtStart = req.startAt
    ? DateTime.fromISO(req.startAt, { zone: req.timezone })
    : DateTime.now().setZone(req.timezone).set({
        hour: req.preferredHour ?? 9,
        minute: req.preferredMinute ?? 0,
        second: 0,
        millisecond: 0,
      });

  const rule = new RRule({
    freq: freqFromCadence(req.cadence),
    interval: req.interval ?? 1,
    dtstart: dtStart.toJSDate(),
    byhour: req.preferredHour ?? 9,
    byminute: req.preferredMinute ?? 0,
    byweekday: req.cadence === 'weekly' ? (req.weekdays ?? [0]).map((day) => WEEKDAY_MAP[day]) : undefined,
  });

  return rule.toString();
};

export const computeNextOccurrence = (
  params: { timezone: string; rrule: string; startAt?: string },
  now = new Date()
): Date => {
  const dtStart = params.startAt
    ? DateTime.fromISO(params.startAt, { zone: params.timezone })
    : DateTime.fromJSDate(now).setZone(params.timezone);
  const rule = rrulestr(params.rrule, { dtstart: dtStart.toJSDate() });
  const next = rule.after(now, true);
  if (!next) {
    throw new Error('No future occurrence for rule');
  }
  return DateTime.fromJSDate(next, { zone: params.timezone }).toUTC().toJSDate();
};

export const describeSchedule = (req: ScheduleRequest) => {
  const time = `${req.preferredHour ?? 9}:${(req.preferredMinute ?? 0).toString().padStart(2, '0')} ${req.timezone}`;
  if (req.cadence === 'daily') return `Every day at ${time}`;
  if (req.cadence === 'weekly') {
    const days = (req.weekdays ?? [0])
      .map((day) => WEEKDAY_MAP[day].toString().slice(0, 2))
      .join(', ');
    return `Every ${days} at ${time}`;
  }
  return `Every month at ${time}`;
};

export const computeNextCheckIn = (req: ScheduleRequest) => {
  const rrule = buildRRule(req);
  return computeNextOccurrence({ timezone: req.timezone, rrule, startAt: req.startAt });
};
