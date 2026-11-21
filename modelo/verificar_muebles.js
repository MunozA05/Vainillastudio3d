/* Comprueba que ningún pastelero se mete dentro de un mueble: ni parado en su
   puesto ni mientras camina de un puesto a otro.

   Por qué existe: los puestos de trabajo de `setFase` son coordenadas sueltas y
   es muy fácil dejar una dentro de la mesa de amasado o del mostrador sin
   darse cuenta — pasaba con el pastelero azul, que se quedaba 80 cm dentro de
   la mesa durante la fase de amasado y la atravesaba de lado a lado al ir al
   horno. Esta prueba mide las cajas reales del grafo de Three.js, así que no
   hay que recalcular nada a mano cuando se mueve un mueble.

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
  if (b.min.y > 1.95) return;       // lámpara, alacena y estantes, por encima del gorro
  muebles.push(b);
});

const RADIO = 0.40, ALTO = 1.95;    // bulto del pastelero, gorro y brazos incluidos
function solape(x, z){
  const c = new THREE.Box3(new THREE.Vector3(x-RADIO, 0, z-RADIO),
                           new THREE.Vector3(x+RADIO, ALTO, z+RADIO));
  let peor = 0;
  for (const m of muebles){
    if (!m.intersectsBox(c)) continue;
    peor = Math.max(peor, Math.min(
      Math.min(c.max.x, m.max.x) - Math.max(c.min.x, m.min.x),
      Math.min(c.max.z, m.max.z) - Math.max(c.min.z, m.min.z)));
  }
  return peor;                      // metros que se solapa; 0 = libre
}

const fases = ['reposo', 'amasado', 'horno', 'empaque', 'reposo', 'amasado'];
let fallos = 0;
console.log(`${muebles.length} muebles medidos · pastelero de ${RADIO} m de radio\n`);

for (const fase of fases){
  Scene3D.setFase(fase);
  chefs.forEach((c, i) => {
    const u = c.userData;
    const pasos = [[u.dest.x, u.dest.z], ...(u.ruta || [])];
    let desde = [c.position.x, c.position.z], andando = 0;
    for (const paso of pasos){
      for (let k = 0; k <= 40; k++){
        const f = k / 40;
        andando = Math.max(andando, solape(desde[0] + (paso[0]-desde[0])*f,
                                           desde[1] + (paso[1]-desde[1])*f));
      }
      desde = paso;
    }
    const parado = solape(desde[0], desde[1]);
    c.position.set(desde[0], 0.03, desde[1]);   // llega a su puesto
    const mal = parado > 0.001 || andando > 0.001;
    if (mal) fallos++;
    console.log(`${mal ? '  ✗ ' : '  OK '}${fase.padEnd(8)} ${u.role.padEnd(8)} ` +
      `-> (${desde[0].toFixed(2)}, ${desde[1].toFixed(2)})  ` +
      `parado ${parado.toFixed(3)} m · caminando ${andando.toFixed(3)} m`);
  });
}

console.log(fallos
  ? `\n✗ ${fallos} situaciones en las que un pastelero se mete en un mueble`
  : '\nOK Muebles: nadie atraviesa la mesa, el horno ni el mostrador.');
process.exit(fallos ? 1 : 0);
