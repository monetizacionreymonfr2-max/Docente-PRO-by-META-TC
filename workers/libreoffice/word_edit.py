"""Edición quirúrgica de DOCX para Camila: solo operaciones JSON permitidas.

No ejecuta código recibido del modelo, no modifica encabezados ni elimina imágenes.
La IA propone operaciones; este módulo valida y cambia únicamente texto inequívoco.
"""
from io import BytesIO
import re
import zipfile

from docx import Document
from lxml import etree

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"
NS = {"w": W_NS}
MAX_OPERATIONS = 20
MAX_SEARCH = 500
MAX_REPLACEMENT = 5000
UNSAFE_ELEMENTS = {
    f"{{{W_NS}}}{name}"
    for name in ("drawing", "object", "fldChar", "instrText", "br", "tab", "sym",
                 "del", "ins", "hyperlink", "sdt")
}


def _texto_seguro(text, max_chars=MAX_REPLACEMENT):
    if not isinstance(text, str) or len(text) > max_chars:
        raise ValueError("Texto demasiado largo o inválido")
    if any(ord(ch) < 32 for ch in text):
        raise ValueError("No se permiten caracteres de control")


def _validar_operaciones(operations):
    if not isinstance(operations, list) or not (1 <= len(operations) <= MAX_OPERATIONS):
        raise ValueError("Se requieren entre 1 y 20 operaciones")
    for operation in operations:
        if not isinstance(operation, dict):
            raise ValueError("Operación no permitida")
        kind = operation.get("tipo")
        if kind == "reemplazar_texto":
            if set(operation) != {"tipo", "buscar", "reemplazar"}:
                raise ValueError("Campos no autorizados para reemplazo")
            old, new = operation["buscar"], operation["reemplazar"]
            _texto_seguro(old, MAX_SEARCH)
            _texto_seguro(new)
            if not old:
                raise ValueError("Texto de búsqueda vacío")
        elif kind == "set_parrafo":
            if set(operation) != {"tipo", "id", "esperado", "texto"} or not isinstance(
                    operation["id"], str) or not re.fullmatch(r"p(?:0|[1-9][0-9]{0,4})", operation["id"]):
                raise ValueError("Párrafo objetivo inválido")
            _texto_seguro(operation["esperado"])
            _texto_seguro(operation["texto"])
        elif kind == "set_celda":
            if set(operation) != {"tipo", "id", "esperado", "lineas"} or not isinstance(
                    operation["id"], str) or not re.fullmatch(
                    r"t(?:0|[1-9][0-9]{0,4})\.r(?:0|[1-9][0-9]{0,4})\.c(?:0|[1-9][0-9]{0,4})",
                    operation["id"]):
                raise ValueError("Celda objetivo inválida")
            _texto_seguro(operation["esperado"])
            if not isinstance(operation["lineas"], list) or len(operation["lineas"]) != 1:
                raise ValueError("Solo una línea por celda en la edición experimental")
            _texto_seguro(operation["lineas"][0])
        else:
            raise ValueError("Tipo de operación no permitido")


def _nodo_para_id(root, operation):
    body = root.find(f"{{{W_NS}}}body")
    if body is None:
        raise ValueError("Word sin cuerpo")
    direct_children = list(body)
    if operation["tipo"] == "set_parrafo":
        paragraphs = [item for item in direct_children if item.tag == f"{{{W_NS}}}p"]
        number = int(operation["id"][1:])
        if number >= len(paragraphs):
            raise ValueError("Párrafo no encontrado")
        return paragraphs[number]
    table_index, row_index, cell_index = (int(n) for n in re.findall(r"[0-9]+", operation["id"]))
    tables = [item for item in direct_children if item.tag == f"{{{W_NS}}}tbl"]
    if table_index >= len(tables):
        raise ValueError("Tabla no encontrada")
    rows = tables[table_index].findall(f"{{{W_NS}}}tr")
    if row_index >= len(rows):
        raise ValueError("Fila no encontrada")
    cells = rows[row_index].findall(f"{{{W_NS}}}tc")
    if cell_index >= len(cells):
        raise ValueError("Celda no encontrada")
    paragraphs = cells[cell_index].findall(f"{{{W_NS}}}p")
    # Una celda multipárrafo requiere operaciones estructurales fuera de este contrato.
    if len(paragraphs) != 1 or cells[cell_index].find(f".//{{{W_NS}}}tbl") is not None:
        raise ValueError("Celda compleja: edición automática no autorizada")
    return paragraphs[0]


def _actualizar_parrafo(paragraph, expected, replacement):
    if any(element.tag in UNSAFE_ELEMENTS for element in paragraph.iter()):
        raise ValueError("Párrafo con elementos especiales: edición no segura")
    nodes, text = _texto_parrafo(paragraph)
    if text.strip() != expected:
        raise ValueError("El documento cambió; la operación no coincide con su contenido")
    if not nodes:
        run = etree.SubElement(paragraph, f"{{{W_NS}}}r")
        value = etree.SubElement(run, f"{{{W_NS}}}t")
        value.text = replacement
        if replacement.startswith(" ") or replacement.endswith(" "):
            value.set(XML_SPACE, "preserve")
        return
    if text:
        _reemplazar_en_nodos(nodes, 0, len(text), replacement)
    else:
        nodes[0].text = replacement
        if replacement.startswith(" ") or replacement.endswith(" "):
            nodes[0].set(XML_SPACE, "preserve")



def _texto_parrafo(paragraph):
    nodes = paragraph.xpath("./w:r/w:t", namespaces=NS)
    return nodes, "".join(node.text or "" for node in nodes)


def _reemplazar_en_nodos(nodes, start, end, replacement):
    """Mantiene los runs, estilos y relaciones. Escribe en el primer w:t afectado."""
    offset = 0
    first = last = None
    for index, node in enumerate(nodes):
        next_offset = offset + len(node.text or "")
        if first is None and start < next_offset:
            first = index
        if first is not None and end <= next_offset:
            last = index
            break
        offset = next_offset
    if first is None or last is None:
        raise ValueError("No se pudo localizar el intervalo exacto")
    start_in_first = start - sum(len(n.text or "") for n in nodes[:first])
    end_in_last = end - sum(len(n.text or "") for n in nodes[:last])
    before = (nodes[first].text or "")[:start_in_first]
    after = (nodes[last].text or "")[end_in_last:]
    if first == last:
        nodes[first].text = before + replacement + after
        affected = [nodes[first]]
    else:
        nodes[first].text = before + replacement
        for node in nodes[first + 1:last]:
            node.text = ""
        nodes[last].text = after
        affected = nodes[first:last + 1]
    for node in affected:
        value = node.text or ""
        if value.startswith(" ") or value.endswith(" "):
            node.set(XML_SPACE, "preserve")


def editar_word(original: bytes, operations: list) -> tuple[bytes, int]:
    """Devuelve (DOCX editado, cambios aplicados) o falla sin producir salida parcial."""
    _validar_operaciones(operations)
    # Asegura que la estructura se pueda abrir también desde python-docx.
    try:
        Document(BytesIO(original))
    except Exception as exc:
        raise ValueError("No se pudo abrir el documento Word") from exc

    with zipfile.ZipFile(BytesIO(original), "r") as source:
        document_xml = source.read("word/document.xml")
        parser = etree.XMLParser(resolve_entities=False, no_network=True, huge_tree=False)
        try:
            root = etree.fromstring(document_xml, parser=parser)
        except etree.XMLSyntaxError as exc:
            raise ValueError("XML del documento inválido") from exc
        paragraphs = root.xpath(".//w:body//w:p", namespaces=NS)
        if len(paragraphs) > 20000:
            raise ValueError("Documento demasiado complejo")

        for operation in operations:
            if operation["tipo"] in ("set_parrafo", "set_celda"):
                paragraph = _nodo_para_id(root, operation)
                replacement = (operation["texto"] if operation["tipo"] == "set_parrafo"
                               else operation["lineas"][0])
                _actualizar_parrafo(paragraph, operation["esperado"], replacement)
                continue
            old, replacement = operation["buscar"], operation["reemplazar"]
            matches = []
            for paragraph in paragraphs:
                nodes, text = _texto_parrafo(paragraph)
                if old in text:
                    if text.count(old) != 1:
                        raise ValueError("El texto aparece varias veces en un párrafo")
                    matches.append((paragraph, nodes, text.index(old)))
            if len(matches) != 1:
                raise ValueError("Texto ausente o repetido; indique un fragmento más específico")
            paragraph, nodes, start = matches[0]
            if any(element.tag in UNSAFE_ELEMENTS for element in paragraph.iter()):
                raise ValueError("El párrafo contiene elementos complejos; no es seguro editarlo")
            _reemplazar_en_nodos(nodes, start, start + len(old), replacement)

        updated_xml = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)
        result = BytesIO()
        with zipfile.ZipFile(result, "w") as output:
            for entry in source.infolist():
                if entry.is_dir():
                    output.writestr(entry, b"")
                else:
                    output.writestr(entry, updated_xml if entry.filename == "word/document.xml"
                                    else source.read(entry.filename))
        edited = result.getvalue()
    try:
        Document(BytesIO(edited))
    except Exception as exc:
        raise ValueError("El DOCX resultante no supera la validación") from exc
    return edited, len(operations)
