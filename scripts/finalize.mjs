// Gera produtos.csv, produtos-shopify.csv e README.md a partir do produtos.json enriquecido.
import { readFileSync, writeFileSync } from "node:fs";
const REPO = "C:/Users/ggcat/pneustore-catalogo/";
const list = JSON.parse(readFileSync(REPO + "produtos.json"));

const esc = (v) => { if (v == null) return ""; const s = String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

// 1) CSV simples/completo
const cols = ["sku", "tipo", "title", "brand", "aro", "measure", "price", "priceOriginal", "discount", "emEstoque", "availability",
  "rating_value", "rating_count", "larguraMm", "perfil", "construcao", "indiceCarga", "indiceVelocidade", "description", "images", "url"];
const rows = list.map(p => cols.map(c => {
  if (c === "rating_value") return esc(p.rating?.value);
  if (c === "rating_count") return esc(p.rating?.count);
  if (["larguraMm", "perfil", "construcao", "indiceCarga", "indiceVelocidade"].includes(c)) return esc(p.specs?.[c]);
  if (c === "images") return esc((p.images || []).join("|"));
  return esc(p[c]);
}).join(";"));
writeFileSync(REPO + "produtos.csv", "﻿" + [cols.join(";"), ...rows].join("\n"));

// 2) estatísticas
const porTipo = {}, porMarca = {};
let comDesc = 0, totImgs = 0, emEst = 0;
for (const p of list) {
  porTipo[p.tipo] = (porTipo[p.tipo] || 0) + 1;
  if (p.brand) porMarca[p.brand] = (porMarca[p.brand] || 0) + 1;
  if (p.description) comDesc++;
  totImgs += (p.images || []).length;
  if (p.emEstoque) emEst++;
}
const topMarcas = Object.entries(porMarca).sort((a, b) => b[1] - a[1]).slice(0, 20);
const marcas = Object.keys(porMarca).sort();
const precos = list.filter(p => p.price).map(p => p.price).sort((a, b) => a - b);

const readme = `# Catálogo de Pneus — Pneustore

Catálogo com **${list.length} pneus** coletados da Pneustore, pronto para importar em outra loja.
Inclui descrição, ficha técnica (medidas/índices), preço, avaliação e **todas as imagens baixadas** (hospedadas neste repositório, não dependem do site de origem).

> 🤖 **Vai importar isto com o Claude?** Comece pelo **[IMPORT.md](IMPORT.md)** — é o passo a passo escrito para o agente de IA.

## Conteúdo

| Arquivo | Descrição |
|---|---|
| \`produtos.json\` | **Fonte da verdade.** Array de produtos (um objeto por produto). |
| \`produtos.schema.json\` | Schema (JSON Schema) descrevendo cada campo. |
| \`IMPORT.md\` | Guia de importação para o agente de IA. |
| \`produtos.csv\` | Mesma informação em planilha (separador \`;\`). |
| \`imagens/<sku>/\` | Imagens de cada produto (\`1.webp\`, \`2.webp\`, …); a 1ª é a capa. |
| \`scripts/\` | Scripts de coleta (reprodutível). |

## Números

- **Total:** ${list.length} produtos — ${comDesc} com descrição (${(100 * comDesc / list.length).toFixed(0)}%)
- **Imagens:** ${totImgs} arquivos (~${(totImgs / list.length).toFixed(1)} por produto)
- **Em estoque:** ${emEst} · Fora de estoque: ${list.length - emEst}
- **Por tipo:** ${Object.entries(porTipo).map(([k, v]) => `${k}: ${v}`).join(" · ")}
- **Preço:** R$ ${precos[0]?.toFixed(2)} a R$ ${precos[precos.length - 1]?.toFixed(2)} (mediana R$ ${precos[Math.floor(precos.length / 2)]?.toFixed(2)})
- **Top marcas:** ${topMarcas.map(([k, v]) => `${k} (${v})`).join(", ")}

## Estrutura de um produto (produtos.json)

\`\`\`json
{
  "sku": "10120084",
  "tipo": "carro",
  "title": "Pneu Continental Aro 16 PowerContact 2 195/55R16 87H",
  "brand": "Continental",
  "aro": "16",
  "measure": "195/55R16",
  "price": 579.90,
  "priceOriginal": 644.34,
  "discount": 10,
  "emEstoque": true,
  "availability": "InStock",
  "rating": { "value": 4.8, "count": 26 },
  "specs": { "larguraMm": 195, "perfil": 55, "construcao": "Radial", "aro": "16", "indiceCarga": "87", "indiceVelocidade": "H" },
  "description": "Continental é uma fabricante alemã ...",
  "images": ["imagens/10120084/1.webp", "imagens/10120084/2.webp", "imagens/10120084/3.webp"],
  "url": "https://www.pneustore.com.br/..."
}
\`\`\`

## Observações

- **Imagens:** internalizadas neste repo (caminhos relativos em \`images\`). O campo \`imageUrls\` guarda as URLs originais apenas como referência.
- **Preços/estoque** refletem o momento da coleta — revise antes de publicar.
- Dados coletados para fins de montagem de catálogo próprio.
`;
writeFileSync(REPO + "README.md", readme);
console.log("Gerado: produtos.csv, README.md");
console.log("Produtos:", list.length, "| com descrição:", comDesc, "| imagens:", totImgs, "| em estoque:", emEst);
