// Canvas renderer for Lumen Relay. One job: turn world state into a readable neon frame.
import { W, H, PALETTE, SCREEN } from './config.js';

function glow(ctx, color, blur, fn) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore();
}
function text(ctx, value, x, y, size, color, align='left', weight=700) {
  ctx.save(); ctx.fillStyle = color; ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align; ctx.fillText(value, x, y); ctx.restore();
}
function background(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#070b18'); g.addColorStop(.55, '#0b1530'); g.addColorStop(1, '#130b28');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(80,160,220,.08)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let i = 0; i < 24; i++) {
    const x = (i * 211 + t * 11) % W, y = (i * 97) % H;
    ctx.fillStyle = `rgba(120,220,255,${.08 + (i % 3) * .03})`;
    ctx.fillRect(x, y, 2, 2);
  }
}
function beams(ctx, w) {
  for (const ray of w.rays) {
    const path = ray.path || [{ x: ray.x, y: ray.y }, { x: W, y: ray.y }];
    ctx.lineCap = 'round';
    glow(ctx, PALETTE[ray.color], 18, () => {
      ctx.strokeStyle = PALETTE[ray.color]; ctx.lineWidth = 5; ctx.globalAlpha = .9;
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    glow(ctx, PALETTE[ray.color], 14, () => { ctx.fillStyle = PALETTE[ray.color]; ctx.beginPath(); ctx.arc(ray.x, ray.y, 12, 0, 7); ctx.fill(); });
  }
}
function mirrors(ctx, w) {
  w.mirrors.forEach((m, i) => {
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.a);
    glow(ctx, '#8ff5ff', 10 + m.hit * 18, () => {
      ctx.fillStyle = m.hit > 0 ? '#e8ffff' : '#85b8d8'; ctx.fillRect(-42, -4, 84, 8);
    });
    ctx.fillStyle = '#162b48'; ctx.fillRect(-6, -15, 12, 30);
    ctx.restore();
    text(ctx, String(i + 1), m.x, m.y - 24, 13, '#5d82a6', 'center', 600);
  });
}
function receivers(ctx, w) {
  for (const r of w.receivers) {
    const c = PALETTE[r.color];
    ctx.save(); ctx.translate(r.x, r.y);
    glow(ctx, c, 8 + r.charge * 24, () => {
      ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = c; ctx.globalAlpha = .12 + r.charge * .75; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();
    text(ctx, `${Math.round(r.charge * 100)}%`, r.x + 48, r.y + 6, 15, c, 'left', 700);
  }
}
function particles(ctx, w) {
  for (const p of w.particles) {
    ctx.fillStyle = PALETTE[p.c] || '#fff'; ctx.globalAlpha = Math.max(0, p.life);
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function hud(ctx, w) {
  text(ctx, 'LUMEN RELAY', 34, 42, 24, '#d9f7ff');
  text(ctx, 'ROUTE ALL THREE BEAMS', 36, 66, 12, '#6c8daa', 'left', 500);
  text(ctx, `SCORE ${w.score}`, 34, 106, 20, '#ffe45e');
  text(ctx, `BEST ${w.best}`, 34, 132, 15, '#91b4cc');
  text(ctx, `CIRCUIT ${Math.min(w.level + 1, 5)}/5`, W/2, 42, 18, '#d9f7ff', 'center');
  text(ctx, `${(w.level % 5 === 4) ? 'FINAL RELAY' : ['FIRST LIGHT','PRISM ARRAY','SPECTRUM SPLIT','RESONANCE'][w.level % 4]}`, W/2, 66, 12, '#6c8daa', 'center', 500);
  const barW = 260, pct = Math.max(0, Math.min(1, w.time / 42));
  ctx.fillStyle = '#152940'; ctx.fillRect(W-294, 34, barW, 12);
  glow(ctx, '#4de1ff', 8, () => { ctx.fillStyle = pct < .2 ? '#ff4d8d' : '#4de1ff'; ctx.fillRect(W-294, 34, barW*pct, 12); });
  text(ctx, `TIME ${Math.max(0,w.time).toFixed(1)}`, W-34, 66, 14, '#d9f7ff', 'right');
  text(ctx, `COMBO x${w.combo}`, W-34, 96, 15, '#ffe45e', 'right');
  text(ctx, `MIRRORS: A / D OR CLICK TO ROTATE · 1 2 3 SELECT BAND`, W/2, H-24, 13, '#6c8daa', 'center', 500);
}
function overlay(ctx, w, title, subtitle, badge) {
  ctx.fillStyle = 'rgba(3,6,18,.76)'; ctx.fillRect(0, 0, W, H);
  text(ctx, badge, W/2, 205, 14, '#4de1ff', 'center', 600);
  glow(ctx, '#4de1ff', 24, () => text(ctx, title, W/2, 282, 62, '#f0fdff', 'center', 800));
  text(ctx, subtitle, W/2, 330, 20, '#a9c8dc', 'center', 500);
  text(ctx, 'PRESS SPACE / CLICK TO BEGIN', W/2, 430, 22, '#ffe45e', 'center', 700);
  text(ctx, 'Three colored emitters. Rotating mirrors. Five circuits. One clock.', W/2, 472, 15, '#6c8daa', 'center', 500);
}
export function render(ctx, w, t = 0) {
  background(ctx, t);
  beams(ctx, w); mirrors(ctx, w); receivers(ctx, w); particles(ctx, w); hud(ctx, w);
  if (w.screen === SCREEN.TITLE) overlay(ctx, w, 'LUMEN RELAY', 'Align the spectrum before the grid decays.', 'ORIGINAL NEON PUZZLE ARCADE');
  if (w.screen === SCREEN.RESULT) {
    overlay(ctx, w, w.won ? 'GRID ONLINE' : 'SIGNAL LOST', `SCORE ${w.score} · BEST ${w.best} · ${w.status}`,
      w.won ? 'FIVE CIRCUITS COMPLETE' : 'RESTART THE RELAY');
    text(ctx, 'PRESS R TO RESTART', W/2, 520, 18, '#4de1ff', 'center', 700);
  }
  if (w.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${w.flash*.35})`; ctx.fillRect(0,0,W,H); }
}
