/* Prueba de humo de la geometría y API de animación, sin navegador/WebGL. */
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const path=require('path');
const root=path.join(__dirname,'..');

vm.runInThisContext(fs.readFileSync(path.join(root,'lib/three.bundle.js'),'utf8'));

class RendererStub{
  constructor(){this.domElement={};this.shadowMap={}}
  setPixelRatio(){} setSize(){} render(){}
}
class ControlsStub{
  constructor(cam){this.target=new THREE.Vector3();this.object=cam}
  update(){}
}

global.THREE={...THREE,WebGLRenderer:RendererStub,OrbitControls:ControlsStub};
global.devicePixelRatio=1;
global.requestAnimationFrame=()=>0;
global.document={createElement(tag){
  if(tag==='canvas')return {width:0,height:0,getContext:()=>({
    fillRect(){},strokeRect(){},fillText(){},set fillStyle(v){},
    set strokeStyle(v){},set lineWidth(v){},set font(v){},set textAlign(v){},set letterSpacing(v){}
  })};
  return {className:'',innerHTML:'',style:{},offsetWidth:70,offsetHeight:20};
}};

vm.runInThisContext(fs.readFileSync(path.join(root,'js/escena3d.js'),'utf8'));
const cont={clientWidth:900,clientHeight:650,appendChild(){}},labels={innerHTML:'',appendChild(){}};
Scene3D.init(cont,labels);
assert(Scene3D.cam,'Falta la cámara 3D');
const P=[4,7,7,10,68,64,68,12], U=[1,1,1,2,9,8,9,2];
Scene3D.setPlan(P,U,false);
Scene3D.setPlan(P.map((n)=>n+2),U,true);
Scene3D.setFase('amasado');
Scene3D.moverBandeja('amasado',.5);
Scene3D.horno(true);
Scene3D.setFase('horno');
Scene3D.bandejaPila(5,.6);
Scene3D.horno(false);
Scene3D.setFase('empaque');
Scene3D.setVista('horno');
Scene3D.resize();
Scene3D.setFase('reposo');
console.log('OK Cocina 3D: geometrías, ocho productos, personajes, horno y vistas.');
