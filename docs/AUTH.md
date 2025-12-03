# Shorten URL API - Autenticação

## 1. Setup Inicial JWT Passport

Para a autenticação do sistema, foi usada a configuração recomendada pelo NestJS,
usando guards e JWT strategy junto com Passport uma lib bastante popular.

```ts
//src/auth/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
//src/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JWTPayload) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

## 2. Habilitação Global

Tendo em vista que geralmente, a maioria das rotas devem ser protegidas, ao definir
um guard global em qualquer Moódulo, usando **JwtAuthGuard** como a classe, por definição
toda rota passa a exigir um token válido para ser acessada.

```ts
//src/auth/auth.module.ts
@Module({
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
    // CONTINUA
]})
```

## 3. Public Decorator

Uma solução ideal para habilitar rotas públicas é a utilização de um decorator que evita
que o global guard seja exigido.

```ts
  //src/commom/decoratos/public.decorator.ts
  import { SetMetadata } from '@nestjs/common';
  export const IS_PUBLIC_KEY = 'isPublic';
  export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

  //src/url.controller.ts
  @Public()
  @Get(':shortCode')
  async short(@Param('shortCode') shortCode: string, @Res() res) {
    const url = await this.urlService.getByShortCode(shortCode);
    return res.status(302).redirect(url);
  }

  //src/auth/jwt-auth.guard.ts
  // Aqui permite que a rota seja acessível sem a validação do token
  if (isPublic) {
    return true;
  }
```

## 4. Current User Decorator

Utilzando novamente o design pattern Decorator, é possível fácilmente acessar os dados
do usuário atual que gerou o token, trazendo um possível null usuário, ou já lançando uma
exceção em caso contrário.

```ts
//src/commom/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user as UserJWTPayload | undefined;
  },
);

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserJWTPayload => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as UserJWTPayload | undefined;
    if (!user) {
      throw new UnauthorizedException(
        'User must be logged in to access this resource',
      );
    }
    return user;
  },
);
```

Podendo então ser acessado no controller e já ter os dados garantidos do usuário logado.

```ts
  //src/commom/types/general.type.ts
  export interface UserJWTPayload {
    userId: number;
    username: string;
  }

  //src/url.controller.ts
  @Put('my-urls/:shortCode')
  async update(
    @AuthUser() user: UserJWTPayload,
    @Param('shortCode') shortCode: string,
    @Body() body: UpdateShortenDTO,
  ) {
    await this.urlService.updateUrl(shortCode, body.url, user.userId);
  }
```
