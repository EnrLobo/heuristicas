"""
Modulo de leitura de instancias e representacao do Problema da Mochila 0/1.

Suporta dois formatos:
1. Formato FSU/Burkardt: 4 arquivos separados (p0X_c.txt, p0X_w.txt, p0X_p.txt, p0X_s.txt)
2. Formato Pisinger (large_scale): 1 arquivo unico, onde:
   - linha 1: "n c"          (numero de itens, capacidade)
   - linhas 2..n+1: "profit weight" de cada item
   - ultima linha: vetor 0/1 com a solucao otima conhecida
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional


@dataclass
class KnapsackInstance:
    name: str
    n: int
    capacity: int
    weights: List[int]
    profits: List[int]
    known_optimum: Optional[int] = None
    known_solution: Optional[List[int]] = field(default=None, repr=False)

    def is_feasible(self, x: List[int]) -> bool:
        """Verifica se uma solucao binaria respeita a capacidade."""
        return self.total_weight(x) <= self.capacity

    def total_weight(self, x: List[int]) -> int:
        return sum(w * xi for w, xi in zip(self.weights, x))

    def total_profit(self, x: List[int]) -> int:
        return sum(p * xi for p, xi in zip(self.profits, x))

    def fitness(self, x: List[int]) -> int:
        """Fitness = valor total se a solucao for viavel, 0 caso contrario.

        Como as heuristicas deste projeto usam reparo (ver repair.py), soluzoes
        avaliadas aqui ja deveriam estar sempre viaveis; esta funcao apenas
        garante que uma solucao invalida nunca vença numa comparacao.
        """
        if not self.is_feasible(x):
            return 0
        return self.total_profit(x)


def load_fsu_instance(folder: Path, prefix: str) -> KnapsackInstance:
    """Le uma instancia no formato FSU/Burkardt (4 arquivos p0X_c/_w/_p/_s)."""
    c = int((folder / f"{prefix}_c.txt").read_text().split()[0])
    weights = [int(x) for x in (folder / f"{prefix}_w.txt").read_text().split()]
    profits = [int(x) for x in (folder / f"{prefix}_p.txt").read_text().split()]

    known_solution = None
    known_optimum = None
    sol_path = folder / f"{prefix}_s.txt"
    if sol_path.exists():
        known_solution = [int(x) for x in sol_path.read_text().split()]
        known_optimum = sum(p * s for p, s in zip(profits, known_solution))

    return KnapsackInstance(
        name=prefix.upper(),
        n=len(weights),
        capacity=c,
        weights=weights,
        profits=profits,
        known_optimum=known_optimum,
        known_solution=known_solution,
    )


def load_pisinger_instance(filepath: Path, name: Optional[str] = None) -> KnapsackInstance:
    """Le uma instancia no formato Pisinger (arquivo unico, 'profit weight' por item)."""
    lines = [l.strip() for l in filepath.read_text(encoding="utf-8").splitlines() if l.strip()]

    n, c = map(int, lines[0].split())
    items = [tuple(map(int, l.split())) for l in lines[1 : 1 + n]]
    profits = [it[0] for it in items]
    weights = [it[1] for it in items]

    known_solution = None
    known_optimum = None
    if len(lines) > 1 + n:
        known_solution = [int(x) for x in lines[1 + n].split()]
        known_optimum = sum(p * s for p, s in zip(profits, known_solution))

    return KnapsackInstance(
        name=name or filepath.stem,
        n=n,
        capacity=c,
        weights=weights,
        profits=profits,
        known_optimum=known_optimum,
        known_solution=known_solution,
    )


def load_all_instances(project_root: Path) -> List[KnapsackInstance]:
    """Carrega as 9 bases do trabalho, na ordem: P01..P08 + a instancia de 100 itens."""
    instances = []
    fsu_folder = project_root / "data" / "fsu"
    for i in range(1, 9):
        prefix = f"p{i:02d}"
        instances.append(load_fsu_instance(fsu_folder, prefix))

    pisinger_path = project_root / "data" / "knapPI_1_100_1000_1.txt"
    instances.append(load_pisinger_instance(pisinger_path, name="knapPI_1_100_1000_1"))

    return instances


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    for inst in load_all_instances(root):
        print(
            f"{inst.name:22} n={inst.n:4d}  C={inst.capacity:10d}  "
            f"otimo_conhecido={inst.known_optimum}"
        )
