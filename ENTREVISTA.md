# ServeRest + Cypress — guia para entrevista

Roteiro para explicar e defender o framework. Fale na ordem das seções. Os blocos **Se perguntarem** são respostas curtas para perguntas comuns.

---

## 1. Pitch (30 segundos)

Este repositório testa a [ServeRest](https://serverest.dev) em duas camadas: **API** (`cy.request`) e **UI** (fluxo no browser). Cypress foi a escolha porque cobre as duas no mesmo runner, o que permite montar pré-condição pela API e exercitar só o fluxo que a UI realmente precisa validar.

Os testes são independentes: cada um cria os próprios dados com Faker. Rodam no GitHub Actions e gravam resultado, screenshot e vídeo no Cypress Cloud.

**Cobertura atual**

| Camada | Cenário | Tipo |
|---|---|---|
| API | Cadastra usuário e busca por `_id` | feliz |
| API | E-mail duplicado retorna 400 | regra de negócio |
| API | Produto exige token de admin (401 sem, 201 com) + DELETE | autorização |
| UI | Cadastro de admin cai em `/admin/home` | feliz |
| UI | Login inválido permanece em `/login` | negativo |
| UI | Admin cria produto e vê na lista | fluxo de negócio |

---

## 2. Por que Cypress, e não Postman + Playwright / Selenium

O desafio pede API **e** frontend. Duas ferramentas (coleção HTTP + suite de UI) dobram setup, CI e linguagem.

Cypress resolve isso num projeto só:

- `cy.request` para contrato HTTP, sem abrir browser.
- Comandos de UI para o front em `https://front.serverest.dev`.
- A mesma fila de comandos permite **encadear** API → UI no mesmo teste (o `beforeEach` de admin faz `POST /usuarios` e depois preenche o login).

Não usei Selenium porque o custo de WebDriver, waits explícitos e sincronização não se justifica num app SPA pequeno com `data-testid`. Playwright seria equivalente em capacidade; Cypress foi escolhido pelo runner visual, pelo Cypress Cloud (vídeo + Test Replay) e pela action oficial de CI.

**Se perguntarem “por que não só API?”**  
Porque cadastro, redirect e lista de produtos são comportamento de interface. Status 201 na API não prova que o front mostrou “Bem Vindo” nem que o produto apareceu na tabela.

**Se perguntarem “por que não só UI?”**  
Porque autorização, persistência e e-mail duplicado são regras de backend. Testar isso só pela tela fica lento, frágil e mistura falha de UI com falha de contrato.

---

## 3. Arquitetura

```
cypress.config.js          baseUrl, projectId, vídeo
.github/workflows/         CI: install + cypress run --record
cypress/e2e/api.cy.js      o que a API precisa garantir
cypress/e2e/ui.cy.js       o que o usuário vê
cypress/page_objects/      como interagir com a tela
cypress/support/helpers.js dados únicos (Faker)
cypress/fixtures/          URLs e mensagens do contrato
```

Três camadas, de propósito:

1. **Spec** — intenção do teste em linguagem de negócio (`only lets an authenticated admin create products`).
2. **Page object** — detalhes de DOM (`data-testid`, `visit`, `type`, `click`).
3. **Helper + fixture** — massa de dados e contrato (URLs, mensagens).

O spec não deve saber que o botão de cadastrar produto tem `data-testid="cadastarProdutos"` (typo do próprio app). O page object isola isso. Se o seletor mudar, o teste de negócio não muda.

Helpers não vivem no spec para os dois arquivos (`api.cy.js` e `ui.cy.js`) gerarem usuário/produto do mesmo jeito. Fixtures não misturam dado aleatório com texto fixo do Swagger: Faker gera `nome`/`email`; `constants.json` guarda o que a API promete devolver.

**Por que não custom commands para tudo?**  
`cy.login` esconde fluxo demais e vira magia. Page object + helper deixa o spec legível e a interação reutilizável, sem registrar API global do Cypress. Commands fariam sentido se o mesmo login fosse usado em dezenas de specs.

**Por que page object “magro”?**  
Cada classe faz uma ação de negócio (`login`, `register`, `create`). Não há asserts dentro do page object. Assert é responsabilidade do spec: o page object clica, o teste decide o que “sucesso” significa. Isso evita page objects que falham por validação, não por interação.

---

## 4. Pontos de integração

O framework não testa um sistema isolado. Ele se conecta a quatro sistemas reais.

```
                    GitHub Actions (ubuntu + Chrome)
                              |
                    cypress-io/github-action
                              |
              +---------------+---------------+
              |                               |
     front.serverest.dev              serverest.dev
     (baseUrl, UI)                    (constants.API.*)
              |                               |
              +---------------+---------------+
                              |
                      Cypress Cloud
                   (projectId + record key)
```

### 4.1 Frontend — `baseUrl`

`cypress.config.js` define `baseUrl: 'https://front.serverest.dev'`. Specs usam caminho relativo (`/login`, `/cadastrarusuarios`). Motivo: um único lugar para trocar ambiente; o spec não concatena host.

### 4.2 API — `constants.API`

A UI e a API **não compartilham host**. O front é `front.serverest.dev`; a API é `serverest.dev`. Por isso as URLs da API não vão no `baseUrl`. Ficam em `constants.json`:

- `USERS` → `POST`/`GET /usuarios`
- `LOGIN` → token
- `PRODUCTS` → `POST`/`DELETE /produtos`

O spec de UI também chama `constants.API.USERS` no `beforeEach`: a pré-condição não passa pelo formulário.

### 4.3 GitHub Actions

Workflow em push/PR para `main`. Sem `build`/`start`/`wait-on` porque o app já está no ar. `browser: chrome` porque Cypress 16 deprecou Electron. `record: true` envia o run ao Cloud.

A record key **não** está no YAML. Está em `secrets.CYPRESS_RECORD_KEY`. `GITHUB_TOKEN` distingue run novo de re-run.

### 4.4 Cypress Cloud

`projectId` no config identifica o projeto. Vídeo foi ligado (`video: true`) porque no Cypress 16 o default é `false`. Screenshot de falha já vem ligado. Relatórios, vídeos e Test Replay ficam na aba **Runs**.

### 4.5 Contrato ServeRest (Swagger)

Os bodies seguem o contrato:

- Usuário: `nome`, `email`, `password`, `administrador` como **string** `"true"` (não boolean).
- Produto: `nome`, `preco` **inteiro**, `descricao`, `quantidade`.

Isso veio do Swagger, não de chute. `administrador: "true"` como string é uma decisão do backend; mandar boolean quebraria o cadastro. `preco` no front não aceita decimal — por isso `faker.number.int` e não `faker.commerce.price()`.

---

## 5. Decisões em partes complexas

### 5.1 Fila do Cypress e `.then()` encadeado

`cy.request()` não devolve o response na hora. Ele entra na fila. O body só existe dentro de `.then()`.

O cenário de produto precisa de ordem rígida:

1. `POST /produtos` sem token → **401** (endpoint protegido)
2. `POST /usuarios` cria o admin
3. `POST /login` devolve `authorization`
4. `POST /produtos` **com** o token → **201**
5. `DELETE /produtos/:id` com o mesmo token → limpeza

Cada passo precisa do anterior (token, `_id`). Por isso cada `.then` **retorna** o próximo `cy.request`. Isso achata a cadeia: o próximo `.then` recebe a response nova, sem callback hell.

`let token` existe porque o token nasce no login (passo 3) e é reusado no create e no delete (passos 4 e 5). Não dá para declarar `const token` no topo do teste: nessa hora o login ainda não rodou.

**Se perguntarem “por que não async/await?”**  
Cypress mistura Promises com a própria fila. `await cy.request()` não é o modelo suportado. O padrão oficial é encadear comandos e `.then()`.

### 5.2 `failOnStatusCode: false`

Por default, `cy.request` falha o teste em qualquer status fora de 2xx **antes** das asserts. No caso negativo (401 sem token, 400 e-mail duplicado), o 4xx **é** o resultado esperado.

Com a flag, o comando devolve a response e o spec afirma `status` e `message`. Sem ela, o teste vermelho não distingue “API rejeitou certo” de “request quebrou”.

Uso a flag nos requests da cadeia de produto também, para um 401 não abortar o restante da história. O 201 do create ainda é assertado explicitamente.

### 5.3 UI autenticada pela API, não pelo form

O spec “cria produto na lista” não testa login. Login já tem spec próprio. Montar admin pelo form em todo teste deixaria a suíte lenta e acoplada a um fluxo que não está em teste.

O `beforeEach`:

1. `uniqueUser("true")` gera um admin
2. `POST /usuarios` na API
3. visita `/login` e entra com esse usuário

A UI começa **já autenticada**, no ponto em que o cadastro de produto existe. Isso é setup por API + uma sessão curta na tela, o padrão certo quando o alvo é o fluxo seguinte.

Há um ponto honesto: esse login no `beforeEach` ainda usa `cy.get` direto, não `loginPage.login()`. Foi o caminho mais curto na hora de amarrar o token visual. Numa revisão, eu moveria para o page object para ficar consistente.

### 5.4 Dados únicos (Faker) e independência

ServeRest é um ambiente **compartilhado**. E-mail repetido retorna 400. Nome de produto repetido também conflita. `user123@test.com` quebra na segunda execução.

`uniqueUser` / `uniqueProduct` geram nome, e-mail, produto e quantidade novos a cada chamada. Os testes podem rodar em qualquer ordem, em paralelo local, e de novo no CI, sem limpar o banco (não temos acesso a ele).

No e-mail duplicado, o segundo payload é outro `uniqueUser()` com o **mesmo** `email` do primeiro. O que precisa colidir é só o e-mail; nome diferente prova que a rejeição é da regra, não de um body idêntico.

`preco` é inteiro (`faker.number.int`). O input de preço da UI recusa decimal; `faker.commerce.price()` devolve `"123.45"` e o teste falha na digitação, não na regra de negócio.

Senha ainda é `"Password@123"` fixa. É senha de ambiente de teste, não credencial real. Faker no password também funcionaria, porque o objeto `user` carrega a senha usada no login. dotenv + `cy.env()` seria o caminho se a senha precisasse sair do git; `cy.env()` é assíncrono e quebraria o helper síncrono.

### 5.5 `data-testid` em vez de CSS ou texto

Classes do front mudam com estilo. Texto muda com i18n. `data-testid` existe no ServeRest exatamente para automação (`nome`, `email`, `senha`, `cadastrarProdutos`, `quantity`).

O seletor `cadastarProdutos` replica o typo do HTML. Corrigir no teste “para ficar certo” quebraria o clique. O page object documenta o contrato real da tela.

`{ log: false }` no `type` da senha no RegisterPage evita imprimir a senha no Command Log.

### 5.6 Validações: o que se afirma, e por quê

Não basta `status === 200`. Cada cenário trava um comportamento.

**API — create + GET**

- `201` e mensagem de cadastro: o create cumpriu o contrato.
- body tem `_id`: a API devolveu identidade.
- GET `200` e `include` de `nome`/`email`/`administrador`: o recurso **persistiu**, não só “aceitou o POST”.

**API — e-mail duplicado**

- primeiro POST `201`: a pré-condição existiu.
- segundo POST `400` + `"Este email já está sendo usado"`: a regra, não um 500 genérico.

**API — produto autenticado**

- `401` sem header: o recurso é protegido (não só “login existe”).
- `201` com `Authorization`: o token de admin libera a escrita.
- `DELETE 200`: o teste não deixa lixo no ambiente compartilhado.

**UI — cadastro**

- toast de sucesso (mesma mensagem da API, via `constants`).
- URL contém `/admin/home`: houve navegação, não só toast.
- `Bem Vindo ${user.nome}`: a sessão é daquele usuário, não de um admin cacheado.

**UI — login inválido**

- mensagem de credencial inválida.
- URL continua `/login`: não houve redirect silencioso.

**UI — produto na lista**

- URL `/admin/listarprodutos`.
- `td` com `product.nome`: o item está na tabela, não só “cadastrou”.

Mensagens e URLs de contrato ficam em `constants.json` para API e UI afirmarem o **mesmo** texto. Se o backend mudar a mensagem, o fixture quebra os dois lados de propósito.

---

## 6. CI e evidência

O desafio pede pipeline e evidência de execução. A cadeia é:

1. Push em `main` dispara `.github/workflows/cypress.yml`.
2. A action instala dependências (`npm ci` via lockfile) e roda Cypress no Chrome.
3. `--record` envia o run ao Cypress Cloud.
4. Na aba **Runs**: resultado por spec, screenshots de falha, vídeo, Test Replay.

Isso é melhor que só badge verde no GitHub: dá para abrir o vídeo e ver *onde* a UI quebrou.

---

## 7. O que eu melhoraria (mostra critério)

Fale isso se perguntarem “o que falta?”. Mostra que as escolhas foram conscientes, não omissão.

- **Login do `beforeEach` UI** deveria usar `loginPage.login(admin)` em vez de `cy.get` duplicado.
- **Senha** sairia do código (Faker por usuário, ou secret no CI).
- **`constants.json`** ainda não tem `"Este email já está sendo usado"` — ficou hardcoded no spec da API.
- **Page objects** poderiam expor o toast/URL, mas eu manteria o assert no spec.
- **Ambiente compartilhado**: os testes dependem de `serverest.dev` estar no ar. Um mock/local ServeRest deixaria o CI determinístico.
- **README** ainda descreve pastas `cypress/e2e/api/` e `frontend/`; na prática são dois specs. Eu alinharia a doc.

Não paralelizei no Cloud nem separei job de API e UI: a suíte tem 6 testes e termina em segundos. Paralelizar agora seria complexidade sem ganho.

---

## 8. Roteiro de 10 minutos

1. **Problema** — ServeRest tem API e front; preciso contrato HTTP e fluxo de usuário.
2. **Ferramenta** — Cypress cobre os dois; Cloud + Actions cobrem evidência.
3. **Arquitetura** — spec / page object / helper / fixture. Desenhe as pastas.
4. **Integrações** — front, API, GitHub, Cloud. Mostre o diagrama da seção 4.
5. **Cenário complexo** — abra o teste do produto na API e explique a cadeia 401 → user → login → 201 → DELETE.
6. **UI** — abra o `beforeEach` e explique setup por API.
7. **Validações** — um exemplo feliz e um negativo (e-mail duplicado ou login inválido).
8. **Melhorias** — seção 7, em 30 segundos.

Se pedirem para abrir código, comece por `api.cy.js` (cadeia) e `helpers.js` (dados). Page objects depois, se perguntarem seletor.
