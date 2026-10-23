#!/usr/bin/env python3
"""Títulos y meta descripciones SEO por página (mapa: tools/seo/mapa-keywords.md).

Reemplaza solo <title>, meta description, og:title, og:description, twitter:title y
twitter:description. No toca el cuerpo, el diseño, las URL ni los datos estructurados.
Valida largos (título ≤ 60, descripción ≤ 155) antes de escribir.

Uso: python3 tools/seo/metadatos.py [--aplicar]   (sin --aplicar solo muestra el cambio)
"""
import html, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

META = {
    "index.html": (
        "Ingeniería de datos e IA para empresas en Colombia | WAE",
        "WAE es una firma de ingeniería de datos e IA: integramos sistemas, modernizamos plataformas y operamos datos con ingeniería confiable. Bogotá, Colombia."),
    "soluciones.html": (
        "Soluciones de ingeniería de datos e IA | WAE",
        "Integración de sistemas, automatización de procesos, migración a la nube, calidad de datos e IA para empresas, organizadas por el resultado que necesitas."),
    "soluciones/integracion-de-sistemas.html": (
        "Integración de sistemas y datos empresariales | WAE",
        "Integración de sistemas, ERP, API y fuentes de datos para que la información avance entre áreas sin cruces manuales ni hojas de cálculo intermedias."),
    "soluciones/automatizacion-de-procesos.html": (
        "Automatización de procesos empresariales con control | WAE",
        "Automatización de procesos empresariales con reglas, integraciones e IA solo cuando aporta: flujos controlados, medibles y con intervención humana."),
    "soluciones/modernizacion-de-datos.html": (
        "Modernización y migración de datos a la nube | WAE",
        "Modernizamos pipelines, bases de datos y plataformas heredadas, incluida la migración de datos a la nube, para ganar rendimiento, escala y mantenibilidad."),
    "soluciones/confiabilidad-de-datos.html": (
        "Calidad y gobierno de datos empresariales | WAE",
        "Calidad de datos con reglas, monitoreo, alertas y trazabilidad: definiciones compartidas para que las áreas confíen en las mismas cifras."),
    "soluciones/preparacion-para-ia.html": (
        "Inteligencia artificial para empresas con datos listos | WAE",
        "Antes de implementar inteligencia artificial en tu empresa evaluamos datos, permisos, reglas y controles, para una IA gobernada y con aprobación humana."),
    "soluciones/operacion-gestionada.html": (
        "Operación y soporte de plataformas de datos | WAE",
        "Monitoreo, mantenimiento y mejora de pipelines y plataformas de datos en operación, con automatización y análisis inteligente cuando mejoran el servicio."),
    "soluciones/capacidad-de-ingenieria.html": (
        "Especialistas en ingeniería de datos para tu proyecto | WAE",
        "Ingenieros de datos y pods administrados para acelerar proyectos, con supervisión, documentación y continuidad definidas desde el inicio."),
    "empresas.html": (
        "Integración y automatización de procesos para empresas | WAE",
        "Para empresas: definimos e implementamos la integración y automatización de procesos críticos, con resultados que se pueden medir, operar y mantener."),
    "empresas/diagnostico.html": (
        "Diagnóstico operativo de procesos y datos | WAE",
        "En un objetivo de 10 días hábiles analizamos un proceso crítico, construimos una línea base y definimos la integración o automatización más proporcional."),
    "partners.html": (
        "Ingeniería de datos para partners tecnológicos | WAE",
        "Especialistas y pods administrados de ingeniería de datos que amplían la capacidad de entrega de partners tecnológicos, con supervisión y continuidad."),
    "partners/pod-administrado.html": (
        "Pod administrado de ingeniería de datos | WAE",
        "Un equipo de ingeniería de datos dedicado y configurado según el proyecto del partner, con supervisión, estándares, documentación y continuidad."),
    "como-trabajamos.html": (
        "Cómo trabajamos: metodología de proyectos de datos | WAE",
        "Las seis etapas con las que WAE organiza cada proyecto de datos: controles de entrega, modalidades de contratación y responsabilidades de cada parte."),
    "wae.html": (
        "Sobre WAE: firma de ingeniería de datos e IA en Bogotá",
        "WAE es una firma de ingeniería de datos e inteligencia artificial aplicada con base en Colombia: propósito, principios, alcance y forma de trabajar."),
    "contacto.html": (
        "Contacto | WAE — Ingeniería de datos en Bogotá",
        "Cuéntanos sobre tu proyecto de datos, integración o automatización. Revisamos tu necesidad y, si podemos ayudarte, acordamos el siguiente paso."),
}

esc = lambda t: html.escape(t, quote=True)


def reemplazar(head, patron, valor):
    nuevo, n = re.subn(patron, lambda m: m.group(1) + valor + m.group(2), head, count=1, flags=re.S)
    return nuevo, n


def main(aplicar):
    errores = []
    for f, (titulo, desc) in META.items():
        if len(titulo) > 60: errores.append(f"{f}: título de {len(titulo)} caracteres")
        if len(desc) > 155: errores.append(f"{f}: descripción de {len(desc)} caracteres")
    if errores:
        sys.exit("\n".join(errores))
    for f, (titulo, desc) in META.items():
        ruta = os.path.join(RAIZ, f)
        s = open(ruta, encoding="utf-8").read()
        fin = s.index("</head>")
        head, resto = s[:fin], s[fin:]
        cambios = 0
        for patron, valor in [
            (r"(<title>).*?(</title>)", esc(titulo)),
            (r'(<meta\s+name="description"\s+content=").*?(")', esc(desc)),
            (r'(<meta\s+property="og:title"\s+content=").*?(")', esc(titulo)),
            (r'(<meta\s+property="og:description"\s+content=").*?(")', esc(desc)),
            (r'(<meta\s+name="twitter:title"\s+content=").*?(")', esc(titulo)),
            (r'(<meta\s+name="twitter:description"\s+content=").*?(")', esc(desc)),
        ]:
            head, n = reemplazar(head, patron, valor)
            cambios += n
        print(f"{f:45} {cambios}/6 · título {len(titulo)} · descripción {len(desc)}")
        if aplicar:
            open(ruta, "w", encoding="utf-8").write(head + resto)


if __name__ == "__main__":
    main("--aplicar" in sys.argv)
