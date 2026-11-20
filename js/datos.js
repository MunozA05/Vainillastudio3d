/* ===================== datos del proyecto ===================== */
const BASE={
  nombre:["Pastel personal de zanahoria","Pastel personal forma de corazón","Cuchareable de maracumango",
          "Cuchareable de fresa","Galleta de chocolate","Alfajor","Rollo de canela","Cuchareable de lulada"],
  U :[9523.64,8811.30,4575.90,5022.50,1212.53,1585.64,1323.22,5022.50],
  pr:[28570.92,20559.70,17649.90,15067.50,2829.25,3699.82,5103.83,15067.50],
  co:[19047.28,11748.40,13074.00,10045.00,1616.72,2114.18,3780.61,10045.00],
  D :[4,7,7,12,68,64,68,12],
  CH:[4,4,20,20,25,30,10,20],
  TC:[20,20,25,25,10,10,25,25],
  RR:[2,5,10,10,94,50,26,10],
  TR:[120,120,180,180,180,180,180,180],
  UC:2, H:1200, MO:2400, K:[4,5,6]
};
const I8=[0,1,2,3,4,5,6,7];
const COL=['#e8954a','#e8899f','#f0c04a','#e2555f','#9c6b4a','#dcab6e','#c98a4a','#9bc24a'];
const CORTO=['Zanahoria','Corazón','Maracumango','Fresa','Galleta','Alfajor','Rollo','Lulada'];
const BREVE=['Zanahoria','Corazón','Maracu.','Fresa','Galleta','Alfajor','Rollo','Lulada'];
const UPB=[1,1,1,2,9,8,9,2];
const FR=[{n:'Jueves',min:360,h0:16*60},{n:'Viernes',min:660,h0:9*60},{n:'Sábado',min:180,h0:9*60}];
const clone=o=>JSON.parse(JSON.stringify(o));
const money=v=>'$'+Math.round(v).toLocaleString('es-CO');
const dec2=v=>v.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2});
const money2=v=>'$'+dec2(v);
const num=v=>(Math.round(v*100)/100).toLocaleString('es-CO');
const hhmm=m=>{const h=Math.floor(m/60)%24,q=Math.round(m%60),ap=h<12?'a.m.':'p.m.',hh=h%12===0?12:h%12;
  return hh+':'+String(q).padStart(2,'0')+' '+ap};
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.innerHTML=x;return e};
const $=s=>document.querySelector(s);

let DAT=clone(BASE), P=clone(BASE);
let SOL=null, SOLBASE=null, LPBASE=null, preset='base';
let S={playing:false,token:0,reto:false};

/* ===================== puente con la escena 3D ===================== */
let scene3dOK=false;
function buildScene(){
  try{
    Scene3D.init($('#canvas3d'),$('#labels'));
    scene3dOK=true; $('#cargando').style.display='none';
  }catch(e){
    $('#cargando').innerHTML='No se pudo iniciar la vista 3D en este navegador.<br>El modelo y los paneles funcionan igual.';
    console.error(e);
  }
}
function renderStacks(X,anim){ if(scene3dOK)Scene3D.setPlan(X,UPB,anim); tags(X); }
function tags(X=SOL?.X){
  if(!scene3dOK||!SOL)return;
  const M=Scene3D.MOSTRADOR, L=[];
  I8.forEach(i=>{const p=Scene3D.pilaPos(i);
    L.push({x:M.x+p.x, y:M.y+.07+.52, z:M.z+p.z-1.3,
      html:`<span style="color:${COL[i]}">●</span> ${BREVE[i]} <b>${X[i]}</b>`});
  });
  L.push({x:Scene3D.HORNO.x,y:3.45,z:Scene3D.HORNO.z+.7,cls:'warm',
    html:`🔥 Horno <b>${num(SOL.horno)}</b>/${num(P.H)} min`});
  L.push({x:Scene3D.AMASADO.x,y:1.95,z:Scene3D.AMASADO.z-.2,
    html:`Amasado · <b>${SOL.L.reduce((a,b)=>a+b,0)}</b> recetas`});
  L.push({x:-2.9,y:2.35,z:2.9,cls:'warm',
    html:`Mano de obra <b>${num(SOL.mo)}</b>/${num(P.MO)} min-p`});
  Scene3D.defLabels(L);
}
function fitZoom(){ if(scene3dOK)Scene3D.resize() }
function applyWorld(){ fitZoom() }
