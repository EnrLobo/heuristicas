const pptxgen = require("pptxgenjs");

const NAVY = "1E2761";
const ICE = "CADCFC";
const OFFWHITE = "F4F6FB";
const WHITE = "FFFFFF";
const CORAL = "E74C3C";
const DARKTEXT = "1B1F2A";
const MUTED = "5B6479";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
const PAGE_W = 13.33;

function bgSlide(dark = false) {
  const s = pres.addSlide();
  s.background = { color: dark ? NAVY : WHITE };
  return s;
}

function footer(s, n, dark = false) {
  s.addText(`${n}`, {
    x: PAGE_W - 0.7, y: 7.08, w: 0.5, h: 0.3, fontFace: "Arial", fontSize: 10,
    color: dark ? ICE : MUTED, align: "right",
  });
  s.addText("Problema da Mochila 0/1 — VNS vs Algoritmo Genético", {
    x: 0.5, y: 7.08, w: 7, h: 0.3, fontFace: "Arial", fontSize: 10,
    color: dark ? ICE : MUTED, align: "left",
  });
}

function circleIcon(s, x, y, d, glyph, opts = {}) {
  s.addShape("ellipse", { x, y, w: d, h: d, fill: { color: opts.fill || NAVY }, line: { type: "none" } });
  s.addText(glyph, {
    x, y, w: d, h: d, align: "center", valign: "middle",
    fontFace: "Arial", fontSize: opts.fontSize || 22, bold: true, color: opts.color || WHITE,
  });
}

// ================= SLIDE 1 — TITULO =================
{
  const s = bgSlide(true);
  s.addShape("ellipse", { x: 10.6, y: -2.2, w: 6, h: 6, fill: { color: "263577" }, line: { type: "none" } });
  s.addShape("ellipse", { x: -2.5, y: 5, w: 5, h: 5, fill: { color: "263577" }, line: { type: "none" } });

  s.addText("PROBLEMA DA MOCHILA 0/1", {
    x: 0.9, y: 2.15, w: 10, h: 0.5, fontFace: "Arial", fontSize: 16, color: ICE, charSpacing: 3, bold: true,
  });
  s.addText("VNS vs Algoritmo Genético", {
    x: 0.9, y: 2.65, w: 11, h: 1.3, fontFace: "Cambria", fontSize: 44, color: WHITE, bold: true,
  });
  s.addText("Comparação de duas meta-heurísticas: qualidade, tempo e convergência", {
    x: 0.9, y: 3.75, w: 10.5, h: 0.6, fontFace: "Arial", fontSize: 18, color: ICE, italic: true,
  });

  s.addText("Heurísticas e Meta-heurísticas  •  Trabalho Acadêmico", {
    x: 0.9, y: 4.65, w: 8, h: 0.4, fontFace: "Arial", fontSize: 13, color: "9FB0DE",
  });
}

// ================= SLIDE 2 — O PROBLEMA =================
{
  const s = bgSlide(false);
  s.addText("O Problema", { x: 0.7, y: 0.5, w: 8, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY });
  s.addText("Knapsack 0/1: escolher itens para maximizar valor sem estourar o peso", {
    x: 0.7, y: 1.15, w: 10.5, h: 0.4, fontFace: "Arial", fontSize: 15, color: MUTED,
  });

  // coluna esquerda: explicacao
  const items = [
    ["Entrada", "n itens, cada um com peso e valor; capacidade máxima C da mochila"],
    ["Decisão", "para cada item, incluir (1) ou não incluir (0) — daí o nome \"0/1\""],
    ["Objetivo", "maximizar o valor total sem que a soma dos pesos ultrapasse C"],
    ["Desafio", "NP-difícil: nº de combinações cresce exponencialmente (2ⁿ)"],
  ];
  let y = 1.9;
  items.forEach(([t, d]) => {
    circleIcon(s, 0.7, y, 0.5, "•", { fill: NAVY, fontSize: 20 });
    s.addText(t, { x: 1.45, y: y - 0.05, w: 3, h: 0.4, fontFace: "Arial", fontSize: 15, bold: true, color: DARKTEXT });
    s.addText(d, { x: 1.45, y: y + 0.32, w: 6.6, h: 0.6, fontFace: "Arial", fontSize: 12.5, color: MUTED });
    y += 1.15;
  });

  // coluna direita: mochila estilizada
  const bx = 9.0, by = 1.9, bw = 3.6, bh = 4.6;
  s.addShape("roundRect", { x: bx, y: by, w: bw, h: bh, rectRadius: 0.15, fill: { color: OFFWHITE }, line: { color: ICE, width: 1.5 } });
  s.addText("MOCHILA", { x: bx, y: by + 0.25, w: bw, h: 0.35, align: "center", fontFace: "Arial", fontSize: 13, bold: true, color: NAVY, charSpacing: 2 });
  s.addText("Capacidade C", { x: bx, y: by + 0.6, w: bw, h: 0.3, align: "center", fontFace: "Arial", fontSize: 11, italic: true, color: MUTED });

  const boxColors = [NAVY, CORAL, "5C7CE0", NAVY];
  const boxLabels = ["item 1", "item 3", "item 5", "item 7"];
  let iy = by + 1.15;
  boxColors.forEach((c, i) => {
    s.addShape("roundRect", { x: bx + 0.4, y: iy, w: bw - 0.8, h: 0.6, rectRadius: 0.08, fill: { color: c }, line: { type: "none" } });
    s.addText(boxLabels[i], { x: bx + 0.4, y: iy, w: bw - 0.8, h: 0.6, align: "center", valign: "middle", fontFace: "Arial", fontSize: 12, bold: true, color: WHITE });
    iy += 0.78;
  });

  footer(s, 2);
}

// ================= SLIDE 3 — METODOLOGIA =================
{
  const s = bgSlide(false);
  s.addText("Metodologia", { x: 0.7, y: 0.5, w: 8, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY });
  s.addText("Representação comum e reparo guloso, usados pelos dois algoritmos", {
    x: 0.7, y: 1.15, w: 10.5, h: 0.4, fontFace: "Arial", fontSize: 15, color: MUTED,
  });

  const cardW = 3.75, cardH = 3.9, gap = 0.35, startX = 0.7, startY = 2.0;
  const cards = [
    ["1", "Representação", "Cada solução é um vetor binário x = (x1...xn). xi = 1 significa que o item i está na mochila."],
    ["2", "Reparo Guloso", "Se o peso passa da capacidade, remove-se o item de pior razão valor/peso, um a um, até caber."],
    ["3", "Solução sempre válida", "Toda solução gerada — por vizinhança ou por cruzamento — passa pelo reparo antes de ser avaliada."],
  ];
  cards.forEach(([n, t, d], i) => {
    const x = startX + i * (cardW + gap);
    s.addShape("roundRect", { x, y: startY, w: cardW, h: cardH, rectRadius: 0.12, fill: { color: OFFWHITE }, line: { type: "none" } });
    circleIcon(s, x + 0.35, startY + 0.35, 0.55, n, { fill: i === 1 ? CORAL : NAVY, fontSize: 22 });
    s.addText(t, { x: x + 0.35, y: startY + 1.1, w: cardW - 0.7, h: 0.5, fontFace: "Arial", fontSize: 16, bold: true, color: DARKTEXT });
    s.addText(d, { x: x + 0.35, y: startY + 1.65, w: cardW - 0.7, h: 2.0, fontFace: "Arial", fontSize: 12.5, color: MUTED, lineSpacingMultiple: 1.25 });
  });

  footer(s, 3);
}

// ================= SLIDE 4 — VNS vs AG (comparacao lado a lado) =================
{
  const s = bgSlide(false);
  s.addText("As Duas Heurísticas", { x: 0.7, y: 0.5, w: 10, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY });
  s.addText("Uma meta-heurística local e uma populacional", {
    x: 0.7, y: 1.15, w: 10.5, h: 0.4, fontFace: "Arial", fontSize: 15, color: MUTED,
  });

  const colW = 5.7, colH = 4.7, y0 = 2.0;
  const leftX = 0.7, rightX = 0.7 + colW + 0.5;

  // VNS card
  s.addShape("roundRect", { x: leftX, y: y0, w: colW, h: colH, rectRadius: 0.12, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("VNS", { x: leftX + 0.4, y: y0 + 0.3, w: colW - 0.8, h: 0.5, fontFace: "Cambria", fontSize: 22, bold: true, color: WHITE });
  s.addText("Variable Neighborhood Search  —  busca local", { x: leftX + 0.4, y: y0 + 0.78, w: colW - 0.8, h: 0.4, fontFace: "Arial", fontSize: 12, italic: true, color: ICE });
  const vnsSteps = [
    "Parte de 1 solução (construção gulosa)",
    "Alterna vizinhanças N1 (1 bit), N2 (2 bits), N3 (3 bits)",
    "Perturba (shaking) + busca local até ótimo local",
    "Melhorou? volta pra N1. Não? tenta vizinhança maior",
  ];
  let vy = y0 + 1.4;
  vnsSteps.forEach((t) => {
    s.addShape("ellipse", { x: leftX + 0.4, y: vy + 0.06, w: 0.12, h: 0.12, fill: { color: ICE }, line: { type: "none" } });
    s.addText(t, { x: leftX + 0.65, y: vy - 0.12, w: colW - 1.1, h: 0.6, fontFace: "Arial", fontSize: 13, color: WHITE, lineSpacingMultiple: 1.15 });
    vy += 0.78;
  });

  // AG card
  s.addShape("roundRect", { x: rightX, y: y0, w: colW, h: colH, rectRadius: 0.12, fill: { color: OFFWHITE }, line: { color: ICE, width: 1 } });
  s.addText("AG", { x: rightX + 0.4, y: y0 + 0.3, w: colW - 0.8, h: 0.5, fontFace: "Cambria", fontSize: 22, bold: true, color: CORAL });
  s.addText("Algoritmo Genético  —  populacional", { x: rightX + 0.4, y: y0 + 0.78, w: colW - 0.8, h: 0.4, fontFace: "Arial", fontSize: 12, italic: true, color: MUTED });
  const agSteps = [
    "População inicial: 1 indivíduo guloso + aleatórios",
    "Seleção por torneio escolhe os pais mais aptos",
    "Crossover uniforme + mutação (bit-flip) geram filhos",
    "Elitismo: o melhor indivíduo sempre sobrevive",
  ];
  let ay = y0 + 1.4;
  agSteps.forEach((t) => {
    s.addShape("ellipse", { x: rightX + 0.4, y: ay + 0.06, w: 0.12, h: 0.12, fill: { color: CORAL }, line: { type: "none" } });
    s.addText(t, { x: rightX + 0.65, y: ay - 0.12, w: colW - 1.1, h: 0.6, fontFace: "Arial", fontSize: 13, color: DARKTEXT, lineSpacingMultiple: 1.15 });
    ay += 0.78;
  });

  footer(s, 4);
}

// ================= SLIDE 5 — PROTOCOLO EXPERIMENTAL =================
{
  const s = bgSlide(false);
  s.addText("Protocolo Experimental", { x: 0.7, y: 0.5, w: 10, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY });
  s.addText("Como os dois algoritmos foram testados e comparados", {
    x: 0.7, y: 1.15, w: 10.5, h: 0.4, fontFace: "Arial", fontSize: 15, color: MUTED,
  });

  const stats = [
    ["9", "instâncias testadas\n(5 a 100 itens)"],
    ["9", "combinações de\nparâmetros por algoritmo"],
    ["3", "sementes aleatórias\npor combinação"],
    ["486", "execuções totais\n(243 por algoritmo)"],
  ];
  const cw = 2.75, gap = 0.3, startX = 0.7, y0 = 2.15;
  stats.forEach(([n, l], i) => {
    const x = startX + i * (cw + gap);
    s.addShape("roundRect", { x, y: y0, w: cw, h: 2.0, rectRadius: 0.12, fill: { color: i === 3 ? NAVY : OFFWHITE }, line: { type: "none" } });
    s.addText(n, { x, y: y0 + 0.25, w: cw, h: 0.9, align: "center", fontFace: "Arial", fontSize: 46, bold: true, color: i === 3 ? WHITE : NAVY });
    s.addText(l, { x: x + 0.15, y: y0 + 1.2, w: cw - 0.3, h: 0.7, align: "center", fontFace: "Arial", fontSize: 12, color: i === 3 ? ICE : MUTED });
  });

  s.addText("Bases de dados", { x: 0.7, y: 4.55, w: 6, h: 0.4, fontFace: "Arial", fontSize: 15, bold: true, color: DARKTEXT });
  s.addText(
    "P01 a P08 (Burkardt/FSU, 5–24 itens)  +  knapPI_1_100_1000_1 (Pisinger, 100 itens)",
    { x: 0.7, y: 5.0, w: 11.5, h: 0.4, fontFace: "Arial", fontSize: 13, color: MUTED }
  );

  s.addText("Parâmetros testados", { x: 0.7, y: 5.55, w: 6, h: 0.4, fontFace: "Arial", fontSize: 15, bold: true, color: DARKTEXT });
  s.addText(
    [
      { text: "VNS: ", options: { bold: true, color: NAVY } },
      { text: "k_max ∈ {2, 3, 5}   ×   iterações ∈ {50, 100, 200}\n", options: {} },
      { text: "AG: ", options: { bold: true, color: CORAL } },
      { text: "população ∈ {20, 50, 100}   ×   gerações ∈ {50, 100, 200}", options: {} },
    ],
    { x: 0.7, y: 6.0, w: 11.5, h: 0.8, fontFace: "Arial", fontSize: 13, color: MUTED, lineSpacingMultiple: 1.3 }
  );

  footer(s, 5);
}

// ================= SLIDE 6 — RESULTADOS: QUALIDADE E TEMPO =================
{
  const s = bgSlide(false);
  s.addText("Resultados: Qualidade e Tempo", { x: 0.7, y: 0.5, w: 11, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: NAVY });
  s.addText("Médias sobre as 243 execuções de cada algoritmo", {
    x: 0.7, y: 1.15, w: 10.5, h: 0.4, fontFace: "Arial", fontSize: 15, color: MUTED,
  });

  const chartColors = [NAVY, CORAL];

  s.addChart(
    pres.charts.BAR,
    [{ name: "Gap médio (%)", labels: ["VNS", "AG"], values: [0.14, 0.34] }],
    {
      x: 0.6, y: 2.0, w: 5.7, h: 4.6,
      chartColors,
      showTitle: true, title: "Gap médio em relação ao ótimo (%)", titleFontSize: 14, titleColor: DARKTEXT,
      showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 13, dataLabelColor: DARKTEXT, dataLabelFormatCode: "0.00\"%\"",
      catAxisLabelFontSize: 13, catAxisLabelColor: DARKTEXT,
      valAxisLabelColor: MUTED, valAxisLabelFontSize: 10,
      valGridLine: { color: "E5E5E5", size: 1 }, catGridLine: { style: "none" },
      showLegend: false, barGapWidthPct: 60,
    }
  );

  s.addChart(
    pres.charts.BAR,
    [{ name: "Tempo médio (s)", labels: ["VNS", "AG"], values: [0.038, 0.088] }],
    {
      x: 6.9, y: 2.0, w: 5.7, h: 4.6,
      chartColors,
      showTitle: true, title: "Tempo médio de execução (s)", titleFontSize: 14, titleColor: DARKTEXT,
      showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 13, dataLabelColor: DARKTEXT, dataLabelFormatCode: "0.000",
      catAxisLabelFontSize: 13, catAxisLabelColor: DARKTEXT,
      valAxisLabelColor: MUTED, valAxisLabelFontSize: 10,
      valGridLine: { color: "E5E5E5", size: 1 }, catGridLine: { style: "none" },
      showLegend: false, barGapWidthPct: 60,
    }
  );

  footer(s, 6);
}

// ================= SLIDE 7 — CONVERGENCIA =================
{
  const s = bgSlide(false);
  s.addText("Resultados: Convergência", { x: 0.7, y: 0.5, w: 11, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: NAVY });
  s.addText("Instância de 100 itens (knapPI_1_100_1000_1) — melhor valor encontrado ao longo das iterações/gerações", {
    x: 0.7, y: 1.15, w: 11.8, h: 0.4, fontFace: "Arial", fontSize: 13.5, color: MUTED,
  });

  const pontos = [0, 2, 4, 6, 8, 10, 15, 20, 40, 60, 80, 100];
  const vns = [8817, 8817, 8817, 8817, 9147, 9147, 9147, 9147, 9147, 9147, 9147, 9147];
  const ag  = [8817, 8929, 9147, 9147, 9147, 9147, 9147, 9147, 9147, 9147, 9147, 9147];

  s.addChart(
    pres.charts.LINE,
    [
      { name: "VNS", labels: pontos.map(String), values: vns },
      { name: "AG", labels: pontos.map(String), values: ag },
    ],
    {
      x: 0.7, y: 1.85, w: 11.9, h: 4.6,
      chartColors: [NAVY, CORAL],
      lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 6,
      showTitle: false,
      catAxisTitle: "Iteração / Geração", showCatAxisTitle: true, catAxisTitleFontSize: 12, catAxisTitleColor: MUTED,
      valAxisTitle: "Melhor valor encontrado", showValAxisTitle: true, valAxisTitleFontSize: 12, valAxisTitleColor: MUTED,
      catAxisLabelFontSize: 11, catAxisLabelColor: MUTED,
      valAxisLabelFontSize: 10, valAxisLabelColor: MUTED,
      valGridLine: { color: "E5E5E5", size: 1 }, catGridLine: { style: "none" },
      showLegend: true, legendPos: "b", legendFontSize: 12,
      valAxisMinVal: 8700, valAxisMaxVal: 9250,
    }
  );

  s.addText("Ambos convergem para o valor ótimo (9.147) em menos de 10 iterações/gerações", {
    x: 0.7, y: 6.6, w: 11.8, h: 0.4, fontFace: "Arial", fontSize: 12, italic: true, color: MUTED, align: "center",
  });

  footer(s, 7);
}

// ================= SLIDE 8 — CONCLUSAO =================
{
  const s = bgSlide(true);
  s.addShape("ellipse", { x: 10.8, y: 4.8, w: 5, h: 5, fill: { color: "263577" }, line: { type: "none" } });

  s.addText("Conclusão", { x: 0.9, y: 0.7, w: 8, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: WHITE });

  const points = [
    ["Ambos encontram o ótimo", "Nas 9 instâncias, VNS e AG alcançaram a solução ótima exata em pelo menos uma combinação de parâmetros."],
    ["VNS: mais consistente e rápido", "Gap médio menor (0,14% vs 0,34%) e ~2,3x mais rápido em instâncias pequenas/médias."],
    ["AG: mais robusto em escala", "Ligeira vantagem de tempo na instância de 100 itens; menos sensível ao crescimento de n."],
    ["Escolha depende do contexto", "VNS quando se quer velocidade e consistência; AG quando a instância cresce muito."],
  ];
  let y = 1.7;
  points.forEach(([t, d], i) => {
    circleIcon(s, 0.9, y, 0.5, String(i + 1), { fill: i % 2 === 0 ? CORAL : "3D4F9E", fontSize: 20 });
    s.addText(t, { x: 1.65, y: y - 0.05, w: 10, h: 0.4, fontFace: "Arial", fontSize: 16, bold: true, color: WHITE });
    s.addText(d, { x: 1.65, y: y + 0.35, w: 10.3, h: 0.55, fontFace: "Arial", fontSize: 12.5, color: ICE });
    y += 1.15;
  });

  footer(s, 8, true);
}

pres.writeFile({ fileName: "/home/claude/work/knapsack_project/results/apresentacao_knapsack.pptx" }).then(() => {
  console.log("Apresentacao salva.");
});
