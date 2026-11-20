/* ===================== restricciones, franjas, medidores ===================== */
function restricciones(sol,par){
  const X=sol.X,Y=sol.Y,L=sol.L,C=sol.C,R=[];
  I8.forEach(i=>R.push({g:'Demanda',n:`X${i+1} ≤ D${i+1}`,d:`Demanda de ${CORTO[i].toLowerCase()}`,
    li:X[i],lim:par.D[i],u:'und/sem',eq:0}));
  I8.forEach(i=>R.push({g:'Capacidad por horneada',n:`X${i+1} ≤ CH${i+1}·Y${i+1}`,
    d:`${par.CH[i]} und por horneada`,li:X[i],lim:par.CH[i]*Y[i],u:'und/sem',eq:0}));
  I8.forEach(i=>R.push({g:'Rendimiento por receta',n:`X${i+1} ≤ RR${i+1}·L${i+1}`,
    d:`cada receta rinde ${num(par.RR[i])} und`,li:X[i],lim:par.RR[i]*L[i],u:'und/sem',eq:0}));
  par.K.forEach((i,j)=>R.push({g:'Empaque en cajitas',n:`X${i+1} = UC·C${i+1}`,
    d:`cajitas de ${par.UC}`,li:X[i],lim:par.UC*C[j],u:'und/sem',eq:1}));
  R.push({g:'Horno',n:'Σ TCᵢ·Yᵢ ≤ H',d:'minutos de horno de la semana',li:sol.horno,lim:par.H,u:'min/sem',eq:0});
  R.push({g:'Mano de obra',n:'Σ TRᵢ·Lᵢ ≤ MO',d:'minutos-persona de la semana',li:sol.mo,lim:par.MO,u:'min-persona/sem',eq:0});
  R.forEach(r=>{r.hol=Math.abs(r.lim-r.li)<1e-6?0:+(r.lim-r.li).toFixed(2);r.act=r.hol===0});
  return R;
}
const totX=()=>SOL.X.reduce((a,b)=>a+b,0);
const totD=()=>P.D.reduce((a,b)=>a+b,0);

function schedule(){
  const b=[]; I8.forEach(i=>{let rem=SOL.X[i];
    for(let k=0;k<SOL.Y[i];k++){const u=Math.min(P.CH[i],Math.max(0,rem));rem-=u;b.push({i,dur:P.TC[i],u})}});
  b.sort((p,q)=>q.dur-p.dur||p.i-q.i);
  const tot=b.reduce((a,x)=>a+x.dur,0), capTot=FR.reduce((a,f)=>a+f.min,0);
  const caps=FR.map(f=>Math.min(f.min,Math.max(0,P.H*f.min/capTot)));
  const sum=caps.reduce((a,v)=>a+v,0)||1;
  const cupo=caps.map(c=>Math.min(c,tot*c/sum));
  const fr=[[],[],[]]; let f=0,used=0;
  for(const x of b){
    while(f<2&&used+x.dur>Math.max(cupo[f],0)){f++;used=0}
    if(f<2&&used+x.dur>caps[f]){f++;used=0}
    x.t0=used;x.fr=f;fr[f].push(x);used+=x.dur;
  }
  return fr;
}
function renderTimeline(sch,act){
  const c=$('#franjas');c.innerHTML='';
  sch.forEach((list,k)=>{
    const row=el('div','franja');
    row.appendChild(el('div','fn',`${FR[k].n}<br><span style="font-size:9.5px">${hhmm(FR[k].h0)}</span>`));
    const bar=el('div','bar');
    list.forEach(x=>{const d=el('div','blk'+(act&&act.i===x.i&&act.t0===x.t0&&act.fr===x.fr?' act':''));
      d.style.width=(x.dur/FR[k].min*100)+'%';d.style.background=COL[x.i];
      d.title=`${CORTO[x.i]} · ${x.dur} min · ${x.u} und`;bar.appendChild(d)});
    const usedM=list.reduce((a,x)=>a+x.dur,0);
    if(usedM<FR[k].min)bar.appendChild(el('div','free'));
    row.appendChild(bar); row.appendChild(el('div','fm',`${usedM}/${FR[k].min}`));
    c.appendChild(row);
  });
  $('#tlsum').innerHTML=`${sch.flat().length} horneadas · ${num(SOL.horno)} min de ${num(P.H)}`;
}
function renderGauges(){
  const ph=P.H?Math.min(100,SOL.horno/P.H*100):0, pm=P.MO?Math.min(100,SOL.mo/P.MO*100):0;
  $('#gf1').style.width=ph+'%'; $('#gf2').style.width=pm+'%';
  $('#gh1').textContent=`${num(SOL.horno)} / ${num(P.H)} min (${ph.toFixed(0)}%)`;
  $('#gh2').textContent=`${num(SOL.mo)} / ${num(P.MO)} min-p (${pm.toFixed(0)}%)`;
  const hh=P.H-SOL.horno, hm=P.MO-SOL.mo;
  let faltaMO=false,faltaH=false,hayCupo=false;
  I8.forEach(i=>{ if(SOL.X[i]>=P.D[i])return; hayCupo=true;
    const nR=(SOL.X[i]+1>P.RR[i]*SOL.L[i])?P.TR[i]:0, nH=(SOL.X[i]+1>P.CH[i]*SOL.Y[i])?P.TC[i]:0;
    if(nR>hm)faltaMO=true; if(nH>hh)faltaH=true; });
  let t;
  if(!hayCupo) t=`<b style="color:var(--ok)">Ningún recurso está agotado:</b> el límite ahora es la <b>demanda</b> — se produce completo lo que la empresa vende. Ampliar capacidad ya no sube Z.`;
  else if(faltaMO&&!faltaH) t=`<b style="color:var(--crit)">La mano de obra es el recurso crítico.</b> Quedan ${num(hm)} min-persona libres, pero la receta que haría falta cuesta más que eso. El horno tiene ${num(hh)} min sin usar (${(100-ph).toFixed(0)}% libre).`;
  else if(faltaH&&!faltaMO) t=`<b style="color:var(--crit)">El horno es el recurso crítico.</b> Quedan ${num(hh)} min y la horneada que haría falta no cabe. Sobran ${num(hm)} min-persona.`;
  else if(faltaH&&faltaMO) t=`<b style="color:var(--crit)">Los dos recursos están agotados.</b>`;
  else t=`<b style="color:var(--warn)">Hay holgura en los dos recursos</b>, pero la combinación entera no permite mejorar Z sin romper otra restricción.`;
  $('#bottleneck').innerHTML=t;
}

/* ===================== tablas ===================== */
function renderParam(){
  let h='<thead><tr><th>i</th><th>Producto</th><th>Uᵢ ($)</th><th>Dᵢ</th><th>CHᵢ</th><th>TCᵢ</th><th>RRᵢ</th><th>TRᵢ</th></tr></thead><tbody>';
  I8.forEach(i=>h+=`<tr><td>${i+1}</td><td><span class="sw" style="background:${COL[i]}"></span>${CORTO[i]}</td>
    <td>${dec2(P.U[i])}</td><td>${P.D[i]}</td><td>${P.CH[i]}</td><td>${P.TC[i]}</td><td>${num(P.RR[i])}</td><td>${P.TR[i]}</td></tr>`);
  $('#tparam').innerHTML=h+'</tbody>';
  $('#paramfoot').textContent=`UC = ${P.UC} und/cajita · H = ${num(P.H)} min/sem de horno · MO = ${num(P.MO)} min-persona/sem (2 personas × 20 h)`;
}
function renderRest(){
  const R=restricciones(SOL,P);
  let h='<thead><tr><th>Restricción</th><th>Lado izq.</th><th>Límite</th><th>Holgura</th><th>Estado</th></tr></thead><tbody>',g='';
  R.forEach(r=>{if(r.g!==g){g=r.g;h+=`<tr><td colspan="5" style="padding-top:8px;font-size:9.5px;letter-spacing:.08em;
      text-transform:uppercase;color:var(--gold);border-bottom:none">${g}</td></tr>`}
    h+=`<tr><td style="font-size:11px">${r.n}<div style="font-size:9.5px;color:var(--mute)">${r.d}</div></td>
      <td>${num(r.li)}</td><td>${num(r.lim)}</td><td>${num(r.hol)}</td>
      <td><span class="pill ${r.act?'a':'i'}">${r.act?'activa':'holgura'}</span></td></tr>`});
  $('#trest').innerHTML=h+'</tbody>';
  const act=R.filter(r=>r.act), dem=act.filter(r=>r.g==='Demanda').length;
  const mo=R.find(r=>r.g==='Mano de obra');
  const faltan=I8.filter(i=>SOL.X[i]<P.D[i]);
  const minTR=faltan.length?Math.min(...faltan.map(i=>P.TR[i])):Infinity;
  let n=`<b>${act.length} restricciones activas</b> de 29: ${dem} de demanda`;
  const otras=[...new Set(act.filter(r=>r.g!=='Demanda').map(r=>r.g.toLowerCase()))];
  if(otras.length)n+=', '+otras.join(', ');
  n+='. ';
  if(!mo.act&&mo.hol>0&&minTR>mo.hol&&minTR<Infinity)
    n+=`<br><br><b>Matiz que vale puntos en la sustentación:</b> la de mano de obra <b>no figura como activa</b>, porque le quedan ${num(mo.hol)} min-persona de holgura. Pero la receta que haría falta cuesta ${num(minTR)} min-persona, así que está <b>efectivamente agotada</b>. En un modelo entero, holgura mayor que cero no significa capacidad utilizable.`;
  else n+='Aflojar una restricción con holgura no cambia nada: solo mover una activa puede mejorar Z.';
  $('#restnote').innerHTML=n;
  let eq='<b>Z = </b>';I8.forEach(i=>eq+=`${i?' + ':''}<span style="color:${COL[i]}">${dec2(P.U[i])}</span>·X${i+1}`);
  eq+='<br><br><b>Z* = </b>';I8.forEach(i=>eq+=`${i?' + ':''}${dec2(P.U[i])}×${SOL.X[i]}`);
  eq+=` = <b style="color:var(--gold)">${money2(SOL.Z)}</b>`;
  $('#eqZ').innerHTML=eq;
}
function renderSol(){
  const cont=$('#cards'); cont.innerHTML='';
  I8.forEach(i=>{
    const pc=P.D[i]?Math.min(100,SOL.X[i]/P.D[i]*100):0, corto=SOL.X[i]<P.D[i];
    const c=el('div','pcard'+(corto?' corto':''));
    c.innerHTML=`<div class="chip" style="background:${COL[i]}"></div>
      <div><div class="nm">${CORTO[i]} <small>${SOL.Y[i]} horneada${SOL.Y[i]===1?'':'s'} · ${SOL.L[i]} receta${SOL.L[i]===1?'':'s'}${P.K.indexOf(i)>=0?' · '+SOL.C[P.K.indexOf(i)]+' cajitas':''}</small></div>
        <div class="pbar"><i style="width:${pc}%;background:${COL[i]}"></i></div>
        <div class="mini" style="margin-top:4px">${SOL.X[i]} de ${P.D[i]} und · ${money2(P.U[i])}/und${corto?' · <b style="color:var(--warn)">queda corto</b>':''}</div></div>
      <div class="rt"><b>${money(P.U[i]*SOL.X[i])}</b><small>por semana</small></div>`;
    cont.appendChild(c);
  });
  const faltan=I8.filter(i=>SOL.X[i]<P.D[i]);
  $('#solhead').innerHTML=`Con <b>${SOL.Y.reduce((a,b)=>a+b,0)} horneadas</b> y <b>${SOL.L.reduce((a,b)=>a+b,0)} recetas</b> se producen
    ${totX()} de ${totD()} unidades y la utilidad máxima es <b>${money2(SOL.Z)}</b> por semana.
    ${faltan.length?`Se queda corto en: ${faltan.map(i=>`${CORTO[i].toLowerCase()} (${SOL.X[i]} de ${P.D[i]})`).join(', ')}.`:'Se atiende el 100% de la demanda.'}`;
  const R=restricciones(SOL,P),hr=R.find(r=>r.g==='Horno'),mr=R.find(r=>r.g==='Mano de obra');
  $('#trec').innerHTML=`<thead><tr><th>Recurso</th><th>Usado</th><th>Disponible</th><th>Holgura</th><th>Uso</th></tr></thead><tbody>
    <tr><td>Horno (min/sem)</td><td>${num(hr.li)}</td><td>${num(hr.lim)}</td><td>${num(hr.hol)}</td><td>${(hr.li/hr.lim*100).toFixed(0)}%</td></tr>
    <tr><td>Mano de obra (min-persona/sem)</td><td>${num(mr.li)}</td><td>${num(mr.lim)}</td><td>${num(mr.hol)}</td><td>${(mr.li/mr.lim*100).toFixed(0)}%</td></tr></tbody>`;
  $('#solnote').innerHTML=`<b>Lectura empresarial.</b> El horno usa ${(hr.li/hr.lim*100).toFixed(0)}% de su tiempo: no es el problema.
    El recurso escaso es el <b>tiempo de las dos personas</b>, porque una receta cuesta 120–180 min-persona y una horneada solo 10–25 min.
    Comprar otro horno no mejora Z; <b>agregar horas de trabajo sí</b>, pero solo hasta cubrir la demanda.`;
  const sob=SOL.sobra, tot=sob.reduce((a,b)=>a+b,0);
  let t='<thead><tr><th>Producto</th><th>Rinden las recetas</th><th>Se venden</th><th>Sobran</th></tr></thead><tbody>';
  I8.forEach(i=>t+=`<tr><td><span class="sw" style="background:${COL[i]}"></span>${CORTO[i]}</td>
    <td>${num(P.RR[i]*SOL.L[i])}</td><td>${SOL.X[i]}</td>
    <td style="color:${sob[i]>0?'var(--warn)':'var(--mute)'}">${num(sob[i])}</td></tr>`);
  $('#tsobra').innerHTML=t+`<tr class="tot"><td>Total</td><td></td><td></td><td>${num(tot)}</td></tr></tbody>`;
  $('#sobrahead').innerHTML=`Las recetas son completas, así que rinden más de lo que se vende: <b>${num(tot)} unidades por semana</b>
    quedan fuera del plan. Si no se venden, su costo no se recupera y la utilidad real sería menor que Z; si se venden aparte,
    son una <b>oportunidad de ingreso adicional</b>. Es el punto clave al validar el modelo contra la realidad.`;
  $('#interp').innerHTML=`<p class="tx">La solución se lee en tres niveles:</p>
    <p class="tx"><b>1. Qué vender (Xᵢ).</b> ${totX()} unidades de ${totD()} demandadas.</p>
    <p class="tx"><b>2. Cómo producirlo (Yᵢ, Lᵢ, Cₖ).</b> ${SOL.L.reduce((a,b)=>a+b,0)} recetas y ${SOL.Y.reduce((a,b)=>a+b,0)} horneadas: es un plan de trabajo, no solo una cifra.</p>
    <p class="tx"><b>3. Qué lo limita.</b> Las restricciones activas. Z = ${money2(SOL.Z)} no se puede mejorar sin cambiar un parámetro.</p>
    <div class="note">Hay <b>óptimos alternativos</b>: fresa y lulada tienen parámetros idénticos (U = $5.022,50, D = 12, CH = 20, TC = 25, RR = 10, TR = 180). Recortar cualquiera da el <b>mismo</b> Z; que el solver reparta distinto no es un error.</div>`;
}
