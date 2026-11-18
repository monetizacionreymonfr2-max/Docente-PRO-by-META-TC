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


def word_cronograma_ficticio():
    doc = Document()
    doc.sections[0].header.paragraphs[0].text = "Logo institucional de prueba"
    doc.add_heading("PPA Ficticio", 0)
    doc.add_paragraph("Contexto de aula ficticio.")
    tabla = doc.add_table(rows=3, cols=3)
    tabla.style = "Table Grid"
    for i, texts in enumerate([
        ["Semana", "Área", "Actividad"],
        ["1", "Lenguaje", "Lectura"],
        ["2", "Matemática", "Juego lógico"],
    ]):
        for j, text in enumerate(texts):
            tabla.cell(i, j).text = text
    tabla.cell(1, 2).paragraphs[0].runs[0].bold = True
    doc.add_heading("Diagnóstico", level=1)
    doc.add_paragraph("Los estudiantes identifican letras.")
    doc.add_paragraph("La estrategia prioriza lectura.")
    saved = BytesIO()
    doc.save(saved)
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

    def test_agregar_semanas_en_cronograma_preserva_formato_y_encabezado(self):
        original = word_cronograma_ficticio()
        result, count = editar_word(original, [
            {"tipo": "agregar_filas", "tablaId": "t0", "despuesDeFilaId": "t0.r2",
             "esperadoModelo": ["2", "Matemática", "Juego lógico"],
             "filas": [["3", "Lenguaje", "Dictado"], ["4", "Ciencias", "Experimento"]]},
        ])
        self.assertEqual(count, 1)
        before = Document(BytesIO(original))
        after = Document(BytesIO(result))
        self.assertEqual(len(before.tables[0].rows), 3)
        self.assertEqual(len(after.tables[0].rows), 5)
        self.assertEqual(after.tables[0].cell(0, 0).text, "Semana")
        self.assertEqual(after.tables[0].cell(3, 2).text, "Dictado")
        self.assertEqual(after.tables[0].cell(4, 1).text, "Ciencias")
        self.assertEqual(after.tables[0].style.name, before.tables[0].style.name)
        self.assertEqual(after.sections[0].header.paragraphs[0].text,
                         before.sections[0].header.paragraphs[0].text)
        with zipfile.ZipFile(BytesIO(original)) as prev, zipfile.ZipFile(BytesIO(result)) as new:
            self.assertEqual(set(prev.namelist()), set(new.namelist()))
            for name in prev.namelist():
                if name != "word/document.xml":
                    self.assertEqual(prev.read(name), new.read(name), name)
        validate_docx(result)

    def test_reemplazar_todas_las_semanas_sin_borrar_cabecera(self):
        original = word_cronograma_ficticio()
        new, count = editar_word(original, [
            {"tipo": "reemplazar_filas", "tablaId": "t0", "filaInicioId": "t0.r1",
             "esperadas": [["1", "Lenguaje", "Lectura"], ["2", "Matemática", "Juego lógico"]],
             "filas": [["1", "Lenguaje", "Sílabas"], ["2", "Matemática", "Series"],
                       ["3", "Ciencias", "Observación"]]},
        ])
        self.assertEqual(count, 1)
        doc = Document(BytesIO(new))
        self.assertEqual(len(doc.tables[0].rows), 4)
        self.assertEqual(doc.tables[0].cell(0, 0).text, "Semana")
        self.assertEqual(doc.tables[0].cell(1, 2).text, "Sílabas")
        self.assertTrue(doc.tables[0].cell(1, 2).paragraphs[0].runs[0].bold)
        self.assertEqual(doc.tables[0].cell(3, 2).text, "Observación")
        self.assertEqual(Document(BytesIO(original)).tables[0].cell(1, 2).text, "Lectura")

    def test_rechaza_filas_incompatibles_y_encabezados_sin_salida_parcial(self):
        original = word_cronograma_ficticio()
        casos = [
            {"tipo": "agregar_filas", "tablaId": "t0", "despuesDeFilaId": "t0.r0",
             "esperadoModelo": ["Semana", "Área", "Actividad"], "filas": [["3","a","b"]]},
            {"tipo": "agregar_filas", "tablaId": "t0", "despuesDeFilaId": "t0.r2",
             "esperadoModelo": ["2", "Matemática", "Antiguo"], "filas": [["3","a","b"]]},
            {"tipo": "reemplazar_filas", "tablaId": "t0", "filaInicioId": "t0.r1",
             "esperadas": [["1", "Lenguaje", "Lectura"]],
             "filas": [["2","a","b"]]},
            {"tipo": "reemplazar_filas", "tablaId": "t0", "filaInicioId": "t0.r1",
             "esperadas": [["1", "Lenguaje", "Lectura"], ["2","Matemática","Juego lógico"]],
             "filas": [["2","a"]]},
        ]
        for caso in casos:
            with self.subTest(caso=caso["tipo"]):
                with self.assertRaises(ValueError):
                    editar_word(original, [caso])
                self.assertEqual(Document(BytesIO(original)).tables[0].cell(1,2).text, "Lectura")

    def test_rechaza_celdas_combinadas_antes_de_reemplazar_filas(self):
        source = Document(BytesIO(word_cronograma_ficticio()))
        source.tables[0].cell(1, 0).merge(source.tables[0].cell(1, 1))
        buffer = BytesIO()
        source.save(buffer)
        with self.assertRaises(ValueError):
            editar_word(buffer.getvalue(), [
                {"tipo":"reemplazar_filas", "tablaId":"t0", "filaInicioId":"t0.r1",
                 "esperadas":[["1", "Lenguaje", "Lectura"], ["2","Matemática","Juego lógico"]],
                 "filas":[["3","A","B"]]},
            ])

    def test_editar_seccion_completa_sin_modificar_titulo(self):
        original = word_cronograma_ficticio()
        edited, count = editar_word(original, [
            {"tipo": "set_seccion", "tituloId": "p2", "tituloEsperado": "Diagnóstico",
             "parrafos": [
                 {"id":"p3", "esperado":"Los estudiantes identifican letras.",
                  "texto":"El grupo reconoce vocales y palabras."},
                 {"id":"p4", "esperado":"La estrategia prioriza lectura.",
                  "texto":"Se prioriza la lectura compartida."},
             ]},
        ])
        self.assertEqual(count, 1)
        doc = Document(BytesIO(edited))
        self.assertEqual(doc.paragraphs[2].text, "Diagnóstico")
        self.assertEqual(doc.paragraphs[3].text, "El grupo reconoce vocales y palabras.")
        self.assertEqual(doc.paragraphs[4].text, "Se prioriza la lectura compartida.")
        self.assertEqual(len(doc.tables[0].rows), 3)
        with self.assertRaises(ValueError):
            editar_word(original, [
                {"tipo": "set_seccion", "tituloId": "p2", "tituloEsperado": "Otro título",
                 "parrafos": [{"id":"p3", "esperado":"Los estudiantes identifican letras.",
                                "texto":"No escribir"}]},
            ])

    def test_nunca_acepta_codigo_ni_operaciones_sobre_la_misma_tabla_ambigua(self):
        original = word_cronograma_ficticio()
        insertar = {"tipo": "agregar_filas", "tablaId":"t0", "despuesDeFilaId":"t0.r2",
                    "esperadoModelo":["2","Matemática","Juego lógico"],
                    "filas":[["3","Ciencias","Exploración"]]}
        for cambios in (
            [insertar, insertar],
            [insertar, {"tipo":"set_celda","id":"t0.r1.c1",
                        "esperado":"Lenguaje","lineas":["Ciencias"]}],
            [{"tipo":"set_seccion","tituloId":"p2","tituloEsperado":"Diagnóstico",
              "parrafos":[{"id":"p5","esperado":"A","texto":"B"}]}],
            [{"tipo":"agregar_filas","tablaId":"t0","despuesDeFilaId":"t0.r2",
              "esperadoModelo":["2","Matemática","Juego lógico"],
              "filas":[["3","A","B"]]*25}],
        ):
            with self.assertRaises(ValueError):
                editar_word(original, cambios)

    def test_descarta_json_malformado_y_base64_falso(self):
        for invalid in (b"not-json", b"{}", b'{"archivoBase64":"??","operaciones":[]}'):
            with self.assertRaises(ValueError):
                process_edit_request(invalid)


if __name__ == "__main__":
    unittest.main()
