// Fun Shed kit v1.4
// Small pieces of screen shared by the scenes: text styles, signs, buttons, floating points.
export const W = 540;
export const H = 960;
export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

// The game's own colours for the shared pieces. A game sets these once in main.js
// (THEME.outline = 0x1b1030, say) rather than changing this file.
export const THEME = { outline: 0x2b1d14 }; // the dark edge round words and buttons
const hex = (c) => "#" + c.toString(16).padStart(6, "0");

// The game is laid out on a 540 x 960 screen but drawn at twice that, so it stays sharp on phones.
// Every scene calls this first; positions everywhere are in the 540 x 960 layout.
export const ZOOM = 2;
export function setupCamera(scene) {
  scene.cameras.main.setZoom(ZOOM).centerOn(W / 2, H / 2);
}

// Where a finger is, in the 540 x 960 layout.
export function fingerAt(scene, pointer) {
  const p = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  return { x: p.x, y: p.y, t: performance.now() };
}

// Scales a picture to a height, so a picture of any size drops in.
export function fit(img, height) {
  return img.setScale(height / img.frame.height);
}

export function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function text(scene, x, y, str, size = 28, opts = {}) {
  return scene.add
    .text(x, y, str, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      fontStyle: opts.bold === false ? "normal" : "bold",
      color: opts.color || "#ffffff",
      stroke: opts.stroke || hex(THEME.outline),
      strokeThickness: opts.strokeThickness ?? Math.round(size / 6),
      align: "center",
      resolution: ZOOM,
      wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
    })
    .setOrigin(opts.originX ?? 0.5, opts.originY ?? 0.5);
}

export function floatText(scene, x, y, words, colour = "#ffe066", size = 30) {
  const t = text(scene, x, y, words, size, { color: colour }).setDepth(9000);
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 900, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  return t;
}

// A big plain button with words on it. r: { x, y, w, h }.
export function button(scene, r, colour, words, size = 32) {
  const g = scene.add.graphics();
  g.fillStyle(THEME.outline).fillRoundedRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 24);
  g.fillStyle(colour).fillRoundedRect(r.x, r.y, r.w, r.h, 20);
  const label = text(scene, r.x + r.w / 2, r.y + r.h / 2, words, size);
  return { g, label };
}

// A wooden farm sign to put words on.
export function woodSign(scene, x, y, w, h) {
  const g = scene.add.graphics();
  g.fillStyle(0x5a3a1e);
  g.fillRoundedRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 14);
  g.fillStyle(0x9a6434);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
  g.lineStyle(2, 0x7d4f27);
  for (let ly = y - h / 2 + h / 4; ly < y + h / 2; ly += h / 4) g.lineBetween(x - w / 2 + 6, ly, x + w / 2 - 6, ly);
  g.fillStyle(0x3b2a1e);
  for (const [nx, ny] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.fillCircle(x + nx * (w / 2 - 12), y + ny * (h / 2 - 12), 4);
  return g;
}

// The autumn countryside behind the menu screens (a stand-in until the real art is made).
export function backdrop(scene) {
  if (scene.textures.exists("bg-title")) {
    const img = scene.add.image(W / 2, H / 2, "bg-title");
    return img.setScale(Math.max(W / img.width, H / img.height));
  }
  const g = scene.add.graphics();
  g.fillGradientStyle(0x8fd0f0, 0x8fd0f0, 0xffe2b0, 0xffe2b0, 1);
  g.fillRect(0, 0, W, 560);
  g.fillStyle(0xd9a441);
  g.fillEllipse(110, 590, 560, 200);
  g.fillStyle(0xc98a2e);
  g.fillEllipse(460, 580, 500, 170);
  g.fillStyle(0x7aa840);
  g.fillRect(0, 590, W, H - 590);
  g.fillStyle(0x6a9636);
  for (let i = 0; i < 40; i++) g.fillEllipse((i * 97) % W, 620 + ((i * 53) % 320), 26, 8);
  // a few autumn trees on the hills
  for (const [x, y, c] of [[60, 520, 0xe0662a], [470, 505, 0xf0a020], [400, 530, 0xc0392b]]) {
    g.fillStyle(0x5a3a1e).fillRect(x - 5, y, 10, 40);
    g.fillStyle(c).fillCircle(x, y - 6, 30);
  }
  g.fillStyle(0xffffff, 0.9);
  for (const [x, y, s] of [[90, 90, 1], [400, 150, 0.8], [260, 50, 0.6]]) {
    g.fillEllipse(x, y, 110 * s, 40 * s);
    g.fillEllipse(x + 30 * s, y - 16 * s, 70 * s, 40 * s);
    g.fillEllipse(x - 30 * s, y - 8 * s, 60 * s, 34 * s);
  }
  return g;
}
