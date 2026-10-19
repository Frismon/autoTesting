import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // describe/it/expect без імпорту в кожному файлі
    environment: 'node', // тестуємо бізнес-логіку, DOM не потрібен
    include: ['tests/**/*.test.ts'], // раннер шукає тести лише тут
    coverage: {
      provider: 'v8', // вбудований у Node механізм вимірювання покриття
      reporter: ['text', 'html'], // вивід у термінал + звіт coverage/index.html
      include: ['src/**/*.ts'], // рахуємо покриття лише продуктового коду
      thresholds: {
        lines: 80, // мінімум 80 % рядків
        branches: 80, // мінімум 80 % гілок
        functions: 100, // кожна функція має бути викликана
      },
    },
  },
});
