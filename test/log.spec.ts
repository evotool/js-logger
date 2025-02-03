import type { Callsite } from '@evojs/callsite';

import { Log, LogLevel } from '../src';

const level = LogLevel.INFO;
const format =
  '{{ date | date }} {{ level | uppercase }}{{ name | name }} {{ args | message }}<-|->{{ caller | file }}';
const pipes = {
  uppercase(text: string): string {
    return text.toUpperCase();
  },
  date(date: number): string {
    return new Date(date).toISOString();
  },
  name(name: string | undefined): string {
    return name ? ` <${name}>` : '';
  },
  message(args: any[]): string {
    return args.join(' ');
  },
  file(caller: Callsite | null): string {
    if (caller) {
      const { source, line, column } = caller;

      return `${source}:${line}:${column}`;
    }

    return '';
  },
};

describe('log', () => {
  it('should create new log and resolve messages', () => {
    const log = new Log('app.test', ['json', format], pipes, level, ['test', 'message']);

    const [jsonMessage, consoleMessage] = log.messages() as [string, string];

    expect(jsonMessage).toBeTruthy();
    expect(() => {
      JSON.parse(jsonMessage);
    }).not.toThrowError();
    expect(
      (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z INFO <app\.test> test message\s*(?:.+:\d+:\d+)?$/).test(
        consoleMessage,
      ),
    ).toBe(true);
  });

  it('should throw error of undefined pipe', () => {
    const log = new Log(undefined, ['{{ date | ts }}'], pipes, level, ['test', 'message']);

    expect(() => {
      log.messages();
    }).toThrowError(TypeError);
  });

  it('should return prop without pipe', () => {
    const log = new Log(undefined, ['{{ level }}'], {}, level, ['test', 'message']);
    const [message] = log.messages();

    expect(message).toBe(level);
  });

  it('should return prop without pipe', () => {
    const log = new Log(undefined, ['{{ level }}<-|->{{ level }}'], {}, level, []);

    Object.defineProperty(Log, 'lineLength', {
      get: () => 0,
      set() {},
    });

    const [message] = log.messages();

    expect(message).toBe(`${level}\n${level}`);

    Object.defineProperty(Log, 'lineLength', {
      value: process.stdout.columns,
      writable: true,
    });
  });

  it('should return message with linebreak', () => {
    const log = new Log(undefined, ['{{ level }}<-|->{{ level }}'], {}, level, []);
    const [message] = log.messages() as [string];
    const regex = new RegExp(`^${level}\\s+${level}$`);

    expect(regex.test(message)).toBe(true);
  });

  it('should resolve circular property', () => {
    const circular = { circular: null as any };

    circular.circular = circular;

    const log = new Log(undefined, ['json'], {}, level, [circular]);
    const [jsonMessage] = log.messages() as [string];
    const json = JSON.parse(jsonMessage);

    expect(json.level).toBe(level);
    expect(json.args[0].circular).toBe('[circular]');
  });
});
