/**
 * Date Utilities for Saudi Arabia Timezone (Asia/Riyadh, UTC+3)
 * All dates in the system should be formatted using these utilities
 */

export const SAUDI_TIMEZONE = 'Asia/Riyadh';

/**
 * Get current date/time
 * @returns {Date}
 */
export function getNow() {
  return new Date();
}

/**
 * Format a date for display in Saudi Arabia timezone
 * @param {Date|string} date - The date to format
 * @param {string} locale - Locale string ('ar' or 'en')
 * @param {Object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'en', options = {}) {
  if (!date) return '-';

  const localeString = locale === 'ar' ? 'ar-US' : 'en-US';
  const defaultOptions = {
    timeZone: SAUDI_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  try {
    return new Date(date).toLocaleDateString(localeString, defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format a date with weekday for display in Saudi Arabia timezone
 * @param {Date|string} date - The date to format
 * @param {string} locale - Locale string ('ar' or 'en')
 * @returns {string} Formatted date string with weekday
 */
export function formatDateWithWeekday(date, locale = 'en') {
  if (!date) return '-';

  const localeString = locale === 'ar' ? 'ar-US' : 'en-US';
  const options = {
    timeZone: SAUDI_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  try {
    return new Date(date).toLocaleDateString(localeString, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format a date with full date and time for display in Saudi Arabia timezone
 * @param {Date|string} date - The date to format
 * @param {string} locale - Locale string ('ar' or 'en')
 * @param {Object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(date, locale = 'en', options = {}) {
  if (!date) return '-';

  const localeString = locale === 'ar' ? 'ar-US' : 'en-US';
  const defaultOptions = {
    timeZone: SAUDI_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  try {
    return new Date(date).toLocaleString(localeString, defaultOptions);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
}

/**
 * Format time only for display in Saudi Arabia timezone
 * @param {Date|string} date - The date to format
 * @param {string} locale - Locale string ('ar' or 'en')
 * @param {Object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export function formatTime(date, locale = 'en', options = {}) {
  if (!date) return '-';

  const localeString = locale === 'ar' ? 'ar-US' : 'en-US';
  const defaultOptions = {
    timeZone: SAUDI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  try {
    return new Date(date).toLocaleTimeString(localeString, defaultOptions);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
}

/**
 * Format time with seconds for display in Saudi Arabia timezone
 * @param {Date|string} date - The date to format
 * @param {string} locale - Locale string ('ar' or 'en')
 * @returns {string} Formatted time string with seconds
 */
export function formatTimeWithSeconds(date, locale = 'en') {
  if (!date) return '-';

  const localeString = locale === 'ar' ? 'ar-US' : 'en-US';
  const options = {
    timeZone: SAUDI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  try {
    return new Date(date).toLocaleTimeString(localeString, options);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
}

/**
 * Format relative time (e.g., "5 minutes ago", "2 days ago")
 * @param {Date|string} date - The date to format
 * @param {Object} t - Translation function from i18n
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date, t) {
  if (!date) return '-';

  const now = new Date();
  const inputDate = new Date(date);
  const diffMs = now - inputDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('notifications.justNow') || 'Just now';
  if (diffMins < 60) return `${diffMins} ${t('notifications.minutesAgo') || 'minutes ago'}`;
  if (diffHours < 24) return `${diffHours} ${t('notifications.hoursAgo') || 'hours ago'}`;
  if (diffDays < 7) return `${diffDays} ${t('notifications.daysAgo') || 'days ago'}`;

  // For older dates, show the full date
  return formatDateTime(date);
}

/**
 * Get the month name in Saudi Arabia timezone
 * @param {Date|string} date - The date
 * @param {string} locale - Locale string ('ar' or 'en')
 * @returns {string} Month name
 */
export function getMonthName(date, locale = 'en') {
  if (!date) return '-';

  const localeString = locale === 'ar' ? 'ar-US' : 'en-US';
  const options = {
    timeZone: SAUDI_TIMEZONE,
    month: 'long'
  };

  try {
    return new Date(date).toLocaleDateString(localeString, options);
  } catch (error) {
    console.error('Error getting month name:', error);
    return '-';
  }
}

/**
 * Get the month and year in Saudi Arabia timezone
 * @param {Date|string} date - The date
 * @param {string} locale - Locale string ('ar' or 'en')
 * @returns {string} Month and year
 */
export function getMonthYear(date, locale = 'en') {
  if (!date) return '-';

  const localeString = locale === 'ar' ? 'ar-US' : 'en-US';
  const options = {
    timeZone: SAUDI_TIMEZONE,
    month: 'long',
    year: 'numeric'
  };

  try {
    return new Date(date).toLocaleDateString(localeString, options);
  } catch (error) {
    console.error('Error getting month year:', error);
    return '-';
  }
}

/**
 * Get day name in Saudi Arabia timezone
 * @param {Date|string} date - The date
 * @param {string} locale - Locale string ('ar' or 'en')
 * @param {boolean} short - Whether to return short day name
 * @returns {string} Day name
 */
export function getDayName(date, locale = 'en', short = false) {
  if (!date) return '-';

  const localeString = locale === 'ar' ? 'ar-US' : 'en-US';
  const options = {
    timeZone: SAUDI_TIMEZONE,
    weekday: short ? 'short' : 'long'
  };

  try {
    return new Date(date).toLocaleDateString(localeString, options);
  } catch (error) {
    console.error('Error getting day name:', error);
    return '-';
  }
}

/**
 * Get YYYY-MM-DD string in Saudi Arabia timezone (for inputs)
 * @param {Date|string} date - The date
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getDateInputValue(date) {
  if (!date) return '';

  try {
    const d = new Date(date);
    // Get date in Saudi timezone
    const saudiDateStr = d.toLocaleDateString('en-CA', { timeZone: SAUDI_TIMEZONE });
    return saudiDateStr; // en-CA gives YYYY-MM-DD format
  } catch (error) {
    console.error('Error getting date input value:', error);
    return '';
  }
}

/**
 * Get datetime-local string in Saudi Arabia timezone (for datetime inputs)
 * @param {Date|string} date - The date
 * @returns {string} DateTime string in YYYY-MM-DDTHH:mm format
 */
export function getDateTimeInputValue(date) {
  if (!date) return '';

  try {
    const d = new Date(date);
    // Get date in Saudi timezone
    const options = {
      timeZone: SAUDI_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
    const values = {};
    parts.forEach(part => {
      values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
  } catch (error) {
    console.error('Error getting datetime input value:', error);
    return '';
  }
}

/**
 * Get time input value in Saudi Arabia timezone (for time inputs)
 * @param {Date|string} date - The date
 * @returns {string} Time string in HH:mm format
 */
export function getTimeInputValue(date) {
  if (!date) return '';

  try {
    const d = new Date(date);
    const options = {
      timeZone: SAUDI_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    return d.toLocaleTimeString('en-GB', options);
  } catch (error) {
    console.error('Error getting time input value:', error);
    return '';
  }
}

/**
 * Check if a date is today in Saudi Arabia timezone
 * @param {Date|string} date - The date to check
 * @returns {boolean}
 */
export function isToday(date) {
  if (!date) return false;

  const todayString = getDateInputValue(new Date());
  const dateString = getDateInputValue(date);
  return todayString === dateString;
}

/**
 * Get start of month in Saudi Arabia timezone
 * @param {number} year 
 * @param {number} month - 0-indexed
 * @returns {Date}
 */
export function getStartOfMonth(year, month) {
  const date = new Date(year, month, 1);
  return date;
}

/**
 * Get end of month in Saudi Arabia timezone
 * @param {number} year 
 * @param {number} month - 0-indexed
 * @returns {Date}
 */
export function getEndOfMonth(year, month) {
  const date = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return date;
}

/**
 * Convert datetime-local value (in Saudi timezone) to UTC ISO string
 * This is needed when sending datetime-local input values to the server
 * @param {string} datetimeLocal - DateTime string in YYYY-MM-DDTHH:mm format (Saudi timezone)
 * @returns {string} ISO string in UTC
 */
export function convertDateTimeLocalToUTC(datetimeLocal) {
  if (!datetimeLocal) return '';

  try {
    // Parse the datetime-local value as if it's in Saudi timezone
    // We need to create a date that represents this time in Saudi timezone
    const [datePart, timePart] = datetimeLocal.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    // Create a date string in ISO format with Saudi timezone offset
    // Saudi Arabia is UTC+3
    const saudiDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`);
    
    // Return as UTC ISO string
    return saudiDate.toISOString();
  } catch (error) {
    console.error('Error converting datetime-local to UTC:', error);
    return '';
  }
}

/**
 * Get timezone name
 * @returns {string}
 */
export function getTimezone() {
  return SAUDI_TIMEZONE;
}

/**
 * Default export with all utilities
 */
const dateUtils = {
  SAUDI_TIMEZONE,
  getNow,
  formatDate,
  formatDateWithWeekday,
  formatDateTime,
  formatTime,
  formatTimeWithSeconds,
  formatRelativeTime,
  getMonthName,
  getMonthYear,
  getDayName,
  getDateInputValue,
  getDateTimeInputValue,
  getTimeInputValue,
  convertDateTimeLocalToUTC,
  isToday,
  getStartOfMonth,
  getEndOfMonth,
  getTimezone
};

export default dateUtils;
