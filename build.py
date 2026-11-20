#!/usr/bin/env python3
"""
Empaqueta el proyecto en UN solo archivo: dist/index.html

Para qué sirve: la versión de carpeta (index.html + css/ + js/ + lib/) es la que
se edita. Para publicarla como artifact de Claude, subirla a un hosting o
mandarla por correo conviene tener un archivo único que no dependa de rutas.

Uso:   python3 build.py
"""
import re, pathlib

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

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', meter_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', meter_js, html)

salida = RAIZ / "dist"
salida.mkdir(exist_ok=True)
(salida / "index.html").write_text(html, encoding="utf-8")
print(f"Listo: dist/index.html ({len(html)/1024:.0f} KB)")
