# Shorten URL API - ORM

## 1. Setup Inicial Prisma

Para fazer a interface com o banco foi utilizado a ORM prisma, seguindo a configuração
básica especificada pelo NestJS.

source: [Nest](https://docs.nestjs.com/recipes/prisma#set-up-prisma)<br/>
source: [Prisma](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql)

```ts
//src/prisma/schema.prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique @db.VarChar(255)
  name     String? @db.VarChar(255)
  password String  @db.VarChar(255)
  urls     Url[]

  @@map("users")
}

model Url {
  id          Int      @id @default(autoincrement())
  originalUrl String   @map("original_url") @db.Text
  shortCode   String   @unique @map("short_code") @db.VarChar(100)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  user        User     @relation(fields: [userId], references: [id])
  userId      Int      @map("user_id")
  accessCount Int      @default(0) @map("access_count") @db.Integer

  @@map("urls")
}
```

## 2. Prisma Service e integração

```ts
//src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Importantes comandos:

```sh
npx prisma migrate dev --name {migration_name}
npx prisma migrate deploy
npx prisma generate
```

1. Fazer alteações no schema.prisma
2. Criar uma nova migração e efetivar as mudanças no banco
3. Atualizar o código gerado

## 3. Utilização

```ts
  //src/url/url.service.ts
  async myUrls(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.UrlOrderByWithRelationInput;
    },
  ) {
    const { skip, take, orderBy } = params;
    const page = Math.max(1, take);
    const finalTake = Math.max(1, Math.min(100, page));
    const finalSkip = (skip - 1) * finalTake;
    const where = {
      userId,
      deletedAt: null,
    };
    const [totalItems, items] = await this.prisma.$transaction([
      this.prisma.url.count({ where }),
      this.prisma.url.findMany({
        where,
        omit: {
          deletedAt: true,
          updatedAt: true,
        },
        skip: finalSkip,
        take: finalTake,
        orderBy,
      }),
    ]);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / finalTake);
    const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    return { totalItems, totalPages, currentPage, perPage: finalTake, items };
  }

```

Migrations:

```
├── prisma
│   ├── migrations
│   │   ├── 20251202150906_init
│   │   │   └── migration.sql
│   │   ├── 20251202195535_varchar
│   │   │   └── migration.sql
│   │   ├── 20251202221525_url_enabled
│   │   │   └── migration.sql
│   │   ├── 20251202231844_url_access_count
│   │   │   └── migration.sql
│   │   ├── 20251202233332_url_deleted_at
│   │   │   └── migration.sql
│   │   ├── 20251202235305_url_text_original_url
│   │   │   └── migration.sql
│   │   ├── 20251203001831_url_access_back_to_int
│   │   │   └── migration.sql
│   │   ├── 20251203002411_removing_deleted_at_clause
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma
```
