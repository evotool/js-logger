import type { Callsite } from '@evojs/callsite';

import type { Log } from './log';
import type { LogLevel } from './log-level';

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
   * Callsite depth
   * @default 0
   */
  callsiteDepth?: number;
}

export interface LogMessage {
  date: number;
  level: LogLevel;
  name?: string;
  args: unknown[];
  callsite?: Callsite | null;
}

export type PipeFn = (...args: any[]) => unknown;
export type LogPipes = Readonly<Record<string, PipeFn>>;
export type LogFormatFn = (this: LogPipes, message: LogMessage) => unknown;
