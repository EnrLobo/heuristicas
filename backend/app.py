"""
app.py - Servidor Flask do trabalho de Heuristicas e Meta-heuristicas.

Este servidor faz duas coisas:
  1. Serve o site (frontend/index.html + arquivos estaticos).
  2. Expoe uma API REST que executa o VNS e o AG DE VERDADE em Python
     (backend/core/vns.py e backend/core/ga.py, os mesmos algoritmos
     entregues e validados no trabalho) e devolve o resultado em JSON.

O frontend (JavaScript) nao reimplementa os algoritmos: ele so desenha o
que o Python calculou. Isso garante que os numeros mostrados no site sao
sempre identicos aos numeros do relatorio/planilha do trabalho.

Como rodar:
    cd backend
    python3 app.py
Depois abra http://localhost:5000 no navegador.
"""

import sys
import time
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

BACKEND_DIR = Path(__file__).resolve().parent
CORE_DIR = BACKEND_DIR / "core"
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

sys.path.insert(0, str(CORE_DIR))

from knapsack_instance import load_all_instances  # noqa: E402
from vns import vns  # noqa: E402
from ga import genetic_algorithm  # noqa: E402

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR / "static"),
    static_url_path="/static",
)

# Carrega as 9 instancias uma unica vez, quando o servidor sobe.
INSTANCES = load_all_instances(BACKEND_DIR)
INSTANCE_BY_ID = {i: inst for i, inst in enumerate(INSTANCES)}

# Grade de parametros oficial do trabalho (a mesma usada no relatorio/planilha).
SEEDS = [1, 2, 3]
VNS_GRID = [{"k_max": k, "max_iterations": it} for k in (2, 3, 5) for it in (50, 100, 200)]
GA_GRID = [{"pop_size": p, "generations": g} for p in (20, 50, 100) for g in (50, 100, 200)]

# Cache simples em memoria do ultimo resultado da bateria de experimentos,
# para nao ter que rodar tudo de novo so para reler o resumo.
_last_experiment_rows = None


# ---------------------------------------------------------------- paginas --
@app.route("/")
def index():
    return send_from_directory(str(FRONTEND_DIR), "index.html")


# ---------------------------------------------------------------- API ------
@app.route("/api/instances")
def api_instances():
    """Lista as 9 instancias disponiveis (para popular o seletor no site).

    Inclui os pesos de cada item porque o frontend usa isso para desenhar
    os blocos da mochila proporcionalmente ao peso de cada item selecionado.
    """
    return jsonify(
        [
            {
                "id": i,
                "name": inst.name,
                "n": inst.n,
                "capacity": inst.capacity,
                "optimal": inst.known_optimum,
                "weights": inst.weights,
            }
            for i, inst in enumerate(INSTANCES)
        ]
    )


@app.route("/api/run", methods=["POST"])
def api_run():
    """Roda UMA execucao (VNS, AG, ou os dois) numa instancia, com os
    parametros escolhidos no site, e devolve o historico passo a passo
    (usado para animar a mochila enchendo e o grafico de convergencia).
    """
    body = request.get_json(force=True) or {}

    try:
        inst = INSTANCE_BY_ID[int(body.get("instanceId", 0))]
    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "instanceId invalido"}), 400

    mode = body.get("mode", "vns")
    seed = int(body.get("seed", 42))
    iterations = max(1, min(500, int(body.get("iterations", 100))))
    k_max = max(1, min(10, int(body.get("kMax", 3))))
    pop_size = max(4, min(300, int(body.get("popSize", 50))))

    result = {}
    if mode in ("vns", "compare"):
        r = vns(inst, k_max=k_max, max_iterations=iterations, seed=seed, track_solutions=True)
        result["vns"] = _serialize_run(r, r.iterations)
    if mode in ("ag", "compare"):
        r = genetic_algorithm(inst, pop_size=pop_size, generations=iterations, seed=seed, track_solutions=True)
        result["ag"] = _serialize_run(r, r.generations)

    return jsonify(
        {
            "instance": {"name": inst.name, "n": inst.n, "capacity": inst.capacity, "optimal": inst.known_optimum},
            "results": result,
        }
    )


def _serialize_run(r, steps):
    return {
        "bestFitness": r.best_fitness,
        "bestSolution": r.best_solution,
        "time": r.time_seconds,
        "steps": steps,
        "history": [
            {"step": i, "fitness": f, "x": r.history_x[i]}
            for i, f in enumerate(r.history)
        ],
    }


@app.route("/api/experiments", methods=["POST"])
def api_experiments():
    """Roda a bateria OFICIAL de experimentos do trabalho: 9 instancias x
    9 combinacoes de parametros x 3 sementes x 2 algoritmos = 486 execucoes.
    Isso e exatamente o que gera os numeros do relatorio e da planilha
    entregues -- rodar aqui deve reproduzir os mesmos resultados.

    Leva ~25-40s. O frontend mostra um indicador de progresso enquanto espera.
    """
    global _last_experiment_rows

    t0 = time.time()
    rows = []

    for inst in INSTANCES:
        for params in VNS_GRID:
            for seed in SEEDS:
                r = vns(inst, k_max=params["k_max"], max_iterations=params["max_iterations"], seed=seed)
                rows.append(_experiment_row(inst, "VNS", params["k_max"], params["max_iterations"], seed, r.iterations, r.best_fitness, r.time_seconds))
        for params in GA_GRID:
            for seed in SEEDS:
                r = genetic_algorithm(inst, pop_size=params["pop_size"], generations=params["generations"], seed=seed)
                rows.append(_experiment_row(inst, "AG", params["pop_size"], params["generations"], seed, r.generations, r.best_fitness, r.time_seconds))

    _last_experiment_rows = rows
    elapsed = time.time() - t0

    return jsonify(
        {
            "totalRuns": len(rows),
            "elapsed": elapsed,
            "overall": _aggregate_overall(rows),
            "byInstance": _aggregate_by_instance(rows),
        }
    )


def _experiment_row(inst, algo, p1, p2, seed, steps, found, elapsed):
    gap = 100 * (inst.known_optimum - found) / inst.known_optimum if inst.known_optimum else 0
    return {
        "instancia": inst.name,
        "algoritmo": algo,
        "param1": p1,
        "param2": p2,
        "seed": seed,
        "steps": steps,
        "otimo": inst.known_optimum,
        "encontrado": found,
        "gap": gap,
        "tempo": elapsed,
    }


def _aggregate_overall(rows):
    out = []
    for algo in ("VNS", "AG"):
        sub = [r for r in rows if r["algoritmo"] == algo]
        n = len(sub)
        out.append(
            {
                "algoritmo": algo,
                "execucoes": n,
                "gapMedio": sum(r["gap"] for r in sub) / n,
                "tempoMedio": sum(r["tempo"] for r in sub) / n,
                "otimosExatos": sum(1 for r in sub if r["gap"] == 0),
            }
        )
    return out


def _aggregate_by_instance(rows):
    instances_order = [inst.name for inst in INSTANCES]
    out = []
    for inst_name in instances_order:
        for algo in ("VNS", "AG"):
            sub = [r for r in rows if r["instancia"] == inst_name and r["algoritmo"] == algo]
            if not sub:
                continue
            n = len(sub)
            out.append(
                {
                    "instancia": inst_name,
                    "algoritmo": algo,
                    "otimo": sub[0]["otimo"],
                    "melhorEncontrado": max(r["encontrado"] for r in sub),
                    "gapMedio": sum(r["gap"] for r in sub) / n,
                    "tempoMedio": sum(r["tempo"] for r in sub) / n,
                }
            )
    return out


if __name__ == "__main__":
    print(f"\n{len(INSTANCES)} instancias carregadas.")
    print("Servidor em http://localhost:5000  (Ctrl+C para parar)\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
