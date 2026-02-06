import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as os from 'os';

/**
 * Response time threshold in milliseconds.
 * Requests taking longer than this will trigger a warning log.
 */
export const SLOW_REQUEST_THRESHOLD_MS = 3000;

/**
 * Pretty format for human-readable log file.
 * Creates a structured, easy-to-read log format.
 */
const prettyFormat = winston.format.printf((info) => {
  const { timestamp, level, message, context, ...meta } = info;

  const ts =
    typeof timestamp === 'string' ? timestamp : new Date().toISOString();
  const ctx = typeof context === 'string' ? context : 'Application';
  const msg = typeof message === 'string' ? message : JSON.stringify(message);

  // Build metadata section
  const metaEntries = Object.entries(meta)
    .filter(([key]) => !['stack', 'splat'].includes(key))
    .map(([key, value]) => {
      if (typeof value === 'object') {
        return `  ├─ ${key}: ${JSON.stringify(value)}`;
      }
      return `  ├─ ${key}: ${value}`;
    });

  // Handle stack trace for errors
  const stackTrace = meta['stack']
    ? `\n  └─ Stack: ${typeof meta['stack'] === 'string' ? meta['stack'].split('\n').join('\n     ') : JSON.stringify(meta['stack'])}`
    : '';

  const separator = '─'.repeat(60);

  return `${separator}
${ts} [${level.toUpperCase()}] [${ctx}]
${msg}
${metaEntries.join('\n')}${stackTrace}
`;
});

/**
 * Console format with colors and structured output.
 */
const consoleFormat = winston.format.printf((info) => {
  const { timestamp, level, message, context, ...meta } = info;

  const ts =
    typeof timestamp === 'string' ? timestamp : new Date().toISOString();
  const ctx = typeof context === 'string' ? context : 'NULL';
  const msg = typeof message === 'string' ? message : JSON.stringify(message);

  // Exclude internal winston fields and format remaining metadata
  const filteredMeta = Object.fromEntries(
    Object.entries(meta).filter(
      ([key]) => !['stack', 'splat', 'service'].includes(key),
    ),
  );

  const metaString = Object.keys(filteredMeta).length
    ? `\n${JSON.stringify(filteredMeta, null, 2)}`
    : '';

  return `[ NexuS - API v2 ] - ${ts} [ ${level} ] [ ${ctx} ] - ${msg}${metaString}`;
});

/**
 * Winston logger configuration with multiple transports.
 *
 * Transports:
 * 1. Console - Colored, human-readable output for development
 * 2. JSON Log File - Machine-readable for ELK/Grafana/monitoring tools
 * 3. Pretty Log File - Human-readable for manual log review
 */
export const winstonConfig = {
  transports: [
    // Console transport - Environment based
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          )
          : winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize({ all: true }),
            winston.format.errors({ stack: true }),
            consoleFormat,
          ),
    }),

    // JSON log file - For monitoring tools (ELK, Grafana, etc.)
    new winston.transports.DailyRotateFile({
      filename: 'logs/json/NexuS-%DATE%.json',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),

    // Pretty log file - For human reading
    new winston.transports.DailyRotateFile({
      filename: 'logs/pretty/NexuS-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        prettyFormat,
      ),
    }),
  ],
};

/**
 * Gathers system metadata for log enrichment.
 * Includes host information and resource usage.
 */
export const getSystemMetaData = () => ({
  hostname: os.hostname(),
  platform: os.platform(),
  nodeVersion: process.version,
  cpuUsage: os.loadavg()[0],
  freemem: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
  totalmem: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
  uptime: `${Math.round(os.uptime() / 60)} min`,
  timestamp: new Date().toISOString(),
});

/**
 * Extracts enriched request metadata for logging.
 * @param request - Express request object
 * @returns Object containing request metadata
 */
export const getRequestMetaData = (request: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  method?: string;
  url?: string;
}) => ({
  userAgent: request.headers['user-agent'] || 'Unknown',
  referer: request.headers['referer'] || request.headers['referrer'] || 'Direct',
  contentType: request.headers['content-type'] || 'None',
  acceptLanguage: request.headers['accept-language'] || 'Unknown',
  origin: request.headers['origin'] || 'Unknown',
});

/**
 * Log levels with their corresponding colors and priorities.
 * Custom levels for more granular logging.
 */
export const customLogLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    debug: 5,
    trace: 6,
  },
  colors: {
    fatal: 'red bold',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    debug: 'blue',
    trace: 'gray',
  },
};
