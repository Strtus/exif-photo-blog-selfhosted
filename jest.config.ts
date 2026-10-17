import type { Config } from 'jest';
import nextJest from 'next/jest.js';
 
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and 
  // .env files in your test environment
  dir: './',
});
 
// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  // Use the Node entry point of server dependencies such as Upstash/uncrypto.
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
 
// createJestConfig is exported this way to ensure that
// next/jest can load the Next.js config which is async
const loadConfig = createJestConfig(config);
export default async () => {
  const resolved = await loadConfig();
  // These dependencies publish ESM only; use the same SWC transform as the app.
  const esm = 'camelcase-keys|camelcase|map-obj|quick-lru|nanoid';
  return {
    ...resolved,
    transformIgnorePatterns: [
      `/node_modules/(?!\\.pnpm/|(?:${esm})/)`,
      `/node_modules/\\.pnpm/(?!(?:${esm})@)`,
      '^.+\\.module\\.(css|sass|scss)$',
    ],
  };
};
