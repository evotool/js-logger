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
  formats: [`{{ date | date }} {{ level | uppercase }}{{ name | name }} {{ args | message }}<-|->{{ caller | file }}`, 'json'],
  pipes: {
    uppercase(text: string): string {
      return text.toUpperCase();
    },
    date(date: number): string {
      return new Date(date).toISOString();
    },
    name(name: string): string {
      return name ? ` <${name}>` : '';
    },
    message(args: any[]): string {
      return args.map((x) => (typeof x === 'string' ? x : x instanceof Error ? x.stack : inspect(x, false, null, false))).join('\n');
    },
    file({ fileName, line, column }: Caller): string {
      return [fileName, line, column].filter(Boolean).join(':');
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

### Creating new logger instance

```typescript
const logger = new Logger({ name: 'request' });

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
