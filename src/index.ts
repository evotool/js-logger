import type { LogLevel, LogPipes } from './log';
import { Log } from './log';

export * from './log';
export * from './caller';

export default class Logger {
  static logname?: string | undefined;

  private static readonly _pipes: LogPipes = {};
  private static readonly _formats: string[] = [];
  private static _writing: boolean = false;
  private static _callerLevel: number | undefined;
  private _logname: string | undefined;

  get logname(): string | undefined {
    return this._logname;
  }

  private readonly _pipes: LogPipes = {};
  private readonly _formats: string[];
  private readonly _handler: LoggerHandler;
  private readonly _callerLevel: number | undefined;

  /**
   * Create new Logger with custom options
   */
  constructor(options: LoggerOptions = {}) {
    const { name = Logger.logname, formats = Logger._formats, handler = Logger._handler } = options;

    this._logname = name;
    this._formats = formats;
    this._handler = handler;
    Object.assign(this._pipes, Logger._pipes, options.pipes);
  }

  /**
   * Create a new logger with name and options of current logger.
   */
  useName(name: string | Function, callerLevel?: number): Logger {
    const logger = this.clone(callerLevel);

    this._logname = [logger.logname, typeof name === 'function' ? name.name : name].filter(Boolean).join('.');

    return logger;
  }

  /**
   * Create a new logger with options of current logger.
   */
  clone(callerLevel?: number): Logger {
    return new Logger({
      name: this.logname,
      formats: this._formats,
      pipes: this._pipes,
      handler: this._handler,
      callerLevel,
    });
  }

  /**
   * Create critical log.
   */
  critical(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, 'critical', args);
  }

  /**
   * Create error log.
   */
  error(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, 'error', args);
  }

  /**
   * Create warn log.
   */
  warn(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, 'warn', args);
  }

  /**
   * Create info log.
   */
  info(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, 'info', args);
  }

  /**
   * Create debug log. Enable debug for working.
   */
  debug(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, 'debug', args);
  }

  /**
   * Create verbose log.
   */
  verbose(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, 'verbose', args);
  }

  private static _handler = (log: Log): void => {};

  private static _handle(instance: LoggerInstance, level: LogLevel, args: any[]): void {
    if (this._writing) {
      process.nextTick(this._handle.bind(this), instance, level, args);

      return;
    }

    this._writing = true;

    const { logname, _formats, _pipes, _handler, _callerLevel } = instance as unknown as LoggerInstance;
    const record = new Log(logname, _formats, _pipes, level, args, _callerLevel || this._callerLevel);
    _handler.call(instance, record);

    this._writing = false;
  }

  /**
   * Set global options.
   */
  static configure(options: LoggerOptions): void {
    Logger.logname = options.name;

    if (Array.isArray(options.formats)) {
      Logger._formats.splice(0, Logger._formats.length, ...options.formats);
    }

    Object.assign(Logger._pipes, options.pipes);

    if (typeof options.handler === 'function') {
      Logger._handler = options.handler;
    }

    this._callerLevel = options.callerLevel;
  }

  /**
   * Create a new logger with the name.
   */
  static useName(name: string | Function, callerLevel?: number): Logger {
    return new this({ name: [this.logname, typeof name === 'function' ? name.name : name].filter(Boolean).join('.'), callerLevel });
  }

  /**
   * Create critical log.
   */
  static critical(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, 'critical', args);
  }

  /**
   * Create error log.
   */
  static error(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, 'error', args);
  }

  /**
   * Create warn log.
   */
  static warn(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, 'warn', args);
  }

  /**
   * Create info log.
   */
  static info(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, 'info', args);
  }

  /**
   * Create debug log.
   */
  static debug(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, 'debug', args);
  }

  /**
   * Create verbose log.
   */
  static verbose(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, 'verbose', args);
  }
}

process.on('uncaughtException', (err) => {
  Logger.critical(err);
  process.exit(0);
});

type LoggerHandler = (log: Log) => void;

interface LoggerInstance {
  logname: string | undefined;
  _pipes: LogPipes;
  _formats: string[];
  _debugMode: boolean;
  _handler: LoggerHandler;
  _callerLevel?: number;
}

export interface LoggerOptions {

  /**
   * Name of the logger.
   */
  name?: string;

  /**
   * Output message formats.
   */
  formats?: string[];

  /**
   * Functions for message formatting.
   */
  pipes?: LogPipes;

  /**
   * Output record handler. Set the handler for handle output messages.
   */
  handler?: (record: Log) => void;

  /**
   * Caller level
   */
  callerLevel?: number;
}
