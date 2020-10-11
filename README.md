# @evojs/logger

Smart logger for nodejs

![@evojs/logger npm version](https://img.shields.io/npm/v/@evojs/logger.svg) ![supported node version for @evojs/logger](https://img.shields.io/node/v/@evojs/logger.svg) ![total npm downloads for @evojs/logger](https://img.shields.io/npm/dt/@evojs/logger.svg) ![monthly npm downloads for @evojs/logger](https://img.shields.io/npm/dm/@evojs/logger.svg) ![npm licence for @evojs/logger](https://img.shields.io/npm/l/@evojs/logger.svg)

## Usage example

### Set global configuration

```typescript
import Logger, { Caller, Level, Record } from '@evojs/logger';

const accessLogFileStream = createWriteStream(accessLogFile, { flags: 'a' });
const errorLogFileStream = createWriteStream(errorLogFile, { flags: 'a' });

Logger.configure({
  name: 'app',
  meta: { appId: process.pid + '.app' },
  formats: [`{{ date | date }} {{ level | uppercase }}{{ name | name }} {{ args | message }}<-|->{{ caller | file }}`, 'json'],
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
  handler(record: Record): void {
    const [customOutput, jsonOutput] = record.messages();
    // 2 formats => 2 outputs
    if (!errorLevels.includes(record.level)) {
      process.stdout.write(customOutput + '\n');
      accessLogFileStream.write(jsonOutput + '\n');
    } else {
      process.stderr.write(customOutput + '\n');
      errorLogFileStream.write(jsonOutput + '\n');
    }
  },
});
```

### Overriding console

```typescript
Logger.overrideConsole();

console.warn('starting in production mode');

// custom format output:
// 2020-09-16T08:17:46.869Z WARN <app> starting in production mode                                        /path/to/project/index.ts:45:17
// yes, this is flexible separator "<-|->"
// JSON output:
// {"args":["starting in production mode"],"caller":{"fileName":"/path/to/project/index.ts","methodName":"","functionName":"","typeName":"Object","line":45,"column":17,"evalOrigin":"","isToplevel":false,"isEval":false,"isNative":false,"isConstructor":false},"date":1600244266869,"level":"debug","metadata":{"appId":"12345.app"},"name":"app"}
```

### Changing separator mask

```typescript
Record.separator = '<=!=>';
Logger.configure({
  formats: [`{{ date }}<=!=>{{ args | message }}`],
  pipes: {
    message(args: any[]): string {
      return args.join(' ');
    },
  },
});
```

### Providing metadata to message

```typescript
// metadata of the current message merges with the global metadata
console.meta({ isMaster: cluster.isMaster }).warn('starting in production mode');
// JSON output:
// {"args":["starting in production mode"],"caller":{"fileName":"/path/to/project/index.ts","methodName":"","functionName":"","typeName":"Object","line":45,"column":17,"evalOrigin":"","isToplevel":false,"isEval":false,"isNative":false,"isConstructor":false},"date":1600244266869,"level":"debug","metadata":{"appId":"12345.app","isMaster":true},"name":"app"}
```

### Creating new logger instance

```typescript
const logger = new Logger({ name: 'request', meta: { appId: process.pid + '.app' } });
export const requestLogger = responseTime((req: any, res: any, time: number) => {
  logger.info(
    chalk.green(req.method),
    chalk.yellow(res.statusCode),
    req.url,
    chalk.yellow(time.toFixed(0) + 'ms'),
    chalk.green(`${req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress}`),
    chalk.magenta(req.headers['user-agent']),
  );
});
```

## Main features

1. Very flexible and easy to understand configuration
2. Metadata providing
3. Caller information
4. Console overriding
5. Typescript typings

## License

Licensed under MIT license
