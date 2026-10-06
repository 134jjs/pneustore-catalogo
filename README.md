# Catálogo de Pneus — Pneustore

Catálogo com **4929 pneus** coletados da Pneustore, pronto para importar em outra loja.
Inclui descrição, ficha técnica (medidas/índices), preço, avaliação e **todas as imagens baixadas** (hospedadas neste repositório, não dependem do site de origem).

> 🤖 **Vai importar isto com o Claude?** Comece pelo **[IMPORT.md](IMPORT.md)** — é o passo a passo escrito para o agente de IA.

## Conteúdo

| Arquivo | Descrição |
|---|---|
| `produtos.json` | **Fonte da verdade.** Array de produtos (um objeto por produto). |
| `produtos.schema.json` | Schema (JSON Schema) descrevendo cada campo. |
| `IMPORT.md` | Guia de importação para o agente de IA. |
| `produtos.csv` | Mesma informação em planilha (separador `;`). |
| `imagens/<sku>/` | Imagens de cada produto (`1.webp`, `2.webp`, …); a 1ª é a capa. |
| `scripts/` | Scripts de coleta (reprodutível). |

## Números

- **Total:** 4929 produtos — 4929 com descrição (100%)
- **Imagens:** 14584 arquivos (~3.0 por produto)
- **Em estoque:** 3995 · Fora de estoque: 934
- **Por tipo:** carro: 3000 · moto: 1429 · caminhao_onibus: 500
- **Preço:** R$ 66.16 a R$ 7124.90 (mediana R$ 789.90)
- **Top marcas:** Pirelli (694), Speedmax (560), Michelin (519), Continental (304), Metzeler (283), Bridgestone (242), Goodyear (228), Itaro (206), Kumho (183), Rinaldi (126), Dynamo (95), Trazano (88), Firestone (87), Onyx (85), Technic (77), Farroad (74), Gripmaster (67), BFGoodrich (59), General Tire by Continental (57), Kenda (57)

## Estrutura de um produto (produtos.json)

```json
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
```

## Observações

- **Imagens:** internalizadas neste repo (caminhos relativos em `images`). O campo `imageUrls` guarda as URLs originais apenas como referência.
- **Preços/estoque** refletem o momento da coleta — revise antes de publicar.
- Dados coletados para fins de montagem de catálogo próprio.
