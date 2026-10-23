# Mapa de palabras clave · www.waengineers.co

Fecha: 2026-10-23 · Estado: **aprobado el 2026-10-23**. Fase 1 aplicada: títulos y meta descripciones de las 16 páginas (`tools/seo/metadatos.py`).
Fuentes: Planificador de palabras clave de Google Ads (Colombia, oct 2025 – sept 2026) → `volumenes-colombia.csv` (43 términos) e `ideas-colombia.csv` (84 ideas); autocompletado de Google Colombia.

## Lo que dicen los datos

1. **Es un nicho de bajo volumen.** Casi todo está entre 10 y 100 búsquedas al mes. El SEO de WAE no va a traer miles de visitas: va a traer **pocas visitas de alta intención**. Por eso conviene una palabra clave clara por página, no cantidad.
2. **«Ingeniería de datos» (1.000 – 10.000/mes) es sobre todo intención académica** (carrera, universidades, nota de corte, sueldos). Sirve para el inicio como término de categoría, pero no como gancho comercial.
3. **Las búsquedas con valor comercial se reconocen por la puja**, que es lo que pagan los anunciantes por un clic:
   - «ia para empresas» (hasta 25.945 COP), «inteligencia artificial para empresas / en empresas / empresarial» (11.000 – 19.500 COP)
   - «automatización de procesos empresariales» (17.024 COP), «automatización empresarial» (12.448 COP)
   - «integración erp» (10.814 COP), «integración de sistemas» (puja alta atípica)
4. **Volumen medio y poca competencia:** «calidad de datos», «gobierno de datos», «arquitectura de datos», «pipeline de datos» y «automatización de procesos» (100 – 1.000/mes). «etl» tiene 1.000 – 10.000, pero es intención técnica e informativa.
5. **Sin volumen medible en Colombia:** «consultoría de datos colombia», «outsourcing de ingeniería de datos», «staff augmentation colombia», «servicios de ingeniería de datos», «modernización de plataformas de datos». Se pueden usar como frase natural, pero no como objetivo principal.

## Mapa por página

| Página | Palabra clave principal | Secundarias | Título propuesto (≤ 60) |
|---|---|---|---|
| Inicio `/` | ingeniería de datos (1k–10k) | ingeniería de datos e inteligencia artificial (100–1k), arquitectura de datos (100–1k), consultoría de datos | Ingeniería de datos e IA para empresas en Colombia \| WAE |
| Soluciones `/soluciones` | soluciones de ingeniería de datos | consultoría de datos, analítica de datos para empresas | Soluciones de ingeniería de datos e IA \| WAE *(se conserva)* |
| Integración `/soluciones/integracion-de-sistemas` | integración de sistemas (10–100, puja alta) | integración de datos, integración erp, integración api, integración de sistemas de información | Integración de sistemas y datos empresariales \| WAE |
| Automatización `/soluciones/automatizacion-de-procesos` | automatización de procesos empresariales (10–100, puja alta) | automatización de procesos (100–1k), automatización empresarial, automatización de flujos de trabajo | Automatización de procesos empresariales con control \| WAE |
| Modernización `/soluciones/modernizacion-de-datos` | migración de datos a la nube (10–100) | modernización de datos, data warehouse en la nube, migración de base de datos | Modernización y migración de datos a la nube \| WAE |
| Confiabilidad `/soluciones/confiabilidad-de-datos` | calidad de datos (100–1k) | gobierno de datos (100–1k), observabilidad de datos, monitoreo de datos, conciliación de datos | Calidad y gobierno de datos empresariales \| WAE |
| Preparación para IA `/soluciones/preparacion-para-ia` | inteligencia artificial para empresas (10–100, puja alta) | ia para empresas, inteligencia artificial en empresas, preparación de datos para IA | Inteligencia artificial para empresas, con datos listos \| WAE |
| Operación `/soluciones/operacion-gestionada` | soporte de plataformas de datos | pipeline de datos (100–1k), mantenimiento de pipelines, servicios gestionados de datos | Operación y soporte de plataformas de datos \| WAE |
| Capacidad `/soluciones/capacidad-de-ingenieria` | ingenieros de datos | equipo de ingenieros de datos, especialistas en ingeniería de datos | Especialistas en ingeniería de datos para tu proyecto \| WAE |
| Empresas `/empresas` | integración y automatización de procesos para empresas | automatización de procesos empresariales (enlaza a la solución) | Integración y automatización de procesos para empresas \| WAE |
| Diagnóstico `/empresas/diagnostico` | diagnóstico de procesos y datos | diagnóstico operativo, plan de integración | Diagnóstico operativo de procesos y datos \| WAE |
| Partners `/partners` | ingeniería de datos para partners tecnológicos | capacidad de entrega, pods administrados | Ingeniería de datos para partners tecnológicos \| WAE |
| Pod administrado `/partners/pod-administrado` | equipo de ingeniería de datos dedicado | pod de ingeniería de datos | Pod administrado de ingeniería de datos \| WAE |
| Cómo trabajamos `/como-trabajamos` | metodología de proyectos de datos | entrega de proyectos de datos | Cómo trabajamos: metodología de proyectos de datos \| WAE |
| Sobre WAE `/wae` | firma de ingeniería de datos e IA | empresa de ingeniería de datos en Colombia | Sobre WAE: firma de ingeniería de datos e IA en Bogotá |
| Contacto `/contacto` | contacto ingeniería de datos Bogotá | — | Contacto \| WAE — Ingeniería de datos en Bogotá *(se conserva)* |

Una sola página por palabra clave principal: «ingeniería de datos» solo en el inicio y «inteligencia artificial para empresas» solo en Preparación para IA, para que no compitan entre sí.

**Ajuste al aplicar:** `PRODUCT.md` dice que WAE no es una empresa de staffing y que es la alternativa a «una consultoría de meses». Por eso Partners no usa «outsourcing / staff augmentation» y Empresas no usa «consultoría».

## Dónde entra cada palabra (solo texto; diseño y URL intactos)

1. **Título** (`<title>`, og:title y twitter:title).
2. **Meta descripción** (≤ 155 caracteres), escrita como respuesta a la búsqueda.
3. **H1:** se conserva el mensaje actual. La palabra clave entra en el subtítulo o en el primer párrafo, con la voz de WAE.
4. **Un H2** de la página la nombra de forma natural, si ya hay un H2 cercano que lo permita.
5. **Texto alternativo** de las imágenes relevantes y **texto de los enlaces internos** que apuntan a la página.
6. **Datos estructurados:** nombre del servicio en el JSON-LD.

## Reglas

- Nada de relleno de palabras clave ni de «agencia de automatizaciones», «chatbots» o «RPA» como posicionamiento, aunque se busquen.
- La IA se presenta como capacidad gobernada dentro de una arquitectura, con control humano.
- Ninguna cifra, cliente ni resultado inventado.

## Decisiones pendientes

1. **Marca en los títulos:** propuesta «… \| WAE» al final, porque es corto y deja espacio a la palabra clave. Alternativa: «WAE \| Data & AI Engineering» solo en el inicio.
2. **Alcance:** los volúmenes son de Colombia. Si se quiere Latinoamérica, hay que repetir la consulta con esos países.
3. **Orden de trabajo:** primero títulos y meta descripciones de las 16 páginas, que es lo de mayor impacto y menor riesgo; después subtítulos y párrafos.
