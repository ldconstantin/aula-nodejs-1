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

        // --- Música 0: My Hero (Foo Fighters) ---
        const myHero = this.inserir('My Hero', 'Foo Fighters');
        myHero.addParte(new Parte('Too alarmin now to talk about \n Take your pictures down and shake it out', 4000, 'verso1'));
        myHero.addParte(new Parte('Truth or consequence, say it aloud \n Use that evidence, race it around', 4000, 'verso2'));
        myHero.addParte(new Parte('There goes my hero', 5000, 'refrão1'));
        myHero.addParte(new Parte('Watch him as he goes', 3000, 'refrão2'));
        myHero.addParte(new Parte("He's ordinary", 3000, 'refrão3'));
        myHero.addParte(new Parte("Don't the best of them bleed it out", 4000, 'verso3'));
        myHero.addParte(new Parte('While the rest of them peter out?', 4000, 'verso4'));
        myHero.addParte(new Parte('Kudos, my hero \nLeavin all the best', 4000, 'verso5'));
        myHero.addParte(new Parte('You know my hero \nThe one thats on', 4000, 'verso6'));

        // --- Música 1: Parabéns pra Você (Domínio Público / Folclore Brasileiro) ---
        const parabens = this.inserir('Parabéns pra Você', 'Domínio Público');
        parabens.addParte(new Parte('Parabéns pra você \nNesta data querida', 3000, 'verso1'));
        parabens.addParte(new Parte('Muitas felicidades \nMuitos anos de vida', 3000, 'verso2'));
        parabens.addParte(new Parte('É pique, é pique, é pique, é pique, é pique!', 2000, 'grito1'));
        parabens.addParte(new Parte('É hora, é hora, é hora, é hora, é hora!', 2000, 'grito2'));
        parabens.addParte(new Parte('Rá-tim-bum! 🎂', 2000, 'final'));

        // --- Música 2: Asa Branca (Luiz Gonzaga - Domínio Público) ---
        const asaBranca = this.inserir('Asa Branca', 'Luiz Gonzaga');
        asaBranca.addParte(new Parte('Quando olhei a terra ardendo \nQual fogueira de São João', 4000, 'verso1'));
        asaBranca.addParte(new Parte('Eu perguntei a Deus do céu, ai \nPor que tamanha judiação', 4000, 'verso2'));
        asaBranca.addParte(new Parte('Que braseiro, que fornalha \nNenhum pé de plantação', 4000, 'verso3'));
        asaBranca.addParte(new Parte('Por falta de água perdi meu gado \nMorreu de sede meu alazão', 4000, 'verso4'));
        asaBranca.addParte(new Parte('Até mesmo a asa branca \nBateu asas do sertão', 4000, 'refrão1'));
        asaBranca.addParte(new Parte('Então eu disse: adeus Rosinha \nGuarda contigo meu coração', 4000, 'refrão2'));

        // --- Música 3: Cai, Cai, Balão (Cantiga Popular Brasileira) ---
        const caiBalao = this.inserir('Cai, Cai, Balão', 'Cantiga Popular');
        caiBalao.addParte(new Parte('Cai, cai, balão \nCai, cai, balão', 3000, 'refrão1'));
        caiBalao.addParte(new Parte('Aqui na minha mão \nNão vou lá, não vou lá, não vou lá', 3000, 'verso1'));
        caiBalao.addParte(new Parte('Tenho medo de apanhar \nCai, cai, balão', 3000, 'verso2'));
        caiBalao.addParte(new Parte('Cai, cai, balão \nAqui na minha mão', 3000, 'refrão2'));

        // --- Música 4: Ciranda, Cirandinha (Cantiga de Roda - Domínio Público) ---
        const ciranda = this.inserir('Ciranda, Cirandinha', 'Cantiga de Roda');
        ciranda.addParte(new Parte('Ciranda, cirandinha \nVamos todos cirandar', 3000, 'verso1'));
        ciranda.addParte(new Parte('Vamos dar a meia-volta \nVolta e meia vamos dar', 3000, 'verso2'));
        ciranda.addParte(new Parte('O anel que tu me deste \nEra vidro e se quebrou', 3000, 'verso3'));
        ciranda.addParte(new Parte('O amor que tu me tinhas \nEra pouco e se acabou', 3000, 'verso4'));
        ciranda.addParte(new Parte('Por isso, dona Rosa \nEntre dentro desta roda', 3000, 'verso5'));
        ciranda.addParte(new Parte('Diga um verso bem bonito \nDiga adeus e vá-se embora', 3000, 'final'));
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