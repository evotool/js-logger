import { Log, Logger } from '../src';
import { dataToTable } from '../src/data-to-table.function';
import { LogLevel } from '../src/enums';

describe('Logger (extended)', () => {
  beforeEach(() => {
    Logger.configure({
      name: '',
      handler: () => {},
      logLevel: LogLevel.VERBOSE,
    });
    // @ts-ignore reset _handling flag after error tests
    Logger._handling = false;
  });

  describe('instance log()', () => {
    it('should call instance log() with custom name', () => {
      const results: Log[] = [];
      const logger = new Logger({
        handler: (r: Log) => results.push(r),
      });

      logger.log(LogLevel.ERROR, 'testName', 'message');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('testName');
      expect(results[0].args[0]).toBe('message');
    });
  });

  describe('static log() with custom name', () => {
    it('should call static log with explicit name override', () => {
      const results: Log[] = [];
      Logger.configure({
        handler: (r: Log) => results.push(r),
        name: 'base',
      });

      Logger.log(LogLevel.WARN, 'overrideName', 'msg');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('overrideName');
      expect(results[0].level).toBe(LogLevel.WARN);
    });
  });

  describe('log level filter', () => {
    it('should filter messages below configured level', () => {
      const results: Log[] = [];
      const logger = new Logger({
        logLevel: LogLevel.WARN,
        handler: (r: Log) => results.push(r),
      });

      logger.info('should be filtered');
      logger.debug('should be filtered');
      logger.verbose('should be filtered');

      expect(results).toHaveLength(0);
    });

    it('should pass messages at or above configured level', () => {
      const results: Log[] = [];
      const logger = new Logger({
        logLevel: LogLevel.WARN,
        handler: (r: Log) => results.push(r),
      });

      logger.fatal('fatal');
      logger.error('error');
      logger.warn('warn');

      expect(results).toHaveLength(3);
    });
  });

  describe('recursion guard', () => {
    it('should defer log when handler triggers another log via static', async () => {
      const results: string[] = [];
      let handlerCalls = 0;
      Logger.configure({
        name: 'recursion',
        handler: () => {
          results.push('handler');

          if (handlerCalls++ === 0) {
            Logger.info('nested');
          }
        },
        logLevel: LogLevel.VERBOSE,
      });

      Logger.info('outer');
      results.push('after');

      expect(results).toEqual(['handler', 'after']);

      await new Promise<void>((resolve) => process.nextTick(resolve));

      expect(results).toEqual(['handler', 'after', 'handler']);
    });
  });

  describe('handler error', () => {
    it('should call process.exit(1) when handler throws', () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      Logger.configure({
        handler: () => {
          throw new Error('handler error');
        },
      });

      Logger.info('test');

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalled();

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Log with callsiteLevel', () => {
    it('should not throw when depth > 0', () => {
      const log = new Log('test', [], {}, LogLevel.INFO, [], 1);

      expect(log).toBeDefined();
    });
  });

  describe('constructor without arguments', () => {
    it('should create logger with default empty options', () => {
      const logger = new Logger();

      logger.info('test');
    });
  });

  describe('setName with function', () => {
    it('should set name from constructor name', () => {
      class MyService {}

      const logger = new Logger({ name: 'base' });
      const named = logger.setName(MyService);

      expect(named.logname).toBe('base.MyService');
    });
  });

  describe('configure without handler', () => {
    it('should not change handler when not provided', () => {
      const results: Log[] = [];
      Logger.configure({
        handler: (r: Log) => results.push(r),
        name: 'before',
      });

      Logger.configure({ name: 'after' });

      Logger.info('test');
      expect(results).toHaveLength(1);
    });
  });

  describe('configure without formats', () => {
    it('should keep existing formats when not provided', () => {
      Logger.configure({
        name: 'noformat',
      });

      Logger.info('test');
    });
  });

  describe('static log() without explicit name', () => {
    it('should use default logger name when name is omitted', () => {
      const results: Log[] = [];
      Logger.configure({
        handler: (r: Log) => results.push(r),
        name: 'defaultName',
      });

      Logger.log(LogLevel.INFO);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('defaultName');
    });
  });

  describe('static setName with function', () => {
    it('should set name from constructor name', () => {
      class MyService {}

      const logger = Logger.setName(MyService);

      expect(logger.logname).toBe('MyService');
    });
  });

  describe('Log with function format', () => {
    it('should use function format', () => {
      const format = function format(this: Record<string, unknown>, msg: any): string {
        return `formatted:${msg.level}`;
      };

      const log = new Log('test', [format], {}, LogLevel.INFO, ['arg'], 0);
      const messages = log.messages();

      expect(messages).toEqual(['formatted:info']);
    });
  });

  describe('dataToTable fallback', () => {
    it('should handle null/undefined data gracefully', () => {
      const result = dataToTable(null);

      expect(typeof result).toBe('string');
      expect(result.startsWith('\n')).toBe(true);
    });

    it('should handle empty string fallback when stream returns nothing', () => {
      const result = dataToTable(undefined);

      expect(typeof result).toBe('string');
      expect(result.startsWith('\n')).toBe(true);
    });
  });
});
