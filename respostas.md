# Respostas Teóricas e Análise Técnica — API do Karaokê

**Disciplina:** Programação III  
**Curso:** Ensino Médio Integrado — Técnico em Informática  
**Professor:** Élder Bernardi  

---

## 1. Revisão Técnica do Servidor

### 1.1 Status Codes HTTP (Seção 1.1 do Enunciado)

| Situação | Código esperado | O servidor original usava? | Situação na versão atualizada |
| :--- | :--- | :--- | :--- |
| **Recurso retornado com sucesso** | `200 OK` | **Sim** (implícito no `res.send` / `res.json`) | `200 OK` explícito nas rotas `GET`, `PUT`, `DELETE`. |
| **Recurso criado (POST)** | `201 Created` | **Parcial** (usava no `POST /musica/:id/parte`, mas faltava no cadastro de músicas) | `201 Created` no `POST /api/musicas` e `POST /api/musicas/:id/partes`. |
| **Dados inválidos no body** | `400 Bad Request` | **Parcial** (atribuía `res.statusCode = 400` manualmente em alguns `catch`) | `400 Bad Request` retornado em validações de campos e JSON mal-formado. |
| **Recurso não encontrado** | `404 Not Found` | **Sim** (usava `res.status(404)` quando `id != 0`, mas com rotas fixas) | `404 Not Found` com mensagem descritiva em JSON em todas as rotas por ID. |
| **Erro interno do servidor** | `500 Internal Server Error` | **Não** (erros não tratados travavam ou geravam HTML padrão de erro) | `500 Internal Server Error` centralizado no middleware final de erro. |

**Análise dos pontos faltantes/incorretos na versão original:**
- O servidor original tratava apenas a música de `id = 0` e devolvia mensagens em texto puro ou strings formatadas manualmente.
- Não havia tratamento centralizado para falhas de parse de JSON ou exceções inesperadas, o que podia derrubar a aplicação ou gerar respostas fora do padrão RESTful.

---

### 1.2 Content-Type e Métodos de Resposta (Seção 1.2 do Enunciado)

- **O que é o cabeçalho `Content-Type` e por que ele é relevante?**  
  O `Content-Type` é um cabeçalho HTTP de entidade que indica ao cliente (navegador, REST Client, app mobile) o formato exato dos dados contidos no corpo da mensagem (MIME Type) e a codificação de caracteres (ex: `utf-8`). Ele é fundamental para que o cliente saiba como interpretar e renderizar o conteúdo recebido (se deve fazer parse como objeto JSON, desenhar uma página HTML, carregar uma imagem ou tratar como texto simples).

- **Quando usamos `res.send()` com uma string HTML, qual `Content-Type` o Express define?**  
  Ao passar uma string contendo tags HTML (ex.: `<html>...</html>`) para o método `res.send()`, o Express inspeciona o início da string e define automaticamente o cabeçalho como:
  ```http
  Content-Type: text/html; charset=utf-8
  ```
  Isso pode ser comprovado no REST Client inspecionando os headers de resposta.

- **Qual a diferença prática entre `res.json()` e `res.send()` em termos de Content-Type?**  
  - `res.json(dado)`: Converte explicitamente qualquer tipo de dado (objeto, array, número, booleano) para JSON usando `JSON.stringify()` e força obrigatoriamente o cabeçalho `Content-Type: application/json; charset=utf-8`.
  - `res.send(dado)`: É polimórfico. Ele tenta inferir o tipo do dado: se receber uma string com tags HTML, envia `text/html`; se receber um Buffer, envia `application/octet-stream`; se receber um objeto ou array JS, ele chama internamente `res.json()`. Porém, em APIs REST profissionais, o uso de `res.json()` é uma boa prática recomendada para deixar clara a intenção de responder dados estruturados em JSON.

---

### 1.3 Tratamento de Erros: 400 vs 500 (Seção 1.3 do Enunciado)

- **Comportamento diante de JSON mal-formado sem middleware:**  
  Quando o cliente envia um JSON sintaticamente incorreto (por exemplo, sem fechar chaves ou faltando vírgulas), o middleware `express.json()` lança um `SyntaxError`. Sem um middleware de erro customizado, o Express gera uma resposta HTML padrão com stack trace e status 400 ou 500, quebrando a comunicação padronizada em JSON com o cliente.
- **Diferenciação 400 vs 500 no middleware implementado:**  
  No middleware centralizado de erros:
  ```javascript
  app.use((err, req, res, next) => {
      console.error('Erro capturado no servidor:', err.message);
      if (err.status === 400 || err instanceof SyntaxError) {
          return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
      }
      res.status(500).json({ erro: 'Erro interno do servidor' });
  });
  ```
  Isso assegura que erros causados pela requisição do cliente recebam status `400 (Bad Request)` e falhas inesperadas do servidor recebam `500 (Internal Server Error)`.

---

## 2. Respostas às Perguntas da Parte 5

### 1. Status Codes HTTP
Os 5 códigos de status mais comuns em APIs REST são:
1. **`200 OK`**: A requisição foi bem-sucedida. Exemplo: Leitura de dados via `GET /api/musicas` ou atualização via `PUT /api/musicas/0`.
2. **`201 Created`**: Um novo recurso foi criado com sucesso no servidor. Exemplo: Cadastro de uma nova música via `POST /api/musicas` ou inserção de parte via `POST /api/musicas/0/partes`.
3. **`400 Bad Request`**: A requisição do cliente é inválida (sintaxe quebrada ou campos obrigatórios ausentes). Exemplo: Enviar `POST /api/musicas` apenas com o campo `nome` sem o campo `artista`.
4. **`404 Not Found`**: O recurso solicitado não existe na base de dados. Exemplo: Buscar `GET /api/musicas/999`.
5. **`500 Internal Server Error`**: Ocorreu um erro inesperado no código do servidor durante o processamento da requisição (ex: erro de banco de dados inacessível ou exceção não tratada).

---

### 2. Content-Type: `application/json` vs `text/html`
- **Diferença:**
  - `application/json` indica que o corpo da mensagem é um dado bruto estruturado no formato JSON (chave/valor, listas), destinado a ser processado programaticamente por aplicações cliente (como um app React, script de frontend ou cliente mobile).
  - `text/html` indica que o corpo é um documento de hipertexto formatado com tags HTML, destinado à interpretação e renderização visual direta pelo motor do navegador.
- **Por que o cliente precisa dessa informação?**
  O cliente utiliza o `Content-Type` para saber qual parser aplicar ao fluxo de bytes recebido. Sem esse cabeçalho, um navegador não saberia se deve renderizar uma interface na tela, abrir uma janela de download de arquivo ou disponibilizar o texto para métodos como `resposta.json()` ou `resposta.text()`.

---

### 3. Padrão DAO e Persistência
- **O que é o padrão DAO?**  
  O **Data Access Object (DAO)** é um padrão de projeto estrutural que atua como uma camada intermediária isolando a lógica de negócio e as rotas HTTP da forma concreta como os dados são armazenados e manipulados.
- **Qual problema ele resolve?**  
  Elimina o acoplamento direto entre as rotas do Express e a estrutura de dados de armazenamento (array em memória, arquivo JSON, banco PostgreSQL/Supabase). Se as rotas acessassem diretamente o array com `musicas.splice()` ou comandos SQL diretos, qualquer mudança no banco exigiria reescrever toda a API. Com o DAO, as rotas apenas chamam métodos de alto nível (`listarTodas`, `buscarPorId`, `inserir`, `atualizar`, `remover`), mantendo a API desacoplada e modular.
- **O que acontece com os dados ao reiniciar o servidor?**  
  Como a implementação atual armazena as músicas em um array na memória RAM da máquina (`this.musicas = []`), ao reiniciar o processo do Node.js todo o estado em memória é destruído e o array é reinicializado com a carga inicial definida no construtor.
- **O que precisaríamos mudar para que os dados sobrevivam?**  
  Bastaria alterar a implementação interna dos métodos do `MusicaDAO` para ler e gravar em um meio persistente — como salvar em um arquivo no disco (`fs.writeFile`/JSON) ou executar queries (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) em um banco de dados real (PostgreSQL, Supabase, SQLite) — **sem precisar alterar nenhuma linha das rotas no `app.js`**.

---

### 4. Singleton no `MusicaDAO.js`
- **Por que exportamos `new MusicaDAO()`?**  
  Ao exportar uma instância já criada (`module.exports = new MusicaDAO();`), o Node.js armazena esse módulo em cache. Todos os arquivos que executam `require('./DAO/MusicaDAO')` recebem a exata mesma referência de objeto na memória.
- **O que aconteceria se exportássemos a classe?**  
  Se exportássemos a classe e cada arquivo fizesse `new MusicaDAO()`, teríamos múltiplas instâncias independentes, cada uma com seu próprio array `this.musicas`. Se uma rota de cadastro inserisse uma música na sua instância do DAO, a rota de listagem (em outro arquivo ou router) não enxergaria a nova música, pois estaria consultando uma instância diferente com um array separado.

---

### 5. Semântica: PUT vs POST vs PATCH
- **Diferença entre PUT e POST:**
  - **`POST`**: É usado para **criar** um novo recurso ou processar dados que não sejam idempotentes. A URI do endpoint geralmente aponta para a coleção (`/api/musicas`) e o servidor define o identificador do recurso criado.
  - **`PUT`**: É usado para **substituir/atualizar integralmente** um recurso existente em uma URI específica (`/api/musicas/:id`). Ele é idempotente: executar a mesma requisição PUT várias vezes seguidas deve produzir o mesmo estado final.
- **Alteração parcial de um campo (apenas o artista):**  
  O verbo HTTP mais adequado para atualizações parciais de campos é o **`PATCH`** (`PATCH /api/musicas/:id`). Enquanto o `PUT` semanticamente exige o envio de todos os dados do recurso para substituição completa, o `PATCH` foi concebido na especificação HTTP para aplicar modificações pontuais a um recurso existente.

---

### 6. Erro do Cliente (4xx) vs Erro do Servidor (5xx)
- **Por que JSON mal-formado deve retornar 400 e não 500?**  
  A família de status **`4xx (Client Error)`** indica que a falha foi originada por uma ação incorreta de quem enviou a requisição (sintaxe inválida, campos ausentes, recurso inexistente ou credenciais não autorizadas).  
  A família **`5xx (Server Error)`** indica que o cliente enviou uma requisição válida, mas o servidor falhou internamente ao tentar processá-la (ex: falha de hardware, bug no código, banco indisponível).  
  Se o cliente envia um JSON quebrado, a responsabilidade do erro é do cliente; portanto, retornar 500 seria uma mentira semântica, acusando falsamente o servidor de ter falhado. O middleware intercepta o `SyntaxError` do parser do Express e responde corretamente com status `400 Bad Request`.

---

### 7. Frontend e API: Reprodução Local do Karaokê
- **Por que clicar em "▶ Tocar" não faz requisições ao servidor?**  
  Quando o usuário seleciona uma música na playlist, a função `escolherMusica(id)` já dispara antecipadamente a requisição `GET /api/musicas/:id` e recebe o objeto completo da música, contendo o array com todas as suas partes (`partes: [ { letra, tempoEspera, tag }, ... ]`).  
  Esse objeto fica guardado na memória do navegador na variável de estado `musicaAtual`. Durante a reprodução (função `tocar()`), o navegador apenas itera localmente sobre o array `musicaAtual.partes`, utilizando `await sleep(tempoEspera)` para controlar o tempo entre as estrofes na tela. Não há necessidade de consultar o servidor a cada verso, economizando tráfego de rede e garantindo uma reprodução sem atrasos causados por latência.

---

## 3. Relato de Testes com o Debugger (Seção 4.3 do Enunciado)

Realizamos testes de depuração controlada passo a passo em duas rotas essenciais da API:

1. **Depuração na Rota `POST /api/musicas`:**
   - **Breakpoint inserido:** Na primeira linha de validação `const { nome, artista } = req.body;`.
   - **Observação:** Ao submeter a requisição via REST Client, o depurador pausou a execução antes do processamento. Inspecionando a aba *Variables*, pudemos constatar que o middleware `express.json()` já havia executado com sucesso e populado `req.body` com os tipos corretos (strings). Ao avançar linha a linha com `F10`, confirmamos a passagem pela validação e a geração do identificador sequencial `id: 1` pelo `musicaDAO.inserir()`.

2. **Depuração na Rota `POST /api/musicas/:id/partes`:**
   - **Breakpoint inserido:** No início do handler da rota de inserção de partes.
   - **Observação:** Foi possível inspecionar `req.params.id` (originalmente uma `string` `"0"`) e acompanhar a conversão numérica com `Number(req.params.id)`. Observamos o fluxo de validação da instância `new Parte(...)` e a execução do método `musicaDAO.adicionarPartes(id, parte)` retornando `true`, resultando na resposta HTTP com status `201 Created` e inclusão da nova estrofe no array da música.
