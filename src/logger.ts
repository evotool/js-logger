/* eslint-disable lodash/prefer-lodash-typecheck */
import { dataToTable } from './data-to-table.function';
import { LogLevel } from './enums';
import { Log } from './log';
import { type LogFormatFn, type LogPipes, type LoggerOptions } from './types';

const LOG_LEVELS = Object.values(LogLevel);
const DEFAULT_LEVEL = LogLevel.INFO;

export class Logger {
  static logname: string = '';

  private static readonly _pipes: LogPipes = {};
  private static readonly _formats: (string | LogFormatFn)[] = [];
  private static _logLevelIndex: number = LOG_LEVELS.indexOf(LogLevel.VERBOSE);
  private static _callsiteLevel: number = 0;

  private static _handling: boolean = false;

  readonly logname: string;

  private readonly _pipes: LogPipes = {};
  private readonly _formats: (string | LogFormatFn)[];
  private readonly _logLevelIndex: number;
  private readonly _callsiteLevel?: number;

  private readonly _handler: LoggerHandler;

  /**
   * Create new Logger with custom options
   */
  constructor(options: LoggerOptions = {}) {
    const {
      name = Logger.logname,
      formats = Logger._formats,
      handler = Logger._handler,
      logLevel,
      callsiteLevel,
    } = options;

    this.logname = name;
    this._formats = formats;
    this._handler = handler;
    this._callsiteLevel = callsiteLevel ?? Logger._callsiteLevel;
    this._logLevelIndex = logLevel ? LOG_LEVELS.indexOf(logLevel) : Logger._logLevelIndex;

    Object.assign(this._pipes, Logger._pipes, options.pipes);
  }

  /**
   * Create a new logger with name and options of current logger.
   */
  setName(name: string): Logger;
  setName(constructor: Function): Logger;
  setName(nameOrConstructor: string | Function): Logger {
    const logger = this.clone();

    const name =
      typeof nameOrConstructor === 'function' ? nameOrConstructor.name : nameOrConstructor;

    // @ts-ignore
    logger.logname = [logger.logname, name].filter(Boolean).join('.');

    return logger;
  }

  /**
   * Create a new logger with options of current logger.
   */
  clone(): Logger {
    return new Logger({
      name: this.logname,
      formats: this._formats,
      pipes: this._pipes,
      handler: this._handler,
      logLevel: LOG_LEVELS[this._logLevelIndex],
      callsiteLevel: this._callsiteLevel,
    });
  }

  /**
   * Create fatal log.
   */
  fatal(...args: any[]): void {
    Logger.fatal.apply(this as unknown as LoggerInstance, args);
  }

  /**
   * Create error log.
   */
  error(...args: any[]): void {
    Logger.error.apply(this as unknown as LoggerInstance, args);
  }

  /**
   * Create warn log.
   */
  warn(...args: any[]): void {
    Logger.warn.apply(this as unknown as LoggerInstance, args);
  }

  /**
   * Create info log.
   */
  info(...args: any[]): void {
    Logger.info.apply(this as unknown as LoggerInstance, args);
  }

  /**
   * Create debug log. Enable debug for working.
   */
  debug(...args: any[]): void {
    Logger.debug.apply(this as unknown as LoggerInstance, args);
  }

  /**
   * Create verbose log.
   */
  verbose(...args: any[]): void {
    Logger.verbose.apply(this as unknown as LoggerInstance, args);
  }

  /**
   * Create verbose log.
   */
  log(level: LogLevel, name?: string, ...args: any[]): void {
    Logger.log.call(this as unknown as LoggerInstance, level, name, ...args);
  }

  /**
   * Create table log.
   */
  table(message: string, values: any[], level?: LogLevel): void;
  table(values: any[], level?: LogLevel): void;
  table(...args: any[]): void {
    Logger.table.apply(this as unknown as LoggerInstance, args as Parameters<typeof Logger.table>);
  }

  time(label: string, level?: LogLevel): (info?: string) => void {
    return Logger.time.call(this as unknown as LoggerInstance, label, level);
  }

  private static _handler = (log: Log): void => {};

  private static _handle(
    this: LoggerInstance,
    level: LogLevel,
    args: any[],
    logname: string = this.logname,
  ): void {
    if (LOG_LEVELS.indexOf(level) > this._logLevelIndex) {
      return;
    }

    if (Logger._handling) {
      process.nextTick(Logger._handle.bind(this), level, args, logname);

      return;
    }

    Logger._handling = true;

    const { _formats, _pipes, _handler, _callsiteLevel } = this;

    try {
      const log = new Log(logname, _formats, _pipes, level, args, _callsiteLevel);

      _handler.call(this, log);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }

    Logger._handling = false;
  }

  /**
   * Set global options.
   */
  static configure(options: LoggerOptions): void {
    this.logname = options.name || '';
    this._callsiteLevel = options.callsiteLevel || 0;

    if (Array.isArray(options.formats)) {
      this._formats.splice(0, this._formats.length, ...options.formats);
    }

    if (typeof options.handler === 'function') {
      this._handler = options.handler;
    }

    Object.assign(this._pipes, options.pipes);

    this._logLevelIndex = LOG_LEVELS.indexOf(options.logLevel || LogLevel.VERBOSE);
  }

  /**
   * Create a new logger with the name.
   */
  static setName(name: string): Logger;
  static setName(constructor: Function): Logger;
  static setName(nameOrConstructor: string | Function): Logger {
    const name =
      typeof nameOrConstructor === 'function' ? nameOrConstructor.name : nameOrConstructor;
    const logname = [this.logname, name].filter(Boolean).join('.');

    return new this({ name: logname });
  }

  /**
   * Create fatal log.
   */
  static fatal(...args: any[]): void;
  static fatal(this: LoggerInstance, ...args: any[]): void {
    Logger._handle.call(this, LogLevel.FATAL, args);
  }

  /**
   * Create error log.
   */
  static error(...args: any[]): void;
  static error(this: LoggerInstance, ...args: any[]): void {
    Logger._handle.call(this, LogLevel.ERROR, args);
  }

  /**
   * Create warn log.
   */
  static warn(...args: any[]): void;
  static warn(this: LoggerInstance, ...args: any[]): void {
    Logger._handle.call(this, LogLevel.WARN, args);
  }

  /**
   * Create info log.
   */
  static info(...args: any[]): void;
  static info(this: LoggerInstance, ...args: any[]): void {
    Logger._handle.call(this, LogLevel.INFO, args);
  }

  /**
   * Create debug log.
   */
  static debug(...args: any[]): void;
  static debug(this: LoggerInstance, ...args: any[]): void {
    Logger._handle.call(this, LogLevel.DEBUG, args);
  }

  /**
   * Create verbose log.
   */
  static verbose(...args: any[]): void;
  static verbose(this: LoggerInstance, ...args: any[]): void {
    Logger._handle.call(this, LogLevel.VERBOSE, args);
  }

  /**
   * Create any level log with custom name.
   */
  static log(level: LogLevel, name?: string, ...args: any[]): void;
  static log(
    this: LoggerInstance,
    level: LogLevel,
    name: string = this.logname,
    ...args: any[]
  ): void {
    Logger._handle.call(this, level, args, name);
  }

  /**
   * Create table log.
   */
  static table(message: string, values: any[], level?: LogLevel): void;
  static table(values: any[], level?: LogLevel): void;
  static table(this: LoggerInstance, ...args: any[]): void {
    const [arg0, arg1, arg2] = args;

    const [message, values, level] = (
      typeof arg0 === 'string'
        ? [arg0, arg1, arg2 || DEFAULT_LEVEL]
        : ['', arg0, arg1 || DEFAULT_LEVEL]
    ) satisfies [string, any[], LogLevel];

    const table = dataToTable(values);

    Logger._handle.call(this, level, message ? [message, table] : [table]);
  }

  static time(label: string, level?: LogLevel): (info?: string) => void;
  static time(
    this: LoggerInstance,
    label: string,
    level: LogLevel = DEFAULT_LEVEL,
  ): (info?: string) => void {
    const startTime = process.hrtime.bigint();

    Logger._handle.call(this, level, [`Start of '${label}'`]);

    return (info?: string): void => {
      const endTime = process.hrtime.bigint();
      const delta = Number((endTime - startTime) / 1000000n);

      Logger._handle.call(
        {
          ...this,
          _callsiteLevel: this._callsiteLevel - 1,
        },
        level,
        [`End of '${label}' (${delta}ms)${info ? `: ${info}` : ''}`],
      );
    };
  }
}

type LoggerHandler = (log: Log) => void;

interface LoggerInstance {
  logname: string;
  _pipes: LogPipes;
  _formats: (string | LogFormatFn)[];
  _debugMode: boolean;
  _handler: LoggerHandler;
  _logLevelIndex: number;
  _callsiteLevel: number;
}
