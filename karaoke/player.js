//script principal

const { sleep } = require('./utils');
const { Musica } = require('./musica');
const { Parte } = require('./parte');

const musica = new Musica('My Hero', 'Foo Fighters');

const letra = {
    tooAlarmin: ['Too alarmin now to talk about \n Take your pictures down and shake it out', 4000],
    truthOrCon: ['Truth or consequence, say it aloud \n Use that evidence, race it around', 4000],
    thereGoes: ['There goes my hero', 5000],
    watchHim: ['Watch him as he goes', 4000],
    hesOrdinary: ['He\'s ordinary', 4000],
    dontTheBest: ['Don\'t the best of them bleed it out', 4000],
    whileTheRest: ['While the rest of them peter out?', 4000],
    kudos: ['Kudos, my hero \nLeavin all the best', 4000],
    youKnow: ['You know my hero \nThe one thats on', 4000],
    // completar o restante da letra
};

let count = 1;

for (const [texto, tempo] of Object.values(letra)) {
    musica.addParte(new Parte(texto, tempo, `verso${count}`));
    count++;
}

async function play() {
    try {
        // para cada parte da música, deve imprimir qual parte é, letra e pausar o tempo necessário
        //ex.:
        for (const parte of musica.partes) {
            //imprime parte e letra
            console.log( " -- " + parte.tag + " --" );
            console.log( "> " + parte.letra );
            //agurda o tempo para a letra
            await sleep( parte.tempoEspera );
        }
    } catch (error) {
        console.log("Erro ao tocar música: " + error.message);
    }
}

module.exports = {musica, play};
