// Browser-safe input tracking for the game canvas.

export function makeInput(canvas) {
  const keys = new Set();
  const pointer = { x: 0, y: 0, down: false };
  let selectedBand = 0;
  let started = false;

  function toLocal(ev) {
    const rect = canvas.getBoundingClientRect();
    const rw = rect.width || 1;
    const rh = rect.height || 1;
    return {
      x: ((ev.clientX - rect.left) / rw) * (canvas.width || rw),
      y: ((ev.clientY - rect.top) / rh) * (canvas.height || rh),
    };
  }

  const onKeyDown = (ev) => {
    keys.add(ev.key.length === 1 ? ev.key.toLowerCase() : ev.key);
    if (ev.key >= "1" && ev.key <= "9") {
      selectedBand = Number(ev.key) - 1;
    }
  };
  const onKeyUp = (ev) => {
    keys.delete(ev.key.length === 1 ? ev.key.toLowerCase() : ev.key);
  };
  const onMove = (ev) => {
    const p = toLocal(ev);
    pointer.x = p.x;
    pointer.y = p.y;
  };
  const onDown = (ev) => {
    pointer.down = true;
    const p = toLocal(ev);
    pointer.x = p.x;
    pointer.y = p.y;
  };
  const onUp = () => {
    pointer.down = false;
  };

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
  }
  if (canvas && typeof canvas.addEventListener === "function") {
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onUp);
  }

  return {
    keys,
    pointer,
    get selectedBand() {
      return selectedBand;
    },
    set selectedBand(v) {
      selectedBand = v;
    },
    get started() {
      return started;
    },
    start() {
      started = true;
    },
    restart() {
      keys.clear();
      pointer.x = 0;
      pointer.y = 0;
      pointer.down = false;
      selectedBand = 0;
      started = false;
    },
    dispose() {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      }
      if (canvas && typeof canvas.removeEventListener === "function") {
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointerleave", onUp);
      }
    },
  };
}
