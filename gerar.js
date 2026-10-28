// Gerador dos 200 plugins (node gerar.js). bv, aluguel, gratis, canal e antilink têm lógica própria e já existem.
const fs = require('fs');
const L = [];
const add = (cat, nomes, tipo, f) => nomes.split(' ').forEach(n => L.push([cat, n, tipo, f ? f(n) : n]));
const W = 'https://api.waifu.pics/sfw/';

add('ADM', 'aluguel bv', 'custom');
add('ADM', 'ban unban promover rebaixar link revogar fechar abrir', 'fn');
add('VENDAS', 'tabela pagamento vodacom movitel tmcel preco promocao internet ilimitado net venda comprar pix mpesa emola precos pacotes oferta stock entrega', 'cfg');

const D = { play: 'a', play2: 'v', ytmp3: 'a', ytmp4: 'v', ytsearch: 't', tiktok: 'v', insta: 'v', fb: 'v', twitter: 'v', threads: 'v', mediafire: 'd', gdrive: 'd', pinterest: 'i', apk: 'd', letra: 't', spotify: 'a', soundcloud: 'a', capcut: 'v', likee: 'v', video: 'v' };
add('DOWNLOAD', Object.keys(D).join(' '), 'dl', n => ({ p: n, k: D[n] }));

add('FIGURINHAS', 's f figu sticker stk take wm toimg togif attp attp2 ttp brat figu-ia', 'fn');
add('FIGURINHAS', 'emojimix', 'web', () => ({ q: 1, mix: 1, img: 1, p: 'results.0.media_formats.png_transparent.url', u: 'https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q={q}' }));

const LORE = {
  sasuke: ['Sasuke Uchiha — último herdeiro do clã.', 'Meu ódio é mais profundo que o seu.'],
  naruto: ['Naruto Uzumaki — o idiota que nunca desistiu.', 'O único rival que eu reconheço.'],
  itachi: ['Itachi Uchiha — meu irmão.', 'Carregou o ódio por mim. Entendi tarde demais.'],
  akatsuki: ['Nuvens vermelhas. Criminosos de rank S.', 'Fracos demais para me deter.'],
  sharingan: ['👁️ Sharingan — o olho que copia, prevê e domina.', 'Nenhuma ilusão me engana.'],
  chidori: ['⚡ Chidori — mil pássaros gritando.', 'Perfura tudo que é fraco.'],
  amaterasu: ['🔥 Amaterasu — chamas negras que nunca se apagam.', 'Queimam até o desprezo.'],
  susanoo: ['Susanoo — guerreiro de chakra roxo.', 'Defesa absoluta. Ataque inevitável.'],
  uchiha: ['Clã Uchiha — orgulho, poder e tragédia.', 'Restou pouco. Restou eu.'],
  konoha: ['Konoha — a vila escondida entre as folhas.', 'Apodrecida por dentro.'],
  hokage: ['Hokage — título de quem protege a vila.', 'Eu prefiro fazê-la tremer.'],
  shinobi: ['Shinobi — quem suporta a dor e segue em frente.', 'Quem chora, perde.'],
  kakashi: ['Kakashi Hatake — o ninja que copiou mil técnicas.', 'Meu antigo professor. Ainda o respeito.'],
  madara: ['Madara Uchiha — lenda do clã.', 'Quem busca poder sem ódio é fraco.'],
  orochimaru: ['🐍 Orochimaru — o sannin das serpentes.', 'Me ensinou poder. Eu o consumi.'],
  tsukuyomi: ['🌑 Tsukuyomi — ilusão onde eu controlo o tempo.', 'Três dias de tortura em um segundo.']
};
add('ANIME', Object.keys(LORE).join(' '), 'txt', n => LORE[n]);
add('ANIME', 'frase-sasuke', 'rnd', () => ['Vocês são fracos... me dão nojo.', 'Meu ódio é mais profundo que o seu.', 'Desapareça.', 'Poder é tudo. O resto é ruído.', 'Não me chame de amigo.']);
add('ANIME', 'waifu wallpaper-anime', 'web', () => ({ img: 1, p: 'url', u: W + 'waifu' }));
add('ANIME', 'neko', 'web', () => ({ img: 1, p: 'url', u: W + 'neko' }));

add('GRUPO', 'antilink', 'custom');
add('GRUPO', 'welcome', 'alias', () => 'bv');
add('GRUPO', 'marcar todos hidetag marcar2 info-grupo admins membros add kick nomegp descgp regras sorteio enquete apagar tagadm fotogp sairgp', 'fn');

const P = { gpt: '', ia: 'Responda como Sasuke Uchiha, frio e seco, em português: ', simi: 'Responda como um chatbot zoeiro: ', pergunte: '', gemini: '', resumir: 'Resuma em português: ', corrigir: 'Corrija o texto: ', 'traduzir-ia': 'Traduza para português: ', codigo: 'Escreva código para: ', poema: 'Escreva um poema sombrio sobre: ', 'conselho-ia': 'Dê um conselho sobre: ', 'piada-ia': 'Conte uma piada sobre: ', 'charada-ia': 'Crie uma charada sobre: ' };
add('IA', Object.keys(P).join(' '), 'ia', n => P[n]);
add('IA', 'dalle imagine', 'ia', () => ({ img: 1 }));

add('JOGOS', 'ppt dado roleta quiz forca rpg level moeda slot adivinha parimpar sorte rank daily perfil', 'fn');

const W18 = '⚠️ +18 — só maiores de idade.\n';
const R18 = {
  verdade18: ['Qual foi o seu melhor beijo?', 'Já ficou com alguém do grupo?', 'Quem é o seu maior crush?'],
  desafio18: ['Mande um áudio sussurrando.', 'Conte o seu último date.', 'Escolha alguém e faça um elogio.'],
  cantada: ['Você tem fogo? Meu Amaterasu acendeu...', 'Seu olhar hipnotiza mais que o meu Sharingan.', 'Seu nome é Wi-Fi? Senti conexão.'],
  beijo: ['Um beijo na testa. Não espere mais de mim.', 'Beijo roubado 😘 Não conte a ninguém.'],
  namoro: ['Combinam. Mas não me envolvam.', 'Duram uma semana.', 'Casal do ano 💘']
};
add('+18', Object.keys(R18).join(' '), 'rnd', n => R18[n].map(x => W18 + x));
const PCT = { hot: 'de calor 🔥', casal: 'de química 💘', ship: 'de compatibilidade 💘', crush: 'de chance com o crush 💘', ciumes: 'de ciúmes 🐍' };
add('+18', Object.keys(PCT).join(' '), 'pct', n => PCT[n] + '\n⚠️ +18');

const RD = {
  piada: ['Por que o Sasuke não faz amigos? Só aceita rivais.', 'Chidori fraco é como piada ruim: não perfura ninguém.', 'Qual o ninja mais educado? O que pede licença antes de sumir.'],
  charada: ['O que é, o que é? Cai em pé e corre deitado. (Chuva)', 'O que é, o que é? Quanto mais se tira, maior fica. (Buraco)', 'O que é, o que é? Tem dentes mas não morde. (Pente)'],
  fato: ['O polvo tem três corações.', 'O mel nunca estraga.', 'Formigas não dormem.'],
  frase: ['A dor te ensina.', 'Quem não suporta a solidão não suporta o poder.', 'Fraqueza é escolha.'],
  conselho: ['Durma cedo.', 'Pague suas dívidas.', 'Treine mesmo sem vontade.'],
  curiosidade: ['O coração do camarão fica na cabeça.', 'Os polvos têm sangue azul.', 'Bananas são levemente radioativas.'],
  desafio: ['Fique 10 min sem celular.', 'Mande um áudio cantando.', 'Elogie o último que falou.'],
  verdade: ['Qual é o seu maior medo?', 'Quem você ignorou hoje?', 'Já mentiu para o grupo?'],
  bola8: ['Sim.', 'Não.', 'Talvez... não me importa.', 'Desapareça e pergunte de novo.'],
  signo: ['Hoje terá sorte... não abuse.', 'Evite discussões hoje.', 'Alguém vai te surpreender.'],
  motivacao: ['Levante. Treine. Repita.', 'A dor passa, o resultado fica.', 'Ninguém fará por você.'],
  trocadilho: ['Esse bot não é fraco, é só... Uchi-ha.', 'Sou ninja: me pego sempre no Naru-todo.', 'Choveu? Vá de Chidori-chuva.'],
  'sorte-hoje': ['Sorte: 20%.', 'Sorte: 70%.', 'Sorte: 99%. Aproveite.']
};
add('DIVERSAO', Object.keys(RD).join(' '), 'rnd', n => RD[n]);
add('DIVERSAO', 'par', 'fn');
add('DIVERSAO', 'tapa', 'acao', () => 'deu um tapa em');
add('DIVERSAO', 'abraco', 'acao', () => 'abraçou');
add('DIVERSAO', 'chute', 'acao', () => 'chutou');
add('DIVERSAO', 'inteligente', 'pct', () => 'de inteligência 🧠');
add('DIVERSAO', 'beleza', 'pct', () => 'de beleza ✨');
add('DIVERSAO', 'meme', 'web', () => ({ img: 1, p: 'url', u: 'https://meme-api.com/gimme' }));

add('UTILIDADES', 'calc horario ping uptime id base64 decode64 maiuscula minuscula contar senha lembrete dolar euro', 'fn');
add('UTILIDADES', 'cep', 'web', () => ({ q: 1, u: 'https://viacep.com.br/ws/{q}/json/', tpl: '{logradouro}, {bairro}\n{localidade}/{uf} — CEP {cep}' }));
add('UTILIDADES', 'clima', 'web', () => ({ q: 1, u: 'https://wttr.in/{q}?format=3&lang=pt' }));
add('UTILIDADES', 'traduzir', 'web', () => ({ q: 1, p: 'responseData.translatedText', u: 'https://api.mymemory.translated.net/get?q={q}&langpair=Autodetect|pt' }));
add('UTILIDADES', 'qrcode', 'web', () => ({ q: 1, dir: 1, u: 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data={q}' }));
add('UTILIDADES', 'encurtar', 'web', () => ({ q: 1, u: 'https://is.gd/create.php?format=simple&url={q}' }));
add('UTILIDADES', 'wiki', 'web', () => ({ q: 1, p: 'extract', u: 'https://pt.wikipedia.org/api/rest_v1/page/summary/{q}' }));

add('DONO', 'canal gratis', 'custom');
add('DONO', 'anuncio broadcast desligar ligar reiniciar update block unblock entrar listgp setnome setbio dono', 'fn');

// Validação e escrita dos arquivos
const nomes = L.map(x => x[1]);
if (new Set(nomes).size !== nomes.length) throw new Error('nomes duplicados');
fs.mkdirSync('plugins', { recursive: true });
for (const [cat, n, tipo, arg] of L) {
  if (tipo === 'custom') { if (!fs.existsSync(`plugins/${n}.js`)) throw new Error('falta plugin ' + n); continue; }
  fs.writeFileSync(`plugins/${n}.js`, `// 🩸 Plugin .${n} — ${cat}\nconst { executar } = require('../lib/tipos');\nmodule.exports = {\n  cmd: ['${n}'], cat: '${cat}',\n  run: c => executar('${tipo}', ${JSON.stringify(arg)}, c)\n};\n`);
}
console.log('Comandos:', L.length, '| Arquivos em plugins/:', fs.readdirSync('plugins').length);