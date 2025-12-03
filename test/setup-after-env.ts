import { TestDatabase } from './setup-e2e';

beforeEach(async () => {
  await TestDatabase.cleanup();
});
