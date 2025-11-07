import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const BRASILIA_TZ = 'America/Sao_Paulo';

/**
 * Get current date/time in Brasília timezone
 */
export function getBrasiliaTime(): Date {
  return toZonedTime(new Date(), BRASILIA_TZ);
}

/**
 * Convert a date to Brasília timezone
 */
export function toBrasiliaTime(date: Date | string): Date {
  return toZonedTime(date, BRASILIA_TZ);
}

/**
 * Get the start of today in Brasília timezone (00:00:00)
 */
export function getTodayStartBrasilia(): Date {
  const now = getBrasiliaTime();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Get ISO string for Brasília timezone
 */
export function getBrasiliaISOString(date?: Date): string {
  const brasiliaDate = date ? toBrasiliaTime(date) : getBrasiliaTime();
  return fromZonedTime(brasiliaDate, BRASILIA_TZ).toISOString();
}

/**
 * Get current day of week in Portuguese (Brasília timezone)
 */
export function getCurrentDayOfWeekBrasilia(): string {
  return getBrasiliaTime().toLocaleDateString('pt-BR', { 
    weekday: 'long',
    timeZone: BRASILIA_TZ 
  }).toLowerCase();
}

/**
 * Get current hour and minute in Brasília timezone
 */
export function getCurrentTimeBrasilia(): { hour: number; minute: number } {
  const now = getBrasiliaTime();
  return {
    hour: now.getHours(),
    minute: now.getMinutes()
  };
}

/**
 * Get current date in YYYY-MM-DD format for Brasília timezone
 */
export function getTodayDateBrasilia(): string {
  const now = getBrasiliaTime();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
