# Shorten URL API - REQUIRIMENTS

[HOME - README](../README.md)

Explicação breve dos endpoints e algumas regras de negócio exigidas.

## 1. POST /user → ( Público )

_Criar um novo usuário_

```bash
curl --location 'http://localhost/user/' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Hellen",
    "password": "pb_hellen",
    "email": "hellen@email.com"
}'
```

## 2. GET /health → ( Público )

_retorna 200 indicando o estado saudável do app_

```bash
curl --location 'http://localhost:3000/health' \
--data ''
```

## 3. GET /my-urls →

_Retorna as urls do usuário logado paginado, caso não tenha nada, retorna array vazio._

```sh
curl --location 'http://localhost/my-urls?page=1&limit=10' \
--header 'Authorization: Bearer ***'

```

## 4. GET /:short → ( Público )

_Busca pela url original dado o código encurtado, se encontra, redireciona para a URL asscoiada._

```sh
curl --location 'http://localhost:3000/TyZ8Rk'
```

## 5. POST /shorten →

_Cria um código encurtado para uma url original e associa ao usuário logado_
<br />_Se o código gerado for repetido, tenta mais 10 veses criar um novo, se falhar retorna erro._

```sh
curl --location 'http://localhost:3000/shorten' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer *** \
--data '{
    "url": "https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres"
}'
```

## 6. DELETE /my-urls/:id

_Deleta uma url encurtada, apenas preenchendo o campo deleted_at, marcando como removida e sendo filtrada nas buscas._

```sh
curl --location --request DELETE 'http://localhost:3000/my-urls/TyZ8Rk' \
--header 'Authorization: Bearer ***' \
--data ''
```

## 7. PUT /my-urls/:id

_Atualiza uma url encurtada com um novo código inserido pelo usuário, porem valida o formato exigindo o padrão: [a-z0-9_-]{3,30}
<br />_Caso já exista uma url com o mesmo código, retorna o conflito._

```sh
curl --location --request PUT 'http://localhost:3000/my-urls/AAKYFf' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer ***' \
--data '{
    "url": "abc-123"
}'
```

## 8. POST /auth/login ( Público )

_Loga usuário cadastrado com login e senha, em caso de sucesso retorna o token de acesso._

```sh
curl --location 'http://localhost:3000/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "password": "admin",
    "email": "admin@email.com"
}'
```
