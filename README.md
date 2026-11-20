# Vainilla Atelier · simulador del modelo de Investigación de Operaciones

Simulador interactivo del proyecto final de **IO 1 (UAO)**: modelo de programación
lineal entera de mezcla de productos para la pastelería Vainilla Atelier.
**27 variables enteras, 29 restricciones.**

El modelo **se resuelve dentro de la página**, no trae resultados pregrabados: si
cambias un dato, todo se vuelve a calcular. Las cifras coinciden exactamente con
las del notebook de PuLP que está en `modelo/`.

---

## Cómo abrirlo

Haz doble clic en **`index.html`** (el de la raíz, no el de `dist/`). No hace falta servidor ni internet:
Three.js viene incluido en `lib/`.

> Si usas VS Code, la extensión *Live Server* ayuda para que recargue sola al guardar.

---

## Qué hay en cada archivo

| Archivo | Qué contiene |
|---|---|
| `index.html` | La estructura de la página: encabezado, la cocina y los 5 paneles de la derecha. **Aquí se edita el texto.** |
| `css/estilos.css` | Todos los estilos. Los colores están arriba, en `:root`. |
| `js/datos.js` | **Los datos del proyecto** (`BASE`), los nombres, los colores de cada producto y el puente con la escena 3D. |
| `js/solver.js` | El modelo matemático: resuelve el problema entero y la relajación lineal. |
| `js/escena3d.js` | La cocina en Three.js: muebles, luces, sombras, cámara y animaciones. |
| `js/tablas.js` | Restricciones en vivo, franjas de producción, medidores y tarjetas de resultado. |
| `js/escenarios.js` | Gráficas, escenarios 1 y 2, y las corridas complementarias. |
| `js/reto.js` | El modo reto (armar el plan a mano y compararlo con el óptimo). |
| `js/app.js` | Controles, animación de la semana, preguntas de sustentación y arranque. |
| `lib/three.bundle.js` | Three.js r187 + OrbitControls + RoundedBoxGeometry, ya empaquetados. **No editar.** |
| `modelo/` | El notebook de PuLP original, que es la fuente de los números. |
| `build.py` | Empaqueta todo en un solo archivo (`dist/index.html`) para publicar. |
| `dist/index.html` | La versión ya empaquetada, lista para subir o entregar. **No la edites**: se regenera con `build.py` y se sobrescribe. |
| `modelo/verificar.js` | `node modelo/verificar.js` comprueba que el solver da los mismos números del notebook. |

---

## Lo que vas a querer cambiar

### Los datos del modelo
`js/datos.js`, el objeto `BASE` (primeras líneas). Un índice por producto, en orden:

```js
U : [...]   // utilidad por unidad   [$/und]
pr: [...]   // precio de venta       [$/und]
co: [...]   // costo                 [$/und]
D : [...]   // demanda semanal       [und/sem]
CH: [...]   // capacidad por horneada[und/horneada]
TC: [...]   // tiempo de horno       [min/horneada]
RR: [...]   // rendimiento por receta[und/receta]
TR: [...]   // mano de obra          [min-persona/receta]
UC: 2,      // unidades por cajita
H : 1200,   // horno disponible      [min/sem]
MO: 2400,   // mano de obra          [min-persona/sem]
K : [4,5,6] // productos que se venden en cajitas (índices desde 0)
```

Ojo: `U` manda sobre `pr − co`. Si cambias precio o costo desde la pestaña
**Controles**, la utilidad se recalcula sola; si editas `BASE` a mano, deja los
tres coherentes.

### Los textos y las preguntas de sustentación
Los textos largos están en `index.html`. Las 12 preguntas con su respuesta están
en `js/app.js`, en la constante `QAS`.

### La cocina 3D
`js/escena3d.js`:

- **Estética:** diorama isométrico de pastelería, baldosas a cuadros, muebles color menta y crema, estanterías, luz cálida, batidora, horno y bandejas.
- **Productos:** los ocho tipos se representan mediante geometría 3D diferente (zanahoria, corazón, cuchareables de frutas, galletas con chips, alfajores y rollos de canela). La vitrina muestra una representación a escala de las cantidades; las cifras reales aparecen en las etiquetas y tablas.
- **Animación educativa:** dos pasteleros articulados se desplazan entre estaciones; el batido, los lotes, la apertura del horno y el color de los pasteles se sincronizan con las tres fases de la semana. La velocidad es regulable (1×, 2×, 3×, 5×).
- **Interacción:** girar, acercar, elegir 4 vistas, modificar los recursos y datos de cada producto, simular una semana, aplicar los dos escenarios o proponer un plan propio en el reto.
- **Alcance:** representación visual didáctica, no animación a escala temporal real ni simulación física del horneado. Los resultados de optimización son independientes de la representación artística.

- **Posición de los muebles:** las constantes `MOSTRADOR`, `HORNO`, `AMASADO`
  y, dentro de `construir()`, cada `bloque(...)` / `cil(...)` / `esfera(...)`.
  Sistema de coordenadas: `x` derecha, `y` **arriba**, `z` hacia la cámara.
- **Colores:** el objeto `C` (muebles) y `PROD` (los ocho productos).
- **Luces:** al final de `construir()` — `HemisphereLight` (ambiente),
  `key` (luz principal, la que tira la sombra), `rim`, `fill` y la luz del horno.
- **Vistas de cámara:** el objeto `VISTAS`, con `p` = posición y `t` = a dónde mira.

### Los colores de la interfaz
`css/estilos.css`, bloque `:root` (líneas 3 a 8).

---

## Cómo funciona el solver (para la sustentación)

El notebook usa **PuLP + CBC** con ramificación y acotamiento. Aquí no se puede
correr Python, así que `js/solver.js` llega al mismo óptimo por otro camino:

Como las horneadas y las recetas mínimas quedan determinadas por las unidades
(`Y = ⌈X/CH⌉`, `L = ⌈X/RR⌉`), el problema se reduce a una **mochila entera de dos
recursos** (horno y mano de obra), que se resuelve **exacta por programación
dinámica**. Es óptimo, no aproximado, y además el plan sale ya depurado
(sin horneadas ni recetas vacías), que es el segundo paso del notebook.

`relajar()` resuelve aparte la **relajación lineal continua** con el método
símplex y devuelve los precios sombra, para la sección de corridas complementarias.

### Comprobación rápida con los números del notebook

| Caso | Z esperada |
|---|---|
| Datos del proyecto | $516.211,92 |
| Escenario 1 · D₁ = 6 | $535.259,20 |
| Escenario 2 · fresa a $16.000 | $527.401,92 |
| MO = 2.460 min-persona | $526.256,92 |
| Relajación lineal continua | $526.256,92 |

---

## Publicar

```bash
python3 build.py      # genera dist/index.html, un solo archivo
```

Ese archivo se puede subir a cualquier hosting, abrir desde una USB o publicar
como artifact. No necesita internet.

---

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `F` | Pantalla completa |
| `C` | Ver solo la cocina (esconde los paneles) |
| `espacio` | Correr o pausar la simulación de la semana |

Con el mouse: arrastra sobre la cocina para girar, rueda para acercar.

---

Emily Yanguas · Juan Camilo Sossa · Daniela Vásquez · Alejandro Muñoz · Isabella Morales
