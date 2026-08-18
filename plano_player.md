# Planejamento do Player de Karaokê no Navegador

Este documento descreve o planejamento conceitual e o fluxo de funcionamento do player de karaokê no navegador antes do início da implementação do código front-end, conforme solicitado na **Parte 6.1** da atividade.

---

## 1. Elementos da Tela

A interface gráfica do usuário precisa exibir de forma clara e intuitiva os seguintes componentes:

- **Cabeçalho principal**: Título da aplicação informando que se trata do Player de Karaokê.
- **Painel lateral da Playlist**:
  - Título da seção indicando "Músicas" ou "Playlist".
  - Lista não-ordenada (`<ul>`) dinâmica onde cada item representará uma música disponível no catálogo (exibindo Nome e Artista). Cada item deve ser clicável e permitir a seleção.
- **Palco central de reprodução**:
  - Título/nome da música selecionada (com texto inicial orientando o usuário a escolher uma música).
  - Subtítulo com o nome do artista ou banda.
  - Indicador da seção ou tag da estrofe atual (por exemplo: "VERSO 1", "REFRÃO").
  - Área principal da letra com destaque tipográfico para facilitar a leitura durante o canto.
  - Indicador de progresso/contador (exemplo: "Parte 1 de 5").
  - Botão de ação principal **"▶ Tocar"** (iniciando desabilitado até que uma música seja selecionada).

---

## 2. Rotas Consumidas e Momentos de Chamada

A aplicação no navegador fará uso de requisições HTTP assíncronas para se comunicar com o servidor Express:

1. **`GET /api/musicas`**:
   - **Quando é chamada**: Imediatamente ao carregar a página no navegador.
   - **Objetivo**: Obter a lista resumida de todas as músicas cadastradas no sistema (contendo identificador, nome, artista e quantidade de partes) para preencher visualmente o menu da playlist.

2. **`GET /api/musicas/:id`**:
   - **Quando é chamada**: No momento em que o usuário clica em um dos itens da playlist.
   - **Objetivo**: Buscar o registro detalhado e completo da música selecionada, incluindo todo o arranjo de suas partes (letras, tags e tempos de espera específicos de cada trecho), armazenando essas informações na memória local da aplicação para preparar o palco.

> **Observação importante**: Quando o usuário clica em "▶ Tocar", **nenhuma rota do servidor é chamada**. Todos os dados da música e suas partes já foram carregados previamente e encontram-se disponíveis no navegador.

---

## 3. Fluxo Numerado de Execução

O ciclo de vida da interação do usuário com o player segue as seguintes etapas sequenciais:

1. **Carregamento inicial da página**: O navegador carrega os arquivos HTML, CSS e JavaScript estáticos fornecidos pelo servidor Express.
2. **Inicialização do catálogo**: O script do cliente dispara a busca pela lista de músicas (`GET /api/musicas`), aguarda a resposta em JSON e cria dinamicamente os elementos clicáveis na lista de reprodução.
3. **Seleção de uma música**: O usuário clica sobre a música desejada na playlist.
4. **Requisição dos dados detalhados**: O cliente solicita os dados completos da música escolhida (`GET /api/musicas/:id`).
5. **Atualização do palco e estado**: O player armazena o objeto da música selecionada em seu estado interno, atualiza o nome e o artista na tela, limpa letras residuais e habilita o botão "▶ Tocar".
6. **Início da reprodução**: O usuário clica no botão "▶ Tocar".
7. **Bloqueio de novas ações**: O botão "▶ Tocar" é desabilitado temporariamente para evitar múltiplas execuções concorrentes.
8. **Execução das partes em loop**: O sistema inicia um laço de repetição que percorre cada parte da música na ordem cadastrada:
   - Apresenta a tag da estrofe atual no palco.
   - Exibe o texto da letra correspondente.
   - Atualiza o contador de progresso ("Parte X de Total").
   - Pausa a execução pelo tempo em milissegundos definido no `tempoEspera` daquela parte.
9. **Finalização da música**: Ao término de todas as partes, o sistema exibe uma mensagem de encerramento no palco (ex: "🎤 Fim! Escolha outra música.") e reabilita o botão "▶ Tocar".

---

## 4. O Uso de Operações Assíncronas (`async`/`await`)

O paradigma assíncrono é fundamental no player em dois momentos essenciais:

- **Nas requisições HTTP (`fetch`)**: O navegador não pode congelar a interface enquanto aguarda a resposta da rede ao solicitar as músicas ao servidor. O uso de `async/await` com a Fetch API permite esperar a resposta e a conversão do corpo JSON de forma limpa e não-bloqueante.
- **Na sincronização do tempo de cada estrofe (`sleep`)**: Para simular o ritmo do karaokê, a execução precisa pausar entre uma estrofe e outra respeitando a duração estipulada em cada parte. Uma Promise com `setTimeout` associada a `await` pausa a função de reprodução sem travar a renderização nem a interatividade da página web.

---

## 5. O Que Foi Diferente (Comparativo Pós-Implementação — Parte 6.2)

Após a conclusão da implementação e dos testes práticos no navegador, identificamos as seguintes diferenças e aprendizados entre o plano inicial e a realidade do desenvolvimento:

1. **Controle de Interrupção e Concorrência (Botão ⏹ Parar):**  
   No planejamento inicial, havíamos considerado apenas desabilitar o botão "▶ Tocar" durante a execução. No entanto, na prática percebemos que o usuário poderia querer parar a reprodução no meio ou trocar de música enquanto uma estrofe longa estava sendo exibida. Para viabilizar o desafio extra do botão **"⏹ Parar"**, foi necessário introduzir uma variável de estado `let tocando = false;` e checar `if (!tocando) break;` a cada iteração do laço `for`, além de desabilitar o botão Parar quando inativo.

2. **Destaque Visual e Associação por Atributo de Dados (`data-id`):**  
   No plano inicial, tínhamos pensado apenas em preencher o texto do item da lista. Durante a construção da interface, notamos que era necessário guardar o ID da música em cada elemento `<li>` (usando `item.dataset.id = musica.id`) para permitir alternar dinamicamente a classe CSS `.ativo`, destacando visualmente qual música da playlist está selecionada no momento.

3. **Inclusão da Rota e Botão de Sorteio (🔀 Aleatória):**  
   Não havíamos previsto no plano original a existência de uma rota `/api/musicas/aleatoria` nem o botão correspondente no cabeçalho da playlist. A adição dessa funcionalidade exigiu atenção especial na ordem de registro das rotas no Express (declarando `/aleatoria` antes de `/:id`) e encadeamento no frontend de `sortearAleatoria()` com `escolherMusica(id)`.

4. **Tratamento de Quebras de Linha e Estados Vazios:**  
   No plano, assumimos que a letra seria exibida diretamente sem preocupações com formatação. Na prática, as letras possuem quebras de linha (`\n`) que exigem a propriedade CSS `white-space: pre-line` e o uso rigoroso de `textContent` (em vez de `innerHTML`) para preservar a formatação original sem risco de injeção de código ou falhas visuais.
