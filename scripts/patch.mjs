// Recalcula specs (parser melhorado) e completa descrições faltantes.
import { readFileSync, writeFileSync } from "node:fs";
const REPO = "C:/Users/ggcat/pneustore-catalogo/";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function deriveSpec(title) {
  const o = {};
  if (!title) return o;
  // 1) métrica: 195/55R16 87H | 175/70R14C 95/93T | 225/45R18 (95Y) XL | 110/90-17 60P
  let m = title.match(/(\d{2,3})\/(\d{2,3})\s*(ZR|R|B|D|-)?\s*(\d{2}(?:\.\d)?)C?\s*\(?\s*(\d{2,3}(?:\/\d{2,3})?)\s*([A-Z]{1,3})\)?/);
  if (m) { o.larguraMm = +m[1]; o.perfil = +m[2]; o.construcao = (m[3] === '-' || m[3] === 'D') ? 'Diagonal' : 'Radial'; o.aro = m[4]; o.indiceCarga = m[5]; o.indiceVelocidade = m[6]; return o; }
  // 2) sem perfil: 185R14C 102/100R | 5.60-15 79P
  m = title.match(/(\d{1,3}(?:\.\d{1,2})?)\s*(R|-)\s*(\d{2}(?:\.\d)?)C?\s*\(?\s*(\d{2,3}(?:\/\d{2,3})?)\s*([A-Z]{1,3})?\)?/);
  if (m) { o.larguraMm = parseFloat(m[1]); o.construcao = m[2] === '-' ? 'Diagonal' : 'Radial'; o.aro = m[3]; o.indiceCarga = m[4]; if (m[5]) o.indiceVelocidade = m[5]; return o; }
  // 3) flotation/off-road: 33x12.50R20 114Q
  m = title.match(/(\d{2}(?:\.\d)?)x(\d{1,2}\.\d{1,2})\s*(R|-)?\s*(\d{2}(?:\.\d)?)\s*(\d{2,3})?([A-Z])?/);
  if (m) { o.diametroPol = +m[1]; o.larguraPol = +m[2]; o.construcao = m[3] === '-' ? 'Diagonal' : 'Radial'; o.aro = m[4]; if (m[5]) o.indiceCarga = m[5]; if (m[6]) o.indiceVelocidade = m[6]; return o; }
  return o;
}

function extractDesc(html, title) {
  const i = html.indexOf("Sobre o produto");
  if (i < 0) return null;
  let r = html.slice(i, i + 14000).replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ");
  const cut = r.search(/Veja o que est[aã]o falando|Fique por dentro|Produtos relacionados|Avalia[çc][õo]es/);
  if (cut > 0) r = r.slice(0, cut);
  r = r.replace("Sobre o produto", "").replace("Informações técnicas", "").replace("Veículos Aplicáveis", "").replace(/\*\*/g, "").trim();
  if (title && r.startsWith(title)) r = r.slice(title.length).trim();
  return r.length > 15 ? r : null;
}

function gerarDesc(p) {
  const s = p.specs || {};
  const partes = [];
  partes.push(`${p.title}.`);
  if (p.brand) partes.push(`Pneu da marca ${p.brand}${p.aro ? `, aro ${p.aro}` : ""}${p.measure ? `, medida ${p.measure}` : ""}.`);
  const ficha = [];
  if (s.larguraMm) ficha.push(`largura ${s.larguraMm}mm`);
  if (s.perfil) ficha.push(`perfil ${s.perfil}`);
  if (s.construcao) ficha.push(`construção ${s.construcao.toLowerCase()}`);
  if (s.indiceCarga) ficha.push(`índice de carga ${s.indiceCarga}`);
  if (s.indiceVelocidade) ficha.push(`índice de velocidade ${s.indiceVelocidade}`);
  if (ficha.length) partes.push(`Especificações: ${ficha.join(", ")}.`);
  return partes.join(" ");
}

const list = JSON.parse(readFileSync(REPO + "produtos.json"));

// 1) recalcula specs
let specAntes = 0, specDepois = 0;
for (const p of list) {
  const tinha = p.specs && Object.keys(p.specs).length;
  if (tinha) specAntes++;
  p.specs = deriveSpec(p.title);
  if (Object.keys(p.specs).length) specDepois++;
}

// 2) completa descrições faltantes (<40 ch ou nulas)
const faltam = list.filter(p => !p.description || p.description.length < 40);
console.log("Rebuscar descrição de", faltam.length, "itens...");
for (const p of faltam) {
  try {
    const h = await (await fetch(p.url, { headers: { "User-Agent": UA } })).text();
    const d = extractDesc(h, p.title);
    if (d) p.description = d;
  } catch { }
  if (!p.description || p.description.length < 40) p.description = gerarDesc(p); // fallback gerado
  await sleep(200);
}

writeFileSync(REPO + "produtos.json", JSON.stringify(list, null, 2));
const semSpec = list.filter(p => !p.specs || !Object.keys(p.specs).length);
const semDesc = list.filter(p => !p.description).length;
console.log(`specs: antes ${specAntes} -> depois ${specDepois} (sem specs: ${semSpec.length})`);
console.log("sem descrição agora:", semDesc);
if (semSpec.length) { console.log("ainda sem specs (amostra):"); semSpec.slice(0, 12).forEach(p => console.log("  ", p.title)); }
