import { SAUDI_TIMEZONE } from './dateUtils';

const MINUTE_MS = 60 * 1000;
const DAY_MINUTES = 24 * 60;

const toMs = (value) => new Date(value).getTime();
const toWholeMinutes = (value) => Math.floor(toMs(value) / MINUTE_MS);

export const getSaudiMinutes = (value) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SAUDI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(value));
  const read = (type) => Number(parts.find((part) => part.type === type).value);

  return read('hour') * 60 + read('minute');
};

const isAfterMidnightOfOvernightShift = (minutes, startMinutes, endMinutes) => (
  endMinutes <= startMinutes && minutes < endMinutes
);

export const getLateMinutes = (checkin, startMinutes, endMinutes) => {
  const minutes = getSaudiMinutes(checkin);
  const adjusted = isAfterMidnightOfOvernightShift(minutes, startMinutes, endMinutes)
    ? minutes + DAY_MINUTES
    : minutes;

  return Math.max(adjusted - startMinutes, 0);
};

export const getOvertimeMinutes = (checkin, checkout, startMinutes, endMinutes) => {
  const checkinMinutes = getSaudiMinutes(checkin);
  const shiftDayStart = toWholeMinutes(checkin) - checkinMinutes;
  const endsNextDay = endMinutes <= startMinutes
    && !isAfterMidnightOfOvernightShift(checkinMinutes, startMinutes, endMinutes);
  const expectedEnd = shiftDayStart + endMinutes + (endsNextDay ? DAY_MINUTES : 0);

  return toWholeMinutes(checkout) - expectedEnd;
};

export const summarizeDayAttendance = (rows) => {
  if (!rows.length) {
    return null;
  }

  const checkins = rows
    .filter((row) => row.checkin)
    .map((row) => row.checkin)
    .sort((a, b) => toMs(a.timestamp) - toMs(b.timestamp));
  const completeShifts = rows.filter((row) => row.checkin && row.checkout);
  const checkoutSource = checkins.length ? completeShifts : rows.filter((row) => row.checkout);
  const checkout = checkoutSource
    .map((row) => row.checkout)
    .sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp))[0] || null;

  return {
    date: rows[0].date,
    checkin: checkins[0] || null,
    checkout,
    workMinutes: completeShifts.length
      ? completeShifts.reduce((total, row) => (
        total + Math.floor((toMs(row.checkout.timestamp) - toMs(row.checkin.timestamp)) / MINUTE_MS)
      ), 0)
      : null
  };
};

export const buildDailyAttendance = (rows) => {
  const rowsByDate = new Map();

  rows.forEach((row) => {
    if (!row.date) {
      return;
    }

    if (!rowsByDate.has(row.date)) {
      rowsByDate.set(row.date, []);
    }

    rowsByDate.get(row.date).push(row);
  });

  return new Map(
    Array.from(rowsByDate, ([date, dayRows]) => [date, summarizeDayAttendance(dayRows)])
  );
};
