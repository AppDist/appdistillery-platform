/**
 * Structured logger for AppDistillery Core
 *
 * Provides consistent logging format with context prefixes.
 * Future: Integrate with Sentry for error tracking.
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogData {
  [key: string]: unknown;
}

function formatMessage(context: string, message: string): string {
  return `[${context}] ${message}`;
}

export const logger = {
  error(context: string, message: string, data?: LogData): void {
    console.error(formatMessage(context, message), data ?? '');
    // Future: Sentry.captureException()
  },

  warn(context: string, message: string, data?: LogData): void {
    console.warn(formatMessage(context, message), data ?? '');
  },

  info(context: string, message: string, data?: LogData): void {
    console.info(formatMessage(context, message), data ?? '');
  },

  debug(context: string, message: string, data?: LogData): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage(context, message), data ?? '');
    }
  },
};
