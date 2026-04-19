type LogLevel = 'info' | 'warn' | 'error' | 'debug';

type LogMetadata = Record<string, unknown> | undefined;

const formatMetadata = (meta: LogMetadata): string => {
  if (!meta) {
    return '';
  }

  const entries = Object.entries(meta).filter(([, value]) => value !== undefined);

  if (!entries.length) {
    return '';
  }

  return ` ${JSON.stringify(Object.fromEntries(entries))}`;
};

const log = (level: LogLevel, message: string, meta?: LogMetadata) => {
  const timestamp = new Date().toISOString();
  const output = `[${timestamp}] [${level.toUpperCase()}] ${message}${formatMetadata(meta)}`;

  if (level === 'error') {
    console.error(output);
    return;
  }

  if (level === 'warn') {
    console.warn(output);
    return;
  }

  if (level === 'debug') {
    console.debug(output);
    return;
  }

  console.info(output);
};

export const logger = {
  info: (message: string, meta?: LogMetadata) => log('info', message, meta),
  warn: (message: string, meta?: LogMetadata) => log('warn', message, meta),
  error: (message: string, meta?: LogMetadata) => log('error', message, meta),
  debug: (message: string, meta?: LogMetadata) => log('debug', message, meta)
};
