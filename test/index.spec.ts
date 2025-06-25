/* eslint-disable lodash/prefer-lodash-typecheck */
/* eslint-disable dot-notation */
import { type Callsite } from '@evojs/callsite';
import { AsyncContext } from '@evojs/context';
import { inspect } from 'util';

import { Log, Logger } from '../src';

describe('index', () => {
  let log!: Log;

  it('should test all basic methods', (done) => {
    Logger.fatal();
    Logger.error();
    Logger.warn();
    Logger.info();
    Logger.debug();
    Logger.verbose();

    let logger = new Logger({});

    // @ts-ignore
    logger._handler.call({}, new Log(undefined, [], {}, 'info', []));
    logger.fatal();
    logger.error();
    logger.warn();
    logger.info();
    logger.debug();
    logger.verbose();
    AsyncContext.create({});
    logger.start('test');
    logger.table('table', ['a', 'b', 'c']);
    logger.table(['a', 'b', 'c']);
    logger.end('test');
    expect(() => logger.end('test2')).toThrow();

    logger = Logger.setName('test');
    expect(logger.logname).toBe('test');
    logger = logger.setName('');
    expect(logger.logname).toBe('test');
    done();
  });

  it('should configure default Logger options', (done) => {
    expect(Logger.logname).toBe('');
    Logger.configure({
      name: 'app',
      formats: [
        `{{ date | date }} {{ level | uppercase }}{{ name | name }} {{ args | message }}<-|->{{ caller | file }}`,
        'json',
      ],
      pipes: {
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
          return args
            .map((x) =>
              typeof x === 'string'
                ? x
                : x instanceof Error
                  ? x.stack
                  : inspect(x, false, null, false))
            .join('\n');
        },
        file({ source, line = 0, column = 0 }: Callsite = {}): string {
          return `${source}:${line}:${column}`;
        },
      },
      handler(r: Log): void {
        log = r;
      },
    });
    expect(Logger.logname).toBe('app');

    done();
  });

  it('should be create messages by formats', (done) => {
    Logger.setName('test').verbose('test message');

    expect(Logger.logname).toBe('app');
    expect(log.name).toBe('app.test');

    const logger = Logger.setName('test');

    expect(logger.logname).toBe('app.test');

    const [message, json] = log.messages() as [string, string];

    expect(
      (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z VERBOSE <app\.test> test message\s+.+:\d+:\d+$/).test(
        message,
      ),
    ).toBe(true);

    const obj = JSON.parse(json);

    expect(obj).toBeDefined();
    done();
  });
});
