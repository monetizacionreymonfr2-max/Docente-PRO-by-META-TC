"""Operaciones estructurales conservadoras para Word institucional.

Solo actúa sobre el cuerpo del documento. Nunca modifica encabezados,
pies, logos, márgenes ni estilos de tabla de la escuela.
"""
from copy import deepcopy
import re

from lxml import etree

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}
Q = lambda tag: f"{{{W}}}{tag}"
MAX_ROWS = 24
MAX_COLS = 12
MAX_SECTION_PARAGRAPHS = 16
MAX_TEXT = 5000
MAX_TOTAL = 40000

UNSAFE = {Q(tag) for tag in (
    "tbl", "gridSpan", "vMerge", "hMerge", "tblHeader", "drawing", "object",
    "fldChar", "instrText", "hyperlink", "sdt", "ins", "del", "bookmarkStart",
    "bookmarkEnd", "commentRangeStart", "commentRangeEnd", "commentReference",
    "footnoteReference", "endnoteReference", "pict", "customXml", "smartTag",
    "moveFrom", "moveTo", "permStart", "permEnd", "proofErr", "br", "tab",
)}
PARA_ID = re.compile(r"p(?:0|[1-9]\d{0,4})\Z")
TABLA_ID = re.compile(r"t(?:0|[1-9]\d{0,4})\Z")


def _string(value, limit=MAX_TEXT):
    if not isinstance(value, str) or len(value) > limit or any(ord(c) < 32 for c in value):
        raise ValueError("Texto inválido o demasiado largo")


def _rows(value):
    if not isinstance(value, list) or not (1 <= len(value) <= MAX_ROWS):
        raise ValueError("Cantidad de filas inválida")
    cols = None
    total = 0
    for row in value:
        if not isinstance(row, list) or not (1 <= len(row) <= MAX_COLS):
            raise ValueError("Columnas fuera de límites")
        cols = len(row) if cols is None else cols
        if len(row) != cols:
            raise ValueError("Filas con distintas columnas")
        for cell in row:
            _string(cell, 1000)
            total += len(cell)
    if total > MAX_TOTAL:
        raise ValueError("Datos de tabla demasiado extensos")


def _row_id(value, table):
    return isinstance(value, str) and re.fullmatch(
        re.escape(table) + r"\.r(?:0|[1-9]\d{0,4})", value) is not None


def validate_structural(op):
    kind = op["tipo"]
    if kind == "agregar_filas":
        if set(op) != {"tipo", "tablaId", "despuesDeFilaId", "esperadoModelo", "filas"}:
            raise ValueError("Parámetros de inserción no autorizados")
        if not isinstance(op["tablaId"], str) or not TABLA_ID.fullmatch(op["tablaId"]) or not _row_id(op["despuesDeFilaId"], op["tablaId"]):
            raise ValueError("Tabla o fila modelo inválidas")
        _rows([op["esperadoModelo"]])
        _rows(op["filas"])
    elif kind == "reemplazar_filas":
        if set(op) != {"tipo", "tablaId", "filaInicioId", "esperadas", "filas"}:
            raise ValueError("Parámetros de reemplazo no autorizados")
        if not isinstance(op["tablaId"], str) or not TABLA_ID.fullmatch(op["tablaId"]) or not _row_id(op["filaInicioId"], op["tablaId"]):
            raise ValueError("Tabla o fila inicial inválidas")
        _rows(op["esperadas"])
        _rows(op["filas"])
    elif kind == "set_seccion":
        if set(op) != {"tipo", "tituloId", "tituloEsperado", "parrafos"} or not isinstance(
                op["tituloId"], str) or not PARA_ID.fullmatch(op["tituloId"]):
            raise ValueError("Sección inválida")
        _string(op["tituloEsperado"])
        if not op["tituloEsperado"]:
            raise ValueError("Título vacío")
        parts = op["parrafos"]
        if not isinstance(parts, list) or not (1 <= len(parts) <= MAX_SECTION_PARAGRAPHS):
            raise ValueError("Cantidad de párrafos inválida")
        first = int(op["tituloId"][1:]) + 1
        for item in parts:
            if not isinstance(item, dict) or set(item) != {"id", "esperado", "texto"} or item["id"] != f"p{first}":
                raise ValueError("Los párrafos deben ser consecutivos")
            _string(item["esperado"])
            _string(item["texto"])
            first += 1
    else:
        raise ValueError("Operación estructural desconocida")


def _get_table(root, table_id):
    body = root.find(Q("body"))
    if body is None:
        raise ValueError("Word sin cuerpo")
    tables = body.findall(Q("tbl"))
    index = int(table_id[1:])
    if index >= len(tables):
        raise ValueError("Tabla no encontrada")
    return tables[index]


def _paragraphs_for_row(row):
    if any(el.tag in UNSAFE for el in row.iter()):
        raise ValueError("Fila con elementos combinados, encabezados o contenido especial")
    cells = row.findall(Q("tc"))
    if not (1 <= len(cells) <= MAX_COLS):
        raise ValueError("Fila con número de columnas no permitido")
    paragraphs = []
    for cell in cells:
        ps = cell.findall(Q("p"))
        if len(ps) != 1:
            raise ValueError("La fila contiene una celda multipárrafo")
        paragraphs.append(ps[0])
    return paragraphs


def _row_values(row, text_of):
    return [text_of(p).strip() for p in _paragraphs_for_row(row)]


def _fill_row(row, values, text_of, update):
    paragraphs = _paragraphs_for_row(row)
    if len(paragraphs) != len(values):
        raise ValueError("El número de columnas no coincide con la plantilla")
    for paragraph, value in zip(paragraphs, values):
        update(paragraph, text_of(paragraph).strip(), value)


def _strip_clone_ids(row):
    for node in row.iter():
        for key in list(node.attrib):
            attr = etree.QName(key).localname
            if attr in ("paraId", "textId") or attr.startswith("rsid"):
                del node.attrib[key]


def _edit_table(root, op, text_of, update):
    table = _get_table(root, op["tablaId"])
    original_rows = table.findall(Q("tr"))
    if len(original_rows) < 2:
        raise ValueError("La tabla no dispone de una fila de datos")
    if op["tipo"] == "agregar_filas":
        index = int(op["despuesDeFilaId"].split(".r")[1])
        if index < 1 or index >= len(original_rows):
            raise ValueError("No se puede clonar un encabezado")
        template = original_rows[index]
        expected = _row_values(template, text_of)
        if expected != op["esperadoModelo"]:
            raise ValueError("La fila prototipo cambió")
        if any(len(values) != len(expected) for values in op["filas"]):
            raise ValueError("La cantidad de columnas cambió")
        for offset, values in enumerate(op["filas"]):
            new_row = deepcopy(template)
            _strip_clone_ids(new_row)
            _fill_row(new_row, values, text_of, update)
            table.insert(table.index(template) + 1 + offset, new_row)
        return

    index = int(op["filaInicioId"].split(".r")[1])
    if index < 1 or index >= len(original_rows):
        raise ValueError("Solo se permiten filas de datos")
    originals = original_rows[index:]
    if len(originals) != len(op["esperadas"]):
        raise ValueError("Número de filas esperado no coincide")
    for old, expected in zip(originals, op["esperadas"]):
        if _row_values(old, text_of) != expected:
            raise ValueError("La tabla cambió desde que se creó la propuesta")
    columns = len(op["esperadas"][0])
    if any(len(row) != columns for row in op["filas"]):
        raise ValueError("Las columnas no coinciden")
    # A igualdad de número de filas se conserva el estilo específico de cada
    # una. Al ampliar, la última fila del documento es el prototipo.
    changed = []
    for i, row_values in enumerate(op["filas"]):
        new_row = deepcopy(originals[min(i, len(originals) - 1)])
        _strip_clone_ids(new_row)
        _fill_row(new_row, row_values, text_of, update)
        changed.append(new_row)
    position = table.index(originals[0])
    for item in originals:
        table.remove(item)
    for i, item in enumerate(changed):
        table.insert(position + i, item)


def _edit_section(root, op, text_of, update):
    body = root.find(Q("body"))
    if body is None:
        raise ValueError("Word sin cuerpo")
    paragraphs = body.findall(Q("p"))
    title_index = int(op["tituloId"][1:])
    if title_index >= len(paragraphs):
        raise ValueError("Título no encontrado")
    title = paragraphs[title_index]
    if text_of(title).strip() != op["tituloEsperado"]:
        raise ValueError("El título de la sección cambió")
    fields = op["parrafos"]
    selected = paragraphs[title_index + 1:title_index + 1 + len(fields)]
    if len(selected) != len(fields):
        raise ValueError("Faltan párrafos de la sección")
    children = list(body)
    position = children.index(title)
    if children[position + 1:position + 1 + len(selected)] != selected:
        raise ValueError("No se puede atravesar una tabla u otro bloque")
    for p, item in zip(selected, fields):
        update(p, item["esperado"], item["texto"])


def apply_structural(root, op, text_of, update):
    if op["tipo"] in ("agregar_filas", "reemplazar_filas"):
        _edit_table(root, op, text_of, update)
    else:
        _edit_section(root, op, text_of, update)
