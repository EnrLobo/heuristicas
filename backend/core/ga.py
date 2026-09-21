"""
AG - Algoritmo Genetico para o Problema da Mochila 0/1.

Representacao: cada individuo (cromossomo) e um vetor binario de tamanho n,
igual ao usado no VNS -- isso e o que torna o Knapsack 0/1 um problema tao
natural para Algoritmos Geneticos.

Ciclo evolutivo por geracao:
    1. Avalia o fitness de toda a populacao (fitness = valor total, e todo
       individuo e sempre reparado antes de ser avaliado, entao o fitness
       nunca precisa penalizar peso excedido).
    2. Elitismo: guarda o melhor individuo da geracao atual.
    3. Gera a nova populacao:
        a. Selecao por torneio escolhe 2 pais.
        b. Crossover uniforme gera 1 filho.
        c. Mutacao (bit-flip) e aplicada ao filho.
        d. Reparo garante que o filho e viavel.
    4. Repete ate atingir o numero de geracoes (ou convergencia).
"""

import random
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from knapsack_instance import KnapsackInstance, load_all_instances
from repair import repair, greedy_construct


@dataclass
class GAResult:
    best_solution: List[int]
    best_fitness: int
    history: List[int] = field(repr=False)   # melhor fitness a cada geracao
    history_x: List[List[int]] = field(default=None, repr=False)  # solucao apos cada geracao (so quando track_solutions=True)
    generations: int = 0
    time_seconds: float = 0.0


def random_individual(instance: KnapsackInstance, rng: random.Random) -> List[int]:
    x = [1 if rng.random() < 0.5 else 0 for _ in range(instance.n)]
    return repair(instance, x)


def init_population(instance: KnapsackInstance, pop_size: int, rng: random.Random) -> List[List[int]]:
    """Populacao inicial: 1 individuo guloso (bom ponto de partida) + resto aleatorio."""
    pop = [greedy_construct(instance)]
    while len(pop) < pop_size:
        pop.append(random_individual(instance, rng))
    return pop


def tournament_selection(
    population: List[List[int]], fitnesses: List[int], rng: random.Random, k: int = 3
) -> List[int]:
    contestants = rng.sample(range(len(population)), k=min(k, len(population)))
    winner = max(contestants, key=lambda i: fitnesses[i])
    return population[winner]


def uniform_crossover(parent1: List[int], parent2: List[int], rng: random.Random) -> List[int]:
    return [p1 if rng.random() < 0.5 else p2 for p1, p2 in zip(parent1, parent2)]


def mutate(x: List[int], mutation_rate: float, rng: random.Random) -> List[int]:
    return [1 - xi if rng.random() < mutation_rate else xi for xi in x]


def genetic_algorithm(
    instance: KnapsackInstance,
    pop_size: int = 50,
    generations: int = 100,
    crossover_rate: float = 0.9,
    mutation_rate: float = 0.02,
    tournament_k: int = 3,
    seed: int = 42,
    track_solutions: bool = False,
) -> GAResult:
    """Executa o AG.

    track_solutions=True guarda uma copia do melhor individuo a cada geracao
    (usado pela API do site para animar a mochila enchendo em tempo real).
    """
    rng = random.Random(seed)
    start = time.time()

    population = init_population(instance, pop_size, rng)
    fitnesses = [instance.fitness(ind) for ind in population]

    best_idx = max(range(pop_size), key=lambda i: fitnesses[i])
    best_solution = list(population[best_idx])
    best_fitness = fitnesses[best_idx]
    history = [best_fitness]
    history_x = [list(best_solution)] if track_solutions else None

    gen = 0
    while gen < generations:
        gen += 1
        new_population = [list(best_solution)]  # elitismo: melhor sobrevive

        while len(new_population) < pop_size:
            parent1 = tournament_selection(population, fitnesses, rng, tournament_k)
            parent2 = tournament_selection(population, fitnesses, rng, tournament_k)

            if rng.random() < crossover_rate:
                child = uniform_crossover(parent1, parent2, rng)
            else:
                child = list(parent1)

            child = mutate(child, mutation_rate, rng)
            child = repair(instance, child)
            new_population.append(child)

        population = new_population
        fitnesses = [instance.fitness(ind) for ind in population]

        gen_best_idx = max(range(pop_size), key=lambda i: fitnesses[i])
        if fitnesses[gen_best_idx] > best_fitness:
            best_fitness = fitnesses[gen_best_idx]
            best_solution = list(population[gen_best_idx])

        history.append(best_fitness)
        if track_solutions:
            history_x.append(list(best_solution))

    elapsed = time.time() - start
    return GAResult(
        best_solution=best_solution,
        best_fitness=best_fitness,
        history=history,
        history_x=history_x,
        generations=gen,
        time_seconds=elapsed,
    )


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    instances = load_all_instances(root)

    print(f"{'Instancia':22}{'Otimo':>12}{'AG':>12}{'Gap %':>10}{'Geracoes':>10}{'Tempo(s)':>10}")
    for inst in instances:
        result = genetic_algorithm(inst, pop_size=50, generations=100)
        gap = 100 * (inst.known_optimum - result.best_fitness) / inst.known_optimum if inst.known_optimum else 0
        print(
            f"{inst.name:22}{inst.known_optimum:>12}{result.best_fitness:>12}"
            f"{gap:>9.2f}%{result.generations:>10}{result.time_seconds:>10.3f}"
        )
