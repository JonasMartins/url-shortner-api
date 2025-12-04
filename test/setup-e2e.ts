import { PrismaPg } from '@prisma/adapter-pg';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { PrismaClient } from '../src/generated/prisma/client';

export class TestDatabase {
  private static container: StartedPostgreSqlContainer;
  private static prisma: PrismaClient;
  private static migrationRun = false;

  static async setup(): Promise<string> {
    this.container = await new PostgreSqlContainer('postgres:15.3-alpine3.18')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    const databaseUrl = this.container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    if (!this.migrationRun) {
      // Executa as migrations
      execSync('npx prisma migrate deploy', {
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
        stdio: 'inherit',
      });
      this.migrationRun = true;
    }
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });
    this.prisma = new PrismaClient({ adapter });
    await this.prisma.$connect();

    return databaseUrl;
  }

  static async teardown(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    if (this.container) {
      await this.container.stop();
    }
  }

  static async cleanup(): Promise<void> {
    if (this.prisma) {
      const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      for (const { tablename } of tables) {
        if (tablename !== '_prisma_migrations') {
          await this.prisma.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
          );
        }
      }
    }
  }
  static getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}
