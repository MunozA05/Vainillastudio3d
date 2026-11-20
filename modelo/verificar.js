/* Comprueba que el solver en JavaScript da los mismos números que el notebook.
   Uso:  node modelo/verificar.js     (desde la carpeta del proyecto)        */
const {resolver,relajar}=require('../js/solver.js');
const B={U:[9523.64,8811.30,4575.90,5022.50,1212.53,1585.64,1323.22,5022.50],
 D:[4,7,7,12,68,64,68,12],CH:[4,4,20,20,25,30,10,20],TC:[20,20,25,25,10,10,25,25],
 RR:[2,5,10,10,94,50,26,10],TR:[120,120,180,180,180,180,180,180],UC:2,H:1200,MO:2400,K:[4,5,6]};
const cl=o=>JSON.parse(JSON.stringify(o));
const f=v=>v.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2});
const ok=(a,b)=>Math.abs(a-b)<0.01?'  OK ':' ✗   ';
let p, r=resolver(B);
console.log('                                       obtenido         esperado');
console.log(ok(r.Z,516211.92)+'Datos del proyecto          ', f(r.Z).padStart(12), f(516211.92).padStart(14));
console.log('      X =',r.X.join(','),' (esperado 4,7,7,10,68,64,68,12)');
console.log('      Y =',r.Y.join(','),'  L =',r.L.join(','),'  horno',r.horno,' mano de obra',r.mo);
p=cl(B); p.D[0]=6;
let e=resolver(p);
console.log(ok(e.Z,535259.20)+'Escenario 1 · D1 = 6        ', f(e.Z).padStart(12), f(535259.20).padStart(14));
p=cl(B); p.U[3]=5955;
e=resolver(p);
console.log(ok(e.Z,527401.92)+'Escenario 2 · fresa $16.000 ', f(e.Z).padStart(12), f(527401.92).padStart(14));
p=cl(B); p.MO=2460; e=resolver(p);
console.log(ok(e.Z,526256.92)+'MO = 2.460 min-persona      ', f(e.Z).padStart(12), f(526256.92).padStart(14));
const lp=relajar(B);
console.log(ok(lp.Z,526256.92)+'Relajación lineal continua  ', f(lp.Z).padStart(12), f(526256.92).padStart(14));
console.log('\n      Mano de obra que de verdad necesita la relajación:',lp.moUsada,'min-persona');
console.log('      Precios sombra · horno',lp.pi.horno,' mano de obra',lp.pi.mo);
console.log('      Costo de la integralidad:',f(lp.Z-r.Z));
