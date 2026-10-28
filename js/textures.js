// Art drawn in code at start-up: crumbs, stars, snow, the plate, and stand-ins for any picture in
// img/ that is missing. BootScene loads the pictures first (PICTURES), and a drawing is skipped when
// its picture is there, so a new picture only has to land in img/ under the same name.

export const ELF_COLOURS = [0x2e9e48, 0xc62f2f, 0x1f8a8a, 0x7b4bb3];  // green, red, teal, purple

// The cartoon pictures in img/ (made on cerebro, tools/art-prompts.py), loaded under these keys.
export const PICTURES = ["fruitcake", "splat", "sleigh", "balloons", ...ELF_COLOURS.map((_, i) => `elf-body-${i}`)];

function draw(scene, key, w, h, paint) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  paint(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function star(g, cx, cy, outer, inner, points = 5) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  g.fillPoints(pts, true);
}

export function makeTextures(scene) {
  ELF_COLOURS.forEach((colour, i) => {
    // Body: a tunic with a zigzag collar and a belt, 120 x 140, the neck at the top centre.
    draw(scene, `elf-body-${i}`, 120, 140, (g) => {
      g.fillStyle(colour);
      g.fillRoundedRect(22, 14, 76, 120, 18);
      g.fillRoundedRect(4, 26, 26, 62, 12);
      g.fillRoundedRect(90, 26, 26, 62, 12);
      g.fillStyle(0xf3d2b3);
      g.fillCircle(17, 92, 10);
      g.fillCircle(103, 92, 10);
      g.fillStyle(0x2b2b2b);
      g.fillRect(22, 84, 76, 12);
      g.fillStyle(0xf2c94c);
      g.fillRect(52, 82, 16, 16);
      g.fillStyle(0xffffff);
      g.fillTriangle(30, 10, 46, 10, 38, 30);
      g.fillTriangle(46, 10, 62, 10, 54, 30);
      g.fillTriangle(58, 10, 74, 10, 66, 30);
      g.fillTriangle(74, 10, 90, 10, 82, 30);
    });
  });

  // The fruitcake: a dark loaf with a sugary top and candied cherries, 120 x 76.
  draw(scene, "fruitcake", 120, 76, (g) => {
    g.fillStyle(0x4a2511);
    g.fillRoundedRect(4, 16, 112, 56, 14);
    g.fillStyle(0x6b3a1c);
    g.fillRoundedRect(4, 10, 112, 30, 14);
    g.fillStyle(0xf4e3c1, 0.85);
    g.fillRoundedRect(10, 8, 100, 14, 7);
    const bits = [[24, 34, 0xd62828], [46, 52, 0x2a9d3a], [70, 36, 0xd62828], [92, 54, 0xf2c94c], [36, 58, 0xd62828], [98, 32, 0x2a9d3a], [60, 60, 0xd62828]];
    for (const [x, y, c] of bits) {
      g.fillStyle(c);
      g.fillCircle(x, y, 5);
    }
  });

  draw(scene, "plate", 220, 44, (g) => {
    g.fillStyle(0xb8c4d6);
    g.fillEllipse(110, 24, 216, 38);
    g.fillStyle(0xeef3fa);
    g.fillEllipse(110, 20, 200, 30);
  });

  draw(scene, "crumb", 14, 14, (g) => {
    g.fillStyle(0x5a2e14);
    g.fillCircle(7, 7, 6);
  });

  draw(scene, "cherry", 14, 14, (g) => {
    g.fillStyle(0xd62828);
    g.fillCircle(7, 7, 6);
  });

  // Fruitcake splattered over a face, used when a person has no splat face of their own.
  draw(scene, "splat", 140, 140, (g) => {
    g.fillStyle(0x5a2e14, 0.92);
    g.fillCircle(70, 72, 34);
    for (const [x, y, r] of [[40, 50, 16], [100, 48, 14], [34, 92, 13], [104, 96, 17], [70, 30, 12], [70, 112, 13], [20, 70, 8], [122, 70, 9]]) g.fillCircle(x, y, r);
    g.fillStyle(0xd62828);
    g.fillCircle(58, 64, 6);
    g.fillCircle(92, 84, 6);
    g.fillStyle(0x2a9d3a);
    g.fillCircle(76, 94, 5);
    g.fillStyle(0xf4e3c1, 0.8);
    g.fillCircle(80, 60, 7);
  });

  draw(scene, "star", 28, 28, (g) => {
    g.fillStyle(0xffe066);
    star(g, 14, 14, 13, 6);
  });

  draw(scene, "snow", 8, 8, (g) => {
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
  });

  // Santa's sleigh, 230 x 110; an elf sits in it with the sleigh drawn in front of its body.
  draw(scene, "sleigh", 230, 110, (g) => {
    g.fillStyle(0xc62f2f);
    g.fillRoundedRect(30, 20, 170, 66, 22);
    g.fillStyle(0xf2c94c);
    g.fillRect(30, 20, 170, 10);
    g.lineStyle(8, 0xf2c94c);
    g.beginPath();
    g.moveTo(10, 100);
    g.lineTo(200, 100);
    g.arc(200, 82, 18, Math.PI / 2, -Math.PI / 2, true);
    g.strokePath();
    g.lineBetween(70, 86, 70, 100);
    g.lineBetween(160, 86, 160, 100);
  });

  // A party balloon bunch the elf hangs from, 160 x 200.
  draw(scene, "balloons", 160, 200, (g) => {
    g.lineStyle(3, 0x555555);
    g.lineBetween(40, 70, 80, 196);
    g.lineBetween(80, 60, 80, 196);
    g.lineBetween(120, 70, 80, 196);
    for (const [x, y, c] of [[40, 50, 0xe63946], [80, 36, 0x4cc9f0], [120, 50, 0xffd166]]) {
      g.fillStyle(c);
      g.fillEllipse(x, y, 52, 64);
    }
  });
}
