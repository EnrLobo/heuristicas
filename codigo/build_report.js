const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, ImageRun, Header, Footer,
  PageNumber, NumberFormat, LevelFormat,
} = require("docx");
const fs = require("fs");

const NAVY = "1F4E78";
const LIGHT_GRAY = "F2F2F2";
const WHITE = "FFFFFF";

function cell(text, { bold = false, fill = null, color = "000000", align = AlignmentType.LEFT, width, size = 19 } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: fill ? { type: ShadingType.CLEAR, fill, color: "auto" } : undefined,
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text: String(text), bold, color, font: "Arial", size })],
      }),
    ],
  });
}

function headerCell(text, width) {
  return cell(text, { bold: true, fill: NAVY, color: WHITE, align: AlignmentType.CENTER, width, size: 17 });
}

// ---------- Tabela resumo por instancia ----------
const resumo = [
  ["P01", "10", "309", "309", "0,00%", "309", "0,00%"],
  ["P02", "5", "51", "51", "0,00%", "51", "1,74%"],
  ["P03", "6", "150", "150", "0,00%", "150", "0,10%"],
  ["P04", "7", "107", "107", "0,00%", "107", "0,00%"],
  ["P05", "8", "900", "900", "0,00%", "900", "0,06%"],
  ["P06", "7", "1735", "1735", "0,00%", "1735", "0,00%"],
  ["P07", "15", "1458", "1458", "0,08%", "1458", "0,11%"],
  ["P08", "24", "13.549.094", "13.549.094", "0,31%", "13.549.094", "0,25%"],
  ["knapPI_1_100_1000_1", "100", "9.147", "9.147", "0,88%", "9.147", "0,84%"],
];

const widths = [3100, 700, 1150, 1150, 950, 1150, 950];
const headerRow = new TableRow({
  tableHeader: true,
  children: [
    headerCell("Instância", widths[0]),
    headerCell("N itens", widths[1]),
    headerCell("Ótimo", widths[2]),
    headerCell("Melhor VNS", widths[3]),
    headerCell("Gap médio VNS", widths[4]),
    headerCell("Melhor AG", widths[5]),
    headerCell("Gap médio AG", widths[6]),
  ],
});

const dataRows = resumo.map((r, i) => new TableRow({
  children: r.map((val, j) => cell(val, { fill: i % 2 === 0 ? LIGHT_GRAY : WHITE, width: widths[j], align: j === 0 ? AlignmentType.LEFT : AlignmentType.CENTER, size: 17 })),
}));

const tabelaResumo = new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths,
  rows: [headerRow, ...dataRows],
});

// ---------- Tabela de parametros testados ----------
const pw = [1800, 3200, 3500];
const paramHeaderRow = new TableRow({
  tableHeader: true,
  children: [
    headerCell("Algoritmo", pw[0]),
    headerCell("Parâmetro", pw[1]),
    headerCell("Valores testados", pw[2]),
  ],
});
const paramRows = [
  ["VNS", "k_max (nº de estruturas de vizinhança)", "2, 3, 5"],
  ["VNS", "max_iterations", "50, 100, 200"],
  ["AG", "pop_size (tamanho da população)", "20, 50, 100"],
  ["AG", "generations (nº de gerações)", "50, 100, 200"],
  ["AG", "crossover_rate / mutation_rate (fixos)", "0,9 / 0,02"],
].map((r, i) => new TableRow({
  children: [
    cell(r[0], { fill: i % 2 === 0 ? LIGHT_GRAY : WHITE, width: pw[0] }),
    cell(r[1], { fill: i % 2 === 0 ? LIGHT_GRAY : WHITE, width: pw[1] }),
    cell(r[2], { fill: i % 2 === 0 ? LIGHT_GRAY : WHITE, width: pw[2], align: AlignmentType.CENTER }),
  ],
}));
const tabelaParametros = new Table({
  width: { size: pw.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: pw,
  rows: [paramHeaderRow, ...paramRows],
});

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 } });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 150 },
    children: [new TextRun({ text, font: "Arial", size: 22, ...opts })],
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
  });
}

const imageBuffer = fs.readFileSync("/home/claude/work/knapsack_project/results/charts/convergencia.png");

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Heurísticas e Meta-heurísticas — Problema da Mochila 0/1", font: "Arial", size: 16, color: "808080" })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Página ", font: "Arial", size: 16, color: "808080" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "808080" }),
            ],
          })],
        }),
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Comparação de Heurísticas para o Problema da Mochila 0/1", bold: true, size: 34, font: "Arial", color: NAVY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "VNS (Variable Neighborhood Search) vs. Algoritmo Genético", italics: true, size: 24, font: "Arial", color: "555555" })],
        }),

        heading("1. Introdução"),
        body(
          "Este relatório apresenta a implementação e a comparação de duas meta-heurísticas aplicadas ao " +
          "Problema da Mochila 0/1 (0/1 Knapsack Problem): uma meta-heurística de busca local, o VNS " +
          "(Variable Neighborhood Search), e uma meta-heurística populacional, o Algoritmo Genético (AG). " +
          "Ambas foram implementadas em Python e avaliadas sobre 9 instâncias de referência: as instâncias " +
          "clássicas P01 a P08 (Burkardt/FSU, 5 a 24 itens) e a instância knapPI_1_100_1000_1 do conjunto de " +
          "Pisinger (100 itens), permitindo avaliar o comportamento dos algoritmos tanto em problemas pequenos " +
          "quanto em uma instância de maior escala."
        ),

        heading("2. Metodologia"),
        body(
          "Representação: em ambos os algoritmos, uma solução é um vetor binário x = (x1, ..., xn), onde xi = 1 " +
          "indica que o item i está na mochila. Como movimentos de vizinhança e operadores genéticos podem " +
          "gerar soluções que excedem a capacidade, foi utilizada uma estratégia de reparo guloso: sempre que " +
          "uma solução é inviável, os itens de pior razão valor/peso são removidos, um a um, até que a " +
          "capacidade volte a ser respeitada. Isso garante que ambos os algoritmos trabalhem sempre com " +
          "soluções válidas."
        ),
        body(
          "VNS: parte de uma solução construída pela heurística gulosa clássica (itens ordenados por razão " +
          "valor/peso) e alterna entre três estruturas de vizinhança de complexidade crescente (N1: 1 bit, " +
          "N2: 2 bits, N3: 3 bits), com busca local best-improvement em N1 após cada perturbação (shaking)."
        ),
        body(
          "Algoritmo Genético: população inicial combinando um indivíduo guloso e indivíduos aleatórios; " +
          "seleção por torneio (k = 3); crossover uniforme; mutação por bit-flip; elitismo (o melhor indivíduo " +
          "sempre sobrevive à próxima geração)."
        ),
        body("Protocolo experimental: para cada uma das 9 instâncias, cada algoritmo foi executado em 9 combinações de parâmetros diferentes, cada uma repetida com 3 sementes aleatórias distintas — totalizando 486 execuções (243 por algoritmo). Os parâmetros testados foram:"),
        tabelaParametros,
        body(""),

        heading("3. Resultados"),
        body(
          "A tabela a seguir resume, para cada instância: o valor ótimo conhecido, o melhor valor encontrado " +
          "por cada algoritmo (considerando todas as combinações de parâmetros e sementes) e o gap médio " +
          "percentual em relação ao ótimo, calculado sobre todas as execuções de cada algoritmo naquela instância."
        ),
        tabelaResumo,
        body(""),
        body(
          "Em todas as 9 instâncias, tanto o VNS quanto o AG foram capazes de encontrar a solução ótima exata " +
          "em pelo menos uma das combinações de parâmetros testadas. A diferença de desempenho aparece na " +
          "consistência: o gap médio (calculado sobre todas as 27 execuções de cada algoritmo por instância — " +
          "9 combinações de parâmetros x 3 sementes) foi, de forma geral, menor no VNS.",
        ),

        heading("3.1 Convergência"),
        body(
          "Os gráficos abaixo mostram a evolução do melhor valor encontrado ao longo das iterações (VNS) e " +
          "gerações (AG) para as duas instâncias mais desafiadoras (P08 e knapPI_1_100_1000_1, com " +
          "k_max=3/max_iterations=200 para o VNS e pop_size=50/generations=100 para o AG):"
        ),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: { width: 580, height: 220 },
              type: "png",
            }),
          ],
        }),
        body(
          "Em ambas as instâncias, os dois algoritmos convergem rapidamente (dentro das primeiras 10-20 " +
          "iterações/gerações) e depois estabilizam, sem melhora adicional — um comportamento típico em " +
          "instâncias de porte pequeno/médio, onde o espaço de busca é suficientemente explorado cedo."
        ),

        heading("4. Discussão comparativa"),
        heading("4.1 Qualidade da solução", HeadingLevel.HEADING_2),
        body(
          "O VNS apresentou gap médio geral de 0,14%, contra 0,34% do AG (considerando todas as 243 execuções " +
          "de cada algoritmo). Isso é esperado: o VNS realiza busca local intensiva (best-improvement) a cada " +
          "iteração, o que o aproxima rapidamente de ótimos locais de alta qualidade, enquanto o AG depende " +
          "mais da diversidade populacional e é mais sensível a más combinações de parâmetros (ex.: população " +
          "pequena combinada com poucas gerações)."
        ),
        heading("4.2 Tempo de execução", HeadingLevel.HEADING_2),
        body(
          "O VNS foi, em média, mais rápido que o AG (0,038s vs 0,088s por execução, considerando todas as " +
          "instâncias e parâmetros). Isso se deve principalmente ao custo por iteração: o AG avalia toda uma " +
          "população (e refaz o reparo) a cada geração, enquanto o VNS avalia apenas os n vizinhos de uma única " +
          "solução por iteração de busca local."
        ),
        heading("4.3 Iterações/gerações e convergência", HeadingLevel.HEADING_2),
        body(
          "Ambos os algoritmos convergem cedo para instâncias pequenas (poucas dezenas de iterações/gerações " +
          "já bastam). Para a instância de 100 itens, o AG demonstrou uma leve vantagem de tempo em relação ao " +
          "VNS com parâmetros mais agressivos, pois a busca local do VNS (que testa todos os n bits a cada " +
          "passo de melhora) fica proporcionalmente mais cara à medida que n cresce — um ponto relevante para " +
          "escalar os algoritmos a instâncias ainda maiores."
        ),

        heading("5. Conclusão"),
        body(
          "Ambas as meta-heurísticas se mostraram eficazes para o Problema da Mochila 0/1, encontrando a " +
          "solução ótima exata em todas as 9 instâncias testadas quando bem parametrizadas. O VNS destacou-se " +
          "pela consistência (menor gap médio) e velocidade em instâncias pequenas/médias, enquanto o AG " +
          "mostrou-se competitivo e mais robusto ao crescimento do número de itens, à custa de maior " +
          "variabilidade nos resultados entre diferentes combinações de parâmetros. A escolha entre as duas " +
          "abordagens, na prática, depende do porte da instância e da importância relativa entre qualidade " +
          "garantida e tempo de execução."
        ),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/home/claude/work/knapsack_project/results/comparacao_heuristicas.docx", buffer);
  console.log("Documento salvo.");
});
