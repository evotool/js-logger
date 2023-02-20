import { Log } from './log';
import { LogLevel } from './log-level';
import type { LogFormatFn, LogPipes, LoggerOptions } from './types';

const LOG_LEVELS = Object.values(LogLevel);

export class Logger {
  static logname: string = '';

  private static readonly _pipes: LogPipes = {};
  private static readonly _formats: (string | LogFormatFn)[] = [];
  private static _writing: boolean = false;
  private static _loglevelindex: number = LOG_LEVELS.indexOf(LogLevel.verbose);
  private static _callsiteDepth?: number;

  readonly logname: string;
  private readonly _pipes: LogPipes = {};
  private readonly _formats: (string | LogFormatFn)[];
  private readonly _handler: LoggerHandler;
  private readonly _loglevelindex: number;
  private readonly _callsiteDepth?: number;

  /**
   * Create new Logger with custom options
   */
  constructor(options: LoggerOptions = {}) {
    const {
      name = Logger.logname,
      formats = Logger._formats,
      handler = Logger._handler,
      logLevel,
      callsiteDepth,
    } = options;

    this.logname = name;
    this._formats = formats;
    this._handler = handler;
    this._callsiteDepth = callsiteDepth ?? Logger._callsiteDepth;
    this._loglevelindex = logLevel ? LOG_LEVELS.indexOf(logLevel) : Logger._loglevelindex;

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
      logLevel: LOG_LEVELS[this._loglevelindex],
      callsiteDepth: this._callsiteDepth,
    });
  }

  /**
   * Create fatal log.
   */
  fatal(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, LogLevel.fatal, args);
  }

  /**
   * Create error log.
   */
  error(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, LogLevel.error, args);
  }

  /**
   * Create warn log.
   */
  warn(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, LogLevel.warn, args);
  }

  /**
   * Create info log.
   */
  info(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, LogLevel.info, args);
  }

  /**
   * Create debug log. Enable debug for working.
   */
  debug(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, LogLevel.debug, args);
  }

  /**
   * Create verbose log.
   */
  verbose(...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, LogLevel.verbose, args);
  }

  /**
   * Create verbose log.
   */
  log(level: LogLevel, name: string = this.logname, ...args: any[]): void {
    Logger._handle(this as unknown as LoggerInstance, level, args, name);
  }

  private static _handler = (log: Log): void => {};

  private static _handle(
    instance: LoggerInstance,
    level: LogLevel,
    args: any[],
    logname: string = instance.logname,
  ): void {
    if (LOG_LEVELS.indexOf(level) > instance._loglevelindex) {
      return;
    }

    if (this._writing) {
      process.nextTick(this._handle.bind(this), instance, level, args, logname);

      return;
    }

    this._writing = true;

    const { _formats, _pipes, _handler, _callsiteDepth } = instance;

    try {
      const log = new Log(logname, _formats, _pipes, level, args, _callsiteDepth);

      _handler.call(instance, log);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }

    this._writing = false;
  }

  /**
   * Set global options.
   */
  static configure(options: LoggerOptions): void {
    this.logname = options.name || '';
    this._callsiteDepth = options.callsiteDepth;

    if (Array.isArray(options.formats)) {
      this._formats.splice(0, this._formats.length, ...options.formats);
    }

    if (typeof options.handler === 'function') {
      this._handler = options.handler;
    }

    Object.assign(this._pipes, options.pipes);

    this._loglevelindex = LOG_LEVELS.indexOf(options.logLevel || LogLevel.verbose);
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
  static fatal(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, LogLevel.fatal, args);
  }

  /**
   * Create error log.
   */
  static error(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, LogLevel.error, args);
  }

  /**
   * Create warn log.
   */
  static warn(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, LogLevel.warn, args);
  }

  /**
   * Create info log.
   */
  static info(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, LogLevel.info, args);
  }

  /**
   * Create debug log.
   */
  static debug(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, LogLevel.debug, args);
  }

  /**
   * Create verbose log.
   */
  static verbose(...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, LogLevel.verbose, args);
  }

  /**
   * Create any level log with custom name.
   */
  static log(level: LogLevel, name: string = this.logname, ...args: any[]): void {
    this._handle(this as unknown as LoggerInstance, level, args, name);
  }
}

process.on('uncaughtException', (err) => {
  Logger.fatal(err);
  process.exit(0);
});

type LoggerHandler = (log: Log) => void;

interface LoggerInstance {
  logname: string;
  _pipes: LogPipes;
  _formats: (string | LogFormatFn)[];
  _debugMode: boolean;
  _handler: LoggerHandler;
  _loglevelindex: number;
  _callerLevel?: number;
  _callsiteDepth?: number;
}
