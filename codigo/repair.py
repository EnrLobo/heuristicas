"""
Estrategia de reparo para o Problema da Mochila 0/1.

Quando uma solucao binaria excede a capacidade da mochila, este modulo a
"conserta" removendo itens ate que ela volte a ser viavel. A remocao segue
a ordem crescente de eficiencia (valor/peso): removemos primeiro os itens
que "compensam menos" por unidade de peso, para preservar o maximo de valor
possivel na solucao reparada.

Este reparo e usado tanto pelo VNS (apos cada movimento de vizinhanca)
quanto pelo AG (apos crossover e mutacao), garantindo que ambos os
algoritmos SEMPRE trabalhem com solucoes validas.
"""

from typing import List
from knapsack_instance import KnapsackInstance


def repair(instance: KnapsackInstance, x: List[int]) -> List[int]:
    """Retorna uma copia reparada de x, respeitando a capacidade da mochila.

    Nao modifica a lista original (retorna uma nova lista).
    """
    x = list(x)  # copia defensiva

    # indices dos itens atualmente na mochila, ordenados do MENOS eficiente
    # para o MAIS eficiente (removemos do inicio dessa lista)
    def efficiency(i: int) -> float:
        return instance.profits[i] / instance.weights[i] if instance.weights[i] > 0 else float("inf")

    current_weight = instance.total_weight(x)

    if current_weight <= instance.capacity:
        return x  # ja e viavel, nada a fazer

    # itens selecionados, ordenados por eficiencia crescente (pior primeiro)
    selected = [i for i in range(instance.n) if x[i] == 1]
    selected.sort(key=efficiency)

    for i in selected:
        if current_weight <= instance.capacity:
            break
        x[i] = 0
        current_weight -= instance.weights[i]

    return x


def greedy_construct(instance: KnapsackInstance) -> List[int]:
    """Constroi uma solucao inicial viavel usando a heuristica gulosa classica:
    ordena os itens por eficiencia (valor/peso) decrescente e vai inserindo
    enquanto couber. Usada para dar um bom ponto de partida ao VNS.
    """
    x = [0] * instance.n
    order = sorted(
        range(instance.n),
        key=lambda i: instance.profits[i] / instance.weights[i] if instance.weights[i] > 0 else float("inf"),
        reverse=True,
    )
    weight = 0
    for i in order:
        if weight + instance.weights[i] <= instance.capacity:
            x[i] = 1
            weight += instance.weights[i]
    return x


if __name__ == "__main__":
    from pathlib import Path
    from knapsack_instance import load_all_instances

    root = Path(__file__).resolve().parent.parent
    instances = load_all_instances(root)
    p01 = instances[0]

    # teste 1: solucao com todos os itens (claramente invalida)
    x_invalido = [1] * p01.n
    print("Antes do reparo:  peso =", p01.total_weight(x_invalido), " valido?", p01.is_feasible(x_invalido))
    x_reparado = repair(p01, x_invalido)
    print("Depois do reparo: peso =", p01.total_weight(x_reparado), " valor =", p01.total_profit(x_reparado))

    # teste 2: construcao gulosa
    x_guloso = greedy_construct(p01)
    print("\nSolucao gulosa:   peso =", p01.total_weight(x_guloso), " valor =", p01.total_profit(x_guloso))
    print("Otimo conhecido de P01:", p01.known_optimum)
