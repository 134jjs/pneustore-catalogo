# Guia de importação (para o agente de IA)

> Este documento é instrução direta para o Claude que vai importar este catálogo em uma loja.
> Leia tudo antes de começar. Não presuma o schema da loja-destino: **confirme no código dela**.

## O que é este repo

Catálogo pronto de pneus (coletado da Pneustore). Fonte da verdade = **`produtos.json`** (array de produtos).
Schema formal em `produtos.schema.json`. As imagens de cada produto já estão baixadas em `imagens/<sku>/`.

## Contexto da loja-destino

As lojas-destino são forks do **brasil-ecom-blueprint** (TanStack Start, SSR). Convenções típicas delas:
- Catálogo em um arquivo de dados consumido no servidor (ex: `src/data/*.json` ou `src/lib/catalog.ts`).
- Imagens internalizadas em **`public/produtos/<categoria>/`** e referenciadas por caminho começando em `/` (SITE_BASE vazio).
- No cliente, dados de produto entram só via server functions / `import type` (nunca embutir o JSON gigante no bundle do cliente).

⚠️ **Antes de importar, abra o repo da loja e identifique:**
1. O arquivo/estrutura exata do catálogo (o tipo TypeScript do produto).
2. Onde ficam as imagens em `public/` e qual o padrão de caminho.
3. Como as categorias/coleções e o menu são definidos.
4. Se há regras de preço (teto, desconto Pix) que afetam o valor exibido.

Depois mapeie os campos deste catálogo para o tipo da loja. Não invente campos que a loja não tem.

## Passo a passo

### 1. Imagens
Copie `imagens/<sku>/` deste repo para a pasta pública da loja, seguindo a convenção dela. Sugerido:
```
imagens/<sku>/N.webp   →   public/produtos/pneus/<sku>/N.webp
```
No produto, as imagens passam a ser referenciadas por `/produtos/pneus/<sku>/N.webp`.
A **primeira imagem** de cada produto (`images[0]`) é a principal/capa.

### 2. Dados
Para cada item de `produtos.json`, crie um produto na loja mapeando:

| Campo daqui | Uso sugerido na loja |
|---|---|
| `sku` | id / sku (chave única — deduplique por ele) |
| `title` | nome do produto |
| `brand` | marca / fabricante |
| `tipo` | categoria/coleção (`carro`, `moto`, `caminhao_onibus`) |
| `description` | descrição da página (texto corrido pt-BR) |
| `specs` | ficha técnica (largura, perfil, aro, índices de carga/velocidade) |
| `measure`, `aro` | atributos/filtros |
| `price` | preço de venda **(revise — é snapshot da coleta)** |
| `priceOriginal` | preço "de/por" (opcional) |
| `emEstoque` / `availability` | status de estoque |
| `rating` | avaliações (opcional; origem é o site de coleta) |
| `images` | galeria (após copiar para `public/`, troque o prefixo `imagens/` pelo caminho público) |
| `url` | NÃO expor na loja — é só proveniência |

### 3. Categorias / menu
Agrupe por `tipo`. Rótulos sugeridos:
`carro` → "Pneus de Carro", `moto` → "Pneus de Moto", `caminhao_onibus` → "Pneus de Caminhão e Ônibus".

### 4. Checagens finais
- **Deduplicar por `sku`** (não deve haver repetidos, mas valide).
- Preços e estoque são do momento da coleta — aplique as regras de preço da loja.
- Produtos fora de estoque estão marcados (`emEstoque: false`); decida se entram ocultos ou com aviso.
- Confirme que toda imagem referenciada existe em `public/` depois da cópia.

## Importante (independência entre lojas)

Cada loja deve ter sua **própria cópia** das imagens e dos dados — não aponte várias lojas para o mesmo arquivo/URL. Internalize tudo no `public/` da loja que está importando.
