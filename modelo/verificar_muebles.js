/* Comprueba que ningún pastelero se mete dentro de un mueble: ni parado en su
   puesto, ni caminando de un puesto a otro, ni girado en cualquier dirección.

   Por qué existe: los puestos de trabajo de `setFase` son coordenadas sueltas y
   es muy fácil dejar una dentro de la mesa de amasado o del mostrador sin darse
   cuenta — pasaba con el pastelero azul, que se quedaba 80 cm dentro de la mesa
   durante la fase de amasado y la atravesaba de lado a lado al ir al horno.

   Cómo mide: coloca de verdad al pastelero en cada punto y en varias
   rotaciones, y cruza su caja 3D real contra las cajas reales de los muebles.
   Importa que sea en 3D y no en planta: el gorro y los brazos son más anchos
   que el cuerpo, pero van por encima de la mesa, así que solapar en planta no
   significa atravesar nada. También comprueba que no se pisen entre ellos.

   Uso:  node modelo/verificar_muebles.js     (desde la carpeta del proyecto)  */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');

vm.runInThisContext(fs.readFileSync(path.join(root, 'lib/three.bundle.js'), 'utf8'));

class RendererStub {
  constructor(){ this.domElement = {}; this.shadowMap = {}; }
  setPixelRatio(){} setSize(){} render(){}
}
class ControlsStub {
  constructor(cam){ this.target = new THREE.Vector3(); this.object = cam; }
  update(){}
}

// Espía el constructor de Scene para quedarnos con el grafo que arma escena3d.js.
const RealScene = THREE.Scene;
let escena = null;
function SceneSpy(){ const s = new RealScene(); escena = s; return s; }

global.THREE = { ...THREE, WebGLRenderer: RendererStub, OrbitControls: ControlsStub, Scene: SceneSpy };
global.devicePixelRatio = 1;
global.requestAnimationFrame = () => 0;
global.document = { createElement(tag){
  if (tag === 'canvas') return { width:0, height:0, getContext: () => ({
    fillRect(){}, strokeRect(){}, fillText(){},
    set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){},
    set font(v){}, set textAlign(v){}, set letterSpacing(v){} }) };
  return { className:'', innerHTML:'', style:{}, offsetWidth:70, offsetHeight:20 };
}};

vm.runInThisContext(fs.readFileSync(path.join(root, 'js/escena3d.js'), 'utf8'));
Scene3D.init({ clientWidth:900, clientHeight:650, appendChild(){} },
             { innerHTML:'', appendChild(){} });
escena.updateMatrixWorld(true);

const chefs = [];
escena.traverse(o => { if (o.userData && o.userData.role) chefs.push(o); });
if (chefs.length !== 2){ console.error('✗ No encontré los 2 pasteleros'); process.exit(1); }

const esDeChef = o => { for (let p = o; p; p = p.parent) if (chefs.includes(p)) return true; return false; };

// Muebles: toda malla que no sea el suelo, una baldosa, una pared ni un pastelero.
const muebles = [];
escena.traverse(o => {
  if (!o.isMesh || esDeChef(o)) return;
  const b = new THREE.Box3().setFromObject(o);
  const s = b.getSize(new THREE.Vector3());
  if (s.x > 6 || s.z > 6) return;   // suelo, paredes y cornisas
  if (b.max.y < 0.05) return;       // baldosas
  muebles.push(b);
});

const GIROS = [0, 0.4, 0.8, 1.2, 1.57, 2.0, 2.4, 2.8, 3.14, -0.28, -0.8, -1.57, -2.4];
const caja = new THREE.Box3();

function cajaChef(ch, x, z, giro){
  ch.position.set(x, 0.03, z); ch.rotation.y = giro; ch.updateMatrixWorld(true);
  return caja.setFromObject(ch);
}
// Metros que el pastelero se mete en el mueble más profundo, en el peor giro.
// Devuelve también dónde y contra qué, para no tener que adivinarlo.
function solape(ch, x, z){
  const r = { m: 0 };
  for (const giro of GIROS){
    const b = cajaChef(ch, x, z, giro);
    for (const m of muebles){
      if (!m.intersectsBox(b)) continue;
      const ov = Math.min(Math.min(b.max.x, m.max.x) - Math.max(b.min.x, m.min.x),
                          Math.min(b.max.z, m.max.z) - Math.max(b.min.z, m.min.z));
      if (ov > r.m) Object.assign(r, { m: ov, x, z, giro,
        mueble: `x[${m.min.x.toFixed(2)},${m.max.x.toFixed(2)}] ` +
                `z[${m.min.z.toFixed(2)},${m.max.z.toFixed(2)}] ` +
                `y[${m.min.y.toFixed(2)},${m.max.y.toFixed(2)}]` });
    }
  }
  return r;
}
const peorDe = (a, b) => (b.m > a.m ? b : a);

const fases = ['reposo', 'amasado', 'horno', 'empaque', 'reposo', 'amasado'];
let fallos = 0;

// Medir al pastelero lo mueve: hay que devolverlo a su sitio antes de empezar,
// o el primer trayecto saldría desde el origen y daría un falso positivo.
const sitio = chefs[0].position.clone();
const ancho = cajaChef(chefs[0], 0, 0, 0).getSize(new THREE.Vector3());
chefs[0].position.copy(sitio); chefs[0].rotation.y = -0.2; chefs[0].updateMatrixWorld(true);
console.log(`${muebles.length} muebles · pastelero de ${ancho.x.toFixed(2)} x ${ancho.z.toFixed(2)} x ${ancho.y.toFixed(2)} m\n`);

for (const fase of fases){
  Scene3D.setFase(fase);
  const paradas = [];
  chefs.forEach((c, i) => {
    const u = c.userData;
    const pasos = [[u.dest.x, u.dest.z], ...(u.ruta || [])];
    let desde = [c.position.x, c.position.z], andando = { m: 0 };
    for (const paso of pasos){
      for (let k = 0; k <= 24; k++){
        const f = k / 24;
        andando = peorDe(andando, solape(c, desde[0] + (paso[0]-desde[0])*f,
                                            desde[1] + (paso[1]-desde[1])*f));
      }
      desde = paso;
    }
    const parado = solape(c, desde[0], desde[1]);
    c.position.set(desde[0], 0.03, desde[1]); c.rotation.y = -0.28;
    c.updateMatrixWorld(true);
    paradas.push(desde);
    const mal = parado.m > 0.001 || andando.m > 0.001;
    if (mal) fallos++;
    console.log(`${mal ? '  ✗ ' : '  OK '}${fase.padEnd(8)} ${u.role.padEnd(8)} ` +
      `-> (${desde[0].toFixed(2)}, ${desde[1].toFixed(2)})  ` +
      `parado ${parado.m.toFixed(3)} m · caminando ${andando.m.toFixed(3)} m`);
    const culpa = peorDe(parado, andando);
    if (mal) console.log(`      se mete ${culpa.m.toFixed(3)} m en (${culpa.x.toFixed(2)}, ${culpa.z.toFixed(2)})` +
      ` girado ${culpa.giro.toFixed(2)} rad · mueble ${culpa.mueble}`);
  });
  // que no se pisen entre ellos
  const d = Math.hypot(paradas[0][0]-paradas[1][0], paradas[0][1]-paradas[1][1]);
  if (d < 0.95){ fallos++; console.log(`  ✗ ${fase.padEnd(8)} los dos pasteleros quedan a ${d.toFixed(2)} m, se pisan`); }
}

console.log(fallos
  ? `\n✗ ${fallos} situaciones en las que un pastelero se mete donde no cabe`
  : '\nOK Muebles: nadie atraviesa la mesa, el horno ni el mostrador.');
process.exit(fallos ? 1 : 0);
