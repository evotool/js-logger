import 'source-map-support/register';
import { CONSOLE_METHOD_NAMES } from './constants';
import type { Level, Meta, Pipes } from './log';
import { Log } from './log';

export * from './log';
export * from './caller';

export default class Logger {
  static logname?: string | undefined;

  private static readonly _meta: Meta = {};
  private static readonly _pipes: Pipes = {};
  private static readonly _formats: string[] = [];
  private static _debugMode: boolean = false;
  private static _writing: boolean = false;
  private static _callerLevel: number | undefined;

  readonly logname: string | undefined;
  private readonly _meta: Meta = {};
  private readonly _pipes: Pipes = {};
  private readonly _formats: string[];
  private readonly _debugMode: boolean;
  private readonly _handler: LoggerHandler;
  private readonly _callerLevel: number | undefined;

  /**
   * Create new Logger with custom options
   */
  constructor(options: LoggerOptions = {}) {
    this.logname = options.name || Logger.logname;
    this._debugMode = typeof options.debug === 'boolean' ? options.debug : Logger._debugMode;
    this._formats = Array.from(Array.isArray(options.formats) ? options.formats : Logger._formats);
    this._handler = typeof options.handler === 'function' ? options.handler : Logger._handler;
    Object.assign(this._pipes, Logger._pipes, options.pipes || {});
    Object.assign(this._meta, Logger._meta, options.meta || {});
  }

  /**
   * Create a new logger with name and options of current logger.
   */
  name(name: string, callerLevel?: number): Logger {
    const logger = this.clone(callerLevel);

    Object.defineProperty(logger as unknown as LoggerInstance, 'logname', {
      value: logger.logname && name ? `${logger.logname}.${name}` : name || logger.logname,
      writable: false,
    });

    return logger;
  }

  /**
   * Add metadata to current logger.
   */
  meta(meta: Meta): void {
    Object.assign(this._meta, meta);
  }

  /**
   * Create a new logger with options of current logger.
   */
  clone(callerLevel?: number): Logger {
    return new Logger({
      name: this.logname,
      meta: this._meta,
      formats: this._formats,
      pipes: this._pipes,
      handler: this._handler,
      callerLevel,
    });
  }

  /**
   * Create a record with 'debug' log type.
   */
  log = (...args: any[]): void => {
    Logger._handle(this as unknown as LoggerInstance, 'debug', args);
  };

  /**
   * Create a record with 'debug' log type. Enable debug for working.
   */
  debug = (...args: any[]): void => {
    if (this._debugMode) {
      Logger._handle(this as unknown as LoggerInstance, 'debug', args);
    }
  };

  /**
   * Create a record with 'info' log type.
   */
  info = (...args: any[]): void => {
    Logger._handle(this as unknown as LoggerInstance, 'info', args);
  };

  /**
   * Create a record with 'warn' log type.
   */
  warn = (...args: any[]): void => {
    Logger._handle(this as unknown as LoggerInstance, 'warn', args);
  };

  /**
   * Create a record with 'trace' log type.
   */
  trace = (...args: any[]): void => {
    Logger._handle(this as unknown as LoggerInstance, 'trace', args);
  };

  /**
   * Create a record with 'error' log type.
   */
  error = (...args: any[]): void => {
    Logger._handle(this as unknown as LoggerInstance, 'error', args);
  };

  /**
   * Create a record with 'critical' log type.
   */
  critical = (...args: any[]): void => {
    Logger._handle(this as unknown as LoggerInstance, 'critical', args);
  };

  /**
   * Create a record with 'verbose' log type.
   */
  dir = (...args: any[]): void => {
    Logger._handle(this as unknown as LoggerInstance, 'verbose', args);
  };

  private static _handler = (record: Log): void => {};

  private static _handle(instance: LoggerInstance, level: Level, args: any[]): void {
    if (this._writing) {
      process.nextTick(this._handle.bind(this), instance, level, args);

      return;
    }

    this._writing = true;

    const { logname, _formats, _pipes, _handler, _callerLevel } = instance as unknown as LoggerInstance;
    const meta = this._getMeta(instance);
    const record = new Log(logname, _formats, _pipes, meta, level, args, _callerLevel || this._callerLevel);
    _handler.call(instance, record);

    this._writing = false;
  }

  private static _getMeta(instance?: LoggerInstance): Meta {
    // @ts-ignore
    if (!instance || instance === this) {
      return { ...Logger._meta };
    }

    return { ...Logger._meta, ...instance._meta };
  }

  /**
   * Set global options.
   */
  static configure(options: LoggerOptions): void {
    Logger.logname = options.name;

    if (options.debug) {
      Logger._debugMode = true;
    }

    if (Array.isArray(options.formats)) {
      Logger._formats.splice(0, Logger._formats.length, ...options.formats);
    }

    if (options.pipes && typeof options.pipes === 'object') {
      Object.assign(Logger._pipes, options.pipes);
    }

    if (options.meta && typeof options.meta === 'object') {
      Object.assign(Logger._meta, options.meta);
    }

    if (typeof options.handler === 'function') {
      Logger._handler = options.handler;
    }

    this._callerLevel = options.callerLevel;
  }

  /**
   * Override console methods.
   */
  static overrideConsole(): void {
    (global as any).__console = { ...console };

    Object.defineProperty(console, 'logger', { value: Logger as unknown as LoggerInstance, writable: false });

    for (const m of CONSOLE_METHOD_NAMES) {
      console[m] = Logger[m].bind(Logger);
    }

    console.meta = (meta: Meta): Logger => Logger.meta(meta);
    console.name = (name: string): Logger => Logger.withName(name);

    process.on('uncaughtException', (err) => {
      Logger.critical(err);
      process.exit(0);
    });
  }

  /**
   * Create a new logger with the name.
   */
  static withName(name: string): Logger {
    return new Logger({ name });
  }

  /**
   * Create a new logger with metadata.
   */
  static meta(meta: Meta): Logger {
    const logger = new Logger();
    Object.assign(logger._meta, meta);

    return logger;
  }

  /**
   * Create a record with 'debug' log type.
   */
  static log = (...args: any[]): void => {
    Logger._handle(Logger as unknown as LoggerInstance, 'debug', args);
  };

  /**
   * Create a record with 'debug' log type. Enable debug for working.
   */
  static debug = (...args: any[]): void => {
    if (Logger._debugMode) {
      Logger._handle(Logger as unknown as LoggerInstance, 'debug', args);
    }
  };

  /**
   * Create a record with 'info' log type.
   */
  static info = (...args: any[]): void => {
    Logger._handle(Logger as unknown as LoggerInstance, 'info', args);
  };

  /**
   * Create a record with 'warn' log type.
   */
  static warn = (...args: any[]): void => {
    Logger._handle(Logger as unknown as LoggerInstance, 'warn', args);
  };

  /**
   * Create a record with 'trace' log type.
   */
  static trace = (...args: any[]): void => {
    Logger._handle(Logger as unknown as LoggerInstance, 'trace', args);
  };

  /**
   * Create a record with 'error' log type.
   */
  static error = (...args: any[]): void => {
    Logger._handle(Logger as unknown as LoggerInstance, 'error', args);
  };

  /**
   * Create a record with 'critical' log type.
   */
  static critical = (...args: any[]): void => {
    Logger._handle(Logger as unknown as LoggerInstance, 'critical', args);
  };

  /**
   * Create a record with 'verbose' log type.
   */
  static dir = (...args: any[]): void => {
    Logger._handle(Logger as unknown as LoggerInstance, 'verbose', args);
  };
}

declare global {
  interface Console {

    /**
     * Logger type.
     */
    logger: typeof Logger;

    /**
     * Create a new logger with metadata.
     */
    meta(meta: Meta): Logger;

    /**
     * Create a new logger with name.
     */
    name(name: string): Logger;
  }
}

type LoggerHandler = (log: Log) => void;

interface LoggerInstance {
  logname: string | undefined;
  _meta: Meta;
  _pipes: Pipes;
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
   * Object with logger metadata.
   */
  meta?: Meta;

  /**
   * Output message formats.
   */
  formats?: string[];

  /**
   * Functions for message formatting.
   */
  pipes?: Pipes;

  /**
   * Output record handler. Set the handler for handle output messages.
   */
  handler?: (record: Log) => void;

  /**
   * Enable debug method. When is true: logger.debug() will works.
   */
  debug?: boolean;

  /**
   * Caller level
   */
  callerLevel?: number;
}
