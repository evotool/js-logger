import { Caller, Record } from '../src';

const ts = Date.now();
const format = '{{ date | date }} {{ level | uppercase }}{{ name | name }} {{ args | message }}<-|->{{ caller | file }}';
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
	file(caller: Caller | null): string {
		if (caller) {
			const { fileName, line, column } = caller;

			return `${fileName}:${line}:${column}`;
		}

		return '';
	},
};

describe('record', () => {
	it('should create new record and resolve messages', () => {
		const record = new Record('app.test', ['json', format], pipes, {}, 'info', ['test', 'message'], ts);

		const [jsonMessage, consoleMessage] = record.messages();
		expect(jsonMessage).toBeTruthy();
		expect(() => {
			JSON.parse(jsonMessage);
		}).not.toThrowError();
		expect((/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z INFO <app\.test> test message\s*(?:.+:\d+:\d+)?$/).test(consoleMessage)).toBe(true);
	});

	it('should throw error of undefined pipe', () => {
		const record = new Record(undefined, ['{{ date | ts }}'], pipes, {}, 'info', ['test', 'message'], ts);

		expect(() => {
			record.messages();
		}).toThrowError(TypeError);
	});

	it('should return prop without pipe', () => {
		const record = new Record(undefined, ['{{ date }}'], {}, {}, 'info', ['test', 'message'], ts);
		const [message] = record.messages();
		expect(message).toBe(ts.toString());
	});

	it('should return prop without pipe', () => {
		const record = new Record(undefined, ['{{ date }}<-|->{{ date }}'], {}, {}, 'info', [], ts);

		Object.defineProperty(Record, 'lineLength', {
			get: () => 0,
			set() {},
		});

		const [message] = record.messages();
		expect(message).toBe(`${ts.toString()}\n${ts.toString()}`);

		Object.defineProperty(Record, 'lineLength', {
			value: process.stdout.columns,
			writable: true,
		});
	});

	it('should return message with linebreak', () => {
		const record = new Record(undefined, ['{{ date }}<-|->{{ date }}'], {}, {}, 'info', [], ts);
		const [message] = record.messages();
		const regex = new RegExp(`^${ts}\\s+${ts}$`);
		expect(regex.test(message)).toBe(true);
	});

	it('should resolve circular property', () => {
		const circular = { circular: null as any };
		circular.circular = circular;

		const record = new Record(undefined, ['json'], {}, {}, 'info', [circular], ts);
		const [jsonMessage] = record.messages();
		const json = JSON.parse(jsonMessage);
		expect(json.date).toBe(ts);
		expect(json.args[0].circular).toBe('[circular circular]');
	});
});
