import { Console } from 'node:console';
import { Transform } from 'node:stream';

const stdout = new Transform({
  transform: (
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: (error?: Error | null, data?: any) => void,
  ) => callback(null, chunk),
});

const logger = new Console({ stdout, colorMode: false });

export function dataToTable(data: any): string {
  logger.table(data);

  return `\n${(stdout.read() as Buffer | null)?.toString('utf-8') || ''}`;
}
