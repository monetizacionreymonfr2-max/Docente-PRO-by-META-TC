"""Pruebas ficticias del editor Python de Mi Formato. Nunca usan datos reales."""
import base64
from io import BytesIO
import json
from pathlib import Path
import sys
import unittest
import zipfile

from docx import Document

sys.path.insert(0, str(Path(__file__).parent.parent / "workers" / "libreoffice"))
from server import process_edit_request, validate_docx
from word_edit import editar_word


def word_ficticio():
    doc = Document()
    doc.sections[0].header.paragraphs[0].text = "Escuela ficticia - encabezado"
    doc.add_heading("PPA Ficticio", 0)
    para = doc.add_paragraph()
    para.add_run("La actividad de ")
    highlighted = para.add_run("lectura guiada")
    highlighted.bold = True
    para.add_run(" inicia hoy.")
    tabla = doc.add_table(rows=2, cols=2)
    tabla.cell(0, 0).text = "Grado"
    tabla.cell(0, 1).text = "Segundo"
    tabla.cell(1, 0).text = "Actividad"
    tabla.cell(1, 1).text = "Lectura inicial"
    saved = BytesIO()
    doc.save(saved)
    with zipfile.ZipFile(saved, "a") as archive:
        archive.writestr("word/media/logo_ficticio.png", b"\x89PNG\r\n\x1a\nSIMULADO")
    return saved.getvalue()


def replace(old, new):
    return {"tipo": "reemplazar_texto", "buscar": old, "reemplazar": new}


class EditorWordTests(unittest.TestCase):
    def test_reemplazo_a_traves_de_runs_sin_perder_tablas_cabecera_ni_logo(self):
        original = word_ficticio()
        operaciones = [
            replace("lectura guiada inicia", "lectura compartida comienza"),
            replace("Lectura inicial", "Secuencia didáctica ficticia"),
        ]
        edited, count = editar_word(original, operaciones)
        self.assertEqual(count, 2)
        anterior = Document(BytesIO(original))
        nuevo = Document(BytesIO(edited))
        self.assertIn("lectura guiada inicia", anterior.paragraphs[1].text)
        self.assertIn("lectura compartida comienza hoy.", nuevo.paragraphs[1].text)
        self.assertEqual(nuevo.tables[0].cell(1, 1).text, "Secuencia didáctica ficticia")
        self.assertEqual(len(nuevo.tables), len(anterior.tables))
        with zipfile.ZipFile(BytesIO(original)) as first, zipfile.ZipFile(BytesIO(edited)) as final:
            self.assertEqual(set(first.namelist()), set(final.namelist()))
            for path in first.namelist():
                if path != "word/document.xml":
                    self.assertEqual(first.read(path), final.read(path), path)
        validate_docx(edited)

    def test_no_cambia_otros_parrafos_si_no_hay_coincidencia_unica(self):
        original = word_ficticio()
        for operations in (
            [replace("No existe", "Texto nuevo")],
            [replace("Segundo", "Tercero"), replace("No existe", "Texto nuevo")],
            [replace("a", "x")],
        ):
            with self.assertRaises(ValueError):
                editar_word(original, operations)
        self.assertEqual(Document(BytesIO(original)).tables[0].cell(0, 1).text, "Segundo")

    def test_rechaza_comandos_no_permitidos_y_saltos_de_linea(self):
        original = word_ficticio()
        for operations in (
            [{"tipo": "python", "codigo": "import os"}],
            [{"tipo": "reemplazar_texto", "buscar": "Segundo", "reemplazar": "A\nB"}],
            [replace("Segundo", "Tercero")] * 21,
            [],
        ):
            with self.assertRaises(ValueError):
                editar_word(original, operations)

    def test_json_firmable_de_aplicacion_y_salida_docx(self):
        original = word_ficticio()
        payload = {"archivoBase64": base64.b64encode(original).decode("ascii"),
                   "operaciones": [replace("Segundo", "Quinto")]}
        response = json.loads(process_edit_request(json.dumps(payload).encode("utf-8")))
        self.assertEqual(response["operacionesAplicadas"], 1)
        changed = base64.b64decode(response["archivoBase64"], validate=True)
        self.assertEqual(Document(BytesIO(changed)).tables[0].cell(0, 1).text, "Quinto")

    def test_set_parrafo_por_id_y_precondicion(self):
        original = word_ficticio()
        result, changed = editar_word(original, [
            {"tipo": "set_parrafo", "id": "p1",
             "esperado": "La actividad de lectura guiada inicia hoy.",
             "texto": "Actividad pedagógica revisada para segundo grado."},
        ])
        self.assertEqual(changed, 1)
        after = Document(BytesIO(result))
        self.assertEqual(after.paragraphs[1].text, "Actividad pedagógica revisada para segundo grado.")
        self.assertTrue(after.paragraphs[1].runs[1].bold)
        with self.assertRaises(ValueError):
            editar_word(original, [
                {"tipo": "set_parrafo", "id": "p1",
                 "esperado": "Dato desactualizado", "texto": "No debe guardarse"},
            ])

    def test_set_celda_por_id_preserva_tabla_y_falla_en_formato_ambiguo(self):
        original = word_ficticio()
        result, count = editar_word(original, [
            {"tipo": "set_celda", "id": "t0.r0.c1", "esperado": "Segundo",
             "lineas": ["Quinto grado"]},
        ])
        self.assertEqual(count, 1)
        self.assertEqual(Document(BytesIO(result)).tables[0].cell(0, 1).text, "Quinto grado")
        for bad in (
            {"tipo": "set_celda", "id": "t0.r0.c1", "esperado": "Tercero",
             "lineas": ["Quinto"]},
            {"tipo": "set_celda", "id": "t4.r0.c0", "esperado": "",
             "lineas": ["Quinto"]},
            {"tipo": "set_celda", "id": "t0.r0.c1", "esperado": "Segundo",
             "lineas": ["Quinto", "Sexto"]},
        ):
            with self.assertRaises(ValueError):
                editar_word(original, [bad])

    def test_operacion_mixta_es_atomica(self):
        original = word_ficticio()
        with self.assertRaises(ValueError):
            editar_word(original, [
                {"tipo": "set_celda", "id": "t0.r0.c1", "esperado": "Segundo",
                 "lineas": ["Tercero"]},
                {"tipo": "set_parrafo", "id": "p1", "esperado": "texto incorrecto",
                 "texto": "No publicar"},
            ])
        self.assertEqual(Document(BytesIO(original)).tables[0].cell(0, 1).text, "Segundo")

    def test_descarta_json_malformado_y_base64_falso(self):
        for invalid in (b"not-json", b"{}", b'{"archivoBase64":"??","operaciones":[]}'):
            with self.assertRaises(ValueError):
                process_edit_request(invalid)


if __name__ == "__main__":
    unittest.main()
