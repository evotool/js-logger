import { Level, Meta, Pipes, Record } from './record';

export * from './record';
export * from './caller';

Record.fromFileName = __filename;

export type ConsoleMethods = 'log' | 'info' | 'error' | 'dir' | 'warn' | 'debug' | 'trace';

export default class Logger {
	static readonly CONSOLE_METHODS_KEYS: ConsoleMethods[] = ['log', 'info', 'error', 'dir', 'warn', 'debug', 'trace'];
	static readonly CONSOLE_METHODS: { [methodName: string]: (...args: any[]) => void } = {};

	protected static _logname?: string | undefined;
	protected static readonly _meta: Meta = {};
	protected static readonly _pipes: Pipes = {};
	protected static readonly _formats: string[] = [];
	protected static _debugMode: boolean = true;
	protected static _handler = (record: Record): void => {};

	protected static _handle(instance: typeof Logger | Logger, level: Level, args: any[]): void {
		const { _logname: logname, _formats: formats, _pipes: pipes, _handler: handler } = instance as unknown as LoggerInstance;
		const meta = this._getMeta(instance);
		const record = new Record(logname, formats, pipes, meta, level, args);
		handler.call({}, record);
	}

	protected static _getMeta(instance?: typeof Logger | Logger): Meta {
		if (!instance || instance === this) {
			return { ...this._meta };
		}

		return { ...this._meta, ...(instance as unknown as LoggerInstance)._meta };
	}

	static configure(options: LoggerOptions): void {
		if (options.name) {
			this._logname = options.name;
		}

		if (options.debug) {
			this._debugMode = true;
		}

		if (Array.isArray(options.formats)) {
			this._formats.splice(0, this._formats.length, ...options.formats);
		}

		if (options.pipes && typeof options.pipes === 'object') {
			Object.assign(this._pipes, options.pipes);
		}

		if (options.meta && typeof options.meta === 'object') {
			Object.assign(this._meta, options.meta);
		}

		if (typeof options.handler === 'function') {
			this._handler = options.handler;
		}
	}

	static overrideConsole(): void {
		Object.defineProperty(console, 'logger', { value: Logger, writable: false });

		for (const m of this.CONSOLE_METHODS_KEYS) {
			console[m] = Logger[m].bind(Logger);
		}

		console.meta = (meta: Meta): Logger => Logger.meta(meta);
		console.name = (name: string): Logger => Logger.useName(name);

		process.on('uncaughtException', (err) => {
			Logger.critical(err);
			process.exit(0);
		});
	}

	static useName(name: string): Logger {
		return new Logger({ name });
	}

	static meta(meta: Meta): Logger {
		const logger = new Logger();
		Object.assign(logger._meta, Logger._meta, meta);

		return logger;
	}

	static log(...args: any[]): void {
		this._handle(this, 'debug', args);
	}

	static debug(...args: any[]): void {
		if (this._debugMode) {
			this._handle(this, 'debug', args);
		}
	}

	static info(...args: any[]): void {
		this._handle(this, 'info', args);
	}

	static warn(...args: any[]): void {
		this._handle(this, 'warn', args);
	}

	static trace(...args: any[]): void {
		this._handle(this, 'trace', args);
	}

	static error(...args: any[]): void {
		this._handle(this, 'error', args);
	}

	static critical(...args: any[]): void {
		this._handle(this, 'critical', args);
	}

	static dir(...args: any[]): void {
		this._handle(this, 'verbose', args);
	}

	protected readonly _logname: string | undefined;
	protected readonly _meta: Meta = {};
	protected readonly _pipes: Pipes = {};
	protected readonly _formats: string[];
	protected readonly _debugMode: boolean;

	constructor(options?: LoggerOptions) {
		Object.assign(this._meta, Logger._meta);
		Object.assign(this._pipes, Logger._pipes);
		this._handler = Logger._handler;
		this._logname = Logger._logname;
		this._formats = Array.from(Logger._formats);
		this._debugMode = Logger._debugMode;

		if (!options) {
			return;
		}

		if (options.name) {
			this._logname = options.name;
		}

		if (typeof options.debug === 'boolean') {
			this._debugMode = options.debug;
		}

		if (Array.isArray(options.formats)) {
			this._formats = Array.from(options.formats);
		}

		if (options.pipes) {
			Object.assign(this._pipes, options.pipes);
		}

		if (options.meta) {
			Object.assign(this._meta, options.meta);
		}

		if (typeof options.handler === 'function') {
			this._handler = options.handler;
		}
	}

	private readonly _handler = (record: Record): void => {};

	name(name: string): Logger {
		const logger = this.clone();

		Object.defineProperty(logger, '_logname', {
			value: logger._logname && name ? `${logger._logname}.${name}` : (name || logger._logname),
			writable: false,
		});

		return logger;
	}

	meta(meta: Meta): void {
		Object.assign(this._meta, meta);
	}

	clone(): Logger {
		return new Logger({
			name: this._logname,
			meta: this._meta,
			formats: this._formats,
			pipes: this._pipes,
			handler: this._handler,
		});
	}

	log(...args: any[]): void {
		Logger._handle(this, 'debug', args);
	}

	debug(...args: any[]): void {
		if (Logger._debugMode) {
			Logger._handle(this, 'debug', args);
		}
	}

	info(...args: any[]): void {
		Logger._handle(this, 'info', args);
	}

	warn(...args: any[]): void {
		Logger._handle(this, 'warn', args);
	}

	trace(...args: any[]): void {
		Logger._handle(this, 'trace', args);
	}

	error(...args: any[]): void {
		Logger._handle(this, 'error', args);
	}

	critical(...args: any[]): void {
		Logger._handle(this, 'critical', args);
	}

	dir(...args: any[]): void {
		Logger._handle(this, 'verbose', args);
	}
}

declare global {
	interface Console {
		logger: typeof Logger;
		meta(meta: Meta): Logger;
		name(name: string): Logger;
	}
}

interface LoggerInstance {
	_logname: string | undefined;
	_meta: Meta;
	_pipes: Pipes;
	_formats: string[];
	_debugMode: boolean;
	_handler(record: Record): void;
}

export interface LoggerOptions {
	name?: string;
	meta?: Meta;
	formats?: string[];
	pipes?: Pipes;
	handler?(record: Record): void;
	debug?: boolean;
}

for (const m of Logger.CONSOLE_METHODS_KEYS) {
	Object.defineProperty(Logger.CONSOLE_METHODS, m, {
		value: console[m],
		writable: false,
	});
}
