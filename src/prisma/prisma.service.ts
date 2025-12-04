import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  private static migrationRun = false;
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      if (!PrismaService.migrationRun) {
        execSync('npx prisma migrate deploy', {
          env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL,
          },
          stdio: 'inherit',
        });
        PrismaService.migrationRun = true;
      }

      await this.$connect();
      // console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
