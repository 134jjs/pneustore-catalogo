// Enriquece cada produto (descrição, imagens, specs, avaliação) e baixa as imagens.
// Resumível: pula produtos já concluídos (marcados em _done.json).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const SRC = "C:/Users/ggcat/pneus-pneustore/produtos.json";
const REPO = "C:/Users/ggcat/pneustore-catalogo/";
const IMGDIR = REPO + "imagens/";
const OUT = REPO + "produtos.json";
const DONE = REPO + "scripts/_done.json";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const CONC = 5;

function deriveSpec(title) {
  const o = {};
  if (!title) return o;
  // metrica: 195/55R16 87H | 110/90-17 60P | 215/75R17.5 135/133J
  let m = title.match(/(\d{2,3})\/(\d{2,3})\s*(ZR|R|B|D|-)?\s*(\d{2}(?:\.\d)?)\s+(\d{2,3}(?:\/\d{2,3})?)\s*([A-Z]{1,3})\b/);
  if (m) {
    o.larguraMm = +m[1]; o.perfil = +m[2];
    o.construcao = m[3] === '-' || m[3] === 'D' ? 'Diagonal' : 'Radial';
    o.aro = m[4]; o.indiceCarga = m[5]; o.indiceVelocidade = m[6];
    return o;
  }
  // flotation/off-road: 33x12.50R20 114Q
  m = title.match(/(\d{2}(?:\.\d)?)x(\d{1,2}\.\d{1,2})\s*(R|-)?\s*(\d{2}(?:\.\d)?)\s*(\d{2,3})?([A-Z])?/);
  if (m) {
    o.diametroPol = +m[1]; o.larguraPol = +m[2];
    o.construcao = m[3] === '-' ? 'Diagonal' : 'Radial';
    o.aro = m[4]; if (m[5]) o.indiceCarga = m[5]; if (m[6]) o.indiceVelocidade = m[6];
  }
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

function parseLD(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  for (const b of blocks) {
    try {
      const arr = [].concat(JSON.parse(b));
      for (const x of arr) if (x["@type"] === "Product") return x;
    } catch { }
  }
  return null;
}

async function fetchText(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { headers: H }); if (r.ok) return await r.text(); if (r.status === 404) return null; }
    catch { } await sleep(600 * (i + 1));
  }
  return null;
}
async function fetchBuf(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { headers: H }); if (r.ok) return Buffer.from(await r.arrayBuffer()); if (r.status === 404) return null; }
    catch { } await sleep(600 * (i + 1));
  }
  return null;
}

const src = JSON.parse(readFileSync(SRC));
const done = existsSync(DONE) ? new Set(JSON.parse(readFileSync(DONE))) : new Set();
const outMap = existsSync(OUT) ? new Map(JSON.parse(readFileSync(OUT)).map(p => [p.sku, p])) : new Map();

let queue = src.filter(p => !done.has(p.sku));
if (process.env.LIMIT) queue = queue.slice(0, +process.env.LIMIT);
console.log(`Total ${src.length} | já feitos ${done.size} | fila ${queue.length}`);

let n = 0, imgCount = 0, fail = 0;
async function worker(items) {
  for (const base of items) {
    const sku = base.sku;
    try {
      const html = await fetchText(base.url);
      const rec = { ...base };
      if (html) {
        const ld = parseLD(html);
        rec.description = extractDesc(html, base.title) || (ld && (ld.description || "").trim()) || null;
        if (ld) {
          rec.rating = ld.aggregateRating ? { value: +ld.aggregateRating.ratingValue, count: +ld.aggregateRating.reviewCount } : null;
          if (ld.offers) {
            rec.availability = /InStock/.test(ld.offers.availability) ? "InStock" : "OutOfStock";
            if (ld.offers.price) rec.price = parseFloat(ld.offers.price);
          }
          rec.imageUrls = Array.isArray(ld.image) ? ld.image : (ld.image ? [ld.image] : []);
        }
      }
      if (!rec.imageUrls || !rec.imageUrls.length) rec.imageUrls = base.image ? [base.image] : [];
      rec.specs = deriveSpec(base.title);
      // baixa imagens
      const dir = IMGDIR + sku + "/";
      const localImgs = [];
      if (rec.imageUrls.length) {
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        let k = 0;
        for (const u of rec.imageUrls) {
          k++;
          const clean = u.replace(/\?.*$/, "");
          const file = dir + k + ".webp";
          const rel = "imagens/" + sku + "/" + k + ".webp";
          if (!existsSync(file)) {
            const buf = await fetchBuf(clean);
            if (buf) { writeFileSync(file, buf); imgCount++; }
            else continue;
          }
          localImgs.push(rel);
        }
      }
      rec.images = localImgs;
      delete rec.image;
      outMap.set(sku, rec);
      done.add(sku);
    } catch (e) { fail++; }
    n++;
    if (n % 25 === 0) {
      writeFileSync(OUT, JSON.stringify([...outMap.values()], null, 2));
      writeFileSync(DONE, JSON.stringify([...done]));
      process.stdout.write(`\r  feitos ${n}/${queue.length} | imgs baixadas ${imgCount} | falhas ${fail}   `);
    }
    await sleep(120);
  }
}

// divide a fila entre workers
const chunks = Array.from({ length: CONC }, () => []);
queue.forEach((it, i) => chunks[i % CONC].push(it));
await Promise.all(chunks.map(worker));

writeFileSync(OUT, JSON.stringify([...outMap.values()], null, 2));
writeFileSync(DONE, JSON.stringify([...done]));
console.log(`\n\nFIM. produtos ${outMap.size} | imgs baixadas nesta run ${imgCount} | falhas ${fail}`);
