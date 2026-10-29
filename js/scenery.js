// Fruitcake's own pieces of screen, on top of the Fun Shed kit's ui.js: speech bubbles, elf faces,
// the night sky and falling snow.
import { FONT, H, W, ZOOM } from "./ui.js";

// A speech bubble above a point, kept inside the screen, gone after `ms`. One at a time: a new
// bubble replaces the last one, so quick hits never stack up unreadable bubbles.
export function bubble(scene, x, y, words, ms = 1700) {
  scene.lastBubble?.destroy();
  const label = scene.add.text(0, 0, words, {
    fontFamily: FONT, fontSize: "24px", fontStyle: "bold", color: "#2b1d14", align: "center",
    wordWrap: { width: 260 }, resolution: ZOOM,
  }).setOrigin(0.5);
  const w = label.width + 32;
  const h = label.height + 22;
  const cx = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x));
  const cy = Math.max(h / 2 + 70, y - h / 2 - 16);
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 0.96);
  g.lineStyle(3, 0x2b1d14);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  const tailX = Math.max(-w / 2 + 20, Math.min(w / 2 - 20, x - cx));
  g.fillTriangle(tailX - 10, h / 2 - 2, tailX + 10, h / 2 - 2, tailX, h / 2 + 14);
  const c = scene.add.container(cx, cy, [g, label]).setDepth(80).setScale(0.6);
  scene.lastBubble = c;
  scene.tweens.add({ targets: c, scale: 1, duration: 160, ease: "Back.easeOut" });
  scene.tweens.add({ targets: c, alpha: 0, delay: ms, duration: 250, onComplete: () => c.destroy() });
  return c;
}

export function face(scene, x, y, key, size) {
  return scene.add.image(x, y, key).setDisplaySize(size, size);
}

export function nightSky(scene, top = 0x0b1a3a, bottom = 0x2a4682) {
  const g = scene.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, W, H);
  return g;
}

// Gently falling snow; `wind` pushes it sideways.
export function snowfall(scene, depth = 5) {
  return scene.add
    .particles(0, -10, "snow", {
      x: { min: -60, max: W + 60 },
      lifespan: 9000,
      speedY: { min: 40, max: 90 },
      speedX: { min: -10, max: 10 },
      scale: { min: 0.4, max: 1 },
      alpha: { min: 0.5, max: 0.9 },
      frequency: 140,
      advance: 9000,
    })
    .setDepth(depth);
}
