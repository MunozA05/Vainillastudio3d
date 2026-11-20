/* ===================== modo reto ===================== */
let RX=null;
function retoInit(){
  RX=BASE.D.map(()=>0);
  const c=$('#retorows'); c.innerHTML='';
  I8.forEach(i=>{
    const r=el('div','retorow');
    r.innerHTML=`<div class="nm"><span class="sw" style="background:${COL[i]}"></span>${CORTO[i]}</div>
      <input type="range" class="rng" id="rr${i}" min="0" max="${BASE.D[i]}" value="0">
      <div class="vl" id="rv${i}">0</div>`;
    c.appendChild(r);
  });
  I8.forEach(i=>$('#rr'+i).oninput=()=>{RX[i]=+$('#rr'+i).value;retoCalc()});
  $('#rCero').onclick=()=>{RX=I8.map(()=>0);retoSync()};
  $('#rDem').onclick=()=>{RX=DAT.D.slice();retoSync()};
  $('#rOptBtn').onclick=()=>{RX=SOL.X.slice();retoSync()};
}
function retoSync(){
  I8.forEach(i=>{const s=$('#rr'+i); s.max=DAT.D[i];
    RX[i]=Math.min(RX[i],DAT.D[i]); s.value=RX[i]});
  retoCalc();
}
function retoCalc(){
  // Yᵢ y Lᵢ mínimas que hacen falta para esas Xᵢ
  const Y=I8.map(i=>DAT.CH[i]>0?Math.ceil(RX[i]/DAT.CH[i]):0);
  const L=I8.map(i=>DAT.RR[i]>0?Math.ceil(RX[i]/DAT.RR[i]):0);
  const horno=I8.reduce((a,i)=>a+DAT.TC[i]*Y[i],0);
  const mo=I8.reduce((a,i)=>a+DAT.TR[i]*L[i],0);
  const Z=I8.reduce((a,i)=>a+DAT.U[i]*RX[i],0);
  const fallas=[];
  if(horno>DAT.H)fallas.push(`el horno se pasa por <b>${num(horno-DAT.H)} min</b>`);
  if(mo>DAT.MO)fallas.push(`la mano de obra se pasa por <b>${num(mo-DAT.MO)} min-persona</b>`);
  const imp=DAT.K.filter(i=>RX[i]%DAT.UC!==0);
  if(imp.length)fallas.push(`${imp.map(i=>CORTO[i].toLowerCase()).join(', ')} no ${imp.length>1?'son múltiplos':'es múltiplo'} de ${DAT.UC} (las cajitas van completas)`);
  const exc=I8.filter(i=>RX[i]>DAT.D[i]);
  if(exc.length)fallas.push(`${exc.map(i=>CORTO[i].toLowerCase()).join(', ')} supera${exc.length>1?'n':''} la demanda`);
  I8.forEach(i=>$('#rv'+i).textContent=RX[i]);
  $('#rZ').textContent=money(Z); $('#rOpt').textContent=money(SOL.Z);
  const dif=Z-SOL.Z;
  $('#rDif').innerHTML=`<span class="${dif>=0?'up':'down'}">${dif>0?'+':''}${money(dif)}</span>`;
  const g=(n,u,lim)=>{const f=$('#rgf'+n),h=$('#rgh'+n); if(!f||!h)return;
    f.style.width=Math.min(100,lim?u/lim*100:0)+'%';
    f.style.background=u>lim?'linear-gradient(90deg,#e4705f,#f09484)':'linear-gradient(90deg,#a99bdd,#86c79a)';
    h.innerHTML=`${num(u)} / ${num(lim)}${u>lim?' <span style="color:var(--crit)">se pasa</span>':''}`};
  g(1,horno,DAT.H); g(2,mo,DAT.MO);
  const v=$('#rVer');
  if(fallas.length){v.className='vered no';
    v.innerHTML=`<b>Plan no factible.</b> ${fallas.join('; ')}. Con este plan la empresa no podría cumplir: harían falta ${I8.reduce((a,i)=>a+L[i],0)} recetas y ${I8.reduce((a,i)=>a+Y[i],0)} horneadas.`}
  else if(Math.abs(dif)<0.005){v.className='vered win';
    v.innerHTML=`<b>¡Empataste con el modelo!</b> Encontraste una solución óptima: ${money2(Z)}. Puede que no sea la misma combinación, y está bien: hay <b>óptimos alternativos</b>.`}
  else if(dif>0){v.className='vered win';
    v.innerHTML=`<b>Imposible:</b> superaste el óptimo. Si ves esto, es que algún dato cambió mientras tanto.`}
  else{v.className='vered ok';
    v.innerHTML=`<b>Plan factible</b>, pero deja <b>${money2(-dif)} menos</b> por semana que el óptimo (${(100*-dif/SOL.Z).toFixed(1)}%). Usa ${num(horno)} min de horno y ${num(mo)} min-persona.`}
  if(S.reto&&scene3dOK)Scene3D.setPlan(RX,UPB,true);
}
