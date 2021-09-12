export type ConsoleMethodName = 'log' | 'info' | 'error' | 'dir' | 'warn' | 'debug' | 'trace';
export const CONSOLE_METHOD_NAMES: ConsoleMethodName[] = ['log', 'info', 'error', 'dir', 'warn', 'debug', 'trace'];
export type LoggerMethodName = ConsoleMethodName | 'critical' | 'verbose';
export const LOGGER_METHOD_NAMES: LoggerMethodName[] = [...CONSOLE_METHOD_NAMES, 'critical', 'verbose'];
