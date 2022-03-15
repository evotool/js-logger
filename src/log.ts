import { Caller } from './caller';
import type { LogLevel } from './constants';
import { FORMAT_REPLACE_MASK } from './constants';
import type { LogFormatFn, LogPipes, Message } from './types';
import { resolveSeparators } from './utils';

export class Log {
  protected static lineLength: number = 0;
  static separator: string = '<-|->';

  readonly caller?: Caller | null;
  readonly date: number = Date.now();

  constructor(
    readonly name: string | undefined,
    readonly formats: (string | LogFormatFn)[],
    readonly pipes: LogPipes,
    readonly level: LogLevel,
    readonly args: any[],
    readonly callerLevel?: number,
  ) {
    this.caller = callerLevel! >= 0 ? Caller.create(callerLevel!) : undefined;
    this.pipes = pipes;
  }

  /**
   * Get formatted messages.
   */
  messages(): unknown[] {
    return this.formats.map((f) => {
      if (f === 'json') {
        const cache: any[] = [];
        const jsonMessage = this.toMessage();
        const out = JSON.stringify(jsonMessage, (key: string, value: any) => {
          if (typeof value === 'object' && value) {
            if (cache.includes(value)) {
              return `[circular]`; // TODO: key from cache
            }

            cache.push(value);
          }

          return value as unknown;
        });

        return out;
      }

      if (typeof f === 'function') {
        return f.call(this.pipes, this.toMessage());
      }

      Log.lineLength = process.stdout.columns;

      const stringMessage = f.replace(
        FORMAT_REPLACE_MASK,
        (_: string, propName: string, pipeName: string) => {
          const prop = this[propName as keyof Message] as string;

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
  toMessage(): Message {
    return {
      date: this.date,
      level: this.level,
      name: this.name || undefined,
      args: this.args,
      caller: this.caller,
    };
  }
}
