import { Caller } from './caller';
import { resolveSeparators } from './utils';

export interface Meta {
	[key: string]: any;
}

export type Level = 'debug' | 'info' | 'warn' | 'error' | 'critical' | 'verbose' | 'trace';

export interface Message {
	args: any;
	caller: any;
	date: any;
	level: any;
	meta: any;
	name: any;
}

export interface Pipes {
	[key: string]: (...args: any[]) => any;
}

const FORMAT_REPLACE_MASK = /\{\{\s*([a-zA-Z_$][0-9a-zA-Z_$]+)(?:\s*\|\s*([a-zA-Z_$][0-9a-zA-Z_$]+))?\s*\}\}/g;

export class Record {
	protected static lineLength: number = 0;
	static separator: string = '<-|->';
	static fromFileName: string = __filename;

	readonly caller: Caller | null;

	constructor(
		readonly name: string | undefined,
		readonly formats: string[],
		readonly pipes: Pipes,
		readonly meta: Meta,
		readonly level: Level,
		readonly args: any[],
		readonly date: number = Date.now(),
	) {
		this.caller = Caller.create(Record.fromFileName);
	}

	/**
	 * Get formatted messages.
	 */
	messages(): string[] {
		return this.formats.map((f) => {
			if (f === 'json') {
				const cache: any[] = [];
				const jsonMessage = this.toMessage(this.pipes);
				const out = JSON.stringify(jsonMessage, (key: string, value: any) => {
					if (typeof value === 'object' && value) {
						if (cache.includes(value)) {
							return `[circular]`; // TODO: key from cache
						}

						cache.push(value);
					}

					return value;
				});

				return out;
			}

			Record.lineLength = process.stdout.columns;

			const stringMessage = f.replace(FORMAT_REPLACE_MASK, (_: string, propName: string, pipeName: string) => {
				const prop = this[propName as keyof Message] as string;

				if (pipeName !== undefined) {
					const pipe = this.pipes[pipeName];

					if (typeof pipe !== 'function') {
						throw new TypeError(`Pipe property "${pipeName}" is not a function`);
					}

					return pipe(prop);
				}

				return prop;
			});

			if (!Record.separator || !stringMessage.includes(Record.separator)) {
				return stringMessage;
			}

			if (Record.lineLength === 0) {
				return stringMessage.split(Record.separator).join('\n');
			}

			return resolveSeparators(stringMessage, Record.separator, Record.lineLength);
		});
	}

	/**
	 * Get Message object.
	 */
	toMessage(pipes: Pipes): Message {
		return {
			args: pipes.message_args ? pipes.message_args(this.args) : this.args,
			caller: pipes.message_caller ? pipes.message_caller(this.caller) : this.caller,
			date: pipes.message_date ? pipes.message_date(this.date) : this.date,
			level: pipes.message_level ? pipes.message_level(this.level) : this.level,
			meta: pipes.message_meta ? pipes.message_meta(this.meta) : this.meta,
			name: pipes.message_name ? pipes.message_name(this.name) : this.name,
		};
	}
}
