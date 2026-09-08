// karaoke/DAO/MusicaDAO.js
// Camada de Acesso a Dados (Data Access Object - DAO)
// Responsável por isolar a persistência e manipulação dos dados de músicas da camada de rotas.

const { Musica } = require('../musica');
const { Parte } = require('../parte');

class MusicaDAO {
    constructor() {
        // "Banco de dados" em memória — array de objetos Musica
        this.musicas = [];
        this.proximoId = 0;

        // Etapa 2.4 do enunciado: Carga inicial de dados
        this._carregarDadosIniciais();
    }

    /**
     * Carrega os dados iniciais do sistema com 5 músicas de domínio público/folclore popular.
     * A primeira música (My Hero, id 0) mantém compatibilidade com os testes HTTP.
     */
    _carregarDadosIniciais() {
        const path = require('path');
        const fs = require('fs');

        const pasta = path.join(__dirname, '../../songs');

        const arquivos = fs.readdirSync(pasta);

        for (const arquivo of arquivos) {
            if (!arquivo.endsWith('.json')) {
                continue;
            }

            const caminho = path.join(pasta, arquivo);
            const dados = JSON.parse(fs.readFileSync(caminho, 'utf8'));

            const musica = this.inserir(dados.titulo, dados.artista);
            for (const parte of dados.partes) {
                musica.addParte(new Parte(parte.texto, parte.tempo, parte.tipo));
            }
        }
    }

    // Retorna todas as músicas
    listarTodas() {
        return this.musicas;
    }

    // Busca uma música pelo ID
    buscarPorId(id) {
        // O método .find() percorre o array e retorna o primeiro item que satisfaz a condição.
        // Se nenhum item for encontrado, retorna undefined; por isso usamos || null.
        for (var i = 0; i < this.musicas.length; i++) {
            if (this.musicas[i].id === id) {
                return this.musicas[i];
            }
        }
        return null;
    }

    // Insere uma nova música e retorna o objeto criado (com ID sequencial)
    inserir(nome, artista) {
        const novaMusica = new Musica(nome, artista);
        novaMusica.id = this.proximoId++;
        this.musicas.push(novaMusica);
        return novaMusica;
    }

    // Adiciona uma Parte a uma música existente
    adicionarPartes(idMusica, parte) {
        if (parte instanceof Parte) {
            const musica = this.buscarPorId(idMusica);
            if (musica != null) {
                musica.addParte(parte);
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    // Atualiza nome e artista de uma música existente
    atualizar(id, nome, artista) {
        const musica = this.buscarPorId(id);
        if (!musica) return null;

        musica.nome = nome;
        musica.artista = artista;
        return musica;
    }

    // Remove uma música pelo ID
    remover(id) {
        // Percorre o array procurando a posição (índice) da música com o id informado
        var indice = -1;
        for (var i = 0; i < this.musicas.length; i++) {
            if (this.musicas[i].id === id) {
                indice = i;
                break; // encontrou, pode parar o laço
            }
        }

        // Se não encontrou nenhuma música com esse id, retorna null
        if (indice === -1) return null;

        // O método .splice(posição, quantidade) remove "quantidade" elementos
        // a partir da "posição" indicada, e retorna um array com os removidos.
        // Usamos [0] para pegar o primeiro (e único) elemento removido.
        return this.musicas.splice(indice, 1)[0];
    }

    // Desafio Extra 7.7: Obter uma música aleatória
    obterAleatoria() {
        if (this.musicas.length === 0) return null;

        // Math.random() gera um número decimal entre 0 e 1.
        // Multiplicamos pelo tamanho do array para obter um índice válido.
        // Math.floor() arredonda para baixo (ex: 2.7 vira 2).
        var indiceAleatorio = Math.floor(Math.random() * this.musicas.length);
        return this.musicas[indiceAleatorio];
    }
}

// Exporta uma INSTÂNCIA única (Padrão Singleton)
module.exports = new MusicaDAO();
