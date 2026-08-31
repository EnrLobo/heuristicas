"""
VNS - Variable Neighborhood Search para o Problema da Mochila 0/1.

Estrutura geral do algoritmo:

    x = solucao inicial (construcao gulosa)
    k = 1
    repita ate criterio de parada:
        x' = shaking(x, k)          # perturba x usando a vizinhanca N_k
        x'' = busca_local(x')       # refina x' ate um otimo local (N1)
        se f(x'') > f(x):
            x = x''                 # aceita a melhora
            k = 1                   # volta para a vizinhanca mais simples
        senao:
            k = k + 1                # tenta uma vizinhanca mais "agressiva"
        se k > k_max:
            k = 1

Vizinhancas usadas (todas atuam sobre o vetor binario x):
    N1 -> flipar 1 bit   (adicionar/remover 1 item)
    N2 -> flipar 2 bits  (equivalente a uma troca: tira 1, poe 1, por exemplo)
    N3 -> flipar 3 bits

Toda solucao gerada passa pelo reparo guloso (repair.py) antes de ser avaliada,
entao o VNS SEMPRE trabalha com solucoes viaveis.
"""

import random
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from knapsack_instance import KnapsackInstance, load_all_instances
from repair import repair, greedy_construct


@dataclass
class VNSResult:
    best_solution: List[int]
    best_fitness: int
    history: List[int] = field(repr=False)   # melhor fitness apos cada iteracao
    iterations: int = 0
    time_seconds: float = 0.0


def shaking(instance: KnapsackInstance, x: List[int], k: int, rng: random.Random) -> List[int]:
    """Perturba x flipando k bits escolhidos aleatoriamente (vizinhanca N_k)."""
    x_new = list(x)
    indices = rng.sample(range(instance.n), k=min(k, instance.n))
    for i in indices:
        x_new[i] = 1 - x_new[i]
    return repair(instance, x_new)


def local_search_n1(instance: KnapsackInstance, x: List[int], max_no_improve: int = 50) -> List[int]:
    """Busca local na vizinhanca N1 (1 bit flip), estrategia best-improvement.

    A cada passo, testa flipar cada um dos n bits e escolhe o melhor movimento.
    Repete ate nao haver mais melhora (otimo local de N1) ou ate max_no_improve
    tentativas sem sucesso (protecao para instancias grandes).
    """
    x = list(x)
    current_fitness = instance.fitness(x)
    no_improve = 0

    while no_improve < max_no_improve:
        best_neighbor = None
        best_neighbor_fitness = current_fitness

        for i in range(instance.n):
            candidate = list(x)
            candidate[i] = 1 - candidate[i]
            candidate = repair(instance, candidate)
            candidate_fitness = instance.fitness(candidate)

            if candidate_fitness > best_neighbor_fitness:
                best_neighbor = candidate
                best_neighbor_fitness = candidate_fitness

        if best_neighbor is not None:
            x = best_neighbor
            current_fitness = best_neighbor_fitness
            no_improve = 0
        else:
            break  # nenhum flip de 1 bit melhora -> otimo local de N1 atingido

    return x


def vns(
    instance: KnapsackInstance,
    k_max: int = 3,
    max_iterations: int = 200,
    seed: int = 42,
) -> VNSResult:
    rng = random.Random(seed)
    start = time.time()

    x = greedy_construct(instance)
    best_fitness = instance.fitness(x)
    history = [best_fitness]

    k = 1
    it = 0
    while it < max_iterations:
        it += 1
        x_shaken = shaking(instance, x, k, rng)
        x_local = local_search_n1(instance, x_shaken)
        f_local = instance.fitness(x_local)

        if f_local > best_fitness:
            x = x_local
            best_fitness = f_local
            k = 1
        else:
            k += 1
            if k > k_max:
                k = 1

        history.append(best_fitness)

    elapsed = time.time() - start
    return VNSResult(
        best_solution=x,
        best_fitness=best_fitness,
        history=history,
        iterations=it,
        time_seconds=elapsed,
    )


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    instances = load_all_instances(root)

    print(f"{'Instancia':22}{'Otimo':>12}{'VNS':>12}{'Gap %':>10}{'Iter':>8}{'Tempo(s)':>10}")
    for inst in instances:
        result = vns(inst, k_max=3, max_iterations=200)
        gap = 100 * (inst.known_optimum - result.best_fitness) / inst.known_optimum if inst.known_optimum else 0
        print(
            f"{inst.name:22}{inst.known_optimum:>12}{result.best_fitness:>12}"
            f"{gap:>9.2f}%{result.iterations:>8}{result.time_seconds:>10.3f}"
        )
