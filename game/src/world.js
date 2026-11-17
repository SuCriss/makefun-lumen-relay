// big-pickle authored version.
// The beam simulation: three rays, rotatable mirrors, receivers, score and lives.
import { W, H, LEVELS, SCREEN, clamp, dist } from './config.js';
import { blip, chime, fail } from './audio.js';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function mirror(x, y, a) { return { x, y, a, hit: 0 }; }
function segmentHit(ray, m) {
  const dx = Math.cos(m.a), dy = Math.sin(m.a), half = 42;
  const rx = ray.x, ry = ray.y, vx = Math.cos(ray.a), vy = Math.sin(ray.a);
  const den = vx * dy - vy * dx;
  if (Math.abs(den) < 1e-6) return null;
  const qx = m.x - rx, qy = m.y - ry;
  const t = (qx * dy - qy * dx) / den;
  const u = (qx * vy - qy * vx) / den;
  if (t > 1 && t < 260 && Math.abs(u) <= half) return { t, x: rx + vx*t, y: ry + vy*t };
  return null;
}
export function createWorld(seed=1) {
  const world = { screen: SCREEN.TITLE, level: 0, score: 0, best: 0, combo: 0, energy: 100, time: LEVELS[0].time, seed, mirrors: [], rays: [], particles: [], status: 'READY', flash: 0, won: false, elapsed: 0 };
  layout(world); return world;
}
function layout(w) {
  const level = LEVELS[Math.min(w.level, LEVELS.length-1)], r = rng(w.seed * 977 + w.level * 7919);
  w.mirrors = [];
  for (let i = 0; i < level.mirrors; i++) w.mirrors.push(mirror(250 + (i%4)*245 + r()*45, 170 + Math.floor(i/4)*245 + r()*45, (r()-.5)*1.6));
  w.time = level.time; w.status = 'ALIGN THE RELAY'; w.flash = 0;
  w.rays = [0,1,2].map(i => ({ x: 72, y: 270 + i*92, a: -0.06 + i*0.05, color: i, alive: true, trail: [] }));
  w.receivers = [0,1,2].map(i => ({ x: 1160, y: 270 + i*92, color: i, charge: 0 }));
}
export function reset(w, keepBest=true) {
  const best = keepBest ? w.best : 0;
  Object.assign(w, createWorld(w.seed));
  w.best = best;
}
export function start(w) { if (w.screen === SCREEN.TITLE || w.screen === SCREEN.RESULT) { reset(w); w.screen = SCREEN.PLAY; blip(); } }
export function rotate(w, dir) {
  if (w.screen !== SCREEN.PLAY) return;
  let nearest = 0, best = 1e9;
  for (let i=0;i<w.mirrors.length;i++) { const d=dist(w.pointer?.x ?? 640,w.pointer?.y ?? 360,w.mirrors[i].x,w.mirrors[i].y); if(d<best){best=d;nearest=i;} }
  w.mirrors[nearest].a += dir * 0.13; w.mirrors[nearest].hit = 1; blip();
}
export function tick(w, dt, input) {
  w.elapsed += dt;
  if (w.flash > 0) w.flash -= dt;
  for (const p of w.particles) { p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; }
  w.particles = w.particles.filter(p => p.life > 0);
  if (w.screen !== SCREEN.PLAY) return;
  w.time -= dt * Math.min(LEVELS[w.level].speed, 2);
  if (w.time <= 0) { end(w, false); return; }
  let solved = 0;
  for (const ray of w.rays) {
    ray.trail = [{x:ray.x,y:ray.y}];
    let x=ray.x, y=ray.y, a=ray.a, bounced=0;
    for (let bounce=0;bounce<8;bounce++) {
      let hit=null, owner=-1;
      w.mirrors.forEach((m,i)=>{ const h=segmentHit({x,y,a},m); if(h && (!hit || h.t<hit.t)){hit=h;owner=i;} });
      const wallT = (W-90-x)/Math.cos(a);
      if (hit && hit.t < wallT) {
        x=hit.x; y=hit.y; ray.trail.push({x,y}); bounced++;
        const m=w.mirrors[owner]; a = 2*m.a - a + Math.PI; m.hit=Math.max(0,m.hit-dt*3);
      } else { x += Math.cos(a)*700; y += Math.sin(a)*700; ray.trail.push({x,y}); break; }
    }
    ray.path = ray.trail; ray.bounces = bounced;
    const target = w.receivers[ray.color];
    const last = ray.trail[ray.trail.length-1];
    const good = Math.abs(last.x-1160)<130 && Math.abs(last.y-target.y)<38;
    if (good) { target.charge=Math.min(1,target.charge+dt*1.7); for(let i=0;i<2;i++) w.particles.push({x:1160,y:target.y,vx:-40-Math.random()*50,vy:(Math.random()-.5)*70,life:.4,c:ray.color}); }
    else target.charge=Math.max(0,target.charge-dt*.8);
    if (target.charge>=1) solved++;
  }
  if (solved===3) {
    const bonus = Math.round(w.time*10) + w.combo*25;
    w.score += 500 + bonus; w.combo++; chime(w.level%3); w.flash=.5;
    w.level++;
    if (w.level>=LEVELS.length) end(w,true); else layout(w);
  }
  const c=input?.consume?.();
  if (c?.start || c?.restart) start(w);
  if (c?.pressed) rotate(w, typeof c.pressed==='number' ? c.pressed : (input.state.pointer.x<640?-1:1));
  if (input?.keys?.has('a') || input?.keys?.has('arrowleft')) rotate(w,-.12*dt*8);
  if (input?.keys?.has('d') || input?.keys?.has('arrowright')) rotate(w,.12*dt*8);
}
function end(w, won) {
  w.won=won; w.screen=SCREEN.RESULT; w.best=Math.max(w.best,w.score); w.status=won?'ALL CIRCUITS ONLINE':'ENERGY DEPLETED';
  won?chime(2):fail();
}
export function stageShot(name, seed=1) {
  const w=createWorld(seed);
  if(name==='start'){ w.screen=SCREEN.TITLE; return w; }
  w.screen=SCREEN.PLAY;
  if(name==='play'){
    w.level=2; layout(w); w.score=1840; w.combo=3; w.time=27.4; w.elapsed=14.6;
    w.receivers.forEach((r,i)=>{r.charge=[.92,.55,.18][i];});
    w.mirrors.forEach((m,i)=>{m.a=[-.45,.28,.62,-.22,.35][i%5];m.hit=.3;});
  } else {
    w.level=4; layout(w); w.score=3460; w.combo=4; w.time=0; w.won=true; w.screen=SCREEN.RESULT;
    w.best=3460; w.status='ALL CIRCUITS ONLINE'; w.receivers.forEach(r=>r.charge=1);
  }
  tick(w,0,{consume:()=>({})});
  return w;
}
