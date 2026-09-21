"""
Roda a bateria completa de experimentos para o trabalho:

    - 9 instancias (P01..P08 + knapPI_1_100_1000_1)
    - VNS: grade de parametros (k_max x max_iterations)
    - AG:  grade de parametros (pop_size x generations)
    - 3 sementes por combinacao (para reduzir efeito da aleatoriedade)

Salva um CSV "bruto" (uma linha por execucao) em results/raw_results.csv,
que sera a base para a planilha final e os graficos de convergencia.
"""

import csv
import sys
import time
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent          # .../experiments
PROJECT_ROOT = THIS_DIR.parent                        # raiz do projeto
BACKEND_DIR = PROJECT_ROOT / "backend"
CORE_DIR = BACKEND_DIR / "core"
sys.path.insert(0, str(CORE_DIR))

from knapsack_instance import load_all_instances
from vns import vns
from ga import genetic_algorithm

RESULTS_DIR = THIS_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)

SEEDS = [1, 2, 3]

VNS_PARAM_GRID = [
    {"k_max": k, "max_iterations": it}
    for k in (2, 3, 5)
    for it in (50, 100, 200)
]

GA_PARAM_GRID = [
    {"pop_size": p, "generations": g}
    for p in (20, 50, 100)
    for g in (50, 100, 200)
]


def run_all():
    instances = load_all_instances(BACKEND_DIR)
    rows = []
    # tambem guardamos o historico de convergencia so da MELHOR combinacao
    # de parametros de cada algoritmo, por instancia (senao o arquivo de
    # convergencia fica gigante e dificil de usar no relatorio)
    convergence_rows = []

    total_runs = len(instances) * (len(VNS_PARAM_GRID) + len(GA_PARAM_GRID)) * len(SEEDS)
    done = 0
    t0 = time.time()

    for inst in instances:
        # ---------------- VNS ----------------
        for params in VNS_PARAM_GRID:
            for seed in SEEDS:
                result = vns(inst, k_max=params["k_max"], max_iterations=params["max_iterations"], seed=seed)
                gap = (
                    100 * (inst.known_optimum - result.best_fitness) / inst.known_optimum
                    if inst.known_optimum
                    else None
                )
                rows.append(
                    {
                        "instancia": inst.name,
                        "n_itens": inst.n,
                        "algoritmo": "VNS",
                        "param_1_nome": "k_max",
                        "param_1_valor": params["k_max"],
                        "param_2_nome": "max_iteracoes",
                        "param_2_valor": params["max_iterations"],
                        "seed": seed,
                        "iteracoes_geracoes": result.iterations,
                        "valor_otimo_conhecido": inst.known_optimum,
                        "valor_encontrado": result.best_fitness,
                        "gap_percentual": round(gap, 4) if gap is not None else None,
                        "tempo_segundos": round(result.time_seconds, 5),
                    }
                )
                done += 1

        # ---------------- AG ----------------
        for params in GA_PARAM_GRID:
            for seed in SEEDS:
                result = genetic_algorithm(
                    inst, pop_size=params["pop_size"], generations=params["generations"], seed=seed
                )
                gap = (
                    100 * (inst.known_optimum - result.best_fitness) / inst.known_optimum
                    if inst.known_optimum
                    else None
                )
                rows.append(
                    {
                        "instancia": inst.name,
                        "n_itens": inst.n,
                        "algoritmo": "AG",
                        "param_1_nome": "pop_size",
                        "param_1_valor": params["pop_size"],
                        "param_2_nome": "geracoes",
                        "param_2_valor": params["generations"],
                        "seed": seed,
                        "iteracoes_geracoes": result.generations,
                        "valor_otimo_conhecido": inst.known_optimum,
                        "valor_encontrado": result.best_fitness,
                        "gap_percentual": round(gap, 4) if gap is not None else None,
                        "tempo_segundos": round(result.time_seconds, 5),
                    }
                )
                done += 1

        print(f"[{done}/{total_runs}] instancia {inst.name} concluida ({time.time()-t0:.1f}s corridos)")

        # ---- historico de convergencia com os "melhores" parametros fixos (seed=1) ----
        vns_conv = vns(inst, k_max=3, max_iterations=200, seed=1)
        for i, fit in enumerate(vns_conv.history):
            convergence_rows.append(
                {"instancia": inst.name, "algoritmo": "VNS", "iteracao": i, "melhor_fitness": fit}
            )

        ga_conv = genetic_algorithm(inst, pop_size=50, generations=100, seed=1)
        for i, fit in enumerate(ga_conv.history):
            convergence_rows.append(
                {"instancia": inst.name, "algoritmo": "AG", "iteracao": i, "melhor_fitness": fit}
            )

    # salva CSV bruto
    raw_path = RESULTS_DIR / "raw_results.csv"
    with open(raw_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    conv_path = RESULTS_DIR / "convergence.csv"
    with open(conv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(convergence_rows[0].keys()))
        writer.writeheader()
        writer.writerows(convergence_rows)

    print(f"\nConcluido em {time.time()-t0:.1f}s. Total de execucoes: {len(rows)}")
    print(f"Salvo em: {raw_path}")
    print(f"Salvo em: {conv_path}")


if __name__ == "__main__":
    run_all()
