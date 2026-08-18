// public/player.js — Cérebro do player de karaokê no navegador
// Disciplina: Programação III - IFSul Campus Passo Fundo
// Implementação fiel das Etapas 7.3, 7.4, 7.5 e Desafios Extras 7.7
//
// NOTA DIDÁTICA: Neste arquivo, preferimos usar funções tradicionais
// (function) ao invés de arrow functions (=>) para facilitar a leitura
// por quem está aprendendo JavaScript pela primeira vez.

// ====================================================================
// 1. Referências aos elementos da página (DOM)
// ====================================================================
//
// document.getElementById('nome') busca no HTML o elemento que tem id="nome".
// Guardamos essas referências em variáveis para não precisar buscar toda vez.

var listaEl    = document.getElementById('listaMusicas');
var nomeEl     = document.getElementById('nomeMusica');
var artistaEl  = document.getElementById('artista');
var tagEl      = document.getElementById('tag');
var letraEl    = document.getElementById('letra');
var contadorEl = document.getElementById('contador');
var btnTocar   = document.getElementById('btnTocar');
var btnParar   = document.getElementById('btnParar');
var btnAleatoria = document.getElementById('btnAleatoria');

// ====================================================================
// 2. Estado do Player
// ====================================================================

// Armazena a música selecionada com todas as suas partes carregadas.
// Começa como null porque nenhuma música foi escolhida ainda.
var musicaAtual = null;

// Flag (bandeira) de controle: indica se uma música está tocando agora.
// Usada pelo botão "⏹ Parar" para interromper a reprodução (Desafio Extra 7.7).
var tocando = false;

/**
 * Função utilitária: "dormir" por um tempo em milissegundos.
 * Cria uma Promise que só é resolvida quando o setTimeout dispara.
 * Com "await sleep(3000)", o código pausa 3 segundos sem travar a página.
 *
 * NOTA DIDÁTICA sobre Promise:
 * - Uma Promise representa um valor que ainda não chegou (uma "promessa").
 * - resolve é a função chamada quando a promessa se cumpre.
 * - setTimeout(resolve, ms) chama resolve após "ms" milissegundos.
 */
function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

// ====================================================================
// 3. Passo 2 (Roteiro 7.3) — Busca GET /api/musicas e monta a playlist
// ====================================================================

/**
 * Faz uma requisição HTTP GET ao servidor para obter a lista de músicas
 * e cria dinamicamente os itens (<li>) na playlist do HTML.
 */
async function carregarPlaylist() {
    try {
        // fetch() faz uma requisição HTTP. O "await" espera a resposta chegar.
        var resposta = await fetch('/api/musicas');

        // .ok é true se o status HTTP está entre 200-299 (sucesso)
        if (!resposta.ok) {
            throw new Error('Falha ao carregar catálogo: HTTP ' + resposta.status);
        }

        // .json() converte o corpo da resposta de texto JSON para um array/objeto JS
        var musicas = await resposta.json();

        // Limpa a lista antes de reconstruir (caso já tivesse itens antigos)
        listaEl.innerHTML = '';

        // Para cada música recebida do servidor, cria um item na lista
        for (var i = 0; i < musicas.length; i++) {
            var musica = musicas[i];

            // document.createElement('li') cria um novo elemento <li> na memória
            var item = document.createElement('li');

            // .textContent define o texto visível do elemento
            item.textContent = musica.nome + ' — ' + musica.artista;

            // dataset é uma forma de guardar dados extras no elemento HTML.
            // Aqui guardamos o id da música para usar depois no clique.
            // No HTML, isso vira: <li data-id="0">...</li>
            item.dataset.id = musica.id;

            // addEventListener('click', ...) registra uma função que será
            // chamada quando o usuário clicar nesse item da lista.
            //
            // Passamos musica.id diretamente porque é um número (valor primitivo).
            // Valores primitivos são copiados, então cada callback guarda seu próprio id.
            item.addEventListener('click', function() {
                escolherMusica(musica.id);
            });

            // .appendChild() insere o <li> criado dentro do <ul> da playlist
            listaEl.appendChild(item);
        }
    } catch (erro) {
        console.error('Erro ao carregar playlist:', erro);
        listaEl.innerHTML = '<li style="color: #ff5555;">Erro ao conectar com o servidor</li>';
    }
}

// ====================================================================
// 4. Passo 3 (Roteiro 7.4) — Busca GET /api/musicas/:id e prepara o palco
// ====================================================================

/**
 * Busca os dados completos de uma música (incluindo todas as partes/estrofes)
 * e atualiza o "palco" na tela para que o usuário possa tocar.
 */
async function escolherMusica(id) {
    try {
        // Se uma música já está tocando, interrompe antes de trocar
        if (tocando) {
            tocando = false;
        }

        // Faz a requisição para buscar a música completa pelo id
        var resposta = await fetch('/api/musicas/' + id);
        if (!resposta.ok) {
            throw new Error('Música não encontrada: HTTP ' + resposta.status);
        }

        // Guarda o objeto da música no estado do player
        musicaAtual = await resposta.json();

        // Atualiza os textos no palco da interface
        nomeEl.textContent = musicaAtual.nome;
        artistaEl.textContent = musicaAtual.artista;
        tagEl.textContent = 'PRONTO';
        letraEl.textContent = 'Clique em ▶ Tocar para iniciar o karaokê!';

        // Exibe quantas partes a música tem
        var totalPartes = 0;
        if (musicaAtual.partes) {
            totalPartes = musicaAtual.partes.length;
        }
        contadorEl.textContent = totalPartes + ' partes disponíveis';

        // Habilita o botão de Tocar e desabilita Parar
        btnTocar.disabled = false;
        if (btnParar) {
            btnParar.disabled = true;
        }

        // Desafio Extra 7.7: Destaque visual do item selecionado na playlist
        //
        // NOTA DIDÁTICA sobre className:
        // Em vez de usar classList.add() e classList.remove(),
        // usamos a propriedade .className que é mais simples de entender.
        // .className contém a string completa das classes CSS do elemento.
        // Ao atribuir '' (vazio), removemos todas as classes.
        // Ao atribuir 'ativo', adicionamos a classe CSS "ativo" definida em estilo.css.
        var itens = listaEl.querySelectorAll('li');
        for (var i = 0; i < itens.length; i++) {
            var li = itens[i];

            // Compara o data-id do <li> com o id da música clicada.
            // Number() converte o texto para número, pois dataset sempre retorna string.
            if (Number(li.dataset.id) === Number(id)) {
                li.className = 'ativo';   // Adiciona a classe de destaque
            } else {
                li.className = '';         // Remove qualquer classe anterior
            }
        }
    } catch (erro) {
        console.error('Erro ao buscar música:', erro);
        alert('Não foi possível carregar os detalhes da música selecionada.');
    }
}

// ====================================================================
// 5. Passo 4 (Roteiro 7.5) — Reproduz as partes com await sleep
// ====================================================================

/**
 * Percorre cada parte (estrofe/verso) da música selecionada,
 * mostrando a letra no palco e esperando o tempo definido para cada trecho.
 *
 * NOTA DIDÁTICA sobre async/await:
 * - A palavra "async" antes de "function" permite usar "await" dentro dela.
 * - "await sleep(3000)" pausa a execução por 3 segundos SEM travar a página.
 * - Enquanto espera, o navegador continua respondendo a cliques e animações.
 */
async function tocar() {
    // Verifica se tem uma música selecionada com partes
    if (!musicaAtual || !musicaAtual.partes || musicaAtual.partes.length === 0) {
        alert('Selecione uma música com partes cadastradas para tocar.');
        return; // Sai da função sem fazer nada
    }

    // Sinaliza que a música começou a tocar
    tocando = true;

    // Desabilita o botão Tocar para evitar que cliquem duas vezes
    btnTocar.disabled = true;

    // Habilita o botão Parar (Desafio Extra)
    if (btnParar) {
        btnParar.disabled = false;
    }

    var total = musicaAtual.partes.length;

    // Laço for percorre cada parte da música, uma por vez
    for (var i = 0; i < total; i++) {
        // Desafio Extra: Verifica se o usuário clicou em "Parar"
        // Se tocando virou false, o break interrompe o laço
        if (!tocando) {
            break;
        }

        var parte = musicaAtual.partes[i];

        // Atualiza a interface com os dados desta estrofe
        // .toUpperCase() transforma o texto para letras maiúsculas (ex: "verso1" -> "VERSO1")
        tagEl.textContent = '-- ' + parte.tag.toUpperCase() + ' --';
        letraEl.textContent = parte.letra;
        contadorEl.textContent = 'Parte ' + (i + 1) + ' de ' + total;

        // Pausa a execução pelo tempo definido para esta estrofe (em milissegundos)
        // Ex: se tempoEspera = 4000, aguarda 4 segundos antes de passar para a próxima parte
        await sleep(parte.tempoEspera);
    }

    // Após o laço, verifica se terminou normalmente ou foi interrompido
    if (!tocando) {
        // Foi interrompido pelo botão Parar
        tagEl.textContent = '⏹ PARADO';
        letraEl.textContent = 'Reprodução interrompida.';
        contadorEl.textContent = '';
    } else {
        // Terminou todas as partes naturalmente
        tagEl.textContent = '🎤 FIM!';
        letraEl.textContent = '🎤 Fim da música! Escolha outra música para cantar.';
        contadorEl.textContent = 'Apresentação concluída!';
    }

    // Restaura o estado dos botões ao finalizar
    tocando = false;
    btnTocar.disabled = false;
    if (btnParar) {
        btnParar.disabled = true;
    }
}

// ====================================================================
// 6. Desafios Extras (Roteiro 7.7) — Parar e Música Aleatória
// ====================================================================

/**
 * Desafio Extra: Interrompe a reprodução imediatamente.
 * Basta mudar a flag "tocando" para false.
 * No próximo ciclo do laço for dentro de tocar(), o "break" será acionado.
 */
function parar() {
    if (tocando) {
        tocando = false;
    }
}

/**
 * Desafio Extra: Sorteia uma música aleatória do servidor
 * e já a seleciona automaticamente no palco.
 */
async function sortearAleatoria() {
    try {
        var resposta = await fetch('/api/musicas/aleatoria');
        if (!resposta.ok) {
            throw new Error('Erro ao buscar aleatória: HTTP ' + resposta.status);
        }
        var musica = await resposta.json();

        // Após receber a música sorteada, chama escolherMusica para preparar o palco
        await escolherMusica(musica.id);
    } catch (erro) {
        console.error('Erro ao sortear música:', erro);
        alert('Não foi possível obter uma música aleatória.');
    }
}

// ====================================================================
// 7. Registro de Eventos e Ponto de Partida
// ====================================================================
//
// addEventListener('click', nomeDaFuncao) conecta o clique do botão
// a uma função que será executada quando o usuário clicar.
// É como dizer: "quando clicarem neste botão, execute esta função".

btnTocar.addEventListener('click', tocar);

if (btnParar) {
    btnParar.addEventListener('click', parar);
}

if (btnAleatoria) {
    btnAleatoria.addEventListener('click', sortearAleatoria);
}

// Ponto de partida: quando a página termina de carregar, busca as músicas no servidor
carregarPlaylist();
