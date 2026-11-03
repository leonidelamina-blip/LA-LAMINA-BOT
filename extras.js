'use strict';
/*
  SASUKE V20 - EXTRAS
  Comandos adicionais (compras/megas, ferramentas, moderação, automações...)
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
let sharp = null;
try {
  sharp = require('sharp');
} catch {}

module.exports = function (L) {
  const {
    config, P, moldura, bloco, jidNum, fmtData, fmtDur, getCtx, unwrap,
    exigirGrupo, exigirAdmin, alvo, statusGrupo, DIA, downloadContentFromMessage,
    ehDonoJid, ehDonoNum, idsDe, idsDoBot, db, sessions,
  } = L;

  const TZ = 'Africa/Maputo';
  const OFFSET = '+02:00';
  const jidDe = (n) => n + '@s.whatsapp.net';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ───────────────────────── BANCO DE DADOS ─────────────────────────
  const DATA_DIR = path.join(__dirname, 'dados');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  function store(nome, padrao) {
    const file = path.join(DATA_DIR, nome + '.json');
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      data = JSON.parse(JSON.stringify(padrao));
    }
    for (const k of Object.keys(padrao)) if (data[k] === undefined) data[k] = padrao[k];
    let t = null;
    const salvar = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        try {
          fs.writeFileSync(file, JSON.stringify(data, null, 2));
        } catch (e) {
          console.error('Erro ao salvar', nome, e.message);
        }
      }, 500);
    };
    return { data, salvar };
  }
  const G = store('grupos', {});
  const V = store('vendas', { pacotes: [], pedidos: [], recibos: {}, saldo: {}, telefones: [], depositos: [], seq: 0 });
  const A = store('atividade', {});
  const REG = store('registrados', {});
  const PICOS = store('picos', { itens: [] });
  const REST = store('restanas', {});
  const TOK = store('tokens', { token: '', criado_em: 0, dono: '', backups: [] });
  const UPLOAD_DIR = path.join(__dirname, 'uploads');
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const cfg = (jid) => {
    const g = (G.data[jid] ||= {});
    g.mutados ||= [];
    g.autoresp ||= {};
    g.nano ||= {};
    g.alarmes ||= [];
    g.agendas ||= [];
    g.seq ||= 0;
    return g;
  };

  // ───────────────────────── UTILIDADES ─────────────────────────
  const enviar = (sock, jid, linhas, titulo, extra = {}) =>
    sock.sendMessage(jid, { text: moldura(linhas, titulo), ...extra });
  const apagar = (sock, msg) => sock.sendMessage(msg.key.remoteJid, { delete: msg.key }).catch(() => {});

  const metaCache = new Map();
  async function getMeta(sock, jid) {
    const c = metaCache.get(jid);
    if (c && Date.now() - c.t < 30000) return c.m;
    const m = await sock.groupMetadata(jid);
    metaCache.set(jid, { t: Date.now(), m });
    return m;
  }
  const ehAdminIds = (meta, ids) => meta.participants.some((p) => p.admin && idsDe(p).some((x) => ids.includes(x)));
  const souBot = (p, sock) => idsDe(p).some((x) => idsDoBot(sock).includes(x));

  async function admin(c) {
    if (c.owner) return true;
    if (!c.isGroup) {
      await c.send(['Apenas o dono ou administradores.'], 'SEM PERMISSÃO');
      return false;
    }
    return !!(await exigirAdmin(c));
  }

  async function alternar(c, chave, rotulo, extra) {
    const meta = await exigirAdmin(c);
    if (!meta) return null;
    const g = cfg(c.from);
    const a = (c.args[0] || '').toLowerCase();
    if (['on', 'ligar', 'ativar', '1', 'sim'].includes(a)) g[chave] = true;
    else if (['off', 'desligar', 'desativar', '0', 'nao', 'não'].includes(a)) g[chave] = false;
    else g[chave] = !g[chave];
    G.salvar();
    await c.send([`${rotulo}: ${g[chave] ? 'ATIVADO' : 'DESATIVADO'}`, ...(extra || [])], rotulo);
    return g;
  }

  const hhmm = (s) => {
    const m = String(s || '').match(/^([01]?\d|2[0-3])[:h]([0-5]\d)$/);
    return m ? m[1].padStart(2, '0') + ':' + m[2] : null;
  };

  async function baixar(media, tipo) {
    const stream = await downloadContentFromMessage(media, tipo);
    const chunks = [];
    for await (const ch of stream) chunks.push(ch);
    return Buffer.concat(chunks);
  }
  async function obterImagem(c) {
    const m = unwrap(c.msg.message);
    const ctx = getCtx(m);
    const fonte = m?.imageMessage ? m : ctx?.quotedMessage ? unwrap(ctx.quotedMessage) : null;
    if (!fonte?.imageMessage) return null;
    return baixar(fonte.imageMessage, 'image');
  }
  const textoCitado = (c) => {
    const q = getCtx(unwrap(c.msg.message))?.quotedMessage;
    if (!q) return '';
    const u = unwrap(q);
    return u?.conversation || u?.extendedTextMessage?.text || u?.imageMessage?.caption || u?.videoMessage?.caption || '';
  };

  // ───────────────────────── COMPRAS / RECIBOS ─────────────────────────
  function parseRecibo(txt) {
    const t = String(txt || '');
    const ref =
      (t.match(/Confirmado\s+([A-Z0-9]{6,14})/i) ||
        t.match(/\b((?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{8,12})\b/) ||
        [])[1] || null;
    const mv = t.match(/(\d[\d\s]*(?:[.,]\d{1,2})?)\s*(?:MT|MZN|Mts?)\b/i);
    const valor = mv ? parseFloat(mv[1].replace(/\s/g, '').replace(',', '.')) : null;
    return { ref: ref ? ref.toUpperCase() : null, valor: Number.isFinite(valor) ? valor : null };
  }
  const normPacote = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
  const rotuloEstado = { aguardando: 'aguardando pagamento', analise: 'em análise', pago: 'pago', entregue: 'entregue', anulada: 'anulada' };

  async function comprovativo(sock, from, sender, texto, resp) {
    const num = jidNum(sender);
    const r = parseRecibo(texto);
    if (!r.ref || !r.valor)
      return resp(['Não consegui ler o comprovativo.', 'Cole o SMS completo do M-Pesa.'], 'COMPROVATIVO');
    if (V.data.recibos[r.ref])
      return resp(['Este comprovativo já foi usado.', 'Referência: ' + r.ref], 'COMPROVATIVO RECUSADO');
    const pedido = [...V.data.pedidos].reverse().find((p) => p.user === num && p.estado === 'aguardando');
    if (!pedido) return resp(['Nenhuma compra aguardando pagamento.', `Use ${P}compra <pacote> primeiro.`], 'COMPROVATIVO');
    if (r.valor + 0.001 < pedido.preco)
      return resp([`Valor insuficiente: ${r.valor}MT.`, `O pacote custa ${pedido.preco}MT.`], 'COMPROVATIVO RECUSADO');
    pedido.prova = { ref: r.ref, valor: r.valor, texto: String(texto).slice(0, 600), em: Date.now() };
    V.data.recibos[r.ref] = pedido.id;
    const auto = !!(G.data[pedido.jid] || {}).vendaAuto;
    pedido.estado = auto ? 'pago' : 'analise';
    V.salvar();
    await resp(
      [`Compra #${pedido.id}: ${pedido.pacote}`, `Referência: ${r.ref}`, `Valor: ${r.valor}MT`, auto ? 'Pagamento confirmado. Aguarde a entrega.' : 'Comprovativo enviado para análise.'],
      'COMPROVATIVO RECEBIDO'
    );
    await sock
      .sendMessage(jidDe(config.numeroDono), {
        text: moldura(
          [`Compra #${pedido.id} (${rotuloEstado[pedido.estado]})`, `Cliente: @${pedido.user}`, `Pacote: ${pedido.pacote} - ${pedido.preco}MT`, `Número a receber: ${pedido.numero}`, `Ref: ${r.ref} / ${r.valor}MT`, `Aprovar: ${P}compras ok ${pedido.id}`],
          'NOVA COMPRA'
        ),
        mentions: [jidDe(pedido.user)],
      })
      .catch(() => {});
  }

  // ───────────────────────── FANTASMAS ─────────────────────────
  async function listarFantasmas(sock, jid, dias) {
    const meta = await sock.groupMetadata(jid);
    const at = A.data[jid] || {};
    const desde = at.__desde || Date.now();
    if (Date.now() - desde < dias * DIA)
      return { cedo: Math.ceil((dias * DIA - (Date.now() - desde)) / DIA) };
    const limite = Date.now() - dias * DIA;
    const alvos = meta.participants.filter((p) => {
      const ids = idsDe(p);
      const ult = Math.max(0, ...ids.map((x) => at[x] || 0));
      return !p.admin && !souBot(p, sock) && !ids.some((x) => ehDonoNum(x)) && !(ult > limite);
    });
    return { alvos };
  }
  async function removerLote(sock, jid, alvos) {
    let ok = 0;
    for (let i = 0; i < alvos.length; i += 5) {
      try {
        await sock.groupParticipantsUpdate(jid, alvos.slice(i, i + 5).map((p) => p.id), 'remove');
        ok += Math.min(5, alvos.length - i);
      } catch {}
      await sleep(1500);
    }
    return ok;
  }

  // ───────────────────────── HOOKS (mensagens e eventos) ─────────────────────────
  const LINK = /(https?:\/\/|www\.|chat\.whatsapp\.com\/|wa\.me\/)/i;
  const flood = new Map();

  async function antes(sock, msg, i) {
    const { from, sender, senderNum, num, owner, body, m } = i;
    if (!statusGrupo(from)) return false;
    const at = (A.data[from] ||= {});
    at.__desde ||= Date.now();
    at[senderNum] = Date.now();
    A.salvar();
    const g = cfg(from);

    let _adm;
    const ehAdm = async () => {
      if (_adm !== undefined) return _adm;
      if (owner) return (_adm = true);
      try {
        _adm = ehAdminIds(await getMeta(sock, from), [senderNum, num]);
      } catch {
        _adm = false;
      }
      return _adm;
    };

    if (!owner) {
      if (g.mutados.includes(senderNum) || g.mutados.includes(num)) {
        await apagar(sock, msg);
        return true;
      }
      if (g.soadm && body.startsWith(P) && !(await ehAdm())) return true;
      if (g.antilink && LINK.test(body) && !(await ehAdm())) {
        await apagar(sock, msg);
        await enviar(sock, from, [`@${senderNum} links são proibidos aqui.`], 'ANTI-LINK', { mentions: [jidDe(senderNum)] });
        return true;
      }
      if (g.antifoto && m.imageMessage && !(await ehAdm())) {
        await apagar(sock, msg);
        return true;
      }
      if (g.anticonc?.on && g.anticonc.palavras?.length && body) {
        const low = body.toLowerCase();
        if (g.anticonc.palavras.some((p) => low.includes(p)) && !(await ehAdm())) {
          await apagar(sock, msg);
          await enviar(sock, from, [`@${senderNum} mensagem removida.`, 'Propaganda não é permitida.'], 'ANTI-CONCORRÊNCIA', { mentions: [jidDe(senderNum)] });
          return true;
        }
      }
      if (g.antispam) {
        const k = from + senderNum;
        const arr = (flood.get(k) || []).filter((t) => Date.now() - t < 8000);
        arr.push(Date.now());
        flood.set(k, arr);
        if (arr.length > 6 && !(await ehAdm())) {
          await apagar(sock, msg);
          if (arr.length === 7)
            await enviar(sock, from, [`@${senderNum} pare de floodar.`], 'ANTI-SPAM', { mentions: [jidDe(senderNum)] });
          return true;
        }
      }
    }

    if (!body.startsWith(P) && body) {
      if (g.autocomp && /Confirmado/i.test(body)) {
        await comprovativo(sock, from, sender, body, (l, t, e) => enviar(sock, from, l, t, e));
        return false;
      }
      const low = body.toLowerCase();
      for (const [k, v] of Object.entries(g.autoresp)) {
        if (low.includes(k)) {
          await enviar(sock, from, [v], 'RESPOSTA');
          break;
        }
      }
    }
    return false;
  }

  async function participantes(sock, u) {
    const jid = u.id;
    metaCache.delete(jid);
    if (!statusGrupo(jid)) return;
    const g = cfg(jid);
    let nomeGrupo = '';
    for (const p of u.participants || []) {
      const pj = typeof p === 'string' ? p : p.id;
      const num = jidNum(pj);
      if (u.action === 'add') {
        if (g.antiestr && !pj.endsWith('@lid') && !g.antiestr.paises.some((cc) => num.startsWith(cc))) {
          await sock.groupParticipantsUpdate(jid, [pj], 'remove').catch(() => {});
          continue;
        }
        if (g.bemvindo?.on) {
          if (!nomeGrupo) nomeGrupo = await getMeta(sock, jid).then((m) => m.subject).catch(() => 'grupo');
          const t = (g.bemvindo.texto || 'Bem-vindo @user ao grupo {grupo}.').replace(/@user/gi, '@' + num).replace(/\{grupo\}/gi, nomeGrupo);
          await enviar(sock, jid, [t], 'BEM-VINDO', { mentions: [pj] });
        }
      } else if (u.action === 'remove' && g.saida?.on) {
        const t = (g.saida.texto || '@user saiu do grupo.').replace(/@user/gi, '@' + num);
        await enviar(sock, jid, [t], 'ADEUS', { mentions: [pj] });
      }
    }
  }

  function personalizado(jid, cmd) {
    if (!statusGrupo(jid)) return null;
    return cfg(jid).nano[cmd] || null;
  }

  function iniciarTimers(getSock) {
    setInterval(async () => {
      const sock = getSock();
      if (!sock?.user) return;
      const agora = new Date();
      const hm = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(agora);
      const dia = agora.toLocaleDateString('en-CA', { timeZone: TZ });
      for (const jid of Object.keys(G.data)) {
        if (!jid.endsWith('@g.us') || !statusGrupo(jid)) continue;
        const g = G.data[jid];
        try {
          const vencidas = (g.agendas || []).filter((a) => a.ts <= Date.now());
          if (vencidas.length) {
            g.agendas = g.agendas.filter((a) => a.ts > Date.now());
            G.salvar();
            for (const ag of vencidas) await enviar(sock, jid, [ag.texto], 'AGENDADO');
          }
          for (const a of g.alarmes || []) {
            if (a.hora === hm && a.ultimo !== dia) {
              a.ultimo = dia;
              G.salvar();
              const meta = await sock.groupMetadata(jid);
              await enviar(sock, jid, [a.texto], 'ALARME', { mentions: meta.participants.map((p) => p.id) });
            }
          }
          const af = g.autofechar;
          if (af?.on) {
            if (af.fechar === hm && af.ultF !== dia) {
              af.ultF = dia;
              G.salvar();
              await sock.groupSettingUpdate(jid, 'announcement');
              await enviar(sock, jid, ['Grupo fechado automaticamente.', 'Abre às ' + af.abrir], 'AUTO-FECHAR');
            }
            if (af.abrir === hm && af.ultA !== dia) {
              af.ultA = dia;
              G.salvar();
              await sock.groupSettingUpdate(jid, 'not_announcement');
              await enviar(sock, jid, ['Grupo aberto automaticamente.'], 'AUTO-ABRIR');
            }
          }
          if (g.autorem && hm === '04:00' && g.ultRem !== dia) {
            g.ultRem = dia;
            G.salvar();
            const r = await listarFantasmas(sock, jid, g.periodo || 5);
            if (r.alvos?.length) {
              const ok = await removerLote(sock, jid, r.alvos);
              await enviar(sock, jid, [`Removidos ${ok} membro(s) inativos.`], 'AUTO-REMOVER');
            }
          }
        } catch (e) {
          console.error('timer', jid, e.message);
        }
      }
    }, 30000);
  }

  // ───────────────────────── COMANDOS ─────────────────────────
  const C = {};

  // ── Ajuda e informações ──
  C.ola = async (c) => c.send([`Olá @${c.senderNum}.`, 'O Sasuke observa.'], 'OLÁ', { mentions: [jidDe(c.senderNum)] });
  C.info = async (c) =>
    c.send([`Bot: Sasuke ${config.versao}`, `Dono: ${config.nomeDono} - wa.me/${config.numeroDono}`, `Prefixo: ${P}`, `Online há: ${fmtDur(process.uptime() * 1000)}`, `Use ${P}menu para ver tudo.`], 'INFORMAÇÕES');
  C.ajuda = async (c) =>
    c.send([`${P}menu - lista de comandos`, `${P}megas - pacotes e preços`, `${P}compra <pacote> - comprar`, `${P}comprovativo - enviar pagamento`, `Dono: wa.me/${config.numeroDono}`], 'AJUDA');
  C.adm = async (c) => {
    if (!(await exigirGrupo(c))) return;
    const meta = await c.sock.groupMetadata(c.from);
    const adms = meta.participants.filter((p) => p.admin);
    await c.send([c.args.join(' ') || 'Chamando os administradores:', ...adms.map((p) => '@' + jidNum(p.id))], 'ADMINISTRADORES', { mentions: adms.map((p) => p.id) });
  };
  C.uptime = async (c) => c.send([`Online há: ${fmtDur(process.uptime() * 1000)}`], 'UPTIME');

  // ── Pesquisa e ferramentas ──
  C.cep = async (c) => {
    const cep = (c.args[0] || '').replace(/\D/g, '');
    if (cep.length !== 8) return c.send([`Use: ${P}cep 01001000`], 'CEP');
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(8000) });
      const d = await r.json();
      if (d.erro) return c.send(['CEP não encontrado.'], 'CEP');
      await c.send([`CEP: ${d.cep}`, `Rua: ${d.logradouro || '-'}`, `Bairro: ${d.bairro || '-'}`, `Cidade: ${d.localidade}/${d.uf}`], 'CEP');
    } catch {
      await c.send(['Falha ao consultar o CEP.'], 'ERRO');
    }
  };
  C.chave = async (c) => {
    const n = Math.min(Math.max(parseInt(c.args[0], 10) || 16, 6), 64);
    const cs = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let s = '';
    for (const b of crypto.randomBytes(n)) s += cs[b % cs.length];
    await c.sock.sendMessage(c.from, { text: moldura([`Chave de ${n} caracteres:`], 'CHAVE') + '\n\n' + s }, { quoted: c.msg });
  };
  C.extrair = async (c) => {
    const t = c.args.join(' ') || textoCitado(c);
    if (!t) return c.send(['Responda a uma mensagem ou escreva o texto.'], 'EXTRAIR');
    const links = t.match(/https?:\/\/\S+/g) || [];
    const nums = t.match(/\+?\d[\d\s-]{6,}\d/g) || [];
    const mails = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
    await c.send([`Links: ${links.join(' ') || '-'}`, `Números: ${nums.join(' | ') || '-'}`, `E-mails: ${mails.join(' ') || '-'}`], 'EXTRAIR');
  };
  C.google = async (c) => {
    const q = c.args.join(' ');
    if (!q) return c.send([`Use: ${P}google <pesquisa>`], 'PESQUISA');
    await c.send(['https://www.google.com/search?q=' + encodeURIComponent(q)], 'PESQUISA');
  };
  C.gerarlink = async (c) => {
    const n = (c.args[0] || '').replace(/\D/g, '');
    if (n.length < 9) return c.send([`Use: ${P}gerar-link 258XXXXXXXXX [mensagem]`], 'LINK');
    const t = c.args.slice(1).join(' ');
    await c.send(['https://wa.me/' + n + (t ? '?text=' + encodeURIComponent(t) : '')], 'LINK WHATSAPP');
  };
  C.lid = async (c) => {
    const ctx = getCtx(unwrap(c.msg.message));
    const l = [`Seu ID: ${c.sender}`, `Número real: ${c.num}`, `Dono: ${c.owner ? 'sim' : 'não'}`, `Chat: ${c.from}`];
    if (ctx?.participant) l.push(`Citado: ${ctx.participant}`);
    await c.send(l, 'ID / LID');
  };
  C.raw = async (c) => {
    const ctx = getCtx(unwrap(c.msg.message));
    const obj = ctx?.quotedMessage ? { participant: ctx.participant, stanzaId: ctx.stanzaId, quoted: ctx.quotedMessage } : c.msg;
    const j = JSON.stringify(obj, (k, v) => ((v && v.type === 'Buffer') || (typeof v === 'string' && v.length > 200) ? '[...]' : v), 2) || '';
    await c.sock.sendMessage(c.from, { text: '```' + j.slice(0, 3500) + '```' }, { quoted: c.msg });
  };
  C.verificar = async (c) => {
    const n = (c.args[0] || '').replace(/\D/g, '');
    if (n.length < 9) return c.send([`Use: ${P}verificar 258XXXXXXXXX`], 'VERIFICAR');
    try {
      const r = await c.sock.onWhatsApp(jidDe(n));
      await c.send([`Número: ${n}`, r?.[0]?.exists ? 'Tem WhatsApp.' : 'Não tem WhatsApp.'], 'VERIFICAR');
    } catch {
      await c.send(['Falha na verificação.'], 'ERRO');
    }
  };
  C.tempo = async (c) => {
    const cidade = c.args.join(' ') || 'Maputo';
    try {
      const r = await fetch('https://wttr.in/' + encodeURIComponent(cidade) + '?format=3&lang=pt', { signal: AbortSignal.timeout(8000) });
      await c.send([(await r.text()).trim()], 'TEMPO');
    } catch {
      await c.send(['Não consegui obter o tempo agora.'], 'ERRO');
    }
  };
  C.calcula = async (c) => {
    const e = c.args.join(' ').replace(/,/g, '.').replace(/[x×]/gi, '*').replace(/÷/g, '/');
    if (!e || e.length > 100 || !/^[\d\s+\-*/().%^]+$/.test(e)) return c.send([`Use: ${P}calcula 2+2*5`], 'CALCULADORA');
    try {
      const r = Function('"use strict"; return (' + e.replace(/\^/g, '**') + ')')();
      if (typeof r !== 'number' || !Number.isFinite(r)) throw new Error('x');
      await c.send([`${e} = ${Math.round(r * 1e8) / 1e8}`], 'CALCULADORA');
    } catch {
      await c.send(['Expressão inválida.'], 'ERRO');
    }
  };
  C.calendario = async (c) => {
    const [y, mo, d] = new Date().toLocaleDateString('en-CA', { timeZone: TZ }).split('-').map(Number);
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const primeiro = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
    const total = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    const linhas = [`${meses[mo - 1]} ${y}`, 'Do Se Te Qu Qu Se Sa'];
    let cel = Array(primeiro).fill('  ');
    for (let n = 1; n <= total; n++) {
      cel.push(String(n).padStart(2, ' ') + (n === d ? '*' : ' '));
      if (cel.length === 7) {
        linhas.push(cel.join(' ').trimEnd());
        cel = [];
      }
    }
    if (cel.length) linhas.push(cel.join(' ').trimEnd());
    linhas.push(`Hoje: ${d}/${mo}/${y} (*)`);
    await c.send(linhas, 'CALENDÁRIO');
  };
  C.pagamento = async (c) => {
    const pg = config.pagamento || {};
    await c.send([`M-Pesa: ${pg.mpesa || config.numeroDono.replace(/^258/, '')}`, `Nome: ${pg.nome || config.nomeDono}`, `Depois envie o SMS com ${P}comprovativo`], 'PAGAMENTO');
  };

  // ── Demonstrações de envio ──
  C['enviar-texto'] = async (c) => c.sock.sendMessage(c.from, { text: moldura([c.args.join(' ') || 'O Sasuke fala.'], 'TEXTO') });
  C['enviar-reacoes'] = async (c) => {
    const e = ['🩸', '⛩️', '👁️', '🔥'];
    await c.sock.sendMessage(c.from, { react: { text: e[Math.floor(Math.random() * e.length)], key: c.msg.key } });
  };
  C['enviar-lista'] = async (c) => {
    const itens = c.args.join(' ').split(',').map((s) => s.trim()).filter(Boolean);
    await c.send(itens.length ? itens.map((t, i) => `${i + 1}. ${t}`) : [`Use: ${P}enviar-lista item1, item2, item3`], 'LISTA');
  };
  C.buttons = async (c) => c.send(['1. Menu', '2. Comprar megas', '3. Falar com o dono', `Use ${P}menu, ${P}megas ou ${P}dono`], 'OPÇÕES');
  C.poll = async (c) => {
    const v = c.args.join(' ').split(',').map((s) => s.trim()).filter(Boolean);
    await c.sock.sendMessage(c.from, { poll: { name: 'Escolha', values: v.length >= 2 ? v.slice(0, 12) : ['Sharingan', 'Rinnegan', 'Mangekyou'], selectableCount: 1 } });
  };
  const midia = (tipo, origem) => async (c) => {
    try {
      let conteudo;
      if (origem === 'url') {
        if (!/^https?:\/\//i.test(c.args[0] || '')) return c.send([`Use: ${P}enviar-${tipo}-de-url <link>`], 'ERRO');
        conteudo = { url: c.args[0] };
      } else {
        const padrao = tipo === 'imagem' ? 'sasuke.jpg' : tipo === 'video' ? 'video.mp4' : 'gif.mp4';
        const f = path.join(__dirname, 'media', path.basename(c.args[0] || padrao));
        if (!fs.existsSync(f)) return c.send(['Arquivo não encontrado na pasta media.'], 'ERRO');
        conteudo = origem === 'buffer' ? fs.readFileSync(f) : { stream: fs.createReadStream(f) };
      }
      const msg = tipo === 'imagem' ? { image: conteudo } : { video: conteudo, ...(tipo === 'gif' ? { gifPlayback: true } : {}) };
      await c.sock.sendMessage(c.from, { ...msg, caption: moldura([`Envio: ${tipo} de ${origem}`], 'MÍDIA') }, { quoted: c.msg });
    } catch {
      await c.send(['Falha ao enviar a mídia.'], 'ERRO');
    }
  };
  for (const t of ['imagem', 'video', 'gif']) {
    C[`enviar-${t}-de-url`] = midia(t, 'url');
    C[`enviar-${t}-de-buffer`] = midia(t, 'buffer');
    if (t !== 'gif') C[`enviar-${t}-de-arquivo`] = midia(t, 'arquivo');
  }
  C.exemplos = async (c) =>
    c.send(['enviar-texto  enviar-resposta', 'enviar-reacoes  enviar-lista', 'enviar-imagem-de-url/arquivo/buffer', 'enviar-video-de-url/arquivo/buffer', 'enviar-gif-de-url/buffer', 'exemplo-poll  funcoes-grupo  buttons'], 'EXEMPLOS');
  C['funcoes-grupo'] = async (c) =>
    c.send(['infogrupo  link  abrir  fechar', 'add  kick  promover  rebaixar', 'nome-grupo  hidetag  tagall', 'mutar  desmutar  anti-link', 'auto-fechar  alarme  agendar'], 'FUNÇÕES DE GRUPO');

  // ── Imagens ──
  const efeito = (rotulo, fn) => async (c) => {
    if (!sharp) return c.send(['Dependência sharp não instalada.'], 'ERRO');
    const buf = await obterImagem(c);
    if (!buf) return c.send(['Envie uma imagem com o comando ou responda a uma.'], 'ERRO');
    try {
      const out = await fn(buf);
      await c.sock.sendMessage(c.from, { image: out, caption: moldura([rotulo], 'EFEITO') }, { quoted: c.msg });
    } catch {
      await c.send(['Falha ao processar a imagem.'], 'ERRO');
    }
  };
  C.embacar = efeito('Embaçado', (b) => sharp(b).blur(25).jpeg().toBuffer());
  C.mirror = efeito('Espelhado', (b) => sharp(b).flop().jpeg().toBuffer());
  C.pb = efeito('Preto e branco', (b) => sharp(b).grayscale().jpeg().toBuffer());
  C.rn = efeito('Negativo', (b) => sharp(b).negate().jpeg().toBuffer());
  C.rec = efeito('Recortado (quadrado)', async (b) => {
    const md = await sharp(b).metadata();
    const s = Math.min(md.width, md.height);
    return sharp(b).resize(s, s, { fit: 'cover' }).jpeg().toBuffer();
  });
  C.px = efeito('Pixelado', async (b) => {
    const md = await sharp(b).metadata();
    const small = await sharp(b).resize(Math.max(8, Math.round(md.width / 18)), null, { kernel: 'nearest' }).toBuffer();
    return sharp(small).resize(md.width, md.height, { kernel: 'nearest' }).jpeg().toBuffer();
  });
  C.s = async (c) => {
    if (!sharp) return c.send(['Dependência sharp não instalada.'], 'ERRO');
    const buf = await obterImagem(c);
    if (!buf) return c.send(['Envie uma imagem com .s ou responda a uma.'], 'FIGURINHA');
    try {
      const webp = await sharp(buf).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
      await c.sock.sendMessage(c.from, { sticker: webp }, { quoted: c.msg });
    } catch {
      await c.send(['Falha ao criar a figurinha.'], 'ERRO');
    }
  };
  C.f = async (c) => {
    const t = c.args.slice(1).join(' ');
    const a = alvo(c) || c.sender;
    const [citado, resposta] = t.split('|').map((s) => s.trim());
    if (!citado) return c.send([`Use: ${P}f @alvo texto citado | resposta`], 'CITAÇÃO FALSA');
    const fake = { key: { remoteJid: c.from, fromMe: false, id: 'SASUKE' + crypto.randomBytes(8).toString('hex').toUpperCase(), participant: a }, message: { conversation: citado } };
    await c.sock.sendMessage(c.from, { text: resposta || '🩸' }, { quoted: fake });
  };
  C.cadeia = async (c) => {
    const a = alvo(c);
    if (!a) return c.send(['Marque quem será preso.'], 'CADEIA');
    await c.send([`@${jidNum(a)} foi preso pelo clã Uchiha.`, `Pena: ${1 + Math.floor(Math.random() * 30)} dia(s) no Tsukuyomi.`], 'CADEIA', { mentions: [a] });
  };

  // ── Gestão de grupos ──
  C.addgp = async (c) => {
    if (!c.owner) return c.send(['Apenas o dono supremo.'], 'SEM PERMISSÃO');
    if (!(await exigirGrupo(c))) return;
    REG.data[c.from] = { em: Date.now() };
    REG.salvar();
    await c.send(['Grupo registrado para comunicados.'], 'GRUPO REGISTRADO');
  };
  C.comunicar = async (c) => {
    if (!c.owner) return c.send(['Apenas o dono supremo.'], 'SEM PERMISSÃO');
    const t = c.args.join(' ');
    if (!t) return c.send([`Use: ${P}comunicar <texto>`], 'COMUNICADO');
    let ok = 0;
    for (const jid of Object.keys(REG.data)) {
      try {
        await enviar(c.sock, jid, [t], 'COMUNICADO GERAL');
        ok++;
        await sleep(1200);
      } catch {}
    }
    await c.send([`Enviado para ${ok} grupo(s).`], 'COMUNICADO');
  };
  C.limpar = async (c) => {
    if (!(await exigirAdmin(c))) return;
    const vazio = Array(60).fill('\u200E').join('\n');
    await c.sock.sendMessage(c.from, { text: vazio + '\n' + moldura(['Chat limpo.'], 'LIMPEZA') });
  };
  C.delete = async (c) => {
    if (!(await exigirAdmin(c))) return;
    const ctx = getCtx(unwrap(c.msg.message));
    if (!ctx?.stanzaId) return c.send(['Responda à mensagem que será apagada.'], 'APAGAR');
    try {
      await c.sock.sendMessage(c.from, { delete: { remoteJid: c.from, fromMe: false, id: ctx.stanzaId, participant: ctx.participant } });
    } catch {
      await c.send(['Preciso ser administrador.'], 'ERRO');
    }
  };
  C.grupo = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const a = (c.args[0] || '').toLowerCase();
    try {
      if (['abrir', 'a', 'open', 'abre'].includes(a)) {
        await c.sock.groupSettingUpdate(c.from, 'not_announcement');
        await c.send(['Grupo aberto.'], 'GRUPO');
      } else if (['fechar', 'f', 'close', 'fecha'].includes(a)) {
        await c.sock.groupSettingUpdate(c.from, 'announcement');
        await c.send(['Grupo fechado.'], 'GRUPO');
      } else {
        await c.send([`Estado: ${meta.announce ? 'fechado' : 'aberto'}`, `Use: ${P}grupo abrir | fechar`], 'GRUPO');
      }
    } catch {
      await c.send(['Preciso ser administrador.'], 'ERRO');
    }
  };
  C['grupo-f'] = async (c) => {
    c.args = ['fechar'];
    return C.grupo(c);
  };
  C.nomegrupo = async (c) => {
    if (!(await exigirAdmin(c))) return;
    const n = c.args.join(' ').trim();
    if (!n) return c.send([`Use: ${P}nome-grupo <novo nome>`], 'NOME');
    try {
      await c.sock.groupUpdateSubject(c.from, n.slice(0, 100));
      await c.send(['Nome alterado.'], 'NOME DO GRUPO');
    } catch {
      await c.send(['Preciso ser administrador.'], 'ERRO');
    }
  };
  const adicionar = (promover) => async (c) => {
    if (!(await exigirAdmin(c))) return;
    const n = (c.args[0] || '').replace(/\D/g, '');
    if (n.length < 9) return c.send([`Use: ${P}add 258XXXXXXXXX`], 'ADICIONAR');
    try {
      const r = await c.sock.groupParticipantsUpdate(c.from, [jidDe(n)], 'add');
      const st = String(r?.[0]?.status || '');
      if (st === '200') {
        if (promover) await c.sock.groupParticipantsUpdate(c.from, [jidDe(n)], 'promote').catch(() => {});
        await c.send([`${n} adicionado${promover ? ' como admin' : ''}.`], 'ADICIONADO');
      } else if (st === '403') {
        await c.send([`${n} não permite ser adicionado.`, 'Envie o link do grupo.'], 'ADICIONAR');
      } else if (st === '409') {
        await c.send([`${n} já está no grupo.`], 'ADICIONAR');
      } else {
        await c.send([`Não foi possível adicionar (${st || '?'}).`], 'ERRO');
      }
    } catch {
      await c.send(['Preciso ser administrador.'], 'ERRO');
    }
  };
  C.add = adicionar(false);
  C['add-adm'] = adicionar(true);
  C.autofechar = async (c) => {
    if (!(await exigirAdmin(c))) return;
    const g = cfg(c.from);
    if ((c.args[0] || '').toLowerCase() === 'off') {
      g.autofechar = { ...(g.autofechar || {}), on: false };
      G.salvar();
      return c.send(['Fechamento automático desativado.'], 'AUTO-FECHAR');
    }
    const f = hhmm(c.args[0]);
    const a = hhmm(c.args[1]);
    if (!f || !a) {
      const af = g.autofechar;
      return c.send([af?.on ? `Ativo: fecha ${af.fechar}, abre ${af.abrir}` : 'Desativado.', `Use: ${P}auto-fechar 22:00 06:00`, `Desligar: ${P}auto-fechar off`], 'AUTO-FECHAR');
    }
    g.autofechar = { on: true, fechar: f, abrir: a };
    G.salvar();
    await c.send([`Fecha às ${f}`, `Abre às ${a}`, 'Fuso: Maputo (CAT)'], 'AUTO-FECHAR ATIVO');
  };

  // ── Segurança e moderação ──
  const AVISO_BOT = ['O Sasuke precisa ser administrador.'];
  C.antilink = (c) => alternar(c, 'antilink', 'ANTI-LINK', AVISO_BOT);
  C.antifoto = (c) => alternar(c, 'antifoto', 'ANTI-FOTO', AVISO_BOT);
  C.antispam = (c) => alternar(c, 'antispam', 'ANTI-SPAM', AVISO_BOT);
  C.soadm = (c) => alternar(c, 'soadm', 'SÓ ADMINS', ['Só administradores usam os comandos.']);
  C.autoremover = (c) => alternar(c, 'autorem', 'AUTO-REMOVER', [`Remove inativos há ${cfg(c.from).periodo || 5} dias, às 04:00.`]);
  C.autocomprovativo = (c) => alternar(c, 'autocomp', 'AUTO-COMPROVATIVO', ['O Sasuke lê SMS M-Pesa colados no grupo.']);
  C.vendaauto = (c) => alternar(c, 'vendaAuto', 'VENDA AUTOMÁTICA', ['Comprovativo válido marca a compra como paga.']);
  C.anticoncorrencia = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const g = cfg(c.from);
    g.anticonc ||= { on: false, palavras: [] };
    const a = (c.args[0] || '').toLowerCase();
    const p = c.args.slice(1).join(' ').toLowerCase();
    if (a === 'add' && p) g.anticonc.palavras.push(p);
    else if (a === 'del' && p) g.anticonc.palavras = g.anticonc.palavras.filter((x) => x !== p);
    else if (a === 'on' || a === 'off') g.anticonc.on = a === 'on';
    else g.anticonc.on = !g.anticonc.on;
    G.salvar();
    await c.send([`Estado: ${g.anticonc.on ? 'ATIVO' : 'DESATIVADO'}`, `Palavras: ${g.anticonc.palavras.join(', ') || 'nenhuma'}`, `Use: ${P}anticoncorrencia add <palavra> | del <palavra>`], 'ANTI-CONCORRÊNCIA');
  };
  const estrangeiros = (ligar) => async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const g = cfg(c.from);
    if (ligar) {
      const paises = c.args.map((x) => x.replace(/\D/g, '')).filter(Boolean);
      g.antiestr = { paises: paises.length ? paises : ['258'] };
      await c.send([`Permitidos: +${g.antiestr.paises.join(', +')}`, 'Outros números são removidos ao entrar.'], 'ANTI-ESTRANGEIROS ON');
    } else {
      delete g.antiestr;
      await c.send(['Desativado.'], 'ANTI-ESTRANGEIROS OFF');
    }
    G.salvar();
  };
  C['antiestrangeiros-on'] = estrangeiros(true);
  C['antiestrangeiros-off'] = estrangeiros(false);
  C.mutar = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const a = alvo(c);
    if (!a) return c.send(['Marque ou responda quem será mutado.'], 'MUTAR');
    const n = jidNum(a);
    if (ehDonoJid(a)) return c.send(['Não toco no meu mestre.'], 'NEGADO');
    const g = cfg(c.from);
    if (!g.mutados.includes(n)) g.mutados.push(n);
    G.salvar();
    await c.send([`@${n} foi silenciado.`, 'Suas mensagens serão apagadas.', ...AVISO_BOT], 'MUTADO', { mentions: [a] });
  };
  C.desmutar = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const a = alvo(c);
    if (!a) return c.send(['Marque ou responda quem será liberado.'], 'DESMUTAR');
    const g = cfg(c.from);
    g.mutados = g.mutados.filter((x) => x !== jidNum(a));
    G.salvar();
    await c.send([`@${jidNum(a)} pode falar novamente.`], 'DESMUTADO', { mentions: [a] });
  };
  C.periodoremocao = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const d = parseInt(c.args[0], 10);
    if (!d || d < 1 || d > 365) return c.send([`Use: ${P}periodo-remocao <dias> (1 a 365)`, `Atual: ${cfg(c.from).periodo || 5} dias`], 'PERÍODO');
    cfg(c.from).periodo = d;
    G.salvar();
    await c.send([`Inativos há mais de ${d} dias serão alvo da remoção.`], 'PERÍODO DEFINIDO');
  };
  C.statusremocao = async (c) => {
    if (!(await exigirGrupo(c))) return;
    const g = cfg(c.from);
    const desde = A.data[c.from]?.__desde;
    await c.send([`Período: ${g.periodo || 5} dias`, `Remoção automática: ${g.autorem ? 'ligada' : 'desligada'}`, `Observando o grupo desde: ${desde ? fmtData(desde) : 'agora'}`], 'STATUS DA REMOÇÃO');
  };
  C.fantasmas = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const dias = cfg(c.from).periodo || 5;
    const r = await listarFantasmas(c.sock, c.from, dias);
    if (r.cedo) return c.send([`Observo este grupo há pouco tempo.`, `Aguarde mais ${r.cedo} dia(s) para ter dados confiáveis.`], 'FANTASMAS');
    if (!r.alvos.length) return c.send([`Nenhum inativo há mais de ${dias} dias.`], 'FANTASMAS');
    if ((c.args[0] || '').toLowerCase() !== 'confirmar') {
      return c.send([`${r.alvos.length} membro(s) sem falar há ${dias}+ dias:`, ...r.alvos.slice(0, 25).map((p) => '@' + jidNum(p.id)), `Para remover: ${P}rfantasmas5 confirmar`], 'FANTASMAS', { mentions: r.alvos.slice(0, 25).map((p) => p.id) });
    }
    const ok = await removerLote(c.sock, c.from, r.alvos);
    await c.send([`Removidos: ${ok} de ${r.alvos.length}.`], 'FANTASMAS REMOVIDOS');
  };

  // ── Automações ──
  C.agendar = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const h = hhmm(c.args[0]);
    const t = c.args.slice(1).join(' ');
    if (!h || !t) return c.send([`Use: ${P}agendar 18:30 texto`], 'AGENDAR');
    const dia = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
    let ts = new Date(`${dia}T${h}:00${OFFSET}`).getTime();
    if (ts <= Date.now()) ts += DIA;
    cfg(c.from).agendas.push({ ts, texto: t });
    G.salvar();
    await c.send([`Mensagem agendada para ${fmtData(ts)}.`], 'AGENDADO');
  };
  C.alarme = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const g = cfg(c.from);
    if ((c.args[0] || '').toLowerCase() === 'del') {
      const id = parseInt(c.args[1], 10);
      g.alarmes = g.alarmes.filter((a) => a.id !== id);
      G.salvar();
      return c.send([`Alarme ${id} removido.`], 'ALARME');
    }
    const h = hhmm(c.args[0]);
    const t = c.args.slice(1).join(' ');
    if (!h || !t) {
      return c.send([...(g.alarmes.length ? g.alarmes.map((a) => `#${a.id} ${a.hora} - ${a.texto}`) : ['Nenhum alarme.']), `Criar: ${P}alarme 08:00 texto`, `Remover: ${P}alarme del <id>`], 'ALARMES');
    }
    g.alarmes.push({ id: ++g.seq, hora: h, texto: t });
    G.salvar();
    await c.send([`Alarme #${g.seq} diário às ${h}.`, 'Todos serão marcados.'], 'ALARME CRIADO');
  };
  C.autoresponder = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const g = cfg(c.from);
    const a = (c.args[0] || '').toLowerCase();
    if (a === 'del') {
      delete g.autoresp[c.args.slice(1).join(' ').toLowerCase()];
      G.salvar();
      return c.send(['Resposta removida.'], 'AUTO-RESPONDER');
    }
    const txt = c.args.join(' ');
    if (txt.includes('=')) {
      const [k, ...v] = txt.split('=');
      if (k.trim() && v.join('=').trim()) {
        g.autoresp[k.trim().toLowerCase()] = v.join('=').trim();
        G.salvar();
        return c.send([`Gatilho "${k.trim()}" criado.`], 'AUTO-RESPONDER');
      }
    }
    const l = Object.entries(g.autoresp).map(([k, v]) => `${k} => ${v}`);
    await c.send([...(l.length ? l : ['Nenhuma resposta.']), `Criar: ${P}auto-responder oi = Olá!`, `Remover: ${P}auto-responder del oi`], 'AUTO-RESPONDER');
  };
  const boasVindas = (chave, rotulo, padrao) => async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const g = cfg(c.from);
    g[chave] ||= { on: false, texto: '' };
    const a = (c.args[0] || '').toLowerCase();
    if (a === 'on') g[chave].on = true;
    else if (a === 'off') g[chave].on = false;
    else if (c.args.length) {
      g[chave].texto = c.args.join(' ');
      g[chave].on = true;
    } else g[chave].on = !g[chave].on;
    G.salvar();
    await c.send([`Estado: ${g[chave].on ? 'ATIVO' : 'DESATIVADO'}`, `Texto: ${g[chave].texto || padrao}`, `Use: ${P}${rotulo.toLowerCase()} on | off | <texto com @user e {grupo}>`], rotulo);
  };
  C.bemvindo = boasVindas('bemvindo', 'BEMVINDO', 'Bem-vindo @user ao grupo {grupo}.');
  C.saida = boasVindas('saida', 'SAIDA', '@user saiu do grupo.');
  C.nanoadd = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const n = (c.args[0] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const t = c.args.slice(1).join(' ');
    if (!n || !t) return c.send([`Use: ${P}nanoadd nome resposta`], 'NANO');
    cfg(c.from).nano[n] = t;
    G.salvar();
    await c.send([`Comando ${P}${n} criado.`], 'NANO CRIADO');
  };
  C.nanodel = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const n = (c.args[0] || '').toLowerCase();
    delete cfg(c.from).nano[n];
    G.salvar();
    await c.send([`Comando ${P}${n} removido.`], 'NANO');
  };
  C.listanano = async (c) => {
    if (!(await exigirGrupo(c))) return;
    const l = Object.keys(cfg(c.from).nano);
    await c.send(l.length ? l.map((n) => P + n) : ['Nenhum comando personalizado.'], 'COMANDOS NANO');
  };

  // ── Vendas e financeiro ──
  C.megas = async (c) => {
    const l = V.data.pacotes.map((p) => `${p.nome} = ${p.preco}MT`);
    await c.send([...(l.length ? l : ['Nenhum pacote cadastrado.']), `Comprar: ${P}compra <pacote> [número]`], 'PACOTES DE MEGAS');
  };
  C.setmegas = async (c) => {
    if (!(await admin(c))) return;
    if ((c.args[0] || '').toLowerCase() === 'del') {
      const id = normPacote(c.args[1]);
      V.data.pacotes = V.data.pacotes.filter((p) => p.id !== id);
      V.salvar();
      return c.send(['Pacote removido.'], 'PACOTES');
    }
    const nome = c.args[0];
    const preco = parseFloat(String(c.args[1] || '').replace(',', '.'));
    if (!nome || !preco) return c.send([`Use: ${P}setmegas 1GB 50`, `Remover: ${P}setmegas del 1GB`], 'PACOTES');
    const id = normPacote(nome);
    const ex = V.data.pacotes.find((p) => p.id === id);
    if (ex) ex.preco = preco;
    else V.data.pacotes.push({ id, nome, preco });
    V.salvar();
    await c.send([`${nome} = ${preco}MT`], 'PACOTE SALVO');
  };
  C.compra = async (c) => {
    if (c.isGroup && cfg(c.from).compras === false) return c.send(['As compras estão desativadas neste grupo.'], 'COMPRAS');
    const p = V.data.pacotes.find((x) => x.id === normPacote(c.args[0]));
    if (!p) return c.send([`Use: ${P}compra <pacote> [número]`, `Veja os pacotes: ${P}megas`], 'COMPRA');
    const numero = (c.args[1] || c.senderNum).replace(/\D/g, '');
    const pedido = { id: ++V.data.seq, jid: c.from, user: c.senderNum, pacote: p.nome, preco: p.preco, numero, estado: 'aguardando', criado: Date.now() };
    V.data.pedidos.push(pedido);
    V.salvar();
    const pg = config.pagamento || {};
    await c.send([`Compra #${pedido.id}: ${p.nome} - ${p.preco}MT`, `Número a receber: ${numero}`, `Pague por M-Pesa: ${pg.mpesa || config.numeroDono.replace(/^258/, '')}`, `Nome: ${pg.nome || config.nomeDono}`, `Depois use ${P}comprovativo com o SMS.`], 'COMPRA REGISTRADA');
    if (config.fauto) await fotoVenda(c).catch(() => {});
  };
  C.comprovativo = async (c) => {
    const t = c.args.join(' ') || textoCitado(c);
    if (!t) return c.send([`Cole o SMS do M-Pesa: ${P}comprovativo <SMS>`, 'Ou responda ao SMS com o comando.'], 'COMPROVATIVO');
    await comprovativo(c.sock, c.from, c.sender, t, (l, ti, e) => c.send(l, ti, e));
  };
  C.verificarsms = async (c) => {
    const t = c.args.join(' ') || textoCitado(c);
    if (!t) return c.send([`Use: ${P}verificarsms <SMS>`], 'VERIFICAR SMS');
    const r = parseRecibo(t);
    const dup = r.ref && V.data.recibos[r.ref];
    await c.send([`Referência: ${r.ref || 'não encontrada'}`, `Valor: ${r.valor != null ? r.valor + 'MT' : 'não encontrado'}`, dup ? `Já usado na compra #${dup}.` : r.ref ? 'Ainda não usado.' : 'SMS inválido.'], 'VERIFICAR SMS');
  };
  C.debugrecibo = async (c) => {
    const t = c.args.join(' ') || textoCitado(c);
    await c.sock.sendMessage(c.from, { text: '```' + JSON.stringify(parseRecibo(t), null, 2) + '```' }, { quoted: c.msg });
  };
  C.saldo = async (c) => c.send([`Saldo: ${V.data.saldo[c.senderNum] || 0}MT`], 'SALDO');
  C.depositar = async (c) => {
    const v = parseFloat(String(c.args[0] || '').replace(',', '.'));
    if (!v || v <= 0) return c.send([`Use: ${P}depositar <valor>`], 'DEPÓSITO');
    const d = { id: ++V.data.seq, user: c.senderNum, valor: v, estado: 'aguardando', criado: Date.now() };
    V.data.depositos.push(d);
    V.salvar();
    const pg = config.pagamento || {};
    await c.send([`Depósito #${d.id}: ${v}MT`, `Pague por M-Pesa: ${pg.mpesa || config.numeroDono.replace(/^258/, '')}`, 'Depois envie o comprovativo ao dono:', 'wa.me/' + config.numeroDono], 'DEPÓSITO');
    await c.sock.sendMessage(jidDe(config.numeroDono), { text: moldura([`Depósito #${d.id}`, `Cliente: @${c.senderNum}`, `Valor: ${v}MT`, `Aprovar: ${P}addsaldo @${c.senderNum} ${v}`], 'NOVO DEPÓSITO'), mentions: [jidDe(c.senderNum)] }).catch(() => {});
  };
  C.addsaldo = async (c) => {
    if (!(await admin(c))) return;
    const a = alvo(c);
    const v = parseFloat(String(c.args[c.args.length - 1] || '').replace(',', '.'));
    if (!a || !v) return c.send([`Use: ${P}addsaldo @cliente 50`], 'SALDO');
    const n = jidNum(a);
    V.data.saldo[n] = (V.data.saldo[n] || 0) + v;
    V.salvar();
    await c.send([`@${n} recebeu ${v}MT.`, `Saldo atual: ${V.data.saldo[n]}MT`], 'SALDO ADICIONADO', { mentions: [a] });
  };
  C.compras = async (c) => {
    if (!(await admin(c))) return;
    if ((c.args[0] || '').toLowerCase() === 'ok') {
      const p = V.data.pedidos.find((x) => x.id === parseInt(c.args[1], 10));
      if (!p) return c.send(['Compra não encontrada.'], 'COMPRAS');
      p.estado = 'entregue';
      V.salvar();
      await c.sock.sendMessage(p.jid, { text: moldura([`Compra #${p.id} (${p.pacote}) entregue.`, `@${p.user} obrigado.`], 'ENTREGUE'), mentions: [jidDe(p.user)] }).catch(() => {});
      return c.send([`Compra #${p.id} marcada como entregue.`], 'COMPRAS');
    }
    const l = V.data.pedidos.filter((p) => !c.isGroup || p.jid === c.from).slice(-15);
    await c.send(l.length ? l.map((p) => `#${p.id} ${p.pacote} ${p.preco}MT - ${p.user} - ${rotuloEstado[p.estado]}`) : ['Nenhuma compra.'], 'COMPRAS');
  };
  C.anularcompra = async (c) => {
    if (!(await admin(c))) return;
    const p = V.data.pedidos.find((x) => x.id === parseInt(c.args[0], 10));
    if (!p) return c.send([`Use: ${P}anularcompra <id>`], 'ANULAR');
    p.estado = 'anulada';
    if (p.prova?.ref) delete V.data.recibos[p.prova.ref];
    V.salvar();
    await c.send([`Compra #${p.id} anulada.`], 'ANULADA');
  };
  C.ativarcompras = async (c) => {
    if (!(await admin(c))) return;
    if (!(await exigirGrupo(c))) return;
    const g = cfg(c.from);
    const a = (c.args[0] || '').toLowerCase();
    g.compras = a === 'off' ? false : a === 'on' ? true : g.compras === false;
    G.salvar();
    await c.send([`Compras: ${g.compras === false ? 'DESATIVADAS' : 'ATIVADAS'}`], 'COMPRAS');
  };
  C.limparcompras = async (c) => {
    if (!(await admin(c))) return;
    const antes = V.data.pedidos.length;
    V.data.pedidos = V.data.pedidos.filter((p) => c.isGroup && p.jid !== c.from);
    V.salvar();
    await c.send([`Removidas ${antes - V.data.pedidos.length} compra(s).`], 'COMPRAS LIMPAS');
  };
  C.faltacompra = async (c) => {
    if (!(await admin(c))) return;
    const l = V.data.pedidos.filter((p) => p.estado === 'aguardando' && (!c.isGroup || p.jid === c.from));
    await c.send(l.length ? l.map((p) => `#${p.id} @${p.user} ${p.pacote} ${p.preco}MT`) : ['Nenhuma compra aguardando pagamento.'], 'FALTA PAGAR', { mentions: l.map((p) => jidDe(p.user)) });
  };
  C.semcompra = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const compraram = new Set(V.data.pedidos.filter((p) => p.jid === c.from).map((p) => p.user));
    const l = meta.participants.filter((p) => !p.admin && !souBot(p, c.sock) && !idsDe(p).some((x) => compraram.has(x)));
    await c.send([`${l.length} membro(s) sem compras:`, ...l.slice(0, 40).map((p) => '@' + jidNum(p.id))], 'SEM COMPRAS', { mentions: l.slice(0, 40).map((p) => p.id) });
  };
  C.pagamentos = async (c) => {
    if (!(await admin(c))) return;
    const l = V.data.pedidos.filter((p) => (p.estado === 'pago' || p.estado === 'entregue') && (!c.isGroup || p.jid === c.from)).slice(-15);
    await c.send(l.length ? l.map((p) => `#${p.id} ${p.pacote} ${p.preco}MT ref ${p.prova?.ref || '-'}`) : ['Nenhum pagamento.'], 'PAGAMENTOS');
  };
  C.relatorio = async (c) => {
    if (!(await admin(c))) return;
    const l = V.data.pedidos.filter((p) => !c.isGroup || p.jid === c.from);
    const cont = (e) => l.filter((p) => p.estado === e).length;
    const receita = l.filter((p) => p.estado === 'pago' || p.estado === 'entregue').reduce((s, p) => s + p.preco, 0);
    await c.send([`Total de compras: ${l.length}`, `Aguardando: ${cont('aguardando')}`, `Em análise: ${cont('analise')}`, `Pagas: ${cont('pago')}`, `Entregues: ${cont('entregue')}`, `Anuladas: ${cont('anulada')}`, `Receita: ${receita}MT`], 'RELATÓRIO');
  };
  C.addtelefone = async (c) => {
    if (!(await admin(c))) return;
    const n = (c.args[0] || '').replace(/\D/g, '');
    if (n.length < 9) return c.send([`Use: ${P}addtelefone 84XXXXXXX`], 'TELEFONES');
    if (!V.data.telefones.includes(n)) V.data.telefones.push(n);
    V.salvar();
    await c.send([`${n} adicionado.`], 'TELEFONES');
  };
  C.deltelefone = async (c) => {
    if (!(await admin(c))) return;
    const n = (c.args[0] || '').replace(/\D/g, '');
    V.data.telefones = V.data.telefones.filter((x) => x !== n);
    V.salvar();
    await c.send([`${n} removido.`], 'TELEFONES');
  };
  C.telefones = async (c) => {
    if (!(await admin(c))) return;
    await c.send(V.data.telefones.length ? V.data.telefones : ['Nenhum telefone.'], 'TELEFONES');
  };


  // ───────────────────────── PICOS / RESTANAS / TOKEN / EXTRAS ─────────────────────────
  async function ehAdm(c) {
    if (c.owner) return true;
    if (!c.isGroup) return false;
    try {
      return ehAdminIds(await getMeta(c.sock, c.from), [c.senderNum, c.num]);
    } catch {
      return false;
    }
  }
  const fmtBytes = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : n >= 1024 ? (n / 1024).toFixed(1) + 'KB' : n + 'B');
  const numPos = (v) => {
    const n = parseFloat(String(v || '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const soDono = async (c) => {
    if (!c.owner) {
      await c.send(['Apenas o dono supremo pode usar.'], 'SEM PERMISSÃO');
      return false;
    }
    return true;
  };

  // ── Picos ──
  C.picos = async (c) => {
    const full = await ehAdm(c);
    const l = PICOS.data.itens;
    if (!l.length) return c.send(['Nenhum pico no estoque.'], 'PICOS DISPONIVEIS');
    await c.send(
      l.map((p) => (full ? `${p.quantidade}MT - Compra ${p.preco_compra}MT - Venda ${p.preco_venda}MT (por ${p.adicionado_por})` : `${p.quantidade}MT - Venda ${p.preco_venda}MT`)),
      'PICOS DISPONIVEIS'
    );
  };
  C.picospv = async (c) => {
    const l = PICOS.data.itens;
    if (!l.length) return c.send(['Nenhum pico cadastrado.'], 'PICOS - PREÇO DE VENDA');
    await c.send(l.map((p) => `${p.quantidade}MT picos = ${p.preco_venda}MT`), 'PICOS - PREÇO DE VENDA');
  };
  C.addpico = async (c) => {
    if (!(await admin(c))) return;
    const q = numPos(c.args[0]);
    const pc = numPos(c.args[1]);
    const pv = numPos(c.args[2]);
    if (!q || !pc || !pv) return c.send([`Use: ${P}addpico <quantidade> <compra> <venda>`, `Ex: ${P}addpico 500 450 550`], 'ADD PICO');
    const it = { quantidade: q, preco_compra: pc, preco_venda: pv, adicionado_por: c.num || c.senderNum };
    const i = PICOS.data.itens.findIndex((p) => p.quantidade === q);
    if (i >= 0) PICOS.data.itens[i] = it;
    else PICOS.data.itens.push(it);
    PICOS.data.itens.sort((a, b) => a.quantidade - b.quantidade);
    PICOS.salvar();
    await c.send([`${q}MT - Compra ${pc}MT - Venda ${pv}MT`], 'PICO SALVO');
  };
  C.delpico = async (c) => {
    if (!(await admin(c))) return;
    const q = numPos(c.args[0]);
    const antes = PICOS.data.itens.length;
    PICOS.data.itens = PICOS.data.itens.filter((p) => p.quantidade !== q);
    PICOS.salvar();
    await c.send([antes !== PICOS.data.itens.length ? `${q}MT removido.` : 'Pico não encontrado.'], 'DEL PICO');
  };

  // ── Restanas ──
  const nomeOp = (k) => k.charAt(0).toUpperCase() + k.slice(1);
  C.restanas = async (c) => {
    const full = await ehAdm(c);
    const ent = Object.entries(REST.data).filter(([, v]) => v > 0);
    const total = Object.values(REST.data).reduce((a, b) => a + b, 0);
    if (!ent.length) return c.send(['Estoque zerado.'], 'RESTANAS');
    await c.send(full ? [`Restam: ${ent.map(([k, v]) => `${v}GB ${nomeOp(k)}`).join(' / ')}`, `Total: ${total}GB`] : [`Restam: ${total}GB no total`], 'RESTANAS');
  };
  C.setrestanas = async (c) => {
    if (!(await admin(c))) return;
    const op = (c.args[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const v = parseFloat(String(c.args[1] || '').replace(',', '.'));
    if (!op || !Number.isFinite(v) || v < 0) return c.send([`Use: ${P}setrestanas vodacom 45`, `Ex: ${P}setrestanas movitel 20`], 'SET RESTANAS');
    REST.data[op] = v;
    REST.salvar();
    await c.send([`${nomeOp(op)}: ${v}GB`], 'RESTANAS ATUALIZADAS');
  };
  C.limparrestanas = async (c) => {
    if (!(await soDono(c))) return;
    const antes = Object.entries(REST.data).map(([k, v]) => `${v}GB ${nomeOp(k)}`);
    for (const k of Object.keys(REST.data)) REST.data[k] = 0;
    REST.salvar();
    await c.send(['Estoque zerado.', `Antes: ${antes.join(' / ') || 'vazio'}`], 'RESTANAS LIMPAS');
  };

  // ── Tokens (guardados em tokens.json) ──
  const mascarar = (t) => '••••' + String(t).slice(-4);
  async function guardarToken(c, novo, rotacao) {
    if (!(await soDono(c))) return;
    if (c.isGroup) await apagar(c.sock, c.msg); // não deixa o token visível no grupo
    if (!novo || novo.length < 8 || /\s/.test(novo)) return c.send([`Use: ${P}${rotacao ? 'migrartoken' : 'settoken'} <token>`, 'Prefira usar no privado do bot.'], rotacao ? 'MIGRAR TOKEN' : 'SET TOKEN');
    const T = TOK.data;
    if (rotacao && T.token) {
      T.backups.push({ token: T.token, criado_em: T.criado_em, substituido_em: Date.now() });
      T.backups = T.backups.slice(-10);
    }
    T.token = novo;
    T.criado_em = Date.now();
    T.dono = c.num || c.senderNum;
    TOK.salvar();
    await c.send([rotacao ? 'Token antigo movido para backup.' : 'Token salvo.', `Novo token: ${mascarar(novo)}`, `Backups guardados: ${T.backups.length}`], rotacao ? 'TOKEN MIGRADO' : 'TOKEN SALVO');
  }
  C.settoken = (c) => guardarToken(c, c.args[0], false);
  C.migrartoken = (c) => guardarToken(c, c.args[0], true);
  C.token = async (c) => {
    const T = TOK.data;
    if (!T.token) return c.send(['Nenhum token salvo.', `Use ${P}settoken <token> no privado.`], 'TOKEN');
    const completo = c.owner && !c.isGroup;
    await c.send([`Token: ${completo ? T.token : mascarar(T.token)}`, `Criado em: ${fmtData(T.criado_em)}`, `Dono: ${T.dono}`, `Backups: ${T.backups.length}`, ...(completo ? [] : ['Token completo só no privado do dono.'])], 'TOKEN');
  };

  // ── Ban com senha ──
  const falhasSenha = new Map();
  C['ban-senha'] = async (c) => {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    await apagar(c.sock, c.msg); // esconde a senha digitada
    const senhaCfg = String(process.env.SENHA_BAN || config.senha_ban || '');
    if (!senhaCfg) return c.send(['Senha não definida.', 'Configure senha_ban no config.json (ou SENHA_BAN no Render).'], 'BAN COM SENHA');
    const a = alvo(c);
    const senha = c.args.length ? c.args[c.args.length - 1] : '';
    if (!a || !senha || (c.args.length === 1 && !getCtx(unwrap(c.msg.message))?.quotedMessage))
      return c.send([`Use: ${P}ban-senha @usuario SENHA`, 'Ou responda a mensagem do alvo com a senha.'], 'BAN COM SENHA');
    const k = c.from + c.senderNum;
    const f = (falhasSenha.get(k) || []).filter((t) => Date.now() - t < 600000);
    if (f.length >= 5) return c.send(['Muitas tentativas erradas.', 'Aguarde 10 minutos.'], 'BLOQUEADO');
    const h = (x) => crypto.createHash('sha256').update(String(x)).digest();
    if (!crypto.timingSafeEqual(h(senha), h(senhaCfg))) {
      f.push(Date.now());
      falhasSenha.set(k, f);
      return c.send(['Senha incorreta.'], 'NEGADO');
    }
    falhasSenha.delete(k);
    const n = jidNum(a);
    if (ehDonoJid(a)) return c.send(['Não toco no meu mestre.'], 'NEGADO');
    if (idsDoBot(c.sock).includes(n)) return c.send(['Não vou me eliminar.'], 'NEGADO');
    try {
      const r = await c.sock.groupParticipantsUpdate(c.from, [a], 'remove');
      if (r?.[0]?.status && String(r[0].status) !== '200') throw new Error('status');
      await c.send([`Usuario @${n} removido com senha.`], 'BANIDO', { mentions: [a] });
    } catch {
      await c.send(['Falhei. Preciso ser administrador do grupo.'], 'ERRO');
    }
  };

  // ── Bolsonaro (comando de zoeira com a sua imagem) ──
  C.bolsonaro = async (c) => {
    const texto = config.textoBolsonaro || 'Mito ativado';
    const f = path.join(__dirname, 'media', 'bolsonaro.jpg');
    if (!fs.existsSync(f)) return c.send([texto], 'MITO');
    await c.sock.sendMessage(c.from, { image: fs.readFileSync(f), caption: moldura([texto], 'MITO') }, { quoted: c.msg });
    if (sharp) {
      try {
        const webp = await sharp(f).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
        await c.sock.sendMessage(c.from, { sticker: webp }, { quoted: c.msg });
      } catch {}
    }
  };

  // ── TI: diagnóstico ──
  C.ti = async (c) => {
    const t0 = Date.now();
    await c.sock.sendPresenceUpdate('composing', c.from).catch(() => {});
    const ping = Date.now() - t0;
    const l = [`Uptime: ${fmtDur(process.uptime() * 1000)}`, `Ping: ${ping}ms`];
    if (await ehAdm(c)) {
      const now = Date.now();
      const alug = Object.values(db.alugados).filter((v) => v.expira > now).length;
      const grat = Object.values(db.gratis).filter((v) => v.expira > now).length;
      let grupos = '?';
      try {
        grupos = Object.keys(await c.sock.groupFetchAllParticipating()).length;
      } catch {}
      const mb = (b) => Math.round(b / 1048576);
      l.push(`RAM do bot: ${mb(process.memoryUsage().rss)}MB`, `RAM do sistema: ${mb(os.totalmem() - os.freemem())}/${mb(os.totalmem())}MB`, `Grupos: ${grupos}`, `Alugados ativos: ${alug}`, `Grátis ativos: ${grat}`, `Sessões: ${sessions.size}`, `Node: ${process.version}`, `Versão: ${config.versao}`);
    }
    await c.send(l, 'TI - DIAGNÓSTICO');
  };

  // ── Upload (só dono, só salva; não executa nem descompacta nada) ──
  C.up = async (c) => {
    if (!(await soDono(c))) return;
    const m = unwrap(c.msg.message);
    const tipos = ['documentMessage', 'imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage'];
    const ctx = getCtx(m);
    const fonte = m && tipos.some((t) => m[t]) ? m : ctx?.quotedMessage ? unwrap(ctx.quotedMessage) : null;
    const tipo = fonte && tipos.find((t) => fonte[t]);
    if (!tipo) return c.send([`Envie um arquivo com a legenda ${P}up`, 'Ou responda a um arquivo com o comando.'], 'UPLOAD');
    const media = fonte[tipo];
    const tam = Number(media.fileLength?.toNumber?.() ?? media.fileLength ?? 0);
    if (tam > 30 * 1048576) return c.send(['Arquivo acima de 30MB.'], 'UPLOAD');
    try {
      const buf = await baixar(media, tipo.replace('Message', ''));
      const ext = path.extname(media.fileName || '') || '.' + ((media.mimetype || 'application/octet-stream').split('/')[1] || 'bin').split(';')[0];
      const base = (c.args[0] || path.basename(media.fileName || tipo.replace('Message', ''), ext)).replace(/[^\w.-]/g, '_').slice(0, 40) || 'arquivo';
      const nome = `${crypto.randomBytes(8).toString('hex')}-${base}${ext.replace(/[^\w.]/g, '')}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, nome), buf);
      const baseUrl = (process.env.RENDER_EXTERNAL_URL || config.urlBase || '').replace(/\/$/, '');
      await c.send([`Arquivo salvo: ${nome}`, `Tamanho: ${fmtBytes(buf.length)}`, baseUrl ? `Link: ${baseUrl}/uploads/${nome}` : `Pasta: ./uploads/${nome}`], 'UPLOAD CONCLUÍDO');
    } catch {
      await c.send(['Falha ao salvar o arquivo.'], 'ERRO');
    }
  };

  // ── App / canal ──
  C.app = async (c) =>
    c.send(
      ['Dono: wa.me/' + config.numeroDono, 'Canal oficial:', config.canal, 'Como usar o Sasuke:', '1. Entre no canal e fale com o dono', `2. Adicione o bot ao grupo`, `3. Use ${P}gratis (1 dia) ou ${P}alugar`, `4. Digite ${P}menu`],
      'SASUKE BOT'
    );

  // ── F-Auto: foto automática após .compra (guarda em config.json) ──
  C['f-auto'] = async (c) => {
    if (!(await soDono(c))) return;
    const a = (c.args[0] || '').toLowerCase();
    config.fauto = a === 'on' ? true : a === 'off' ? false : !config.fauto;
    try {
      fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2));
    } catch (e) {
      console.error('Não consegui salvar config.json:', e.message);
    }
    await c.send([`F-Auto: ${config.fauto ? 'ATIVADO' : 'DESATIVADO'}`, config.fauto ? 'Cada .compra envia a foto media/venda.jpg.' : 'Nenhuma foto automática.'], 'F-AUTO');
  };
  async function fotoVenda(c) {
    const f = path.join(__dirname, 'media', 'venda.jpg');
    if (!fs.existsSync(f)) return console.warn('f-auto ligado mas media/venda.jpg não existe');
    await c.sock.sendMessage(c.from, { image: fs.readFileSync(f), caption: moldura(['Veja como pagar e envie o comprovativo.'], 'F-AUTO') }, { quoted: c.msg });
  }

  // ───────────────────────── ALIAS ─────────────────────────
  const alias = {};
  const apelidos = {
    menu: ['menubot', 'imenu'],
    adm: ['ad'],
    google: ['g-search', 'google-search'],
    gerarlink: ['gera-link', 'gerar-link', 'to-link'],
    lid: ['get-lid', 'getlid', 'meu-lid'],
    raw: ['info-msg', 'metadados', 'obter-metadados-mensagem', 'raw-message'],
    link: ['linkgrupo'],
    exemplos: ['exemplo-de-mensagem', 'exemplo-de-mensagens', 'exemplos-de-mensagens'],
    poll: ['exemplo-poll', 'poll-example'],
    'enviar-lista': ['list'],
    infogrupo: ['obter-dados-grupo'],
    pagamento: ['m-pesa', 'mpesa', 'payment'],
    embacar: ['embaçar', 'embaça'],
    f: ['fk', 'fq', 'f-quote'],
    abrir: ['abre', 'abre-grupo', 'abrir-grupo', 'open', 'open-group', 'abri'],
    fechar: ['fecha', 'fechar-grupo', 'close', 'close-group'],
    limpar: ['clear', 'clear-chat', 'limpa', 'limpargrupo', 'limgroup'],
    delete: ['del', 'd'],
    nomegrupo: ['nome-grupo', 'mudar-nome-grupo', 'set-group-name', 'set-name'],
    add: ['adicionar'],
    promover: ['promove', 'promote', 'p'],
    rebaixar: ['rebaixa', 'demote'],
    revelar: ['reveal', 'rv'],
    kick: ['rm'],
    hidetag: ['hide-tag', 'to-tag'],
    antilink: ['anti-link'],
    mutar: ['mute'],
    desmutar: ['unmute'],
    soadm: ['only-adm', 'only-admin', 'so-admin', 'only-administrator', 'only-administrators', 'only-admins', 'so-adm', 'so-administrador', 'so-administradores', 'so-admins'],
    periodoremocao: ['periodo-remocao'],
    statusremocao: ['status-remocao'],
    fantasmas: ['remover5', 'tirar5', 'rfantasmas5'],
    agendar: ['agendar-mensagem'],
    alarme: ['setalarme', 'addalarme', 'adalarme', 'al'],
    autocomprovativo: ['auto-comprovativo', 'autocomprovstivo', 'autocomptovativo', 'autocomptovstivo'],
    autoremover: ['auto-remover'],
    autofechar: ['auto-fechar', 'autoclose'],
    autoresponder: ['auto-responder'],
    bemvindo: ['boas', 'boasvinda', 'boasvindas', 'boavinda', 'boavindas', 'welcome', 'welkom', 'welkon'],
    saida: ['exit'],
    calendario: ['cale'],
    listanano: ['nanocomandos'],
    vendaauto: ['venda-automatica', 'venda-automativa', 'vendaautomatica', 'vendaautomativa'],
    verificarsms: ['sms', 'checkrecibo', 'verificarrecibo'],
    telefones: ['listtelefones'],
    relatorio: ['relatório'],
    'ban-senha': ['bansenha'],
    'f-auto': ['fauto'],
    up: ['upload'],
    settoken: ['configurartoken'],
    migrartoken: ['migrartokens'],
  };
  for (const [alvoCmd, lista] of Object.entries(apelidos)) for (const a of lista) alias[a] = alvoCmd;

  // ───────────────────────── MENU ─────────────────────────
  const MEMBROS = [
    ['PAREAMENTO / CONEXAO', ['.pareamento258XXX - codigo', '.qrcode / .qr / .qrc - QR Code']],
    ['ALUGUEL / GRATIS', ['.gratis - 1 dia gratis', '.alugar  .alugados  .desaprovar']],
    ['COMPRAS & MEGAS', ['.compra  .comprovativo  .megas', '.saldo  .depositar', '.verificarsms  .pagamento / .mpesa', '.picos  .picospv  .restanas']],
    ['AJUDA & INFORMACOES', ['.menu / .menubot / .imenu', '.ola  .info  .adm  .ajuda', '.criador / .dono  .bot', '.ping  .id  .sasuke  .uptime']],
    ['PESQUISA & FERRAMENTAS', ['.cep  .chave  .extrair', '.google  .gerar-link  .lid', '.raw  .verificar  .link', '.tempo  .calcula  .calendario', '.ti  .app  .up / .upload (dono)']],
    ['ENVIO & EXEMPLOS', ['.enviar-texto  .enviar-reacoes', '.enviar-lista  .buttons', '.enviar-imagem-de-url/arquivo/buffer', '.enviar-video-de-url/arquivo/buffer', '.enviar-gif-de-url/buffer', '.exemplo-poll  .exemplos  .funcoes-grupo', '.obter-dados-grupo']],
    ['OUTROS - MEMBROS', ['.s - figurinha', '.embacar  .mirror  .pb  .px  .rn  .rec', '.f - citacao falsa  .cadeia', '.revelar - ver unica vez  .bolsonaro']],
  ];
  const ADMINS = [
    ['VENDAS & FINANCEIRO', ['.setmegas  .compras  .anularcompra', '.ativarcompras  .limparcompras', '.faltacompra  .semcompra', '.pagamentos  .relatorio', '.addsaldo  .telefones', '.addtelefone  .deltelefone', '.venda-automatica', '.addpico  .delpico', '.setrestanas  .limparrestanas', '.token  .settoken  .migrartoken', '.f-auto on/off']],
    ['GESTAO DE GRUPOS', ['.abrir / .abre / .open', '.fechar / .fecha / .close', '.grupo  .grupo-f  .auto-fechar', '.nome-grupo  .limpar  .delete', '.kick / .ban / .rm', '.promover  .rebaixar', '.add  .add-adm  .infogrupo', '.hidetag  .tag-all  .addgp  .comunicar']],
    ['SEGURANCA & MODERACAO', ['.anti-link  .antifoto  .antispam', '.anticoncorrencia', '.antiestrangeiros-on / -off', '.mutar  .desmutar  .ban-senha', '.only-adm', '.periodo-remocao  .status-remocao', '.rfantasmas5 / .remover5 / .tirar5']],
    ['AUTOMACOES', ['.agendar  .alarme', '.auto-comprovativo  .auto-remover', '.auto-responder', '.bemvindo  .saida', '.nanoadd  .nanodel  .listanano']],
  ];
  const secoes = (lista) => lista.map(([t, l]) => bloco(t, l)).join('\n');
  function menuTextos() {
    return [secoes(MEMBROS), '🔐 ' + L.mono('AREA DE ADMINISTRACAO') + '\n' + secoes(ADMINS)];
  }

  const livres = ['ola', 'info', 'ajuda', 'pagamento', 'megas'];
  return { comandos: C, alias, livres, antes, participantes, personalizado, iniciarTimers, menuTextos, _parseRecibo: parseRecibo };
};
