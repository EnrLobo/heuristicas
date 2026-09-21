# Problema da Mochila 0/1 — VNS vs Algoritmo Genético

Trabalho da disciplina de Heurísticas e Meta-heurísticas. Implementa e compara duas
meta-heurísticas aplicadas ao Problema da Mochila 0/1 (0/1 Knapsack Problem):

- **VNS** (Variable Neighborhood Search) — meta-heurística de busca local
- **AG** (Algoritmo Genético) — meta-heurística populacional

Testadas em 9 instâncias de referência (P01–P08 do conjunto Burkardt/FSU, e
`knapPI_1_100_1000_1` do conjunto Pisinger), com uma grade de parâmetros e múltiplas
sementes aleatórias por combinação.

Além do código, o projeto inclui um **site interativo** para demonstrar o trabalho:
o backend (Python/Flask) executa os algoritmos de verdade, e o frontend
(HTML/CSS/JS) anima os resultados em tempo real.

## Arquitetura

```
┌────────────────────┐      fetch() / JSON      ┌──────────────────────────┐
│      FRONTEND       │ ───────────────────────▶ │        BACKEND            │
│  HTML + CSS + JS     │ ◀─────────────────────── │  Flask (Python)            │
│  (Chart.js p/ gráf.) │                           │  VNS + AG rodam de verdade │
└────────────────────┘                           └──────────────────────────┘
```

O frontend **não reimplementa os algoritmos** — ele só desenha o que o backend
Python calculou. Isso garante que os números mostrados no site são sempre
idênticos aos do relatório e da planilha entregues (mesmo código-fonte).

## Estrutura de pastas

```
.
├── backend/
│   ├── app.py                 # servidor Flask + API REST
│   ├── core/                  # os algoritmos em si (mesmo codigo do trabalho)
│   │   ├── knapsack_instance.py   # leitura das instancias + representacao do problema
│   │   ├── repair.py              # reparo guloso + construcao gulosa
│   │   ├── vns.py                 # VNS
│   │   └── ga.py                  # Algoritmo Genetico
│   └── data/                  # as 9 instancias (bases originais)
│       ├── fsu/                   # P01 a P08
│       └── knapPI_1_100_1000_1.txt
├── frontend/
│   ├── index.html
│   └── static/
│       ├── css/style.css
│       └── js/app.js          # consome a API via fetch, anima o resultado
├── experiments/
│   ├── run_experiments.py     # roda a bateria oficial (486 execucoes) -> CSV
│   ├── build_spreadsheet.py   # gera a planilha .xlsx a partir do CSV
│   └── results/                # gerado ao rodar os scripts acima (nao versionado)
├── docs/                      # entregaveis finais do trabalho
│   ├── comparacao_heuristicas.docx
│   ├── planilha_resultados.xlsx
│   └── apresentacao_knapsack.pptx
├── requirements.txt
└── README.md
```

## Como rodar o site

Pré-requisito: Python 3.9+.

```bash
# 1. (recomendado) crie um ambiente virtual
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. instale as dependencias
pip install -r requirements.txt

# 3. suba o servidor
cd backend
python3 app.py
```

Abra **http://localhost:5000** no navegador. O site tem duas abas:

- **Demonstração** — escolha uma instância e parâmetros, clique em Executar, e veja
  a mochila sendo preenchida ao vivo + o gráfico de convergência.
- **Experimentos** — roda a bateria oficial de 486 execuções (leva ~30s) e mostra
  um resumo comparativo (gap médio, tempo médio) e uma tabela por instância.

## Como rodar os algoritmos isoladamente (sem o site)

Cada arquivo em `backend/core/` também roda sozinho e imprime uma tabela com os
resultados nas 9 instâncias:

```bash
cd backend/core
python3 vns.py
python3 ga.py
```

## Como reproduzir os resultados oficiais (relatório/planilha)

Os scripts em `experiments/` reproduzem exatamente os números usados no relatório
(`docs/comparacao_heuristicas.docx`) e na planilha (`docs/planilha_resultados.xlsx`):

```bash
cd experiments
python3 run_experiments.py     # roda 486 execucoes -> results/raw_results.csv
python3 build_spreadsheet.py   # monta results/planilha_resultados.xlsx
```

## Metodologia (resumo)

- **Representação**: vetor binário `x = (x1, ..., xn)`, `xi = 1` = item i na mochila.
- **Reparo guloso**: soluções que excedem a capacidade têm os itens de pior razão
  valor/peso removidos, um a um, até voltarem a ser viáveis.
- **VNS**: parte de uma construção gulosa; alterna vizinhanças N1 (1 bit), N2 (2 bits)
  e N3 (3 bits); busca local best-improvement em N1 após cada perturbação.
- **AG**: população inicial (1 indivíduo guloso + aleatórios); seleção por torneio
  (k=3); crossover uniforme; mutação bit-flip; elitismo.

### Parâmetros testados na bateria oficial

| Algoritmo | Parâmetro | Valores testados |
|---|---|---|
| VNS | `k_max` | 2, 3, 5 |
| VNS | `max_iterations` | 50, 100, 200 |
| AG | `pop_size` | 20, 50, 100 |
| AG | `generations` | 50, 100, 200 |

9 combinações por algoritmo × 9 instâncias × 3 sementes = **486 execuções**.

## Bases de dados

- **P01–P08**: [Burkardt/FSU — 0/1 Knapsack Problem datasets](https://people.sc.fsu.edu/~jburkardt/datasets/knapsack_01/knapsack_01.html)
- **knapPI_1_100_1000_1**: [Pisinger — 0/1 Knapsack instances (large_scale)](https://github.com/dnlfm/knapsack-01-instances)

## Entregáveis (`docs/`)

- `comparacao_heuristicas.docx` — relatório com metodologia, resultados e discussão
- `planilha_resultados.xlsx` — as 486 execuções + resumos por parâmetro/algoritmo
- `apresentacao_knapsack.pptx` — slides para apresentação em sala
