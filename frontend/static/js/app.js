/* ============================================================
   app.js — front-end puro (sem framework), consome a API Flask.
   Nenhum algoritmo roda aqui: isso so desenha o que o backend
   Python calculou (fetch em /api/run e /api/experiments).
============================================================ */

const API = {
  instances: () => fetch('/api/instances').then(r => r.json()),
  run: (body) => fetch('/api/run', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json()),
  experiments: () => fetch('/api/experiments', { method:'POST' }).then(r => r.json()),
};

let INSTANCES = [];
let mode = 'vns';
let chart = null;
let overallChart = null;
let animToken = 0;

/* ---------------------------------------------------------- TABS ---- */
document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const tab = btn.dataset.tab;
  [...document.getElementById('tabs').children].forEach(b => b.classList.toggle('active', b === btn));
  document.getElementById('panel-demo-controls').style.display = tab === 'demo' ? 'block' : 'none';
  document.getElementById('panel-experiments-controls').style.display = tab === 'experiments' ? 'block' : 'none';
  document.getElementById('panel-demo').style.display = tab === 'demo' ? 'block' : 'none';
  document.getElementById('panel-experiments').style.display = tab === 'experiments' ? 'block' : 'none';
});

/* ---------------------------------------------------------- DEMO UI ---- */
const els = {
  instanceSelect: document.getElementById('instanceSelect'),
  modeSeg: document.getElementById('modeSeg'),
  vnsControls: document.getElementById('vnsControls'),
  agControls: document.getElementById('agControls'),
  kMax: document.getElementById('kMax'), kMaxVal: document.getElementById('kMaxVal'),
  popSize: document.getElementById('popSize'), popSizeVal: document.getElementById('popSizeVal'),
  iterations: document.getElementById('iterations'), iterVal: document.getElementById('iterVal'),
  seed: document.getElementById('seed'), diceBtn: document.getElementById('diceBtn'),
  runBtn: document.getElementById('runBtn'),
  bagsWrap: document.getElementById('bagsWrap'),
  bagStatus: document.getElementById('bagStatus'),
  chartStatus: document.getElementById('chartStatus'),
  statOptimal: document.getElementById('statOptimal'),
  statFound: document.getElementById('statFound'),
  statFoundSub: document.getElementById('statFoundSub'),
  statGap: document.getElementById('statGap'),
  statGapSub: document.getElementById('statGapSub'),
  statTime: document.getElementById('statTime'),
  statTimeSub: document.getElementById('statTimeSub'),
};

function fmtInt(n){ return Number(n).toLocaleString('pt-BR'); }

async function init(){
  INSTANCES = await API.instances();
  INSTANCES.forEach((inst, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${inst.name}  ·  ${inst.n} itens`;
    els.instanceSelect.appendChild(opt);
  });
  els.instanceSelect.value = 0;
  renderBagsSkeleton();
  ensureChart();
}
init();

els.modeSeg.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  mode = btn.dataset.mode;
  [...els.modeSeg.children].forEach(b => b.classList.toggle('active', b === btn));
  els.vnsControls.style.display = (mode === 'vns' || mode === 'compare') ? 'flex' : 'none';
  els.agControls.style.display = (mode === 'ag' || mode === 'compare') ? 'flex' : 'none';
});

els.kMax.addEventListener('input', () => els.kMaxVal.textContent = els.kMax.value);
els.popSize.addEventListener('input', () => els.popSizeVal.textContent = els.popSize.value);
els.iterations.addEventListener('input', () => els.iterVal.textContent = els.iterations.value);
els.diceBtn.addEventListener('click', () => { els.seed.value = Math.floor(Math.random()*100000); });

function buildBagCard(key, title){
  return `
    <div class="bag-card ${key}" id="bagCard-${key}">
      <div class="bag-head">
        <h3>${title}</h3>
        <span class="weight" id="bagWeight-${key}">peso 0 / 0</span>
      </div>
      <div class="capacity-track"><div class="capacity-fill" id="bagFill-${key}" style="width:0%"></div></div>
      <div class="items-grid" id="bagItems-${key}"></div>
      <div class="bag-stats">
        <div>Itens na mochila: <b id="bagCount-${key}">0</b></div>
        <div>Valor atual: <b id="bagValue-${key}">0</b></div>
      </div>
    </div>`;
}

function renderBagsSkeleton(){
  if (mode === 'compare'){
    els.bagsWrap.className = 'bags compare';
    els.bagsWrap.innerHTML = buildBagCard('vns','VNS') + buildBagCard('ag','Algoritmo Genético');
  } else if (mode === 'vns') {
    els.bagsWrap.className = 'bags single';
    els.bagsWrap.innerHTML = buildBagCard('vns','VNS');
  } else {
    els.bagsWrap.className = 'bags single';
    els.bagsWrap.innerHTML = buildBagCard('ag','Algoritmo Genético');
  }
}

function updateBag(inst, key, x, fVal){
  const weights = inst.weights;
  let w = 0;
  for(let i=0;i<x.length;i++) w += x[i]*weights[i];
  const pct = Math.min(100, (w / inst.capacity) * 100);

  const fill = document.getElementById(`bagFill-${key}`);
  if (!fill) return;
  document.getElementById(`bagWeight-${key}`).textContent = `peso ${fmtInt(w)} / ${fmtInt(inst.capacity)}`;
  fill.style.width = pct.toFixed(1) + '%';

  let count = 0;
  const blocks = [];
  for(let i=0;i<x.length;i++){
    if (x[i] === 1){
      count++;
      const widthPct = Math.max(1.2, (weights[i] / inst.capacity) * 100);
      blocks.push(`<div class="item-block" style="width:${widthPct.toFixed(2)}%; min-width:5px;" title="item ${i+1} — peso ${weights[i]}"></div>`);
    }
  }
  document.getElementById(`bagItems-${key}`).innerHTML = blocks.join('');
  document.getElementById(`bagCount-${key}`).textContent = count;
  document.getElementById(`bagValue-${key}`).textContent = fmtInt(fVal);
}

function ensureChart(){
  if (chart) chart.destroy();
  const ctx = document.getElementById('convChart').getContext('2d');
  chart = new Chart(ctx, {
    type:'line',
    data:{ labels:[], datasets:[] },
    options:{
      responsive:true, maintainAspectRatio:false, animation:false,
      interaction:{ intersect:false, mode:'index' },
      plugins:{
        legend:{ display:true, position:'bottom', labels:{ font:{family:'Inter', size:12.5}, color:'#5B6479', usePointStyle:true } },
      },
      scales:{
        x:{ title:{ display:true, text:'Iteração / Geração', color:'#5B6479', font:{size:12} },
            ticks:{ color:'#5B6479', maxTicksLimit:8 }, grid:{ display:false } },
        y:{ title:{ display:true, text:'Melhor valor encontrado', color:'#5B6479', font:{size:12} },
            ticks:{ color:'#5B6479' }, grid:{ color:'#EEF1F8' } }
      }
    }
  });
}

function subsampleFrames(len, maxFrames){
  if (len <= maxFrames) return Array.from({length:len}, (_,i)=>i);
  const frames = [];
  for(let i=0;i<maxFrames;i++) frames.push(Math.round(i * (len-1) / (maxFrames-1)));
  return [...new Set(frames)];
}

function setStatus(running){
  els.bagStatus.textContent = running ? 'executando' : 'concluído';
  els.bagStatus.className = 'status ' + (running ? 'running' : 'done');
  els.chartStatus.textContent = running ? 'executando' : 'concluído';
  els.chartStatus.className = 'status ' + (running ? 'running' : 'done');
}

async function animateRun(inst, results){
  const myToken = ++animToken;
  ensureChart();
  renderBagsSkeleton();
  setStatus(true);

  const keys = Object.keys(results);
  const colors = { vns:'#1E2761', ag:'#E74C3C' };
  const labels = { vns:'VNS', ag:'Algoritmo Genético' };

  const maxLen = Math.max(...keys.map(k => results[k].history.length));
  chart.data.labels = Array.from({length:maxLen}, (_,i)=>i);
  chart.data.datasets = keys.map(k => ({
    label:labels[k], data:[], borderColor:colors[k], backgroundColor:colors[k],
    borderWidth:2.5, pointRadius:0, tension:0
  }));
  chart.update();

  const frames = subsampleFrames(maxLen, 55);
  const frameDelay = Math.max(16, Math.min(70, 2200 / frames.length));

  for (const f of frames){
    if (myToken !== animToken) return;
    keys.forEach((k, di) => {
      const hist = results[k].history;
      const point = hist[Math.min(f, hist.length-1)];
      chart.data.datasets[di].data[f] = point.fitness;
      updateBag(inst, k, point.x, point.fitness);
    });
    chart.update('none');
    await new Promise(r => setTimeout(r, frameDelay));
  }

  keys.forEach((k, di) => {
    const hist = results[k].history;
    const last = hist[hist.length-1];
    for(let i=0;i<maxLen;i++){
      if (chart.data.datasets[di].data[i] === undefined){
        const src = hist[Math.min(i, hist.length-1)];
        chart.data.datasets[di].data[i] = src.fitness;
      }
    }
    updateBag(inst, k, last.x, last.fitness);
  });
  chart.update('none');

  setStatus(false);
  renderStats(inst, results);
}

function renderStats(inst, results){
  els.statOptimal.textContent = fmtInt(inst.optimal);
  const keys = Object.keys(results);
  if (keys.length === 1){
    const k = keys[0];
    const r = results[k];
    const gap = 100 * (inst.optimal - r.bestFitness) / inst.optimal;
    els.statFound.textContent = fmtInt(r.bestFitness);
    els.statFoundSub.textContent = k === 'vns' ? 'VNS' : 'Algoritmo Genético';
    els.statGap.textContent = gap.toFixed(2) + '%';
    els.statGapSub.textContent = gap === 0 ? 'ótimo exato encontrado!' : 'distância até o ótimo';
    els.statTime.textContent = r.time.toFixed(3) + 's';
    els.statTimeSub.textContent = `${r.steps} ${k==='vns' ? 'iterações' : 'gerações'}`;
  } else {
    const r1 = results.vns, r2 = results.ag;
    const g1 = 100*(inst.optimal-r1.bestFitness)/inst.optimal;
    const g2 = 100*(inst.optimal-r2.bestFitness)/inst.optimal;
    els.statFound.textContent = `${fmtInt(r1.bestFitness)} / ${fmtInt(r2.bestFitness)}`;
    els.statFoundSub.textContent = 'VNS / AG';
    els.statGap.textContent = `${g1.toFixed(2)}% / ${g2.toFixed(2)}%`;
    els.statGapSub.textContent = 'VNS / AG';
    els.statTime.textContent = `${r1.time.toFixed(3)}s / ${r2.time.toFixed(3)}s`;
    els.statTimeSub.textContent = 'VNS / AG';
  }
}

async function run(){
  const instIdx = Number(els.instanceSelect.value);
  const inst = INSTANCES[instIdx];
  const body = {
    instanceId: instIdx,
    mode,
    seed: Number(els.seed.value) || 42,
    iterations: Number(els.iterations.value),
    kMax: Number(els.kMax.value),
    popSize: Number(els.popSize.value),
  };

  els.runBtn.disabled = true;
  els.runBtn.textContent = '⏳ Executando no backend...';

  try {
    const data = await API.run(body);
    await animateRun(inst, data.results);
  } finally {
    els.runBtn.disabled = false;
    els.runBtn.textContent = '▶ Executar';
  }
}
els.runBtn.addEventListener('click', run);

/* ---------------------------------------------------------- EXPERIMENTOS ---- */
const runExperimentsBtn = document.getElementById('runExperimentsBtn');
const experimentsHint = document.getElementById('experimentsHint');
const experimentsEmpty = document.getElementById('experimentsEmpty');
const experimentsResults = document.getElementById('experimentsResults');
const overallStats = document.getElementById('overallStats');
const byInstanceTableBody = document.querySelector('#byInstanceTable tbody');

function ensureOverallChart(){
  if (overallChart) overallChart.destroy();
  const ctx = document.getElementById('overallChart').getContext('2d');
  overallChart = new Chart(ctx, {
    type:'bar',
    data:{ labels:['Gap médio (%)','Tempo médio (s) ×10'], datasets:[
      { label:'VNS', backgroundColor:'#1E2761', data:[] },
      { label:'AG', backgroundColor:'#E74C3C', data:[] },
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ font:{family:'Inter', size:12.5}, color:'#5B6479' } } },
      scales:{
        x:{ ticks:{ color:'#5B6479' }, grid:{ display:false } },
        y:{ ticks:{ color:'#5B6479' }, grid:{ color:'#EEF1F8' } }
      }
    }
  });
}

runExperimentsBtn.addEventListener('click', async () => {
  runExperimentsBtn.disabled = true;
  runExperimentsBtn.textContent = '⏳ Rodando 486 execuções...';
  experimentsHint.textContent = 'Isso roda no backend Python, aguarde...';

  try {
    const data = await API.experiments();
    renderExperiments(data);
  } finally {
    runExperimentsBtn.disabled = false;
    runExperimentsBtn.textContent = '▶ Rodar bateria completa';
  }
});

function renderExperiments(data){
  experimentsEmpty.style.display = 'none';
  experimentsResults.style.display = 'block';
  experimentsHint.textContent = `Concluído: ${data.totalRuns} execuções em ${data.elapsed.toFixed(1)}s.`;

  const vnsRow = data.overall.find(r => r.algoritmo === 'VNS');
  const agRow = data.overall.find(r => r.algoritmo === 'AG');

  ensureOverallChart();
  overallChart.data.datasets[0].data = [vnsRow.gapMedio, vnsRow.tempoMedio*10];
  overallChart.data.datasets[1].data = [agRow.gapMedio, agRow.tempoMedio*10];
  overallChart.update();

  overallStats.innerHTML = [vnsRow, agRow].map(r => `
    <div class="stat-card">
      <div class="label">${r.algoritmo} — ${r.execucoes} execuções</div>
      <div class="value ${r.algoritmo==='VNS'?'navy':'coral'}">${r.gapMedio.toFixed(2)}%</div>
      <div class="sub">gap médio · ${r.tempoMedio.toFixed(3)}s médio · ${r.otimosExatos} ótimos exatos</div>
    </div>
  `).join('');

  byInstanceTableBody.innerHTML = data.byInstance.map(r => `
    <tr>
      <td>${r.instancia}</td>
      <td class="badge-${r.algoritmo.toLowerCase()==='vns'?'vns':'ag'}">${r.algoritmo}</td>
      <td>${fmtInt(r.otimo)}</td>
      <td>${fmtInt(r.melhorEncontrado)}</td>
      <td>${r.gapMedio.toFixed(2)}%</td>
      <td>${r.tempoMedio.toFixed(3)}s</td>
    </tr>
  `).join('');
}
