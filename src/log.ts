/* eslint-disable lodash/prefer-lodash-typecheck */
import { Callsite } from '@evojs/callsite';

import { type LogLevel } from './enums';
import { type LogFormatFn, type LogMessage, type LogPipes } from './types';
import { resolveSeparators, toJson } from './utils';

const FORMAT_REPLACE_MASK =
  /\{\{\s*([a-zA-Z_$][0-9a-zA-Z_$]+)(?:\s*\|\s*([a-zA-Z_$][0-9a-zA-Z_$]+))?\s*\}\}/g;

const INTERNAL_CALLSITE_DEPTH = 2;

export class Log {
  protected static lineLength: number = 0;
  static separator: string = '<-|->';

  readonly callsite?: Callsite;
  readonly date: number = Date.now();

  constructor(
    readonly name: string | undefined,
    readonly formats: (string | LogFormatFn)[],
    readonly pipes: LogPipes,
    readonly level: LogLevel,
    readonly args: any[],
    readonly callsiteDepth: number = 0,
  ) {
    if (callsiteDepth > 0) {
      this.callsite = Callsite.get(callsiteDepth + INTERNAL_CALLSITE_DEPTH, 1)[0];
    }
  }

  /**
   * Get formatted messages.
   */
  messages(): unknown[] {
    return this.formats.map((f) => {
      if (f === 'json') {
        return toJson(this.toMessage());
      }

      if (typeof f === 'function') {
        return f.call(this.pipes, this.toMessage());
      }

      Log.lineLength = process.stdout.columns;

      const stringMessage = f.replace(
        FORMAT_REPLACE_MASK,
        (_: string, propName: string, pipeName: string) => {
          const prop = this[propName as keyof LogMessage] as string;

          if (pipeName !== undefined) {
            const pipe = this.pipes[pipeName];

            if (typeof pipe !== 'function') {
              throw new TypeError(`Pipe property "${pipeName}" is not a function`);
            }

            return pipe(prop) as string;
          }

          return prop;
        },
      );

      if (!Log.separator || !stringMessage.includes(Log.separator)) {
        return stringMessage;
      }

      if (Log.lineLength === 0) {
        return stringMessage.split(Log.separator).join('\n');
      }

      return resolveSeparators(stringMessage, Log.separator, Log.lineLength);
    });
  }

  /**
   * Get Message object.
   */
  toMessage(): LogMessage {
    return {
      date: this.date,
      level: this.level,
      name: this.name || undefined,
      args: this.args,
      callsite: this.callsite,
    };
  }
}
