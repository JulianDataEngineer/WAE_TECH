#!/usr/bin/env python3
"""SEO fase 3: textos alternativos, logos de experiencia previa y datos estructurados.

- Fotos con alt de una sola palabra → describen la escena y su etapa.
- Logos de experiencia previa con el nombre completo que registra PRODUCT.md.
- La frase bajo «Experiencia presentada con transparencia» decía «Empresas que impulsamos
  con datos e IA», lo que los presentaba como clientes; CLAUDE.md exige rotularlos como
  experiencia previa del equipo.
- Nombres de servicio del JSON-LD del inicio con la palabra clave de cada solución
  (no se ven en pantalla; las etiquetas visibles del menú no cambian).
Cada reemplazo debe aparecer exactamente las veces indicadas; si no, no toca el archivo.

Uso: python3 tools/seo/fase3-alt-y-datos.py [--aplicar]
"""
import os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOGO_PIE = ('alt="WAE — World AI Engineers"', 'alt="WAE, firma de ingeniería de datos e IA"')

CAMBIOS = {
    "como-trabajamos.html": [
        ('alt="Comprender"', 'alt="Comprender: dos profesionales revisan en una tableta el proceso y los datos de la empresa"', 1),
        ('alt="Conectar"', 'alt="Conectar: el equipo revisa en sala la integración de sistemas y fuentes de datos"', 1),
        ('alt="Diseñar"', 'alt="Diseñar: un ingeniero explica la arquitectura de datos de la solución en una pantalla"', 1),
        ('alt="Construir"', 'alt="Construir: dos ingenieros de datos desarrollan la solución en sus computadores"', 1),
        ('alt="Controlar y documentar"', 'alt="Controlar y documentar: monitores con tableros de calidad y monitoreo de datos"', 1),
        ('alt="Transferir y evolucionar"', 'alt="Transferir y evolucionar: el equipo presenta la arquitectura documentada de la solución"', 1),
    ],
    "partners.html": [
        ('alt="Contexto"', 'alt="Contexto: estación de trabajo con los tableros del proyecto del partner"', 1),
        ('alt="Capacidad"', 'alt="Capacidad: equipo de ingeniería de datos planifica el proyecto sobre diagramas"', 1),
        ('alt="Validación"', 'alt="Validación: reunión del equipo para validar el perfil y el plan de trabajo"', 1),
        ('alt="Incorporación"', 'alt="Incorporación: pantalla con el plan de incorporación del proyecto"', 1),
        ('alt="Operación"', 'alt="Operación: dos ingenieros de datos revisan el monitoreo del servicio"', 1),
        ('alt="Renovación o cierre"', 'alt="Renovación o cierre: una profesional revisa la documentación y los resultados del proyecto"', 1),
    ],
    "index.html": [
        ('<p class="clients-sub">Empresas que impulsamos con datos e IA</p>',
         '<p class="clients-sub">Experiencia previa de nuestro equipo. No son clientes de WAE.</p>', 1),
        ('class="client-logo" alt="Cinte"', 'class="client-logo" alt="Grupo Cinte"', 1),
        ('class="client-logo" alt="Credi"', 'class="client-logo" alt="Credibanco"', 1),
        ('class="client-logo" alt="GT"', 'class="client-logo" alt="Globaltask"', 1),
        ('class="client-logo" alt="Sophos"', 'class="client-logo" alt="Sophos Solutions"', 1),
        ('class="client-logo" alt="Tali"', 'class="client-logo" alt="Talycap Global"', 1),
        ('"name": "Ampliar capacidad de ingeniería",', '"name": "Especialistas en ingeniería de datos",', 1),
        ('"name": "Integrar sistemas y datos",', '"name": "Integración de sistemas y datos empresariales",', 1),
        ('"name": "Automatizar procesos",', '"name": "Automatización de procesos empresariales",', 1),
        ('"name": "Modernizar plataformas de datos",', '"name": "Modernización y migración de datos a la nube",', 1),
        ('"name": "Mejorar la confiabilidad de los datos",', '"name": "Calidad y gobierno de datos",', 1),
        ('"name": "Prepararse para IA aplicada",', '"name": "Preparación de datos e inteligencia artificial para empresas",', 1),
        ('"name": "Operar y evolucionar soluciones",', '"name": "Operación y soporte de plataformas de datos",', 1),
    ],
}


def main(aplicar):
    archivos = set(CAMBIOS) | {f for f in os.popen(f"cd {RAIZ} && git ls-files '*.html'").read().split()
                               if not f.startswith(("concepts", "tools", "prototipo"))}
    for f in sorted(archivos):
        ruta = os.path.join(RAIZ, f)
        s = open(ruta, encoding="utf-8").read()
        lista = CAMBIOS.get(f, []) + ([(LOGO_PIE[0], LOGO_PIE[1], s.count(LOGO_PIE[0]))] if LOGO_PIE[0] in s else [])
        if not lista:
            continue
        mal = [(a, s.count(a), n) for a, _, n in lista if s.count(a) != n]
        if mal:
            print(f"✗ {f}: {mal}")
            continue
        for a, b, _ in lista:
            s = s.replace(a, b)
        print(f"✓ {f}: {len(lista)} cambios")
        if aplicar:
            open(ruta, "w", encoding="utf-8").write(s)


if __name__ == "__main__":
    main("--aplicar" in sys.argv)
