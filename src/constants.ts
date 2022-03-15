export enum LogLevel {
  critical = 'critical',
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
  verbose = 'verbose',
}
export const LOG_LEVELS = Object.values(LogLevel);
export const FORMAT_REPLACE_MASK = /\{\{\s*([a-zA-Z_$][0-9a-zA-Z_$]+)(?:\s*\|\s*([a-zA-Z_$][0-9a-zA-Z_$]+))?\s*\}\}/g;

export const LOG_METHODS = [...LOG_LEVELS, 'log'];
export const NATIVE_PREPARE_STACK_TRACE = Error.prepareStackTrace;
export const OVERRIDED_PREPARE_STACK_TRACE = (e: Error, s: NodeJS.CallSite[]): NodeJS.CallSite[] => s;
export const HANDLE_METHOD_NAME = '_handle';

// eslint-disable-next-line no-control-regex
export const ANSI_COLORS_REPLACE_MASK = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
