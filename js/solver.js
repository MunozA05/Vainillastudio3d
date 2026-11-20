/* ============================================================
   Solver del modelo Vainilla Atelier, en JavaScript.
   Mismo modelo del notebook: 27 variables enteras, 29 restricciones.
   Estructura aprovechada: dadas las X, las Y, L y C mínimas son
   Y=ceil(X/CH), L=ceil(X/RR), C=X/UC  ->  queda una mochila entera
   de 2 recursos, que se resuelve exacto por programación dinámica.
   ============================================================ */
const gcd=(a,b)=>{a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){[a,b]=[b,a%b]}return a||1};

function candidatos(P,i){
  const D=P.D[i],CH=P.CH[i],RR=P.RR[i],TC=P.TC[i],TR=P.TR[i],caj=P.K.includes(i);
  const paso=caj?P.UC:1, out=[];
  for(let X=0;X<=D;X+=paso){
    const y=CH>0?Math.ceil(X/CH):0, l=RR>0?Math.ceil(X/RR):0;
    out.push({X,y,l,tc:TC*y,tr:TR*l});
  }
  // quitar dominados: otro candidato produce >= y cuesta <= en ambos recursos
  return out.filter((a,k)=>!out.some((b,j)=>j!==k&&b.X>=a.X&&b.tc<=a.tc&&b.tr<=a.tr&&(b.X>a.X||b.tc<a.tc||b.tr<a.tr)));
}

function resolver(P){
  const n=P.U.length, cand=[]; let maxH=0,maxM=0;
  for(let i=0;i<n;i++){const c=candidatos(P,i);cand.push(c);
    maxH+=c[c.length-1].tc; maxM+=c[c.length-1].tr;}
  const Hc=Math.min(P.H,maxH), Mc=Math.min(P.MO,maxM);
  if(Hc<0||Mc<0) return null;
  let gH=Hc,gM=Mc;
  cand.forEach(c=>c.forEach(e=>{gH=gcd(gH,e.tc);gM=gcd(gM,e.tr)}));
  const nH=Math.floor(Hc/gH)+1, nM=Math.floor(Mc/gM)+1, S=nH*nM;
  if(S>4e6) return {error:'demasiados estados'};
  const NEG=-1e18;
  let dp=new Float64Array(S).fill(NEG); dp[0]=0;
  const pick=[];
  for(let i=0;i<n;i++){
    const nd=new Float64Array(S).fill(NEG), pk=new Int8Array(S).fill(-1), c=cand[i];
    for(let h=0;h<nH;h++)for(let m=0;m<nM;m++){
      const s=h*nM+m, v=dp[s]; if(v===NEG)continue;
      for(let k=0;k<c.length;k++){
        const e=c[k], h2=h+e.tc/gH, m2=m+e.tr/gM;
        if(h2>=nH||m2>=nM)continue;
        const val=v+P.U[i]*e.X+1e-9*(i+1)*e.X, s2=h2*nM+m2;
        if(val>nd[s2]){nd[s2]=val;pk[s2]=k}
      }
    }
    dp=nd; pick.push(pk);
  }
  let best=NEG,bs=-1;
  for(let s=0;s<S;s++) if(dp[s]>best){best=dp[s];bs=s}
  if(bs<0) return null;
  const X=new Array(n).fill(0),Y=new Array(n).fill(0),L=new Array(n).fill(0);
  let s=bs;
  for(let i=n-1;i>=0;i--){
    const k=pick[i][s]; if(k<0){return null}
    const e=cand[i][k]; X[i]=e.X;Y[i]=e.y;L[i]=e.l;
    s=(Math.floor(s/nM)-e.tc/gH)*nM+(s%nM-e.tr/gM);
  }
  const C=P.K.map(i=>X[i]/P.UC);
  const Z=X.reduce((a,x,i)=>a+P.U[i]*x,0);
  return {Z:+Z.toFixed(2),X,Y,L,C,
    horno:Y.reduce((a,y,i)=>a+P.TC[i]*y,0),
    mo:L.reduce((a,l,i)=>a+P.TR[i]*l,0),
    sobra:X.map((x,i)=>P.RR[i]*L[i]-x)};
}

/* ---- relajación lineal continua (símplex, base de holguras) ----
   max U'X   s.a.  sum (TC/CH) X <= H ; sum (TR/RR) X <= MO ; X <= D ; X >= 0
   Devuelve Z, X y los precios sombra (duales). */
function relajar(P){
  const n=P.U.length, m=2+n;
  const A=[],b=[];
  A.push(P.U.map((_,i)=>P.CH[i]>0?P.TC[i]/P.CH[i]:0)); b.push(P.H);
  A.push(P.U.map((_,i)=>P.RR[i]>0?P.TR[i]/P.RR[i]:0)); b.push(P.MO);
  for(let i=0;i<n;i++){const r=new Array(n).fill(0);r[i]=1;A.push(r);b.push(P.D[i])}
  const N=n+m, T=[];                       // tabla: m filas x (N+1)
  for(let r=0;r<m;r++){const row=new Array(N+1).fill(0);
    for(let j=0;j<n;j++)row[j]=A[r][j]; row[n+r]=1; row[N]=b[r]; T.push(row)}
  const z=new Array(N+1).fill(0); for(let j=0;j<n;j++)z[j]=-P.U[j];
  const base=[]; for(let r=0;r<m;r++)base.push(n+r);
  for(let it=0;it<500;it++){
    let p=-1,mn=-1e-9;
    for(let j=0;j<N;j++) if(z[j]<mn){mn=z[j];p=j}
    if(p<0)break;
    let q=-1,best=Infinity;
    for(let r=0;r<m;r++) if(T[r][p]>1e-9){const t=T[r][N]/T[r][p];if(t<best-1e-12){best=t;q=r}}
    if(q<0)break;
    const pv=T[q][p]; for(let j=0;j<=N;j++)T[q][j]/=pv;
    for(let r=0;r<m;r++) if(r!==q&&Math.abs(T[r][p])>1e-12){const f=T[r][p];
      for(let j=0;j<=N;j++)T[r][j]-=f*T[q][j]}
    const f=z[p]; for(let j=0;j<=N;j++)z[j]-=f*T[q][j];
    base[q]=p;
  }
  const X=new Array(n).fill(0);
  for(let r=0;r<m;r++) if(base[r]<n) X[base[r]]=T[r][N];
  return {Z:+z[N].toFixed(2), X:X.map(v=>+v.toFixed(4)),
    pi:{horno:+z[n].toFixed(4), mo:+z[n+1].toFixed(4),
        demanda:X.map((_,i)=>+z[n+2+i].toFixed(4))},
    moUsada:+X.reduce((a,x,i)=>a+(P.RR[i]>0?P.TR[i]/P.RR[i]:0)*x,0).toFixed(2),
    hornoUsado:+X.reduce((a,x,i)=>a+(P.CH[i]>0?P.TC[i]/P.CH[i]:0)*x,0).toFixed(2)};
}
if(typeof module!=='undefined')module.exports={resolver,relajar};
