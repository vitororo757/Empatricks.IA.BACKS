process.env.RUN_DATABASE_INTEGRATION = '1';
process.argv = [
  process.argv[0],
  'jest',
  '--runInBand',
  '--runTestsByPath',
  'test/prisma-rls.integration.spec.mjs',
];

await import('../node_modules/jest/bin/jest.js');
