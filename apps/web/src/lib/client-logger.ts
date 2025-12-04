/**
 * Client-safe logger for browser-side error logging.
 * Mirrors the interface of @appdistillery/core logger but is safe for client components.
 *
 * Future: Integrate with Sentry for client-side error tracking.
 */

export interface LogData {
  [key: string]: unknown
}

function formatMessage(context: string, message: string): string {
  return `[${context}] ${message}`
}

export const clientLogger = {
  error(context: string, message: string, data?: LogData): void {
    console.error(formatMessage(context, message), data ?? '')
    // Future: Sentry.captureException()
  },

  warn(context: string, message: string, data?: LogData): void {
    console.warn(formatMessage(context, message), data ?? '')
  },

  info(context: string, message: string, data?: LogData): void {
    // eslint-disable-next-line no-console -- Info logging needed for client diagnostics
    console.info(formatMessage(context, message), data ?? '')
  },

  debug(context: string, message: string, data?: LogData): void {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Debug logging needed for development
      console.debug(formatMessage(context, message), data ?? '')
    }
  },
}
