export function taipeiToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const value = type => parts.find(p => p.type === type).value;
  return value('year') + '-' + value('month') + '-' + value('day');
}
export function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date + 'T00:00:00Z')) &&
    new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date;
}
export function shiftDate(date, days) {
  const value = new Date(date + 'T00:00:00Z');
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function periodRange(date, period) {
  if (!validDate(date)) throw new Error('Invalid date');
  if (period === 'day') return {start: date, end: date};
  const weekday = new Date(date + 'T00:00:00Z').getUTCDay();
  const start = shiftDate(date, -((weekday + 6) % 7));
  return {start, end: shiftDate(start, 6)};
}
export function selectEditions(editions, date, period) {
  const {start, end} = periodRange(date, period);
  return editions.filter(e => e.date >= start && e.date <= end)
    .sort((a, b) => b.date.localeCompare(a.date));
}
