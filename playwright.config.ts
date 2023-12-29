import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 5 * 60 * 1000,
  expect: {
    timeout: 10000,
  },
});
