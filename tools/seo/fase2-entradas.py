#!/usr/bin/env python3
"""SEO fase 2: la palabra clave de cada página entra en el párrafo de entrada bajo el H1.

Un solo cambio por página, en el primer párrafo después del H1; el H1 de marca se conserva.
Reemplazo tolerante a saltos de línea y espacios del HTML. Si el texto original no aparece
exactamente una vez, no toca el archivo y lo informa.

Uso: python3 tools/seo/fase2-entradas.py [--aplicar]
"""
import os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

CAMBIOS = {
    "index.html": ("WAE ayuda a empresas y socios tecnológicos a",
                   "WAE es una firma de ingeniería de datos e IA que ayuda a empresas y socios tecnológicos a"),
    "soluciones.html": ("definimos la solución técnica y la forma de trabajo",
                        "definimos la solución de ingeniería de datos e IA y la forma de trabajo"),
    "soluciones/integracion-de-sistemas.html": ("Diseñamos e implementamos integraciones entre aplicaciones y fuentes de datos",
                                                "Diseñamos e implementamos la integración de sistemas, aplicaciones y fuentes de datos"),
    "soluciones/automatizacion-de-procesos.html": ("Después automatizamos solo lo que puede controlarse, medirse y mantenerse.",
                                                   "Después aplicamos la automatización de procesos empresariales solo donde puede controlarse, medirse y mantenerse."),
    "soluciones/modernizacion-de-datos.html": ("antes de migrar o rediseñar una plataforma de datos.",
                                               "antes de migrar a la nube o rediseñar una plataforma de datos."),
    "soluciones/confiabilidad-de-datos.html": ("Diseñamos controles de calidad, trazabilidad",
                                               "Diseñamos controles de calidad de datos, trazabilidad"),
    "soluciones/preparacion-para-ia.html": ("antes de recomendar inteligencia artificial.",
                                            "antes de recomendar inteligencia artificial para tu empresa."),
    "soluciones/operacion-gestionada.html": ("Acompañamos tus soluciones de datos e integración con monitoreo",
                                             "Acompañamos tus plataformas de datos, pipelines e integraciones con monitoreo"),
    "soluciones/capacidad-de-ingenieria.html": ("con especialistas, pods administrados o apoyo en el diseño técnico.",
                                                "con ingenieros de datos y otros especialistas, pods administrados o apoyo en el diseño técnico."),
    "empresas.html": ("una solución de integración o automatización que pueda medirse",
                      "una solución de integración de sistemas o automatización de procesos que pueda medirse"),
    "empresas/diagnostico.html": ("Analizamos un proceso crítico, medimos su situación actual",
                                  "Analizamos un proceso crítico y los datos que lo alimentan, medimos su situación actual"),
    "partners.html": ("pods de Data Engineering para consultoras",
                      "pods de ingeniería de datos para consultoras"),
    "como-trabajamos.html": ("WAE Delivery System es nuestra forma de organizar el trabajo.",
                             "WAE Delivery System es nuestra metodología para organizar cada proyecto de datos."),
}


def main(aplicar):
    for f, (antes, despues) in CAMBIOS.items():
        ruta = os.path.join(RAIZ, f)
        s = open(ruta, encoding="utf-8").read()
        h1 = s.index("</h1>")
        patron = r"\s+".join(map(re.escape, antes.split()))
        hallados = list(re.finditer(patron, s[h1:]))
        if len(hallados) != 1:
            print(f"✗ {f}: el texto original aparece {len(hallados)} veces; no se toca")
            continue
        m = hallados[0]
        nuevo = s[:h1 + m.start()] + despues + s[h1 + m.end():]
        print(f"✓ {f}")
        if aplicar:
            open(ruta, "w", encoding="utf-8").write(nuevo)


if __name__ == "__main__":
    main("--aplicar" in sys.argv)
