import pino from 'pino';

const usePrettyLogs = process.env.NODE_ENV !== 'production' && process.stdout.isTTY;

/**
 * Provides the shared structured logger.
 * Pretty output is enabled only for development in an interactive terminal.
 */
export const logger = pino({
  level: 'info',
  ...(usePrettyLogs && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});
