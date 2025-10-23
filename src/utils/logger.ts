import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  serializers: {
    // Mask sensitive data
    phone: (phone: string) => {
      if (!phone || phone.length < 4) return '***';
      return `***${phone.slice(-4)}`;
    },
    token: () => '***',
    apiKey: () => '***',
  },
});

export default logger;
