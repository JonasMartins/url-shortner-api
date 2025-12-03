import { TestDatabase } from './setup-e2e';

export default async () => {
  await TestDatabase.teardown();
};
