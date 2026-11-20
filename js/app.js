/* ===================== controles tipo stepper ===================== */
function stepper(lab,sub,val,step,onSet,wide,fmt){
  const d=el('div','stp'+(wide?' wide':''));
  d.innerHTML=`<div class="lb">${lab}<small>${sub}</small></div>
    <div class="ct"><button data-d="-1">−</button><input type="number" value="${val}"><button data-d="1">+</button></div>`;
  const inp=d.querySelector('input');
  const push=v=>{if(!isFinite(v)||v<0)v=0; inp.value=v; onSet(v)};
  d.querySelectorAll('button').forEach(b=>b.onclick=()=>push(+(+inp.value+ +b.dataset.d*step).toFixed(2)));
  inp.onchange=()=>push(parseFloat(inp.value));
  return d;
}
function renderControles(){
  const cap=$('#capctrl'); cap.innerHTML='';
  cap.appendChild(stepper('Horno disponible · H',`min/sem · original ${num(BASE.H)}`,DAT.H,60,
    v=>{DAT.H=Math.round(v);recalcular()}));
  cap.appendChild(stepper('Mano de obra · MO',`min-persona/sem · original ${num(BASE.MO)}`,DAT.MO,60,
    v=>{DAT.MO=Math.round(v);recalcular()}));
  cap.appendChild(stepper('Unidades por cajita · UC',`galleta, alfajor y rollo`,DAT.UC,1,
    v=>{DAT.UC=Math.max(1,Math.round(v));recalcular()}));
  renderProdCtrl();
}
function renderProdCtrl(){
  const i=+($('#selProd').value||0), c=$('#prodctrl'); c.innerHTML='';
  const set=(k,v)=>{DAT[k][i]=v;
    if(k==='pr'||k==='co')DAT.U[i]=+(DAT.pr[i]-DAT.co[i]).toFixed(2);
    if(k==='U')DAT.pr[i]=+(DAT.co[i]+DAT.U[i]).toFixed(2);
    recalcular()};
  const o=(k,v)=>BASE[k][i]===v?'':`<span class="chg">original ${num(BASE[k][i])}</span>`;
  c.appendChild(stepper('Precio de venta',`$/und ${o('pr',DAT.pr[i])}`,DAT.pr[i],100,v=>set('pr',v),true));
  c.appendChild(stepper('Costo',`$/und ${o('co',DAT.co[i])}`,DAT.co[i],100,v=>set('co',v),true));
  c.appendChild(stepper('Utilidad Uᵢ',`= precio − costo ${o('U',DAT.U[i])}`,DAT.U[i],100,v=>set('U',v),true));
  c.appendChild(stepper('Demanda Dᵢ',`und/sem ${o('D',DAT.D[i])}`,DAT.D[i],1,v=>set('D',Math.round(v))));
  c.appendChild(stepper('Capacidad por horneada CHᵢ',`und/horneada ${o('CH',DAT.CH[i])}`,DAT.CH[i],1,v=>set('CH',Math.max(1,Math.round(v)))));
  c.appendChild(stepper('Tiempo de horno TCᵢ',`min/horneada ${o('TC',DAT.TC[i])}`,DAT.TC[i],5,v=>set('TC',Math.max(1,Math.round(v)))));
  c.appendChild(stepper('Rendimiento por receta RRᵢ',`und/receta ${o('RR',DAT.RR[i])}`,DAT.RR[i],1,v=>set('RR',Math.max(1,v))));
  c.appendChild(stepper('Mano de obra por receta TRᵢ',`min-persona/receta ${o('TR',DAT.TR[i])}`,DAT.TR[i],30,v=>set('TR',Math.max(1,Math.round(v)))));
}
function marcarPreset(){
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const e1=clone(BASE); e1.D[0]=6;
  const e2=clone(BASE); e2.pr[3]=16000; e2.U[3]=+(16000-BASE.co[3]).toFixed(2);
  preset=eq(DAT,BASE)?'base':eq(DAT,e1)?'e1':eq(DAT,e2)?'e2':'';
  document.querySelectorAll('#presets button').forEach(b=>b.classList.toggle('on',b.dataset.k===preset));
}
function recalcular(){
  if(S.playing){S.token++;S.playing=false;$('#play').innerHTML='▶ Simular la semana';
    if(scene3dOK)Scene3D.horno(false);mostrarFase('reposo');}
  const s=resolver(DAT), lp=relajar(DAT);
  if(!s||s.error){
    $('#kEst').innerHTML='<span class="badge bad"><span class="dot"></span>Sin solución</span>';
    $('#kEstS').textContent=s&&s.error?'datos fuera de rango':'modelo no factible'; return;
  }
  SOLBASE=s; LPBASE=lp; P=clone(DAT); SOL=s;
  marcarPreset(); renderComplementarias(); paint(true);
  renderEsc1(); renderEsc2(); if(S.reto)retoSync();
  $('#kZ').classList.remove('flash');void $('#kZ').offsetWidth;$('#kZ').classList.add('flash');
}
/* ===================== pintado ===================== */
function paint(anim){
  $('#kZ').textContent=money(SOL.Z);
  const d=SOL.Z-resolver(BASE).Z;
  $('#kZd').innerHTML=preset==='base'?'datos del proyecto':
    `vs. proyecto <span class="delta ${d>=0?'up':'down'}">${d>=0?'+':''}${money(d)}</span>`;
  $('#kEst').innerHTML='<span class="badge"><span class="dot"></span>Óptimo</span>';
  $('#kEstS').textContent='solución entera exacta';
  $('#kU').textContent=totX();
  $('#kD').textContent=`${(totX()/totD()*100).toFixed(0)} % de la demanda (${totD()} und)`;
  renderStacks(SOL.X,anim); renderGauges(); renderTimeline(schedule());
  renderRest(); renderSol(); renderParam();
}
/* ===================== animación de la semana ===================== */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const s3=(method,...args)=>{if(scene3dOK)Scene3D[method](...args)};
function mostrarFase(fase,b){
  const etapas={
    reposo:['✦','OBRADOR EN ESPERA','Tu obrador, tus decisiones','Modifica los datos, compara escenarios o inicia una semana de producción.'],
    amasado:['🥣','ETAPA 01 · PREPARACIÓN',`Preparando ${b?CORTO[b.i]:'el pedido'}`,'Cada receta consume minutos de mano de obra y se prepara completa.'],
    horno:['🔥','ETAPA 02 · HORNEADO',`Horneando ${b?CORTO[b.i]:'productos'}`,b?`${b.u} unidades · ${b.dur} minutos de horno reservados`:'El horno se ocupa por cargas completas.'],
    empaque:['🧁','ETAPA 03 · MOSTRADOR',`Listos: ${b?CORTO[b.i]:'productos'}`,'El lote terminado se incorpora al plan de ventas y a la vitrina.'],
    fin:['🏆','SEMANA FINALIZADA','Producción optimizada',`${totX()} unidades planificadas · ${money2(SOL.Z)} de utilidad estimada. Vuelve a jugar con otros parámetros.`]
  };
  const [ico,k,t,d]=etapas[fase]||etapas.reposo;
  $('#storyIcon').textContent=ico;$('#storyStep').textContent=k;
  $('#storyTitle').textContent=t;$('#storyDesc').textContent=d;
  document.querySelectorAll('.process-step').forEach(e=>e.classList.toggle('active',e.dataset.phase===fase));
  s3('setFase',fase==='fin'?'reposo':fase);
}
async function play(){
  if(S.playing){S.token++;S.playing=false;$('#play').innerHTML='▶ Simular la semana';
    s3('horno',false);mostrarFase('reposo');$('#clock').textContent='simulación detenida';return}
  const tk=++S.token;S.playing=true;$('#play').innerHTML='■ Detener';
  s3('setVista','general');
  const sch=schedule(),all=sch.flat(), done=I8.map(()=>0);
  renderStacks(done,false);
  for(const b of all){
    if(tk!==S.token)return;
    const v=()=>Math.max(.5,Number($('#velSim').value)||1);
    renderTimeline(sch,b);
    const fr=FR[b.fr||0];
    $('#clock').innerHTML=`<b>${fr.n}</b> ${hhmm(fr.h0+(b.t0||0))} · amasando <b>${CORTO[b.i]}</b>`;
    mostrarFase('amasado',b);s3('colorBandeja',b.i);s3('moverBandeja','amasado',.5/v());
    await sleep(630/v()); if(tk!==S.token)return;
    $('#clock').innerHTML=`<b>${fr.n}</b> ${hhmm(fr.h0+(b.t0||0))} · al horno · ${CORTO[b.i]} · ${b.dur} min · ${b.u} und`;
    mostrarFase('horno',b);s3('moverBandeja','horno',.72/v());
    await sleep(740/v()); if(tk!==S.token)return;
    s3('horno',true);await sleep((340+b.dur*7)/v());if(tk!==S.token)return;
    s3('horno',false);
    $('#clock').innerHTML=`<b>${fr.n}</b> ${hhmm(fr.h0+(b.t0||0)+b.dur)} · al mostrador · ${b.u} und de ${CORTO[b.i]}`;
    mostrarFase('empaque',b);s3('bandejaPila',b.i,.68/v());
    await sleep(690/v()); if(tk!==S.token)return;
    done[b.i]+=b.u;renderStacks(done,true);await sleep(220/v());
  }
  if(tk!==S.token)return;
  renderTimeline(sch);s3('moverBandeja','amasado',.7);
  S.playing=false;$('#play').innerHTML='▶ Simular la semana';
  $('#clock').innerHTML=`<b>Semana cerrada</b> · ${totX()} unidades · ${money2(SOL.Z)}`;
  renderStacks(SOL.X,true);
  mostrarFase('fin');
}
/* ===================== sustentación ===================== */
const QAS=[
 ['¿Por qué el modelo es entero y no de programación lineal continua?',
  'Porque las cuatro familias de variables son cantidades físicas indivisibles: no se producen 3,4 pasteles, no se prepara 1,7 recetas, no se hace media horneada y no se vende una cajita incompleta. Al exigir Xᵢ, Yᵢ, Lᵢ, Cₖ ∈ ℤ₊ deja de ser PL puro y se resuelve por ramificación y acotamiento.'],
 ['¿Para qué sirven Yᵢ y Lᵢ si no están en la función objetivo?',
  'Son el puente entre lo que se vende y lo que se consume. El horno se ocupa por carga completa, no por unidad, y la masa se prepara por receta completa. Sin ellas no se podrían escribir las restricciones de horno ni de mano de obra. No están en Z porque hornear no genera utilidad: solo gasta capacidad.'],
 ['¿Cuál es el resultado y cuál es la restricción que manda?',
  'Z = $516.211,92 por semana, con 19 horneadas y 14 recetas. Se cubre toda la demanda de siete productos y solo el cuchareable queda corto: 10 vasos de 12. La mano de obra usa 2.280 de 2.400 min-persona y el horno apenas 370 de 1.200, es decir, 31%.'],
 ['Si sobran 120 min-persona, ¿por qué no se producen los 2 vasos que faltan?',
  'Porque la masa se prepara por genovesa completa y cada una cuesta 180 min-persona. Con 120 disponibles no alcanza. Cubrir la demanda completa exigiría 2.460 min-persona y solo hay 2.400. En un modelo entero, tener holgura no significa tener capacidad utilizable.'],
 ['¿Por qué se recorta justamente la fresa y no otro producto?',
  'Porque hay que renunciar a una receta y conviene que sea la más barata de perder. La segunda genovesa de fresa solo aporta 2 vasos, es decir 2 × $5.022,50 = $10.045, la menor pérdida posible. Recortar galletas costaría $72.407,04 y recortar rollos $11.126,52. Recortar lulada da exactamente lo mismo que fresa: son óptimos alternativos.'],
 ['¿Por qué el horno queda tan libre si la empresa siente que es su cuello de botella?',
  'Porque cada carga dura 10 a 25 minutos y rinde muchas unidades, mientras que preparar la receta toma 120 a 180 min-persona. La empresa mide el horno porque es lo visible; el modelo muestra que el tiempo de las dos personas es lo que restringe. Es el tipo de hallazgo que justifica haber hecho el modelo.'],
 ['¿Por qué no se usan precios sombra?',
  'Porque en un modelo entero los duales de la relajación no corresponden al problema real. Al relajar, el modelo atiende toda la demanda con $526.256,92 y le sobra recurso: necesitaría solo 1.797,4 min-persona, y los precios sombra del horno y de la mano de obra dan cero. Aun así el modelo entero pierde $10.045. Esa diferencia no la causa la capacidad, la causa la indivisibilidad. Por eso el análisis se hace por escenarios.'],
 ['Escenario 1: ¿qué pasó al subir la demanda de zanahoria de 4 a 6?',
  'Z sube $19.047,28, exactamente los 2 pasteles × $9.523,64. X₁ pasa de 4 a 6, L₁ de 2 a 3 recetas y Y₁ de 1 a 2 horneadas. Ningún otro producto se recorta, porque la tercera receta usa justo los 120 min-persona que sobraban. Pero la mano de obra queda en 2.400 de 2.400: pasa a ser activa, y cualquier pedido adicional ya obligaría a sacrificar otro producto.'],
 ['Escenario 2: ¿qué pasó al subir el precio de la fresa a $16.000?',
  'U₄ pasa de $5.022,50 a $5.955 y cambian tanto la solución como Z, que sube $11.190. Ahora se producen 12 vasos de fresa y 10 de lulada: antes era al revés. Recortar fresa pasó a costar 2 × $5.955 = $11.910, mientras que recortar lulada sigue costando $10.045, así que el modelo recorta la lulada. El punto de quiebre está exactamente en U₄ = $5.022,50.'],
 ['¿Qué quedó fuera del modelo y por qué?',
  'Los días de compra de insumos perecederos (martes y viernes; fresa miércoles y viernes) y los tiempos de fermentación de los rollos y de congelación de los alfajores. No compiten por el horno ni por el tiempo de las dos personas, así que no entran como restricciones: se declaran como condiciones del problema y como supuesto del modelo.'],
 ['¿Qué advertencia hay que hacer al presentar el resultado?',
  'Que las recetas rinden más de lo que se vende: sobran 86 unidades por semana, entre ellas 26 galletas y 36 alfajores. Si no se venden, su costo no se recupera y la utilidad real sería menor que Z. Z no debe presentarse como ganancia garantizada, sino como el resultado del modelo bajo sus supuestos.'],
 ['¿Qué dos recomendaciones salen de aquí?',
  'Primera: no invertir en capacidad de horno sino en horas de trabajo, y en bloques útiles de una receta completa (180 min-persona), porque agregar menos no mejora la utilidad; el salto aparece en 2.460 min-persona, donde Z sube $10.045. Segunda: aprovechar o medir los sobrantes de receta, que hoy son costo hundido y podrían ser ingreso. Ambas se presentan como resultados del modelo, no como ganancias aseguradas.']
];
/* ===================== arranque ===================== */
function init(){
  buildScene();
  $('#qas').innerHTML=QAS.map(q=>`<div class="qa"><b>${q[0]}</b><p>${q[1]}</p></div>`).join('');
  $('#selProd').innerHTML=I8.map(i=>`<option value="${i}">${i+1}. ${BASE.nombre[i]}</option>`).join('');
  $('#selProd').onchange=renderProdCtrl;
  renderControles(); retoInit(); recalcular();
  document.querySelectorAll('#presets button').forEach(b=>b.onclick=()=>{
    DAT=clone(BASE);
    if(b.dataset.k==='e1')DAT.D[0]=6;
    if(b.dataset.k==='e2'){DAT.pr[3]=16000;DAT.U[3]=+(16000-BASE.co[3]).toFixed(2)}
    renderControles(); recalcular();
  });
  $('#play').onclick=play;
  $('#reset2').onclick=()=>{S.token++;S.playing=false;$('#play').innerHTML='▶ Simular la semana';
    s3('horno',false);s3('moverBandeja','amasado',.5);mostrarFase('reposo');
    $('#clock').textContent='Jueves 4:00 p.m. · listo para empezar';
    renderStacks(SOL.X,false);renderTimeline(schedule())};
  document.querySelectorAll('.vbtn[data-v]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.vbtn[data-v]').forEach(x=>x.classList.toggle('on',x===b));
    Scene3D.setVista(b.dataset.v)});
  let auto=false;
  $('#vauto').onclick=()=>{auto=!auto;Scene3D.auto(auto);$('#vauto').classList.toggle('on',auto)};
  document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
    document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x===t));
    document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id===t.dataset.p));
    S.reto=(t.dataset.p==='p3');
    if(S.reto){retoSync()} else {renderStacks(SOL.X,false)}
  });
  document.querySelectorAll('.step>button').forEach(b=>b.onclick=()=>{
    const s=b.parentElement,o=s.classList.contains('open');
    s.classList.toggle('open',!o);b.querySelector('.cv').textContent=o?'+':'−'});
  // pantalla completa
  const syncFS=()=>{const on=document.body.classList.contains('fs');
    $('#btnFS').innerHTML=on?'⛶ Salir':'⛶ Pantalla completa';
    setTimeout(fitZoom,160)};
  $('#btnFS').onclick=async()=>{const on=document.body.classList.contains('fs');
    document.body.classList.toggle('fs',!on);
    try{ if(!on){if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}
         else if(document.fullscreenElement)await document.exitFullscreen() }catch(e){}
    syncFS()};
  $('#btnSolo').onclick=()=>{const on=document.body.classList.toggle('solo');
    $('#btnSolo').innerHTML=on?'◨ Mostrar paneles':'◧ Solo la cocina'; setTimeout(fitZoom,160)};
  document.addEventListener('fullscreenchange',()=>{
    if(!document.fullscreenElement&&document.body.classList.contains('fs')){
      document.body.classList.remove('fs');syncFS()}});
  document.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
    const k=e.key.toLowerCase();
    if(k==='f'){e.preventDefault();$('#btnFS').click()}
    if(k==='c'){e.preventDefault();$('#btnSolo').click()}
    if(k===' '){e.preventDefault();play()}});
  window.addEventListener('resize',fitZoom);
  setTimeout(fitZoom,200);
}
init();
