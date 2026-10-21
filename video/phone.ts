// The store's 3D phone (video/assets/search/phone-3d.webp, a 3060 px square render) and the
// app's screens laid on its glass, for the store videos and stills.

export const PHONE_SRC = 3060;
/** The glass's corners in the render's pixels (tl, tr, br, bl): rays from the middle of the
 *  screen to the bezel, a line fitted to each edge, the edges' meeting points. */
export const GLASS: [number, number][] = [[1343.4, 394.4], [2330.0, 423.2], [1612.5, 2791.7], [595.8, 2628.0]];
/** The flat screen the captures (1170 × 2532) are shown in, CSS px. */
export const SCREEN = { w: 390, h: 844 };

/** The CSS matrix3d that lays a w × h box on the quad tl, tr, br, bl. */
export function quadMatrix(w: number, h: number, [p0, p1, p2, p3]: [number, number][]) {
  const [x0, y0] = p0, [x1, y1] = p1, [x2, y2] = p2, [x3, y3] = p3;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const k = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(',')})`;
}

/** Lays the screen element on the glass of the render drawn `size` px square. */
export function fitScreen(screen: HTMLElement, size: number) {
  const k = size / PHONE_SRC;
  screen.style.transform = quadMatrix(SCREEN.w, SCREEN.h, GLASS.map(([x, y]) => [x * k, y * k]));
}
