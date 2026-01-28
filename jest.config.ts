export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setup-app.ts'],
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: ['node_modules/(?!uuid|@faker-js/faker)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coveragePathIgnorePatterns: [
    'node_modules',
    'dist',
    'test',
    'src/main.ts',
    'src/migrations',
    'src/seeders',
    'src/mikro-orm.config.ts',
    '.*\\.module\\.ts$',
  ],
};
