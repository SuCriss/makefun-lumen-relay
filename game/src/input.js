// Keyboard and mouse input, plus deterministic shot-mode overrides.
export function makeInput(canvas) {
  const keys = new Set();
  const state = { pointer: { x: 640, y: 360 }, selected: 0, pressed: false, start: false, restart: false };
  addEventListener('keydown', e => {
    keys.add(e.key.toLowerCase());
    if (e.key === ' ') state.start = true;
    if (e.key.toLowerCase() === 'r') state.restart = true;
    if (['1','2','3'].includes(e.key)) state.selected = Number(e.key) - 1;
    if (['a','arrowleft'].includes(e.key.toLowerCase())) state.pressed = state.pressed || -1;
    if (['d','arrowright'].includes(e.key.toLowerCase())) state.pressed = state.pressed || 1;
  });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    state.pointer.x = (e.clientX - r.left) * 1280 / r.width;
    state.pointer.y = (e.clientY - r.top) * 720 / r.height;
  });
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect();
    state.pointer.x = (e.clientX - r.left) * 1280 / r.width;
    state.pointer.y = (e.clientY - r.top) * 720 / r.height;
    state.pressed = true;
  });
  return { keys, state, consume() { const p = state.pressed; state.pressed = false; const s = state.start, q = state.restart; state.start = false; state.restart = false; return { pressed: p, start: s, restart: q }; } };
}
