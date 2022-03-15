import type { Caller } from './caller';
import type { LogLevel } from './constants';
import type { Log } from './log';

export interface Message {
  date: number;
  level: LogLevel;
  name?: string;
  args: unknown[];
  caller?: Caller | null;
}

export type PipeFn = (...args: any[]) => unknown;
export type LogPipes = Readonly<Record<string, PipeFn>>;
export type LogFormatFn = (this: LogPipes, message: Message) => unknown;

export type _LoggerHandler = (log: Log) => void;
export interface _LoggerInstance {
  logname: string;
  _pipes: LogPipes;
  _formats: (string | LogFormatFn)[];
  _debugMode: boolean;
  _handler: _LoggerHandler;
  _loglevelindex: number;
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
  formats?: (string | LogFormatFn)[];

  /**
   * Functions for message formatting.
   */
  pipes?: LogPipes;

  /**
   * Output log handler. Set the handler for handle output messages.
   */
  handler?: (log: Log) => void;

  /**
   * Output log handler. Set the handler for handle output messages.
   * @default 'verbose'
   */
  logLevel?: LogLevel;

  /**
   * Caller level
   */
  callerLevel?: number;
}
