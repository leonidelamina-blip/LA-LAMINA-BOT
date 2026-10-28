// Utilitários: banco JSON na raiz, moldura sombria e helpers de rede
const fs = require('fs'), path = require('path'), axios = require('axios');
const raiz = path.join(__dirname, '..');
const ler = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(raiz, f), 'utf8')); } catch { return d; } };
const salvar = (f, d) => fs.writeFileSync(path.join(raiz, f), JSON.stringify(d, null, 2));
const A = 'ཻུ۪۪⸙ཻུ͎۪۪';

// Moldura sombria — usada em TODAS as mensagens
const moldura = (linhas, titulo = '') => {
  const corpo = [].concat(linhas).join('\n').split('\n').map(l => (l ? `│ ✧˚ ༘♡ 🩸 ${l}` : '│'));
  return [`╭─•❁${A}🩸${titulo ? ` ${titulo} 👁️ ` : ''}${A}❁─╮`, ...corpo, `╰─•❁${A}🩸${A}❁─╯`].join('\n');
};
const pick = a => a[Math.floor(Math.random() * a.length)];
const http = (u, o = {}) => axios.get(u, { timeout: 30000, ...o });
// Procura a primeira URL / texto dentro de qualquer JSON de API
const achaUrl = o => {
  if (typeof o === 'string') return /^https?:\/\//.test(o) ? o : null;
  if (o && typeof o === 'object') for (const v of Object.values(o)) { const r = achaUrl(v); if (r) return r; }
  return null;
};
const achaTxt = o => {
  if (typeof o === 'string') return o;
  if (o && typeof o === 'object') for (const k of ['result', 'response', 'answer', 'message', 'text', 'data']) { const r = achaTxt(o[k]); if (r) return r; }
  return null;
};
// Gera imagem por IA (retorna Buffer)
const imagemIA = async c => {
  const r = await http(c.cfg.apis.img + encodeURIComponent(c.q), { responseType: 'arraybuffer' });
  if ((r.headers['content-type'] || '').startsWith('image')) return Buffer.from(r.data);
  const u = achaUrl(JSON.parse(Buffer.from(r.data).toString()));
  if (!u) throw new Error('a API não devolveu imagem');
  return Buffer.from((await http(u, { responseType: 'arraybuffer' })).data);
};
module.exports = { ler, salvar, moldura, pick, http, achaUrl, achaTxt, imagemIA };
