// importacoes dos objetos locais
const { Parte } = require('./karaoke/parte');
const {musica, play} = require('./karaoke/player');

//acesso ao DAO
//Vai retornar instância única e não a Classe
const musicaDAO = require('./karaoke/DAO/MusicaDAO');

/* EXEMPLOS de uso do DAO

//consultar ef obter uma musica
musicaDAO.inserir('Sinais de Fogo', 'Preta Gil' );
const minhaMusica = musicaDAO.buscarPorId(0);
musicaDAO.adicionarPartes(0, new Parte('Quando você me vê...', 1100, 'parte1'));
musicaDAO.atualizar(0, 'Novo nome', 'novoArtista');
const novaMusica = musicaDAO.inserir( 'Billie Jean', 'Michael Jackson' );
musicaDAO.adicionarPartes( novaMusica.id, new Parte('Billie Jean is not my lover...',1500, 'estrofe1') );

const todas = musicaDAO.listarTodas();
todas.forEach(m => {
   console.log(JSON.stringify(m));
     
});

Ignorar trecho entre comentários */


// 1. Importar o Express
const express = require('express');
const MusicaDAO = require('./karaoke/DAO/MusicaDAO');

// 2. Criar a aplicação (a "loja")
const app = express();

// 3. Configurar middlewares (pré-processamento)
app.use(express.json());


// Serve os arquivos da pasta public/ (index.html, estilo.css, player.j
app.use(express.static('public'));

// 4. Definir rotas (os "balcões de atendimento")
app.get('/', (req, res) => {
    res.send('Servidor funcionando');
});

app.get('/teste', (req, res)=>{
    res.contentType('html');
    const html = "<html> <body> <b>Este é o meu site Express.js. </body> <html> "
    res.send(html);
});


/**
 * API da musica
 * GET /musica/:id -> retornar a musica inteira
 * GET /mussica/:id/nome
 * GET /musica:id/:parte -> retornar parte da musica
 * 
 */

// * GET /musica/:id -> retornar a musica inteira
app.get('/musica/:id', (req,res)=>{
    const id = req.params.id;
    if(id != 0){
        res.status(404);
        //res.statusCode = 404;
        res.send('Musica não encontrada.');
    }

    const musicaJSON = JSON.stringify(musica); //transformar objeto js em string json
    
    res.contentType('application/json');
    res.send(musicaJSON);
});

// * GET /musica:id/parte/:parte -> retornar parte da musica
app.get('/musica/:id/parte/:parte',(req,res) =>{
    const id = req.params.id;
    const parte = req.params.parte;
    
    if(id != 0){
        res.status(404);
        res.send('Musica não encontrada.');
    }

    const parteParaRetornar = musica.partes[parte];
    res.contentType('application/json');
    res.send(JSON.stringify(parteParaRetornar));

});

// GET /mussica/:id/nome
app.get('/musica/:id/titulo', (req,res)=>{
    const id = req.params.id;
    if(id != 0){
        res.status(404);
        res.send('Musica não encontrada.');
    }
   res.send({titulo: musica.nome });

});

app.get('/player/:id/play',(req,res)=>{
    play();
    res.send("Música reproduziu no servidor!");
});

/*pushs*/
app.post('/musica/:id/parte', (req, res)=>{
    console.log("entrou no push da parte.")

    try{
        let body= req.body;
        const parte = new Parte(body.letra, body.tempoEspera, body.tag);
        musica.addParte(parte);

        res.status(201).send(JSON.stringify(parte));

    }catch(error){
        console.log("ERROR: POST parte: "+ error.message);
        res.statusCode = 400; //status de erro no lado do cliente (msg)
        res.send({error:"Mensagem invalida ou incompleta."});     
    }
});

app.get("/musica/:id/play", async (req, res) =>{
    
    try{
        play();//assíncrono, sem controle de sincronia
        res.status(200).send({msg:`Musica ${musica.nome} está tocando!`});
    }catch(error){

    }
});



// 5. Abrir a loja (escutar a porta)
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});