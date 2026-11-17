"""Edición quirúrgica de DOCX para Camila: solo operaciones JSON permitidas.

No ejecuta código recibido del modelo, no modifica encabezados ni elimina imágenes.
La IA propone operaciones; este módulo valida y cambia únicamente texto inequívoco.
"""
from io import BytesIO
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


def _validar_operaciones(operations):
    if not isinstance(operations, list) or not (1 <= len(operations) <= MAX_OPERATIONS):
        raise ValueError("Se requieren entre 1 y 20 operaciones")
    for operation in operations:
        if not isinstance(operation, dict) or set(operation) != {"tipo", "buscar", "reemplazar"}:
            raise ValueError("Operación no permitida")
        if operation["tipo"] != "reemplazar_texto":
            raise ValueError("Tipo de operación no permitido")
        old, new = operation["buscar"], operation["reemplazar"]
        if not isinstance(old, str) or not (1 <= len(old) <= MAX_SEARCH):
            raise ValueError("Texto de búsqueda inválido")
        if not isinstance(new, str) or len(new) > MAX_REPLACEMENT:
            raise ValueError("Texto de reemplazo demasiado largo")
        if any(ord(ch) < 32 and ch not in "\n\t" for ch in old + new):
            raise ValueError("Caracteres de control no permitidos")
        # Los saltos de párrafo requieren operaciones estructurales específicas.
        if "\n" in old + new or "\r" in old + new or "\t" in old + new:
            raise ValueError("No se admiten saltos de línea ni tabuladores en reemplazos")


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
