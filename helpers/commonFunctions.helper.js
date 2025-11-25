const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const dateConstants = require('../constants/dateFormat.constant');

const processInBatchesWithLimit = async function (items, callback, concurrency = 5) {
  const pool = [];
  for (const item of items) {
    pool.push(callback(item));

    if (pool.length >= concurrency) {
      await Promise.all(pool);
      pool.length = 0;
    }
  }
  if (pool.length) {
    await Promise.all(pool);
  }
};

const parseSingleDate = function (raw) {
  const cleaned = raw.replace(/current|present|now/i, 'Present').trim();

  if (/present/i.test(cleaned)) return null;

  for (const fmt of dateConstants.DATE_FORMATS) {
    const parsed = dayjs(cleaned, fmt, true);
    if (parsed.isValid()) return parsed;
  }

  return null;
};

const normalizeDateString = function (str) {
  return str
    .replace(/[’‘`´]/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/['’](?=\w)|(?<=\w)['’]/g, ' ')
    .replace(/[,\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const parseTimePeriod = function (periodStr) {
  const raw = normalizeDateString(periodStr);

  let [startRaw, endRaw] = raw.split(/-|–|—/);

  startRaw = normalizeDateString(startRaw);
  endRaw = normalizeDateString(endRaw);

  const start = parseSingleDate(startRaw);
  const end = /present/i.test(endRaw) ? dayjs() : parseSingleDate(endRaw);

  return { start, end };
};

const calculateDurationYears = function (periodStr) {
  const { start, end } = parseTimePeriod(periodStr);

  if (!start || !end) return 0;

  const totalMonths = end.diff(start, 'month', true); // float allowed

  if (totalMonths < 12) {
    return Math.round(totalMonths) + ' months';
  }

  return Number((totalMonths / 12).toFixed(2)) + ' years';
};

module.exports = {
  calculateDurationYears,
  parseTimePeriod,
  processInBatchesWithLimit
};
