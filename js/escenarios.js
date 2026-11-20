/* ===================== gráficas ===================== */
function chart(pts,cur,base,xlab,ylab){
  if(pts.length<2)return '';
  const W=100,H=70,p=4;
  const xs=pts.map(a=>a[0]),ys=pts.map(a=>a[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const sx=v=>p+(v-x0)/((x1-x0)||1)*(W-2*p), sy=v=>H-p-(v-y0)/((y1-y0)||1)*(H-2*p);
  const d=pts.map((a,k)=>(k?'L':'M')+sx(a[0]).toFixed(2)+' '+sy(a[1]).toFixed(2)).join(' ');
  return `<div style="font-size:10px;color:var(--mute);display:flex;justify-content:space-between;margin-bottom:3px">
    <span>${ylab}</span><span>● actual &nbsp; ┆ original</span></div>
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:88px;display:block;
    background:#1d1518;border:1px solid var(--line);border-radius:9px">
    <path d="${d}" fill="none" stroke="#e9b96b" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
    <line x1="${sx(base[0])}" y1="0" x2="${sx(base[0])}" y2="${H}" stroke="#6b525a" stroke-width="1"
      stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>
    <circle cx="${sx(cur[0])}" cy="${sy(cur[1])}" r="1.7" fill="#e8899f" vector-effect="non-scaling-stroke"/>
  </svg>
  <div style="font-size:10px;color:var(--mute);display:flex;justify-content:space-between;margin-top:3px">
    <span>${num(x0)}</span><span>${xlab}</span><span>${num(x1)}</span></div>`;
}
function tablaCmp(id,nuevo,ref){
  let h='<thead><tr><th>Producto</th><th>Xᵢ orig.</th><th>Xᵢ nuevo</th><th>Δ</th><th>Lᵢ orig.</th><th>Lᵢ nuevo</th></tr></thead><tbody>';
  I8.forEach(i=>{const d=nuevo.X[i]-ref.X[i], dl=nuevo.L[i]-ref.L[i];
    h+=`<tr${d||dl?' class="hl"':''}><td><span class="sw" style="background:${COL[i]}"></span>${CORTO[i]}</td>
      <td>${ref.X[i]}</td><td><b>${nuevo.X[i]}</b></td>
      <td style="color:${d>0?'var(--ok)':d<0?'var(--crit)':'var(--mute)'}">${d>0?'+':''}${d||'—'}</td>
      <td>${ref.L[i]}</td><td>${nuevo.L[i]}</td></tr>`});
  h+=`<tr class="tot"><td>Recursos</td><td colspan="2">horno ${num(ref.horno)} → <b>${num(nuevo.horno)}</b></td>
    <td colspan="3">mano de obra ${num(ref.mo)} → <b>${num(nuevo.mo)}</b></td></tr>`;
  $(id).innerHTML=h+'</tbody>';
}

/* ===================== escenarios (se leen de los datos cargados) ===================== */
function renderEsc1(){
  const i=0, lim=Math.max(DAT.D[i]*3,DAT.D[i]+10), pts=[];
  for(let d=0;d<=lim;d+=Math.max(1,Math.round(lim/40))){const q=clone(DAT);q.D[i]=d;
    const r=resolver(q); if(r)pts.push([d,r.Z])}
  const ref=resolver(Object.assign(clone(DAT),{D:BASE.D.slice()}))||SOLBASE;
  $('#chart1').innerHTML=chart(pts,[DAT.D[i],SOL.Z],[BASE.D[i],ref.Z],
    'Dᵢ de zanahoria (und/sem)','Z óptima ($/sem)');
  const dZ=SOL.Z-ref.Z, dD=DAT.D[i]-BASE.D[i];
  let t;
  if(!dD) t=`Ahora mismo D₁ está en su valor original (${BASE.D[i]} und/sem). Súbelo en <b>Controles → Datos de un producto</b> o usa el botón del escenario 1. La curva muestra qué pasaría con cada valor: sube <b>a escalones</b>, porque cada tramo necesita una receta completa más.`;
  else{t=`<b>D₁ pasa de ${BASE.D[i]} a ${DAT.D[i]} und/sem.</b> Z pasa de ${money2(ref.Z)} a <b>${money2(SOL.Z)}</b> (${dZ>=0?'+':''}${money2(dZ)}). `;
    const dX=SOL.X[i]-ref.X[i];
    if(dX) t+=`La producción de zanahoria sube ${dX} unidad${Math.abs(dX)===1?'':'es'}`;
    const otros=I8.filter(j=>j!==i&&SOL.X[j]!==ref.X[j]);
    t+=otros.length?`, y el modelo reacomoda: ${otros.map(j=>`${CORTO[j].toLowerCase()} ${ref.X[j]}→${SOL.X[j]}`).join(', ')}.`:', sin recortar ningún otro producto.';
    const mr=restricciones(SOL,DAT).find(r=>r.g==='Mano de obra');
    if(mr.act) t+=` <b>La mano de obra queda exactamente en el tope</b> (${num(SOL.mo)} de ${num(DAT.MO)}): cualquier pedido adicional obligaría a dejar de producir otra cosa.`;
  }
  $('#exp1').innerHTML=t;
  tablaCmp('#tcmp1',SOL,ref);
}
function renderEsc2(){
  const i=3, lo=Math.max(0,DAT.co[i]), hi=DAT.pr[i]>BASE.pr[i]*1.5?DAT.pr[i]*1.2:BASE.pr[i]*1.8, pts=[];
  for(let k=0;k<=36;k++){const pv=lo+(hi-lo)*k/36;const q=clone(DAT);q.U[i]=+(pv-DAT.co[i]).toFixed(2);
    const r=resolver(q); if(r)pts.push([Math.round(pv),r.Z])}
  const ref=resolver(Object.assign(clone(DAT),{U:BASE.U.slice()}))||SOLBASE;
  $('#chart2').innerHTML=chart(pts,[DAT.pr[i],SOL.Z],[BASE.pr[i],ref.Z],
    'precio de venta de la fresa ($)','Z óptima ($/sem)');
  const dU=DAT.U[i]-BASE.U[i], cambio=I8.some(k=>SOL.X[k]!==ref.X[k]);
  let t;
  if(Math.abs(dU)<.005) t=`U₄ está en su valor original (${money2(BASE.U[i])}). Cambia el <b>precio</b> del cuchareable de fresa en <b>Controles</b> o usa el botón del escenario 2. El quiebre de la curva está en U₄ = $5.022,50: por debajo se recorta la fresa, por encima se recorta la lulada.`;
  else{t=`<b>U₄ pasa de ${money2(BASE.U[i])} a ${money2(DAT.U[i])}</b> (precio ${money2(DAT.pr[i])} − costo ${money2(DAT.co[i])}). Z pasa de ${money2(ref.Z)} a <b>${money2(SOL.Z)}</b>. `;
    if(!cambio) t+=`<b>El plan óptimo no cambia</b>, solo Z. X₄ estaba determinada por una <b>restricción</b>, no por el coeficiente: cambiar cuánto vale algo que ya produces al máximo mueve el resultado, no la decisión. Es el equivalente entero de seguir <b>dentro del rango de optimalidad</b>.`;
    else{const cs=I8.filter(k=>SOL.X[k]!==ref.X[k]);
      t+=`<b>Cambian la solución óptima y la función objetivo:</b> ${cs.map(k=>`${CORTO[k].toLowerCase()} ${ref.X[k]}→${SOL.X[k]}`).join(', ')}.
      La mano de obra obliga a renunciar a una genovesa; con los datos originales fresa y lulada empataban ($10.045 de pérdida en cualquiera), y al subir el precio de la fresa recortarla cuesta más, así que el modelo recorta la lulada.`;}
  }
  $('#exp2').innerHTML=t;
  tablaCmp('#tcmp2',SOL,ref);
}
/* ===================== corridas complementarias ===================== */
function renderComplementarias(){
  // MO
  const base=SOLBASE;
  let h='<thead><tr><th>MO disponible</th><th>MO usada</th><th>X₄ fresa</th><th>X₈ lulada</th><th>Z</th><th>Δ vs. original</th></tr></thead><tbody>';
  [2280,2340,2400,2459,2460,2520,2640].forEach(mo=>{const p=clone(DAT);p.MO=mo;const s=resolver(p);if(!s)return;
    const d=s.Z-base.Z;
    h+=`<tr${mo===2400?' class="hl"':''}><td>${num(mo)}${mo===2400?' (actual)':''}</td><td>${num(s.mo)}</td>
      <td>${s.X[3]}</td><td>${s.X[7]}</td><td>${money2(s.Z)}</td>
      <td style="color:${d>0?'var(--ok)':'var(--mute)'}">${d>0?'+':''}${money2(d)}</td></tr>`});
  $('#tmo').innerHTML=h+'</tbody>';
  // relajación
  const lp=LPBASE, costo=lp.Z-base.Z;
  $('#tlp').innerHTML=`<thead><tr><th>Indicador</th><th>Resultado</th></tr></thead><tbody>
    <tr><td>Z de la relajación continua</td><td>${money2(lp.Z)}</td></tr>
    <tr><td>Z del modelo entero</td><td>${money2(base.Z)}</td></tr>
    <tr class="hl"><td><b>Costo de la integralidad</b></td><td><b>${money2(costo)}</b></td></tr>
    <tr><td>Mano de obra que realmente necesita</td><td>${num(lp.moUsada)} de ${num(DAT.MO)} min-persona</td></tr>
    <tr><td>Horno que realmente necesita</td><td>${num(lp.hornoUsado)} de ${num(DAT.H)} min</td></tr>
    <tr><td>Precio sombra del horno</td><td>${money2(lp.pi.horno)} / min</td></tr>
    <tr><td>Precio sombra de la mano de obra</td><td>${money2(lp.pi.mo)} / min-persona</td></tr></tbody>`;
  $('#lpnote').innerHTML=`Si se permiten recetas fraccionarias, el modelo <b>atiende toda la demanda</b>
    (${money2(lp.Z)} = Σ Uᵢ·Dᵢ) y le sobra recurso: necesitaría solo ${num(lp.moUsada)} min-persona. Por eso los dos precios sombra
    dan <b>$0</b>: ni el horno ni la mano de obra limitan en la versión continua; las ocho restricciones activas son las de demanda.
    La diferencia de <b>${money2(costo)}</b> frente al modelo entero <b>no la causa la falta de capacidad, sino la indivisibilidad</b>:
    para los 2 vasos que faltan habría que preparar una genovesa completa de 180 min-persona y solo quedan 120.
    Ese es el argumento para no usar precios sombra en un modelo entero.`;
  // reglas A/B/C
  const per=[];
  I8.forEach(i=>{const rec=Math.ceil(DAT.D[i]/DAT.RR[i]);
    let tope=Math.min(DAT.D[i],(rec-1)*DAT.RR[i]);
    if(DAT.K.includes(i))tope-=tope%DAT.UC;
    const p=clone(DAT);p.D[i]=tope;const s=resolver(p);
    per.push({i,tope,z:s?s.Z:0,perd:s?base.Z-s.Z:0})});
  let r='<thead><tr><th>Producto recortado</th><th>X antes</th><th>X después</th><th>Z de la regla</th><th>Pérdida</th></tr></thead><tbody>';
  per.forEach(x=>r+=`<tr${x.i===4||x.i===6?' class="hl"':''}><td><span class="sw" style="background:${COL[x.i]}"></span>${CORTO[x.i]}</td>
    <td>${DAT.D[x.i]}</td><td>${x.tope}</td><td>${money2(x.z)}</td>
    <td style="color:${x.perd>0?'var(--crit)':'var(--ok)'}">${money2(x.perd)}</td></tr>`);
  const prom=per.reduce((a,x)=>a+x.perd,0)/8;
  r+=`<tr class="tot"><td>A · recortar galletas</td><td colspan="3">el producto de menor utilidad unitaria</td>
      <td>${money2(per[4].perd)} · ${(100*per[4].perd/base.Z).toFixed(2)}%</td></tr>
    <tr class="tot"><td>B · recortar rollos</td><td colspan="3">el que más mano de obra usa para cubrir su demanda</td>
      <td>${money2(per[6].perd)} · ${(100*per[6].perd/base.Z).toFixed(2)}%</td></tr>
    <tr class="tot"><td>C · elegir al azar</td><td colspan="3">pérdida promedio teórica de los ocho</td>
      <td>${money2(prom)} · ${(100*prom/base.Z).toFixed(2)}%</td></tr>
    <tr class="tot"><td style="color:var(--ok)">Modelo</td><td colspan="3">recorta fresa o lulada, las de menor pérdida</td>
      <td style="color:var(--ok)">$0,00 · 0,00%</td></tr>`;
  $('#treglas').innerHTML=r+'</tbody>';
}
