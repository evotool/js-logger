/* eslint-disable dot-notation */
import { inspect } from 'util';

import Logger, { Caller, Record } from '../src';

describe('index', () => {
	let record!: Record;

	it('should test all basic methods', (done) => {
		Logger.configure({
			debug: false,
		});
		Logger.debug();
		Logger.configure({
			debug: true,
		});
		Logger.log();
		Logger.info();
		Logger.error();
		Logger.dir();
		Logger.warn();
		Logger.debug();
		Logger.trace();
		Logger.critical();

		let logger = new Logger({ debug: true });
		logger['_handler'].call({}, new Record(undefined, [], {}, {}, 'info', [], Date.now()));
		logger.meta({});
		logger.log();
		logger.info();
		logger.error();
		logger.dir();
		logger.warn();
		logger.debug();
		logger.trace();
		logger.critical();

		logger = new Logger({ debug: false });
		logger.debug();

		logger = Logger.useName('test');
		expect(logger['_logname']).toBe('test');
		logger = logger.name('');
		expect(logger['_logname']).toBe('test');
		done();
	});

	it('should configure default Logger options', (done) => {
		expect(Logger['_logname']).toBeUndefined();
		Logger.configure({
			name: 'app',
			meta: { appId: 'test' },
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
					return args.map((x) => (typeof x === 'string' ? x : x instanceof Error ? x.stack : inspect(x, false, null, false))).join('\n');
				},
				file({ fileName, line, column }: Caller): string {
					return `${fileName}:${line}:${column}`;
				},
			},
			handler(r: Record): void {
				record = r;
			},
		});
		expect(Logger['_logname']).toBe('app');

		done();
	});

	it('should be override console methods', (done) => {
		Logger.overrideConsole();
		done();
	});

	it('should be create messages by formats', (done) => {
		console
			.meta({ test: 1 })
			.name('test')
			.log('test message');
		expect(record.name).toBe('app.test');
		expect(record.meta.test).toBe(1);

		const logger = console.name('test');
		expect(logger['_logname']).toBe('test');

		const [consoleMessage, json] = record.messages();
		expect((/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z DEBUG <app\.test> test message\s+.+:\d+:\d+$/).test(consoleMessage)).toBe(true);

		const obj = JSON.parse(json);
		expect(obj).toBeDefined();
		done();
	});
});
