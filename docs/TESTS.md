# Shorten URL API - TESTS

## 1. Setup Inicial tests e2e

Os tests usados na aplicação foram testes end to end, chamando os atuais endpoints e persistindo no
banco de dados caso necessário. NestJS facilita bastante a criação de testes **e2e** deixando como exemplo vários casos
gerados automaticamente para cada módulo.

source: [NestJS tests e2e Tutorial](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing)<br />
source: [Testcontainers](https://testcontainers.com/)

## 2. Jest já configurado e exemplo

```ts
//test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
}
```

```ts
//test/auth.e2e-spec.ts
describe('Auth (e2e) - POST /auth/login', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sucesso login retorna token (201)', async () => {
    const random = generateRandomString(6);
    const email = `alice-${random}@example.com`;
    const password = 'ValidPass123';

    await request(app.getHttpServer())
      .post('/user')
      .send({ email, name: 'Alice', password })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(typeof res.body.access_token).toBe('string');
  });
});
```

## 3. Testes que requerem autenticação

Cada teste deve ser independente, logo sempre que necessário um token de acesso, o ideal é
criar um novo usuário e realizar o login, como o email de cada usuário é único, sempre é utilizado
uma string random para garantir a unicidade.

```ts
//test/delete-my-urls.e2e-spec.ts
async function createAndLogin(emailPrefix = 'user') {
  const random = generateRandomString(10);
  const email = `${emailPrefix}-${random}@example.com`;
  const password = 'SafePass123';

  await request(app.getHttpServer())
    .post('/user')
    .send({ email, name: 'Tester', password })
    .expect(201);

  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);

  return { token: loginRes.body.access_token as string, email };
}

it('retorna 401 quando token ausente ao deletar', async () => {
  // criar usuário e link
  const { token } = await createAndLogin('creator');
  const shortCode = await createShort(token);
  const parts = shortCode.split('/');

  // tentar deletar sem token
  await request(app.getHttpServer())
    .delete(`/my-urls/${parts[parts.length - 1]}`)
    .expect(401);
});
```

## 4. Testcontainers

Como alternativa a sujeira que fica no banco ao realizar testes **e2e**, foi adicionado o **Testcontainers** permitindo
que um novo banco seja criado, feito todos os testes e depois essa imagem docker totalmente excluída da máquina local. Apesar
da ferramenta ser bastante útil e aparentemente complexa, a integração dela com o **Jest** se mostrou simples e funcionou como
esperado.

```json
//test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "globalSetup": "<rootDir>/global-setup.ts",
  "globalTeardown": "<rootDir>/global-teardown.ts",
  "setupFilesAfterEnv": ["<rootDir>/setup-after-env.ts"]
}
```

```ts
//test/setup-e2e.ts
export class TestDatabase {
  private static container: StartedPostgreSqlContainer;
  private static prisma: PrismaClient;

  static async setup(): Promise<string> {
    this.container = await new PostgreSqlContainer('postgres:15.3-alpine3.18')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    const databaseUrl = this.container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    // Executa as migrations
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'inherit',
    });

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
```

Essa configuração no Jest permite setar globalmente a origem do ambiente de teste, em **TestDatabase**
é especificado o banco e a conexão do prisma com o banco recem criado e executado as migrações, após o termino
de todos os testes, a imagem é removida da máquina.

```json
{
  "globalSetup": "<rootDir>/global-setup.ts",
  "globalTeardown": "<rootDir>/global-teardown.ts",
  "setupFilesAfterEnv": ["<rootDir>/setup-after-env.ts"]
}
```

## 5. Resultado

<img src="../images/e2e.png" alt="tests">
