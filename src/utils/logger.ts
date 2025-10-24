import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Logger configuration with Winston
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'jira-mcp-server' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to `combined.log`
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// If we're not in production, log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Metrics tracking
 */
export class Metrics {
  private toolUsage: Map<string, number>;
  private errors: Map<string, number>;
  private startTime: number;

  constructor() {
    this.toolUsage = new Map();
    this.errors = new Map();
    this.startTime = Date.now();
  }

  /**
   * Track tool usage
   */
  trackToolUsage(toolName: string): void {
    const count = this.toolUsage.get(toolName) || 0;
    this.toolUsage.set(toolName, count + 1);
    logger.info(`Tool used: ${toolName}`, { tool: toolName, count: count + 1 });
  }

  /**
   * Track errors
   */
  trackError(errorType: string): void {
    const count = this.errors.get(errorType) || 0;
    this.errors.set(errorType, count + 1);
    logger.error(`Error occurred: ${errorType}`, { errorType, count: count + 1 });
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const uptime = Date.now() - this.startTime;
    
    return {
      uptime: Math.floor(uptime / 1000), // seconds
      toolUsage: Object.fromEntries(this.toolUsage),
      errors: Object.fromEntries(this.errors),
      totalCalls: Array.from(this.toolUsage.values()).reduce((a, b) => a + b, 0),
      totalErrors: Array.from(this.errors.values()).reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Log metrics summary
   */
  logSummary(): void {
    const summary = this.getSummary();
    logger.info('Metrics Summary', summary);
  }
}

export const metrics = new Metrics();

// Log metrics every 5 minutes
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    metrics.logSummary();
  }, 5 * 60 * 1000);
}
