// app.js — Servidor Express da API do Karaokê
// Disciplina: Programação III - IFSul Campus Passo Fundo
// Professor: Élder Bernardi

// ====================================================================
// PARTE 1 & PARTE 2: Importações e Configurações Iniciais
// ====================================================================

const express = require('express');

// Importação da classe Parte para manipulação de estrofes/versos
const { Parte } = require('./karaoke/parte');

// Importação da instância única (Singleton) da camada DAO
const musicaDAO = require('./karaoke/DAO/MusicaDAO');

// Inicialização da aplicação Express
const app = express();
const PORT = 3000;

// ====================================================================
// MIDDLEWARES DE PRÉ-PROCESSAMENTO
// ====================================================================

// Middleware para processar requisições com corpo no formato JSON
app.use(express.json());

// Parte 7.2: Servir arquivos estáticos do front-end da pasta public/ (index.html, estilo.css, player.js)
app.use(express.static('public'));

// ====================================================================
// PARTE 3: Rotas da API para Múltiplas Músicas (/api/musicas)
// ====================================================================

/**
 * 1. GET /api/musicas
 * Lista todas as músicas cadastradas em formato de resumo (sem sobrecarregar com as partes).
 * Status: 200 OK
 */
app.get('/api/musicas', (req, res) => {
    const musicas = musicaDAO.listarTodas();
    
    // Constrói lista de resumo com contagem de partes
    const resumo = [];
    for (let i = 0; i < musicas.length; i++) {
        const m = musicas[i];
        resumo.push({
            id: m.id,
            nome: m.nome,
            artista: m.artista,
            totalPartes: m.partes ? m.partes.length : 0
        });
    }
    
    res.status(200).json(resumo);
});

/**
 * Desafio Extra (Parte 7.7): Rota de Música Aleatória
 * GET /api/musicas/aleatoria
 * IMPORTANTE: Declarada ANTES de /api/musicas/:id para não colidir com o parâmetro :id.
 * Status: 200 OK ou 404 caso o catálogo esteja vazio.
 */
app.get('/api/musicas/aleatoria', (req, res) => {
    const musicaAleatoria = musicaDAO.obterAleatoria();
    if (!musicaAleatoria) {
        return res.status(404).json({ erro: 'Nenhuma música cadastrada no catálogo' });
    }
    res.status(200).json(musicaAleatoria);
});

/**
 * 2. GET /api/musicas/:id
 * Retorna os detalhes completos de uma música específica, incluindo todas as suas partes.
 * Status: 200 OK ou 404 Not Found
 */
app.get('/api/musicas/:id', (req, res) => {
    const id = Number(req.params.id);
    const musica = musicaDAO.buscarPorId(id);

    if (!musica) {
        return res.status(404).json({ erro: `Música com id ${id} não encontrada` });
    }

    res.status(200).json(musica);
});

/**
 * 3. POST /api/musicas
 * Cadastra uma nova música no catálogo a partir do nome e artista informados no corpo.
 * Status: 201 Created ou 400 Bad Request
 */
app.post('/api/musicas', (req, res) => {
    const { nome, artista } = req.body;

    // Validação de campos obrigatórios
    if (!nome || !artista) {
        return res.status(400).json({ erro: 'Campos obrigatórios: nome, artista' });
    }

    const novaMusica = musicaDAO.inserir(nome, artista);
    res.status(201).json(novaMusica);
});

/**
 * 4. PUT /api/musicas/:id
 * Atualiza o nome e o artista de uma música existente identificada pelo ID.
 * Status: 200 OK, 400 Bad Request (campos inválidos) ou 404 Not Found (id inexistente)
 */
app.put('/api/musicas/:id', (req, res) => {
    const id = Number(req.params.id);
    const { nome, artista } = req.body;

    // Validação dos dados recebidos no corpo
    if (!nome || !artista) {
        return res.status(400).json({ erro: 'Campos obrigatórios: nome, artista' });
    }

    // Verifica se a música existe antes de atualizar
    const musicaExistente = musicaDAO.buscarPorId(id);
    if (!musicaExistente) {
        return res.status(404).json({ erro: `Música com id ${id} não encontrada` });
    }

    const musicaAtualizada = musicaDAO.atualizar(id, nome, artista);
    res.status(200).json(musicaAtualizada);
});

/**
 * 5. DELETE /api/musicas/:id
 * Remove uma música do catálogo pelo seu ID.
 * Status: 200 OK ou 404 Not Found
 */
app.delete('/api/musicas/:id', (req, res) => {
    const id = Number(req.params.id);
    const musicaRemovida = musicaDAO.remover(id);

    if (!musicaRemovida) {
        return res.status(404).json({ erro: `Música com id ${id} não encontrada` });
    }

    res.status(200).json({
        mensagem: 'Música removida com sucesso',
        musica: musicaRemovida
    });
});

/**
 * 6. POST /api/musicas/:id/partes (Parte 3.5 do enunciado)
 * Adiciona uma nova parte (estrofe/verso com tempo e tag) a uma música existente.
 * Status: 201 Created, 400 Bad Request ou 404 Not Found
 */
app.post('/api/musicas/:id/partes', (req, res) => {
    const id = Number(req.params.id);
    const { letra, tempoEspera, tag } = req.body;

    // Validação de todos os campos obrigatórios da parte
    if (!letra || tempoEspera === undefined || tempoEspera === null || !tag) {
        return res.status(400).json({ erro: 'Campos obrigatórios para parte: letra, tempoEspera, tag' });
    }

    // Verifica se a música alvo existe no DAO
    const musica = musicaDAO.buscarPorId(id);
    if (!musica) {
        return res.status(404).json({ erro: `Música com id ${id} não encontrada` });
    }

    // Instancia a nova Parte e associa via DAO
    const novaParte = new Parte(letra, Number(tempoEspera), tag);
    const adicionou = musicaDAO.adicionarPartes(id, novaParte);

    if (adicionou) {
        // Retorna a música completa com a nova parte adicionada
        return res.status(201).json(musica);
    } else {
        return res.status(400).json({ erro: 'Não foi possível adicionar a parte à música' });
    }
});

// ====================================================================
// PARTE 1.3: Middleware de Tratamento Centralizado de Erros
// Deve ser o último middleware configurado com app.use()
// ====================================================================
app.use((err, req, res, next) => {
    console.error('Erro capturado no servidor:', err.message);

    // Diferencia erro 400 (corpo JSON mal-formado enviado pelo cliente) de erro 500 (erro interno)
    if (err.status === 400 || err instanceof SyntaxError) {
        return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
    }

    res.status(500).json({ erro: 'Erro interno do servidor' });
});

// ====================================================================
// Inicialização do Servidor HTTP
// ====================================================================
app.listen(PORT, () => {
    console.log(`Servidor de Karaokê rodando em http://localhost:${PORT}`);
});