/* ============================================================
   Cocina 3D de Vainilla Atelier — Three.js (WebGL)
   Luces reales, sombras proyectadas, materiales y animación.
   ============================================================ */
const T=THREE;
const Scene3D=(()=>{
let ren,scene,cam,ctl,raf,cont,labelBox;
let hornoLuz,hornoVidrio,puerta,bandeja,vapor=[],chefs=[],pilas=[],bases=[];
let hornoInterior,mezcladora,mezcla,flour=[],destellos=[],fase='reposo',cocinando=false;
let anim=[], reloj=new T.Clock(), autoRot=false, listo=false;

const C={pared:0xffe6bc, pared2:0xf9dca7, piso:0xf3dec1, tabla:0x30483d,
  lila:0xabcbb6, lilaOsc:0x578b7c, crema:0xfff9ed, duraz:0xffb75d, oro:0xf7c65e,
  madera:0xb8774b, rosa:0xf28b91, menta:0xa4dfbd, azul:0x9cbfce, piel:0xeeb78d,
  vidrio:0x493934, gris:0xe0d1be};
const PROD=[0xe8954a,0xe8899f,0xf0c04a,0xe2555f,0x9c6b4a,0xdcab6e,0xc98a4a,0x9bc24a];

const mat=(c,r,m,e)=>new T.MeshStandardMaterial({color:c,roughness:r==null?.72:r,
  metalness:m||0,emissive:e||0x000000,emissiveIntensity:e?1:0});
function caja(w,h,d,m,r){
  const g=new T.RoundedBoxGeometry(w,h,d,3,Math.min(r==null?.06:r,Math.min(w,h,d)/2.05));
  const o=new T.Mesh(g,m); o.castShadow=true; o.receiveShadow=true; return o;
}
function add(p,o,x,y,z){o.position.set(x,y,z);p.add(o);return o}
function bloque(p,x,y,z,w,h,d,c,r,rough,met){
  return add(p,caja(w,h,d,mat(c,rough,met),r),x,y,z);
}
function cil(p,x,y,z,rt,rb,h,c,seg){
  const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg||24),mat(c,.7));
  o.castShadow=true;o.receiveShadow=true;return add(p,o,x,y,z);
}
function esfera(p,x,y,z,r,c,rough){
  const o=new T.Mesh(new T.SphereGeometry(r,26,20),mat(c,rough==null?.7:rough));
  o.castShadow=true;o.receiveShadow=true;return add(p,o,x,y,z);
}
function cono(p,x,y,z,top,bottom,h,c,seg){
  const o=new T.Mesh(new T.CylinderGeometry(top,bottom,h,seg||18),mat(c,.76));
  o.castShadow=true;return add(p,o,x,y,z);
}
function torus(p,x,y,z,r,t,c){
  const o=new T.Mesh(new T.TorusGeometry(r,t,7,34),mat(c,.55));
  o.castShadow=true;return add(p,o,x,y,z);
}
function giro(p,x,y,z,rx,ry,rz){p.position.set(x,y,z);p.rotation.set(rx||0,ry||0,rz||0);return p}

/* ---------- posiciones de las 8 vitrinas ---------- */
const PX=[-1.72,-0.575,0.575,1.72];
function pilaPos(i){return {x:PX[i%4], z:(i<4? 0.74 : 1.86)}}
const MOSTRADOR={x:1.95,z:1.55,y:0.98};
const HORNO={x:-3.5,z:-1.6}, AMASADO={x:-3.15,z:1.7};
function cartel(p,txt,w,h,x,y,z,accent){
  const cv=document.createElement('canvas');cv.width=768;cv.height=256;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#fff8e8';ctx.fillRect(0,0,768,256);
  ctx.strokeStyle='#b97d59';ctx.lineWidth=13;ctx.strokeRect(12,12,744,232);
  ctx.font='bold 75px Georgia, serif';ctx.fillStyle=accent||'#875041';
  ctx.textAlign='center';ctx.fillText(txt,384,130);
  ctx.font='27px sans-serif';ctx.letterSpacing='5px';ctx.fillText('PASTELERÍA ARTESANAL',384,189);
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));
  return add(p,m,x,y,z);
}

/* ---------- construcción ---------- */
function construir(){
  scene=new T.Scene();
  scene.background=null;
  scene.fog=new T.Fog(0xffdfb8,24,46);

  // ----- habitación -----
  const room=new T.Group(); scene.add(room);
  const piso=new T.Mesh(new T.BoxGeometry(10.4,.36,7.6),mat(C.piso,.88));
  piso.position.y=-.18; piso.receiveShadow=true; room.add(piso);
  // Baldosas a cuadros estilo diorama de pastelería artesanal.
  const tileCream=mat(0xfff7e8,.88), tileDark=mat(0x436056,.87);
  const tileGeo=new T.BoxGeometry(.93,.018,.93);
  for(let ix=0;ix<11;ix++)for(let iz=0;iz<8;iz++){
    const tile=new T.Mesh(tileGeo,(ix+iz)%2?tileCream:tileDark);
    tile.position.set(-4.70+ix*.94,.014,-3.29+iz*.94);
    tile.receiveShadow=true;room.add(tile);
  }
  bloque(room,0,-.22,3.84,10.6,.20,.15,0x9b6e4b,.03,.8);
  bloque(room,5.23,-.22,0,.15,.20,7.8,0x9b6e4b,.03,.8);
  bloque(room,0,1.55,-3.72,10.4,3.5,.36,C.pared,.05,.95);
  bloque(room,-5.0,1.55,0,.36,3.5,7.6,C.pared2,.05,.95);
  bloque(room,0,.07,-3.5,10.4,.14,.1,C.pared2,.03,.9);
  // Cornisas y detalles del encuentro de las paredes.
  bloque(room,0,3.28,-3.46,10.0,.14,.46,0xfff6dc,.04,.75);
  bloque(room,-4.83,3.28,0,.46,.14,7.35,0xfff6dc,.04,.75);
  bloque(room,-4.83,.23,0,.16,.43,7.25,0xe8b778,.03,.75);
  cartel(room,'Vainilla Atelier',2.35,.79,-1.32,2.77,-3.49,'#985d51');
  // Lámpara colgante con pantalla metálica y luz cálida.
  const lamp=new T.Group();add(room,lamp,1.7,3.36,.34);
  cil(lamp,0,-.28,0,.027,.027,.56,0x956c57,16);
  cono(lamp,0,-.63,0,.08,.51,.31,0xe7aa63,32);
  esfera(lamp,0,-.86,0,.13,0xffebac,.2);
  const glow=new T.PointLight(0xffca80,1.9,5,2);glow.position.set(0,-.81,0);lamp.add(glow);
  // Estantes visibles en la pared lateral.
  [-1.04,.62].forEach((z,k)=>{
    bloque(room,-4.60,2.1,z,.45,.09,1.15,0xbb8659,.02,.62);
    for(let j=0;j<3;j++){
      const jar=cil(room,-4.58,2.32,z-.38+j*.37,.11,.11,.32,
        [0xffe1aa,0xf4a879,0xb4cda3][(k+j)%3],18);
      jar.material.roughness=.33;
      cil(room,-4.58,2.51,z-.38+j*.37,.12,.12,.052,0xfff6e5,18);
    }
  });

  // ----- ventana -----
  const vg=new T.Group(); vg.position.set(1.4,2.05,-3.52); room.add(vg);
  bloque(vg,0,0,0,2.3,1.8,.16,0xc78a62,.05,.8);
  const luzv=new T.Mesh(new T.PlaneGeometry(2.0,1.5),
    new T.MeshBasicMaterial({color:0xd9f3d8}));
  luzv.position.z=.09; vg.add(luzv);
  bloque(vg,0,0,.11,.09,1.5,.06,0xc78a62,.02,.8);
  bloque(vg,0,0,.11,2.0,.09,.06,0xc78a62,.02,.8);
  bloque(room,1.4,1.05,-3.4,2.6,.14,.4,C.duraz,.05,.85);
  // matas
  const m1=bloque(room,.75,1.26,-3.35,.3,.3,.3,0xc97f6a,.09,.8);
  esfera(room,.75,1.56,-3.35,.26,0x79b88c,.85);
  esfera(room,.63,1.47,-3.26,.16,0x8fc8a4,.85);
  bloque(room,2.1,1.24,-3.35,.26,.26,.26,0xc97f6a,.08,.8);
  esfera(room,2.1,1.5,-3.35,.22,0x8fc8a4,.85);

  // ----- cuadro -----
  bloque(room,3.55,2.15,-3.55,1.05,.82,.1,0xb9784b,.04,.8);
  bloque(room,3.55,2.15,-3.47,.85,.62,.04,0xfdf4ec,.02,.9);
  bloque(room,3.48,2.08,-3.43,.4,.26,.03,C.rosa,.02,.9);

  // ----- alacena -----
  const al=new T.Group(); al.position.set(HORNO.x,2.45,-3.38); room.add(al);
  bloque(al,0,0,0,2.5,1.0,.62,0xf7e4c4,.07,.65);
  [-.61,.61].forEach(x=>{
    bloque(al,x,0,.345,1.08,.82,.038,0xfff9ee,.035,.48);
    bloque(al,x<0?x+.4:x-.4,-.12,.40,.04,.24,.06,0xb58c57,.018,.3,.45);
  });
  [[-.75,.22,0xf3b6c5],[0,.2,0xf6dfa6],[.72,.24,0x8fc8a4]].forEach(([x,r,c])=>{
    const t=cil(al,x,-.14,.33,r,r*.8,.3,c); t.material.roughness=.55;
  });

  // ----- horno + estufa -----
  const ho=new T.Group(); ho.position.set(HORNO.x,0,HORNO.z); room.add(ho);
  bloque(ho,0,.14,0,1.9,.28,1.6,C.lilaOsc,.06,.6);
  bloque(ho,0,.95,0,2.0,1.35,1.7,C.lila,.12,.6);
  bloque(ho,0,.95,.87,1.7,.97,.09,0x524139,.06,.75);
  hornoInterior=new T.Group(); ho.add(hornoInterior);
  bloque(hornoInterior,0,.74,.915,1.19,.055,.64,0x7c756e,.02,.3,.45);
  for(let i=0;i<6;i++){
    const x=(i%3-1)*.34,z=.75+Math.floor(i/3)*.27;
    const pastel=cil(hornoInterior,x,.82,z,.138,.13,.10,0xe4ae6b,20);
    pastel.userData.t=i;pastel.userData.base=.10;
  }
  puerta=new T.Group(); puerta.position.set(0,.5,.985); ho.add(puerta);
  const pm=bloque(puerta,0,.3,0,1.62,.9,.1,C.crema,.06,.5);
  hornoVidrio=bloque(puerta,0,.3,.06,1.15,.58,.04,C.vidrio,.03,.25,.2);
  hornoVidrio.material.emissive=new T.Color(0xff8c1a);
  hornoVidrio.material.emissiveIntensity=0;
  bloque(puerta,0,.78,.06,1.35,.1,.1,C.oro,.045,.35,.75);
  const enc=bloque(ho,0,1.68,0,2.08,.14,1.78,0xf8f2f9,.05,.35);
  [[-.52,-.4],[.52,-.4],[-.52,.42],[.52,.42]].forEach(([x,z])=>{
    const q=cil(ho,x,1.76,z,.26,.26,.05,C.lilaOsc,28); q.material.roughness=.5;
  });
  const olla=cil(ho,-.52,1.94,-.4,.3,.26,.32,C.menta,28);
  olla.material.roughness=.45; cil(ho,-.52,2.12,-.4,.33,.33,.05,0xf6f1ff,28);
  // Perillas y controles visibles en la cocina de juguete.
  for(let i=0;i<5;i++){
    const knob=cil(ho,-.72+i*.36,1.58,.76,.075,.075,.065,0x42332d,18);
    knob.rotation.x=Math.PI/2;
  }
  hornoLuz=new T.PointLight(0xff9b3d,0,4.2,2); hornoLuz.position.set(0,.8,.5); ho.add(hornoLuz);
  // vapor
  for(let i=0;i<7;i++){
    const s=esfera(ho,-.52,2.2,-.4,.09+Math.random()*.06,0xffffff,1);
    s.material.transparent=true; s.material.opacity=0; s.castShadow=false;
    s.userData.t=Math.random(); vapor.push(s);
  }

  // ----- nevera -----
  const nv=new T.Group(); nv.position.set(-1.25,0,-3.0); room.add(nv);
  bloque(nv,0,1.35,0,1.6,2.7,1.2,0xfff3df,.14,.55);
  bloque(nv,0,1.72,.61,1.5,.03,.02,C.lilaOsc,.01,.6);
  bloque(nv,-.55,2.1,.64,.09,.5,.1,C.oro,.04,.35,.7);
  bloque(nv,-.55,1.25,.64,.09,.44,.1,C.oro,.04,.35,.7);

  // ----- lavaplatos -----
  const lv=new T.Group(); lv.position.set(3.2,0,-3.0); room.add(lv);
  bloque(lv,0,.48,0,2.1,.96,1.2,0xffe9ce,.1,.6);
  bloque(lv,0,1.0,0,2.2,.12,1.3,0xf8f2fc,.05,.35);
  const pi=new T.Mesh(new T.BoxGeometry(1.1,.14,.7),mat(0xe2d9f0,.4,.25));
  pi.position.set(0,1.0,.05); pi.receiveShadow=true; lv.add(pi);
  cil(lv,0,1.22,-.35,.05,.05,.42,C.oro); bloque(lv,0,1.42,-.19,.07,.07,.42,C.oro,.03,.35,.7);

  // ----- mesa de amasado -----
  const am=new T.Group(); am.position.set(AMASADO.x,0,AMASADO.z); room.add(am);
  [[-1.05,-.48],[1.05,-.48],[-1.05,.48],[1.05,.48]].forEach(([x,z])=>
    bloque(am,x,.42,z,.15,.84,.15,C.madera,.05,.75));
  bloque(am,0,.9,0,2.4,.16,1.2,C.crema,.06,.55);
  bloque(am,-.6,1.0,0,.85,.06,.65,0xedd9c4,.03,.8);
  const mz=esfera(am,-.6,1.08,0,.2,0xf7e3c8,.85); mz.scale.y=.6;
  bloque(am,.7,1.04,-.15,.42,.14,.42,0xf3b6c5,.06,.6);
  // Batidora animada: cuerpo, tazón metálico, paleta, huevo y utensilios.
  mezcladora=new T.Group(); add(am,mezcladora,.62,1.05,-.25);
  bloque(mezcladora,-.16,.18,0,.32,.39,.36,0xf099aa,.07,.35);
  bloque(mezcladora,-.05,.47,0,.58,.16,.39,0xf099aa,.08,.4);
  cil(mezcladora,.13,.12,0,.22,.18,.17,0xc6cbd0,24);
  mezcla=new T.Group();add(mezcladora,mezcla,.13,.25,0);
  cil(mezcla,0,.15,0,.043,.043,.35,0xd9a887,16);
  for(let i=0;i<3;i++){
    const p=bloque(mezcla,0,-.03,.12,.04,.18,.04,0xd5dbe0,.013,.3,.65);
    p.rotation.y=i*Math.PI*2/3;
    p.position.x=Math.sin(i*Math.PI*2/3)*.12;
    p.position.z=Math.cos(i*Math.PI*2/3)*.12;
  }
  for(let i=0;i<4;i++){
    const s=esfera(am,-.5+(i%2)*.15,1.13,(i>>1)*.17-.28,.07,0xfff6df,.7);
    s.scale.y=1.3;
  }
  for(let i=0;i<16;i++){
    const dot=esfera(am,-.55+(Math.random()-.5)*.55,1.08+(Math.random())*.32,
       (Math.random()-.5)*.5,.014,0xfff4e1,.95);
    dot.material.transparent=true;dot.material.opacity=0;dot.castShadow=false;
    dot.userData.off=Math.random()*Math.PI*2;flour.push(dot);
  }

  // ----- mostrador -----
  const mo=new T.Group(); mo.position.set(MOSTRADOR.x,0,MOSTRADOR.z); room.add(mo);
  bloque(mo,0,.45,0,5.0,.9,2.0,0xf0c084,.08,.7);
  bloque(mo,0,.95,0,5.2,.14,2.15,C.crema,.06,.5);
  bloque(mo,0,.46,1.03,5.0,.84,.05,0xb8754c,.03,.8);
  [-1.62,-.55,.55,1.62].forEach(x=>{
    bloque(mo,x,.49,1.066,.97,.65,.025,0xffdfad,.02,.6);
    bloque(mo,x,.46,1.096,.12,.04,.045,0xbd8b58,.018,.3,.5);
  });
  // taburetes
  [.8,2.9].forEach(x=>{const g=new T.Group();g.position.set(x,0,2.85);room.add(g);
    cil(g,0,.36,0,.09,.11,.72,C.madera); cil(g,0,.76,0,.42,.42,.14,0xe0a771,28);
    [[-.22,0],[0.22,0]].forEach(()=>{});});

  // ----- pasteleros articulados: brazos, piernas, gorros y delantales -----
  [[-4.25,2.65,C.rosa],[-2.55,2.70,C.azul]].forEach(([x,z,c],k)=>{
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=-.2;room.add(g);
    const leg=[];
    [-.155,.155].forEach(dx=>{
      const a=new T.Group();add(g,a,dx,.41,0);
      cono(a,0,-.19,0,.118,.10,.39,0x47443f,16);
      bloque(a,0,-.38,.095,.25,.12,.39,0x654b40,.05,.8);
      leg.push(a);
    });
    cono(g,0,.72,0,.245,.31,.64,k?0xc9d5cd:0xffece1,24);
    bloque(g,0,.74,.257,.42,.52,.06,k?0x7fa99c:0xe4a4a0,.04,.75);
    bloque(g,0,.74,.292,.30,.14,.018,0xfff4da,.03,.75);
    const arm=[];
    [-1,1].forEach(sign=>{
      const a=new T.Group();add(g,a,sign*.26,.95,0);
      cono(a,sign*.08,-.23,.01,.098,.125,.45,k?0xd5ece1:0xffe6df,16);
      esfera(a,sign*.10,-.46,.02,.12,C.piel,.75);
      arm.push(a);
    });
    esfera(g,0,1.22,0,.264,C.piel,.75);
    esfera(g,-.243,1.22,.03,.062,C.piel,.75);
    esfera(g,.243,1.22,.03,.062,C.piel,.75);
    [-.095,.095].forEach(dx=>esfera(g,dx,1.26,.242,.021,0x564439,.5));
    const sonrisa=torus(g,0,1.15,.252,.081,.012,0x9d5d57);
    sonrisa.rotation.z=Math.PI;
    // Gorro de chef volumétrico.
    cil(g,0,1.55,0,.23,.22,.19,0xfff9ef,26);
    for(let j=0;j<5;j++){
      const a=j*Math.PI*2/5;
      esfera(g,Math.sin(a)*.17,1.68,Math.cos(a)*.17,.17,0xfffcf3,.9);
    }
    esfera(g,0,1.72,0,.175,0xfffcf3,.9);
    g.userData={inicio:new T.Vector3(x,0,z),dest:new T.Vector3(x,0,z),
      arm,leg,tint:c,role:k?'horno':'amasado',walk:0};chefs.push(g);
  });

  // ----- bandeja -----
  bandeja=new T.Group(); room.add(bandeja);
  bandeja.position.set(AMASADO.x,1.12,AMASADO.z);
  bloque(bandeja,0,0,0,.80,.055,.58,0xb6aca4,.035,.35,.65);
  bloque(bandeja,0,.042,0,.72,.018,.5,0xfaf4e6,.01,.65);
  const cont3=cil(bandeja,0,.12,0,.20,.19,.13,0xeeb46c,22);
  bandeja.userData.cont=cont3;
  for(let j=0;j<4;j++){
    const cookie=cil(bandeja,(j%2-.5)*.30,.14,((j>>1)-.5)*.23,.105,.1,.055,0xde9959,20);
    cookie.userData.baked=false;
  }

  // ----- vitrinas / pilas -----
  for(let i=0;i<8;i++){
    const p=pilaPos(i);
    const g=new T.Group(); g.position.set(MOSTRADOR.x+p.x,MOSTRADOR.y+.07,MOSTRADOR.z+p.z-1.3);
    room.add(g);
    const b=bloque(g,0,.03,0,.87,.065,.88,0xfbf2df,.04,.52);bases.push(b);
    bloque(g,0,.073,.42,.82,.025,.032,0xc6a178,.011,.5);
    const pil=new T.Group(); g.add(pil); pilas.push(pil);
  }

  // ----- luces -----
  scene.add(new T.HemisphereLight(0xfff5d7,0x6a6a59,1.35));
  const key=new T.DirectionalLight(0xffeecb,2.65);
  key.position.set(6.5,9.5,6.5); key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  const sc=key.shadow.camera; sc.left=-9;sc.right=9;sc.top=9;sc.bottom=-9;sc.near=1;sc.far=32;
  key.shadow.bias=-0.0006; key.shadow.normalBias=.022; key.shadow.radius=3;
  scene.add(key); scene.add(key.target); key.target.position.set(0,.6,.3);
  const rim=new T.DirectionalLight(0xffd9a8,.75); rim.position.set(1.4,3.4,-6); scene.add(rim);
  const fill=new T.DirectionalLight(0xffd7d2,.5); fill.position.set(-7,4,4); scene.add(fill);
  const vent=new T.PointLight(0xfff0cf,2.1,11,2); vent.position.set(1.4,2.2,-3.0); scene.add(vent);
}

/* ---------- productos en miniatura: ocho recetas visuales diferentes ---------- */
function producto(i){
  const g=new T.Group();
  if(i===0){ // pastel de zanahoria, bizcocho en capas y zanahoria de azúcar
    cil(g,0,.083,0,.145,.147,.13,0xe8a468,24);
    cil(g,0,.156,0,.150,.15,.039,0xfff3d9,24);
    torus(g,0,.183,0,.115,.016,0xffffff).rotation.x=Math.PI/2;
    const z=cono(g,0,.226,0,.018,.054,.105,0xf67c2c,14);z.rotation.z=Math.PI/2;
    esfera(g,-.055,.235,0,.023,0x63a866);esfera(g,-.075,.227,.016,.018,0x86c26f);
  }else if(i===1){ // corazón de fresa glaseado
    const s=new T.Shape();s.moveTo(0,-.17);s.bezierCurveTo(-.23,-.045,-.23,.13,-.08,.14);
    s.bezierCurveTo(0,.18,0,.11,0,.095);s.bezierCurveTo(0,.11,.08,.18,.15,.14);
    s.bezierCurveTo(.30,.13,.23,-.045,0,-.17);
    const ex=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,
      bevelSegments:2,steps:1,bevelSize:.011,bevelThickness:.01}),mat(0xf29fae,.49));
    ex.rotation.x=-Math.PI/2;ex.position.y=.155;ex.scale.set(.78,.78,.78);
    ex.castShadow=true;g.add(ex);
    esfera(g,0,.18,-.01,.034,0xffedfa);esfera(g,.067,.168,.055,.022,0xffffff);
    torus(g,0,.064,0,.145,.018,0xe6b773).rotation.x=Math.PI/2;
  }else if(i===2||i===3||i===7){ // cuchareables en vaso de cristal
    const color=i===2?0xf8bc3d:i===3?0xec6c7b:0xa7c867;
    cil(g,0,.108,0,.125,.102,.185,0xfff5df,24);
    cil(g,0,.09,0,.129,.108,.064,color,24);
    cil(g,0,.14,0,.127,.127,.038,0xf9f4e7,24);
    cil(g,0,.19,0,.123,.123,.05,color,24);
    cil(g,0,.224,0,.129,.129,.024,0xffffff,24);
    torus(g,0,.234,0,.132,.011,0xe9e4dd).rotation.x=Math.PI/2;
    for(let q=0;q<3;q++){
      const a=q*Math.PI*2/3;
      esfera(g,Math.cos(a)*.065,.254,Math.sin(a)*.064,.034,
        i===2?(q===0?0xf29328:0xffdc66):i===3?0xde345a:0x75b55f,.5);
    }
    if(i===3)esfera(g,0,.283,0,.025,0x569457);
  }else if(i===4){ // galleta con trocitos de chocolate
    cil(g,0,.078,0,.151,.149,.084,0xbb8756,30);
    cil(g,0,.121,0,.148,.148,.024,0xd6a36b,30);
    [[-.075,-.045],[.070,.045],[-.02,.079],[.072,-.07],[-.07,.075],[.01,-.02]].forEach(([x,z],q)=>{
      const ch=bloque(g,x,.146,z,.042,.018,.035,q%2?0x594032:0x745143,.013,.6);
      ch.rotation.y=q*.78;
    });
  }else if(i===5){ // alfajor de dos tapas y dulce de leche
    cil(g,0,.07,0,.140,.14,.055,0xefc790,28);
    cil(g,0,.11,0,.137,.137,.045,0x9b5b39,28);
    cil(g,0,.15,0,.139,.139,.055,0xf8d5a1,28);
    torus(g,0,.128,0,.14,.012,0xfff8eb).rotation.x=Math.PI/2;
    for(let j=0;j<5;j++){
      const a=j*Math.PI*2/5;
      esfera(g,Math.cos(a)*.08,.184,Math.sin(a)*.08,.016,0xfff7e2);
    }
  }else if(i===6){ // rollo con espiral de canela e icing
    cil(g,0,.092,0,.15,.135,.125,0xe6ab71,27);
    cil(g,0,.157,0,.151,.148,.016,0xffd0a1,28);
    const points=[];
    for(let j=0;j<=49;j++){
      const a=j*.35,r=.004+j*.00255;
      points.push(new T.Vector3(Math.cos(a)*r,.171,Math.sin(a)*r));
    }
    const spiral=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),80,.012,6,false),mat(0x8f5338,.52));
    spiral.castShadow=true;g.add(spiral);
    torus(g,0,.175,0,.114,.009,0xfff7df).rotation.x=Math.PI/2;
  }
  return g;
}
function setPlan(X,UPB,animar){
  for(let i=0;i<8;i++){
    const pil=pilas[i],n=Math.min(6,Math.ceil((X[i]||0)/UPB[i])),cur=pil.children.length;
    if(!animar&&cur!==n){while(pil.children.length)pil.remove(pil.children[0]);
      for(let k=0;k<n;k++)ponerProducto(i,k,false);continue}
    if(n>cur)for(let k=cur;k<n;k++)ponerProducto(i,k,true);
    while(pil.children.length>n)pil.remove(pil.children[pil.children.length-1]);
  }
}
function ponerProducto(i,k,animar){
  const y=.082,x=(k%2-.5)*.37,z=(Math.floor(k/2)-1)*.264;
  const o=producto(i);o.position.set(x,animar?y+1.1:y,z);
  o.scale.setScalar(animar?.45:1);pilas[i].add(o);
  if(animar)anim.push({o,t:0,dur:.47,y0:y+1.1,y1:y,tipo:'caer'});
}

/* ---------- etiquetas HTML ---------- */
let etiquetas=[];
function defLabels(lista){
  labelBox.innerHTML='';
  etiquetas=lista.map(L=>{const e=document.createElement('div');
    e.className='tag3 '+(L.cls||''); e.innerHTML=L.html; labelBox.appendChild(e);
    return {e,p:new T.Vector3(L.x,L.y,L.z),w:0,h:0,prio:L.prio||0}});
  requestAnimationFrame(()=>etiquetas.forEach(L=>{L.w=L.e.offsetWidth;L.h=L.e.offsetHeight}));
}
function actualizarLabels(){
  if(!etiquetas.length)return;
  const W=cont.clientWidth,H=cont.clientHeight,v=new T.Vector3(),vis=[];
  for(const L of etiquetas){
    v.copy(L.p).project(cam);
    if(v.z>=1){L.e.style.display='none';continue}
    L.e.style.display='';
    if(!L.w){L.w=L.e.offsetWidth;L.h=L.e.offsetHeight}
    vis.push({L,x:(v.x*.5+.5)*W,y:(-v.y*.5+.5)*H,d:cam.position.distanceTo(L.p)});
  }
  // separar etiquetas que se pisan: las de abajo empujan hacia arriba a las de encima
  vis.sort((a,b)=>b.y-a.y);
  const puestas=[];
  for(const o of vis){
    const w=o.L.w||70,h=o.L.h||18;
    for(let it=0;it<14;it++){
      let choca=false;
      for(const q of puestas){
        if(Math.abs(o.x-q.x)<(w+q.w)/2+4 && Math.abs(o.y-q.y)<(h+q.h)/2+3){
          o.y=q.y-(h+q.h)/2-3; choca=true;
        }
      }
      if(!choca)break;
    }
    o.y=Math.max(h/2+3,Math.min(H-h/2-3,o.y));
    o.x=Math.max(w/2+3,Math.min(W-w/2-3,o.x));
    puestas.push({x:o.x,y:o.y,w,h});
    o.L.e.style.transform=`translate(-50%,-50%) translate(${o.x.toFixed(1)}px,${o.y.toFixed(1)}px)`;
    o.L.e.style.opacity=Math.max(.42,Math.min(1,22/o.d));
  }
}

/* ---------- cámara ---------- */
const VISTAS={
  general:{p:[5.9,5.45,11.3],t:[-.25,1.2,.3]},
  horno:{p:[-.4,3.4,3.4],t:[-3.5,1.4,-1.5]},
  mostrador:{p:[2.1,3.4,7.4],t:[1.9,1.3,1.3]},
  alto:{p:[.3,11.8,7.4],t:[0,.3,0]}
};
let camAnim=null;
function setVista(n){
  const V=VISTAS[n]||VISTAS.general;
  camAnim={t:0,dur:1.1,p0:cam.position.clone(),p1:new T.Vector3(...V.p),
           t0:ctl.target.clone(),t1:new T.Vector3(...V.t)};
}
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

/* ---------- bucle ---------- */
function loop(){
  raf=requestAnimationFrame(loop);
  const dt=Math.min(.05,reloj.getDelta()), t=reloj.elapsedTime;
  if(camAnim){camAnim.t+=dt; const k=ease(Math.min(1,camAnim.t/camAnim.dur));
    cam.position.lerpVectors(camAnim.p0,camAnim.p1,k);
    ctl.target.lerpVectors(camAnim.t0,camAnim.t1,k);
    if(camAnim.t>=camAnim.dur)camAnim=null;}
  for(let i=anim.length-1;i>=0;i--){const a=anim[i]; a.t+=dt;
    const k=Math.min(1,a.t/a.dur);
    if(a.tipo==='caer'){const e=1-Math.pow(1-k,3);
      a.o.position.y=a.y0+(a.y1-a.y0)*e;
      const s=k<.75?.6+.55*e:1+Math.sin((k-.75)*12.5)*.07*(1-k);
      a.o.scale.setScalar(Math.min(1.08,s));
      if(k>=1){a.o.position.y=a.y1;a.o.scale.setScalar(1);anim.splice(i,1)}}
    else if(a.tipo==='mover'){const e=ease(k);
      a.o.position.lerpVectors(a.p0,a.p1,e);
      a.o.position.y+=Math.sin(Math.PI*k)*(a.arco||0);
      if(k>=1){anim.splice(i,1); a.cb&&a.cb()}}
  }
  chefs.forEach((c,i)=>{
    const u=c.userData,p=c.position,d=u.dest;
    const vx=d.x-p.x,vz=d.z-p.z,dist=Math.hypot(vx,vz);
    const walking=dist>.045;
    if(walking){const s=Math.min(dist,dt*2.6);
      p.x+=vx/dist*s;p.z+=vz/dist*s;
      c.rotation.y=Math.atan2(vx,vz);u.walk+=dt*13;
    }else{c.rotation.y+=(-.28-c.rotation.y)*Math.min(1,dt*2.5)}
    const busy=cocinando&&(i===0?fase==='amasado':fase==='horno'||fase==='empaque');
    u.leg.forEach((part,j)=>{part.rotation.x=walking?Math.sin(u.walk+j*Math.PI)*.55:Math.sin(t*2+j)*.025});
    u.arm.forEach((part,j)=>{
      const signed=j===0?1:-1;
      part.rotation.x=walking?Math.sin(u.walk+j*Math.PI)*.55:busy?-.48+Math.sin(t*11+j*Math.PI)*.25:.09+Math.sin(t*1.5+j)*.05;
      part.rotation.z=busy?signed*.22:signed*.05;
    });
    p.y=(walking?Math.abs(Math.sin(u.walk))*.052:Math.sin(t*1.7+i*2.1)*.025);
  });
  if(mezcla)mezcla.rotation.y+=dt*(fase==='amasado'?14:1);
  flour.forEach(s=>{const k=Math.abs(Math.sin(t*2.5+s.userData.off));
    s.material.opacity=fase==='amasado'?Math.max(0,(k-.4)*.9):0;
    s.position.y=1.08+k*.28;
  });
  const on=hornoLuz.intensity>.05;
  if(hornoInterior){hornoInterior.children.forEach(o=>{
    if(o.userData.t!==undefined){
      const baked=on?1:0;
      o.scale.y+=(1+baked*.46-o.scale.y)*Math.min(1,dt*2.5);
      o.material.color.lerp(new T.Color(on?0xc67e35:0xe4ae6b),Math.min(1,dt*3));
    }
  })}
  vapor.forEach((s,i)=>{const u=((t*.38+s.userData.t)%1);
    s.position.y=2.26+u*.95; s.position.x=-.52+Math.sin(u*7+i)*.12;
    s.material.opacity=(on?.42:.2)*Math.sin(Math.PI*u);
    s.scale.setScalar(.6+u*1.2)});
  ctl.autoRotate=autoRot; ctl.update();
  ren.render(scene,cam); actualizarLabels();
}

/* ---------- API ---------- */
function init(container,labels){
  cont=container; labelBox=labels;
  ren=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  ren.setPixelRatio(Math.min(2,devicePixelRatio||1));
  ren.setSize(cont.clientWidth,cont.clientHeight);
  ren.shadowMap.enabled=true; ren.shadowMap.type=T.PCFSoftShadowMap;
  ren.toneMapping=T.ACESFilmicToneMapping; ren.toneMappingExposure=1.02;
  ren.outputColorSpace=T.SRGBColorSpace;
  cont.appendChild(ren.domElement);
  cam=new T.PerspectiveCamera(34,cont.clientWidth/cont.clientHeight,.1,120);
  cam.position.set(5.9,5.45,11.3);
  ctl=new T.OrbitControls(cam,ren.domElement);
  ctl.enableDamping=true; ctl.dampingFactor=.075; ctl.enablePan=false;
  ctl.minDistance=5.5; ctl.maxDistance=30;
  ctl.minPolarAngle=.32; ctl.maxPolarAngle=1.36;
  ctl.minAzimuthAngle=-1.15; ctl.maxAzimuthAngle=1.15;
  ctl.autoRotateSpeed=.55; ctl.target.set(-.25,1.2,.3);
  construir(); listo=true; loop();
}
function resize(){ if(!ren)return;
  const w=cont.clientWidth,h=cont.clientHeight; if(!w||!h)return;
  cam.aspect=w/h; cam.updateProjectionMatrix(); ren.setSize(w,h)}
function horno(on){ if(!listo)return;
  hornoLuz.intensity=on?3.4:0;
  hornoVidrio.material.emissiveIntensity=on?1.15:0;
  puerta.rotation.x=on?-.19:0;
}
function setFase(n){
  fase=n;cocinando=n!=='reposo';
  if(!chefs.length)return;
  const destinos={
    amasado:[[-4.05,2.40],[-2.55,1.88]],
    horno:[[-3.95,2.42],[-3.17,.52]],
    empaque:[[-4.05,2.42],[.23,2.94]],
    reposo:[[-4.25,2.65],[-2.55,2.70]]};
  (destinos[n]||destinos.reposo).forEach((p,i)=>chefs[i].userData.dest.set(p[0],0,p[1]));
}
function moverBandeja(destino,dur,cb){
  const p={amasado:new T.Vector3(AMASADO.x,1.12,AMASADO.z),
           horno:new T.Vector3(HORNO.x,1.25,HORNO.z+1.5)}[destino]||destino;
  anim=anim.filter(a=>a.o!==bandeja);
  anim.push({o:bandeja,t:0,dur:dur||.8,p0:bandeja.position.clone(),p1:p,
             tipo:'mover',arco:.45,cb});
}
function bandejaPila(i,dur,cb){
  const p=pilaPos(i);
  moverBandeja(new T.Vector3(MOSTRADOR.x+p.x,1.9,MOSTRADOR.z+p.z-1.3),dur,cb);
}
function colorBandeja(i){bandeja.userData.cont.material.color.setHex(PROD[i])}
return {init,resize,setPlan,defLabels,horno,moverBandeja,bandejaPila,colorBandeja,
  setVista,setFase,pilaPos,MOSTRADOR,HORNO,AMASADO,
  auto:v=>{autoRot=v}, get cam(){return cam}, get ctl(){return ctl}};
})();
