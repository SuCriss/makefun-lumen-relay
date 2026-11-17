// Canvas renderer for the Lumen Relay game.

import { W, H, PALETTE, SCREEN, LEVELS, clamp } from "./config.js";

const FONT = "monospace";

function drawGrid(ctx, t) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);

  const step = 40;
  const offset = (t * 18) % step;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = PALETTE.grid;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  for (let x = -offset; x <= W; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = -offset; y <= H; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = PALETTE.accent;
  ctx.beginPath();
  for (let x = -offset; x <= W; x += step * 4) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBeams(ctx, world) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const beam of world.beams) {
    if (!beam.points || beam.points.length < 2) continue;

    ctx.beginPath();
    ctx.moveTo(beam.points[0].x, beam.points[0].y);
    for (let i = 1; i < beam.points.length; i++) {
      ctx.lineTo(beam.points[i].x, beam.points[i].y);
    }

    ctx.shadowColor = beam.color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = beam.color;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
}

function mirrorEndpoints(m) {
  const a = (m.quarters * Math.PI) / 4;
  const hx = (Math.cos(a) * m.len) / 2;
  const hy = (Math.sin(a) * m.len) / 2;
  return { ax: m.x - hx, ay: m.y - hy, bx: m.x + hx, by: m.y + hy };
}

function drawMirrors(ctx, world) {
  ctx.save();
  ctx.lineCap = "round";
  world.mirrors.forEach((m, i) => {
    const { ax, ay, bx, by } = mirrorEndpoints(m);
    const selected = world.selectedMirror === i;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);

    ctx.shadowColor = selected ? PALETTE.accent : PALETTE.muted;
    ctx.shadowBlur = selected ? 22 : 10;
    ctx.strokeStyle = selected ? PALETTE.accent : PALETTE.fg;
    ctx.globalAlpha = selected ? 1 : 0.8;
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = PALETTE.bg;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = selected ? PALETTE.accent : PALETTE.muted;
    for (const p of [
      { x: ax, y: ay },
      { x: bx, y: by },
    ]) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawEmitter(ctx, world, t) {
  const { x, y } = world.emitter;
  const pulse = 0.6 + 0.4 * Math.sin(t * 4);
  ctx.save();
  ctx.shadowColor = PALETTE.accent;
  ctx.shadowBlur = 24 * pulse;
  ctx.fillStyle = PALETTE.fg;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = PALETTE.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 16 + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawReceivers(ctx, world, t) {
  ctx.save();
  for (const r of world.receivers) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + r.x);
    ctx.shadowColor = r.color;
    ctx.shadowBlur = r.active ? 26 : 12;

    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = r.active ? 1 : 0.5;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius + 6 + pulse * 3, 0, Math.PI * 2);
    ctx.globalAlpha = r.active ? 0.35 : 0.12;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (r.active) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = PALETTE.muted;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawParticles(ctx, world) {
  ctx.save();
  for (const p of world.particles) {
    const a = clamp(p.life / (p.max || 1), 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHud(ctx, world) {
  ctx.save();
  ctx.fillStyle = "rgba(4, 8, 16, 0.6)";
  ctx.fillRect(0, 0, W, 64);
  ctx.strokeStyle = PALETTE.grid;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(W, 64);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.textBaseline = "middle";
  ctx.font = `bold 24px ${FONT}`;

  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `14px ${FONT}`;
  ctx.fillText("SCORE", 28, 20);
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = PALETTE.fg;
  ctx.fillText(String(world.score).padStart(5, "0"), 28, 44);

  ctx.textAlign = "center";
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText("TIME", W / 2, 20);
  ctx.font = `bold 26px ${FONT}`;
  const low = world.timer <= 10;
  ctx.fillStyle = low ? PALETTE.danger : PALETTE.accent;
  ctx.fillText(`${Math.ceil(world.timer)}s`, W / 2, 44);

  ctx.textAlign = "right";
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText("COMBO", W - 28, 20);
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = world.combo > 0 ? PALETTE.warn : PALETTE.muted;
  ctx.fillText(`x${Math.max(1, world.combo)}`, W - 28, 44);

  ctx.textAlign = "center";
  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(`LEVEL ${world.level + 1} / ${LEVELS.length}`, W / 2, 84);
  ctx.restore();
}

function drawTitleOverlay(ctx, world, t) {
  const pulse = 0.65 + 0.35 * Math.sin(t * 2.4);

  ctx.save();
  ctx.fillStyle = "rgba(3, 6, 12, 0.72)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = PALETTE.accent;
  ctx.shadowBlur = 28;
  ctx.fillStyle = PALETTE.fg;
  ctx.font = `bold 72px ${FONT}`;
  ctx.fillText("LUMEN RELAY", W / 2, H * 0.34);

  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.accent;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText("BEND THE LIGHT · LIGHT THE RELAYS", W / 2, H * 0.34 + 64);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = `18px ${FONT}`;
  ctx.fillText("Rotate mirrors to route each colored beam into its receiver.", W / 2, H * 0.56);
  ctx.fillText("Three beams. Three relays. Beat the clock.", W / 2, H * 0.56 + 30);

  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.success;
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText("PRESS SPACE OR CLICK TO START", W / 2, H * 0.78);
  ctx.restore();
}

function drawResultOverlay(ctx, world, t) {
  const pulse = 0.6 + 0.4 * Math.sin(t * 3.2);
  const won = world.timer > 0 && (world.message || "").toLowerCase().includes("relay");
  const tint = won ? PALETTE.success : PALETTE.danger;

  ctx.save();
  ctx.fillStyle = "rgba(3, 6, 12, 0.78)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = tint;
  ctx.shadowBlur = 30;
  ctx.fillStyle = tint;
  ctx.font = `bold 64px ${FONT}`;
  ctx.fillText(won ? "ALL RELAYS LIT" : "OUT OF TIME", W / 2, H * 0.32);

  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.fg;
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillText(`FINAL SCORE  ${world.score}`, W / 2, H * 0.5);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = `20px ${FONT}`;
  ctx.fillText(`BEST COMBO  x${Math.max(1, world.combo)}`, W / 2, H * 0.5 + 44);

  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.accent;
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText("PRESS SPACE TO PLAY AGAIN", W / 2, H * 0.76);
  ctx.restore();
}

export function render(ctx, world, t) {
  ctx.clearRect(0, 0, W, H);

  drawGrid(ctx, t);
  drawBeams(ctx, world);
  drawEmitter(ctx, world, t);
  drawMirrors(ctx, world);
  drawReceivers(ctx, world, t);
  drawParticles(ctx, world);

  drawHud(ctx, world);

  if (world.screen === SCREEN.title) {
    drawTitleOverlay(ctx, world, t);
  } else if (world.screen !== SCREEN.playing) {
    drawResultOverlay(ctx, world, t);
  }
}
