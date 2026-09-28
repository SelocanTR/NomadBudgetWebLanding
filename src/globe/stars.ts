// The sky behind the globe, drawn once per size on a 2D canvas under the planet's.
// The app's star hash (globeSpace.ts): every value a whole number under 2^24, so the
// same cell is the same star on any device. One cell in ~260 is a star, at one of
// sixteen brightnesses; a cell is 1/1.2 CSS px.

export const SPACE = '#040812';

export function drawStars(canvas: HTMLCanvasElement, dpr: number) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = SPACE;
  ctx.fillRect(0, 0, w, h);
  const levels: number[][] = Array.from({ length: 16 }, () => []);
  const cols = Math.ceil(w * 1.2), rows = Math.ceil(h * 1.2);
  for (let sy = 0; sy < rows; sy++) {
    for (let sx = 0; sx < cols; sx++) {
      const a = (sx * 37 + sy * 91 + 17) % 1024;
      const b = (a * a + sx * 5 + sy * 29 + a * sy) % 2048;
      const c = (b * b + a * 73 + b * sx + sy * 3) % 4096;
      if (c >= 4080) levels[c - 4080].push(sx, sy);
    }
  }
  const cell = 1 / 1.2;
  levels.forEach((cells, i) => {
    if (!cells.length) return;
    ctx.fillStyle = `rgba(255,255,255,${(i + 1) / 16})`;
    ctx.beginPath();
    for (let k = 0; k < cells.length; k += 2) ctx.rect(cells[k] * cell, cells[k + 1] * cell, cell * 1.4, cell * 1.4);
    ctx.fill();
  });
}
