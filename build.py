#!/usr/bin/env python3
"""
Empaqueta el proyecto en UN solo archivo: dist/index.html

Para qué sirve: la versión de carpeta (index.html + css/ + js/ + lib/ + assets/)
es la que se edita. Para publicarla como artifact de Claude, subirla a un hosting
o mandarla por correo conviene tener un archivo único que no dependa de rutas.

Se incrustan: la hoja de estilos, los scripts y los archivos de `assets/`
(el logo) como data URI, para que el archivo funcione sin carpeta al lado.

Uso:   python3 build.py
"""
import re, pathlib, base64, mimetypes

RAIZ = pathlib.Path(__file__).parent
html = (RAIZ / "index.html").read_text(encoding="utf-8")

def meter_css(m):
    ruta = RAIZ / m.group(1)
    return "<style>\n" + ruta.read_text(encoding="utf-8") + "\n</style>"

def meter_js(m):
    ruta = RAIZ / m.group(1)
    codigo = ruta.read_text(encoding="utf-8")
    # la línea de export solo sirve para usar el solver desde Node
    codigo = codigo.replace(
        "if(typeof module!=='undefined')module.exports={resolver,relajar};", "")
    return "<script>\n" + codigo + "\n</script>"

_cache = {}
def meter_asset(m):
    atributo, rel = m.group(1), m.group(2)
    if rel not in _cache:
        ruta = RAIZ / rel
        tipo = mimetypes.guess_type(ruta.name)[0] or "application/octet-stream"
        b64 = base64.b64encode(ruta.read_bytes()).decode("ascii")
        _cache[rel] = f"data:{tipo};base64,{b64}"
    return f'{atributo}="{_cache[rel]}"'

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', meter_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', meter_js, html)
html = re.sub(r'\b(src|href)="(assets/[^"]+)"', meter_asset, html)

salida = RAIZ / "dist"
salida.mkdir(exist_ok=True)
(salida / "index.html").write_text(html, encoding="utf-8")
print(f"Listo: dist/index.html ({len(html)/1024:.0f} KB)")
