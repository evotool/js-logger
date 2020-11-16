import { Caller } from './caller';
import { resolveSeparators } from './utils';

export interface Meta {
	[key: string]: any;
}

export type Level = 'debug' | 'info' | 'warn' | 'error' | 'critical' | 'verbose' | 'trace';

export interface Message {
	args: any[];
	caller: Caller | null;
	date: number;
	level: Level;
	meta: Meta;
	name: string | undefined;
}

export interface Pipes {
	[key: string]: (...args: any[]) => string;
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
	 * @description Get formatted messages.
	 */
	messages(): string[] {
		return this.formats.map((f) => {
			if (f === 'json') {
				const cache: any[] = [];
				const jsonMessage = this.toMessage();
				const out = JSON.stringify(jsonMessage, (key, value) => {
					if (typeof value === 'object' && value) {
						if (cache.includes(value)) {
							return `[circular ${key}]`;
						}

						cache.push(value);
					}

					return value;
				});

				return out;
			}

			Record.lineLength = process.stdout.columns;

			const stringMessage = f.replace(FORMAT_REPLACE_MASK, (_: string, propName: string, pipeName: string) => {
				const prop = (this as {[ key: string]: any })[propName];

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
	 * @description Get Message object.
	 */
	toMessage(): Message {
		return {
			args: this.args,
			caller: this.caller,
			date: this.date,
			level: this.level,
			meta: this.meta,
			name: this.name,
		};
	}
}
