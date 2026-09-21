"""
Gera a planilha final (results/planilha_resultados.xlsx) a partir do CSV bruto
de experimentos, com 3 abas:

    1. Dados_Brutos       -> as 486 execucoes individuais (1 linha por execucao/seed)
    2. Resumo_Parametros  -> 1 linha por combinacao (instancia, algoritmo, parametros),
                              com medias calculadas via FORMULA (AVERAGEIFS/MAXIFS)
                              sobre a aba de dados brutos -- nao valores fixos.
    3. Comparacao_Geral   -> agregado final por algoritmo, tambem via formula.
"""

import subprocess
import sys
from pathlib import Path

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent
RESULTS_DIR = ROOT / "results"

FONT_NAME = "Arial"
HEADER_FILL = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
HEADER_FONT = Font(name=FONT_NAME, bold=True, color="FFFFFF", size=11)
TITLE_FONT = Font(name=FONT_NAME, bold=True, size=14, color="1F4E78")
BODY_FONT = Font(name=FONT_NAME, size=10)
THIN = Side(style="thin", color="D9D9D9")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def style_header_row(ws, row_idx, n_cols):
    for c in range(1, n_cols + 1):
        cell = ws.cell(row=row_idx, column=c)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = BORDER


def autofit(ws, n_cols, min_width=10, max_width=32):
    for c in range(1, n_cols + 1):
        col_letter = get_column_letter(c)
        max_len = min_width
        for cell in ws[col_letter]:
            if cell.value is not None:
                max_len = max(max_len, len(str(cell.value)) + 2)
        ws.column_dimensions[col_letter].width = min(max_len, max_width)


def build_dados_brutos(wb, df_raw: pd.DataFrame):
    ws = wb.create_sheet("Dados_Brutos")
    ws["A1"] = "Dados Brutos - Todas as Execucoes (VNS e AG)"
    ws["A1"].font = TITLE_FONT
    ws.merge_cells("A1:M1")

    headers = list(df_raw.columns)
    header_row = 3
    for j, h in enumerate(headers, start=1):
        ws.cell(row=header_row, column=j, value=h)
    style_header_row(ws, header_row, len(headers))

    for i, row in enumerate(df_raw.itertuples(index=False), start=header_row + 1):
        for j, value in enumerate(row, start=1):
            cell = ws.cell(row=i, column=j, value=value)
            cell.font = BODY_FONT
            cell.border = BORDER

    ws.freeze_panes = ws.cell(row=header_row + 1, column=1)
    autofit(ws, len(headers))
    return ws, header_row, len(df_raw)


def build_resumo_parametros(wb, df_raw: pd.DataFrame, dados_sheet_name: str, header_row: int, n_data_rows: int):
    ws = wb.create_sheet("Resumo_Parametros")
    ws["A1"] = "Resumo por Combinacao de Parametros (media sobre 3 sementes)"
    ws["A1"].font = TITLE_FONT
    ws.merge_cells("A1:K1")

    combos = (
        df_raw[
            [
                "instancia",
                "algoritmo",
                "param_1_nome",
                "param_1_valor",
                "param_2_nome",
                "param_2_valor",
                "iteracoes_geracoes",
                "valor_otimo_conhecido",
            ]
        ]
        .drop_duplicates()
        .sort_values(["instancia", "algoritmo", "param_1_valor", "param_2_valor"])
        .reset_index(drop=True)
    )

    headers = [
        "Instancia",
        "Algoritmo",
        "Parametro 1",
        "Valor Param 1",
        "Parametro 2",
        "Valor Param 2",
        "Iteracoes/Geracoes",
        "Valor Otimo Conhecido",
        "Media Valor Encontrado",
        "Media Gap (%)",
        "Media Tempo (s)",
    ]
    header_row_out = 3
    for j, h in enumerate(headers, start=1):
        ws.cell(row=header_row_out, column=j, value=h)
    style_header_row(ws, header_row_out, len(headers))

    data_first_row = header_row + 1
    data_last_row = header_row + n_data_rows
    rng = lambda col: f"'{dados_sheet_name}'!{col}{data_first_row}:{col}{data_last_row}"

    # colunas na aba Dados_Brutos (na mesma ordem em que o CSV foi escrito):
    # A instancia | B n_itens | C algoritmo | D param_1_nome | E param_1_valor
    # F param_2_nome | G param_2_valor | H seed | I iteracoes_geracoes
    # J valor_otimo_conhecido | K valor_encontrado | L gap_percentual | M tempo_segundos
    COL_INSTANCIA = "A"
    COL_ALGORITMO = "C"
    COL_P1VAL = "E"
    COL_P2VAL = "G"
    COL_VALOR_ENCONTRADO = "K"
    COL_GAP = "L"
    COL_TEMPO = "M"

    for i, row in combos.iterrows():
        out_row = header_row_out + 1 + i
        ws.cell(row=out_row, column=1, value=row["instancia"])
        ws.cell(row=out_row, column=2, value=row["algoritmo"])
        ws.cell(row=out_row, column=3, value=row["param_1_nome"])
        ws.cell(row=out_row, column=4, value=row["param_1_valor"])
        ws.cell(row=out_row, column=5, value=row["param_2_nome"])
        ws.cell(row=out_row, column=6, value=row["param_2_valor"])
        ws.cell(row=out_row, column=7, value=row["iteracoes_geracoes"])
        ws.cell(row=out_row, column=8, value=row["valor_otimo_conhecido"])

        crit = (
            f"{rng(COL_INSTANCIA)},$A{out_row},"
            f"{rng(COL_ALGORITMO)},$B{out_row},"
            f"{rng(COL_P1VAL)},$D{out_row},"
            f"{rng(COL_P2VAL)},$F{out_row}"
        )
        ws.cell(row=out_row, column=9, value=f"=AVERAGEIFS({rng(COL_VALOR_ENCONTRADO)},{crit})")
        ws.cell(row=out_row, column=10, value=f"=AVERAGEIFS({rng(COL_GAP)},{crit})")
        ws.cell(row=out_row, column=11, value=f"=AVERAGEIFS({rng(COL_TEMPO)},{crit})")

        for c in range(1, 12):
            cell = ws.cell(row=out_row, column=c)
            cell.font = BODY_FONT
            cell.border = BORDER
            if c == 9:
                cell.number_format = "#,##0.00"
            elif c == 10:
                cell.number_format = "0.0000"
            elif c == 11:
                cell.number_format = "0.00000"

    ws.freeze_panes = ws.cell(row=header_row_out + 1, column=1)
    autofit(ws, len(headers))
    return ws, header_row_out, len(combos)


def build_comparacao_geral(wb, dados_sheet_name: str, header_row: int, n_data_rows: int):
    ws = wb.create_sheet("Comparacao_Geral", 0)  # primeira aba
    ws["A1"] = "Comparacao Geral: VNS vs Algoritmo Genetico"
    ws["A1"].font = TITLE_FONT
    ws.merge_cells("A1:F1")
    ws["A2"] = "Medias calculadas sobre as 243 execucoes de cada algoritmo (9 instancias x 9 combinacoes de parametros x 3 sementes)"
    ws["A2"].font = Font(name=FONT_NAME, italic=True, size=9, color="666666")
    ws.merge_cells("A2:F2")

    headers = [
        "Algoritmo",
        "Execucoes",
        "Media Gap (%)",
        "Media Tempo (s)",
        "Instancias com Gap = 0%",
        "Media Iteracoes/Geracoes",
    ]
    header_row_out = 4
    for j, h in enumerate(headers, start=1):
        ws.cell(row=header_row_out, column=j, value=h)
    style_header_row(ws, header_row_out, len(headers))

    data_first_row = header_row + 1
    data_last_row = header_row + n_data_rows
    rng = lambda col: f"'{dados_sheet_name}'!{col}{data_first_row}:{col}{data_last_row}"

    COL_ALGORITMO = "C"
    COL_GAP = "L"
    COL_TEMPO = "M"
    COL_ITER = "I"

    for i, alg in enumerate(["VNS", "AG"]):
        r = header_row_out + 1 + i
        ws.cell(row=r, column=1, value=alg)
        crit = f"{rng(COL_ALGORITMO)},$A{r}"
        ws.cell(row=r, column=2, value=f"=COUNTIFS({crit})")
        ws.cell(row=r, column=3, value=f"=AVERAGEIFS({rng(COL_GAP)},{crit})")
        ws.cell(row=r, column=4, value=f"=AVERAGEIFS({rng(COL_TEMPO)},{crit})")
        ws.cell(row=r, column=5, value=f"=COUNTIFS({crit},{rng(COL_GAP)},0)")
        ws.cell(row=r, column=6, value=f"=AVERAGEIFS({rng(COL_ITER)},{crit})")

        for c in range(1, 7):
            cell = ws.cell(row=r, column=c)
            cell.font = BODY_FONT
            cell.border = BORDER
            if c == 3:
                cell.number_format = "0.0000"
            elif c == 4:
                cell.number_format = "0.00000"
            elif c == 6:
                cell.number_format = "0.0"

    autofit(ws, len(headers))
    ws.column_dimensions["A"].width = 14
    return ws


def main():
    df_raw = pd.read_csv(RESULTS_DIR / "raw_results.csv")

    wb = Workbook()
    wb.remove(wb.active)  # remove a aba padrao vazia

    dados_ws, header_row, n_rows = build_dados_brutos(wb, df_raw)
    build_resumo_parametros(wb, df_raw, dados_ws.title, header_row, n_rows)
    build_comparacao_geral(wb, dados_ws.title, header_row, n_rows)

    # ordem final das abas: Comparacao_Geral, Resumo_Parametros, Dados_Brutos
    wb.move_sheet("Resumo_Parametros", offset=-1)

    out_path = RESULTS_DIR / "planilha_resultados.xlsx"
    wb.save(out_path)
    print("Planilha salva em:", out_path)
    return out_path


if __name__ == "__main__":
    out_path = main()
    # recalcula as formulas via LibreOffice (obrigatorio)
    recalc_script = Path("/mnt/skills/public/xlsx/scripts/recalc.py")
    result = subprocess.run(
        [sys.executable, str(recalc_script), str(out_path), "60"],
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    print(result.stderr, file=sys.stderr)
