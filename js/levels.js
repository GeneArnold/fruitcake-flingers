// The levels. A level is a background, the spots where elves appear, and the things not to hit.
// Adding a level is adding an entry here; once the artist draws a background, the level's `paint`
// can just place that picture (and a `front` picture for anything elves hide behind).
//
// Coordinates are game pixels on the 540 x 960 portrait screen. The bottom 260 px is the flick zone.
// Spot kinds:
//   pop   rises from behind something at (x, sillY); `clip` [x, y, w, h] limits what shows (a window)
//   walk  crosses at height y between x1 and x2; `dir` 1 or -1 fixes the direction, `speed` px/s
//   fly   crosses the sky at height y, riding `vehicle`
// Props are hit only when a short throw lands on them. `snow: false` keeps it from snowing indoors.
import { W, H, FONT, ZOOM } from "./ui.js";

function layer(scene) {
  return scene.add.container(0, 0);
}

function label(scene, x, y, words, size, colour) {
  return scene.add
    .text(x, y, words, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: "bold", color: colour, resolution: ZOOM })
    .setOrigin(0.5);
}

function sky(g, top, bottom) {
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, W, H);
}

const STARS = [[40, 60], [120, 140], [200, 50], [300, 110], [380, 40], [520, 90], [60, 230], [250, 180], [490, 210], [160, 90]];

// ---------------------------------------------------------------------------------------------

function paintHouse(scene) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0x0b1a3a, 0x2a4682);
  g.fillStyle(0xffffff, 0.8);
  for (const [x, y] of STARS) g.fillCircle(x, y, 2);
  g.fillStyle(0xf4f1d0);
  g.fillCircle(455, 140, 38);
  // ground
  g.fillStyle(0xe8eef7);
  g.fillRect(0, 630, W, H - 630);
  g.fillStyle(0xd3dceb);
  g.fillRect(0, 700, W, H - 700);
  // chimney, then the roof over its foot
  g.fillStyle(0x7a3b2e);
  g.fillRect(360, 214, 52, 110);
  g.fillStyle(0x5a2a20);
  g.fillRect(354, 206, 64, 14);
  g.fillStyle(0x5b2e2e);
  g.fillTriangle(60, 364, 270, 212, 480, 364);
  g.lineStyle(9, 0xffffff);
  g.lineBetween(60, 364, 270, 212);
  g.lineBetween(270, 212, 480, 364);
  // house
  g.fillStyle(0x9c5a44);
  g.fillRect(90, 364, 360, 268);
  g.lineStyle(2, 0x84473a);
  for (let y = 384; y < 632; y += 20) g.lineBetween(90, y, 450, y);
  for (const wx of [130, 320]) {
    g.fillStyle(0xffffff);
    g.fillRect(wx - 5, 378, 100, 108);
    g.fillStyle(0xffd36b);
    g.fillRect(wx, 383, 90, 98);
  }
  g.fillStyle(0x3b2a1e);
  g.fillRect(240, 500, 60, 132);
  g.lineStyle(7, 0x2a9d3a);
  g.strokeCircle(270, 532, 15);
  // snowman
  g.fillStyle(0xffffff);
  g.fillCircle(62, 640, 44);
  g.fillCircle(62, 580, 33);
  g.fillCircle(62, 532, 24);
  g.fillStyle(0x222222);
  g.fillRect(44, 496, 36, 16);
  g.fillRect(38, 510, 48, 5);
  g.fillCircle(55, 528, 3);
  g.fillCircle(70, 528, 3);
  g.fillStyle(0xf28c28);
  g.fillTriangle(62, 534, 62, 540, 84, 537);
  // the snow bank an elf hides behind
  g.fillStyle(0xf4f7fb);
  g.fillEllipse(160, 640, 150, 80);
  // inflatable reindeer
  g.fillStyle(0x9b6b43);
  g.fillRect(410, 620, 14, 40);
  g.fillRect(480, 620, 14, 40);
  g.fillEllipse(452, 612, 150, 70);
  g.fillRect(488, 540, 22, 70);
  g.fillEllipse(508, 540, 48, 40);
  g.lineStyle(5, 0x6b4226);
  g.lineBetween(500, 522, 488, 492);
  g.lineBetween(516, 522, 528, 492);
  g.fillStyle(0xe63946);
  g.fillCircle(530, 544, 8);
  // porch table with Grandma's good china, and Mom's poinsettia
  g.fillStyle(0x6b4226);
  g.fillRect(300, 650, 64, 7);
  g.fillRect(306, 657, 5, 30);
  g.fillRect(353, 657, 5, 30);
  g.fillStyle(0xffffff);
  g.lineStyle(2, 0x4a6fa5);
  for (let i = 0; i < 3; i++) {
    g.fillEllipse(332, 645 - i * 6, 48, 9);
    g.strokeEllipse(332, 645 - i * 6, 48, 9);
  }
  g.fillStyle(0x8c4a2f);
  g.fillRect(208, 660, 26, 24);
  g.fillStyle(0xd62828);
  for (const [x, y] of [[212, 648], [230, 648], [221, 638], [204, 656], [238, 656]]) g.fillCircle(x, y, 10);
  return { back };
}

function paintMall(scene) {
  const back = layer(scene);
  const front = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0xf6e7c8, 0xe3c995);
  // balcony level
  g.fillStyle(0xd7bf95);
  g.fillRect(0, 0, W, 232);
  g.fillStyle(0xbfa57a);
  g.fillRect(0, 228, W, 18);
  // floor
  g.fillStyle(0xcdb791);
  g.fillRect(0, 620, W, H - 620);
  g.lineStyle(2, 0xb9a27b);
  for (let x = -200; x < W + 200; x += 70) g.lineBetween(x, 620, x + (x - 270) * 0.9, H);
  for (const y of [660, 720, 800, 900]) g.lineBetween(0, y, W, y);
  // three shops
  const shops = [[100, "TOYS", 0xe63946], [270, "CANDY", 0x2a9d8f], [440, "SHOES", 0x6c5ce7]];
  for (const [cx, , colour] of shops) {
    g.fillStyle(colour);
    g.fillRect(cx - 82, 296, 164, 300);
    g.fillStyle(0xfff6e0);
    g.fillRect(cx - 74, 304, 148, 34);
    g.fillStyle(0xbfe3f2);
    g.fillRect(cx - 65, 360, 130, 110);
    g.fillStyle(0x7c5a3a);
    g.fillRect(cx - 24, 490, 48, 106);
  }
  for (const [cx, name, colour] of shops) back.add(label(scene, cx, 321, name, 22, Phaser.Display.Color.IntegerToColor(colour).rgba));
  // fountain
  g.fillStyle(0x9aa5b1);
  g.fillEllipse(270, 650, 240, 74);
  g.fillStyle(0x6ec6ff);
  g.fillEllipse(270, 628, 212, 40);
  g.fillStyle(0x9aa5b1);
  g.fillRect(156, 616, 228, 30);
  g.fillStyle(0xb7c0ca);
  g.fillRect(156, 610, 228, 10);
  // mall Santa in his chair, and a glass display case
  g.fillStyle(0x7a1f1f);
  g.fillRoundedRect(34, 640, 92, 74, 14);
  g.fillStyle(0xd62828);
  g.fillCircle(80, 660, 28);
  g.fillStyle(0xf3d2b3);
  g.fillCircle(80, 626, 17);
  g.fillStyle(0xffffff);
  g.fillCircle(80, 640, 15);
  g.fillStyle(0xd62828);
  g.fillTriangle(64, 614, 96, 614, 92, 594);
  g.fillStyle(0xd8f1ff, 0.7);
  g.fillRect(420, 640, 90, 64);
  g.lineStyle(3, 0x8aa4b8);
  g.strokeRect(420, 640, 90, 64);
  g.fillStyle(0xf2c94c);
  g.fillCircle(445, 680, 9);
  g.fillCircle(480, 676, 12);
  // balcony railing, in front of the elves walking along it
  const r = scene.add.graphics();
  front.add(r);
  r.fillStyle(0x8d8d8d);
  r.fillRect(0, 200, W, 8);
  for (let x = 10; x < W; x += 34) r.fillRect(x, 200, 5, 30);
  return { back, front };
}

function paintPlayground(scene) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0x7ec8f0, 0xd6f0fc);
  g.fillStyle(0xffe066);
  g.fillCircle(470, 100, 40);
  g.fillStyle(0xffffff);
  for (const [x, y, w] of [[120, 120, 110], [170, 100, 90], [330, 160, 120]]) g.fillEllipse(x, y, w, 44);
  // snowy ground
  g.fillStyle(0xeef4f9);
  g.fillRect(0, 620, W, H - 620);
  g.fillStyle(0xd9e4ef);
  g.fillRect(0, 700, W, H - 700);
  // zip line from the tree house
  g.lineStyle(4, 0x444444);
  g.lineBetween(178, 176, W, 176);
  // tree house
  g.fillStyle(0x7a4e2d);
  g.fillRect(70, 300, 36, 330);
  g.fillStyle(0xa0673a);
  g.fillRect(18, 200, 160, 120);
  g.fillStyle(0x6b3a1c);
  g.fillTriangle(8, 202, 98, 140, 188, 202);
  g.fillStyle(0x3a2412);
  g.fillRect(60, 228, 76, 72);
  // slide: ladder, platform wall and chute
  g.lineStyle(6, 0x8d99ae);
  g.lineBetween(300, 380, 286, 640);
  g.lineBetween(330, 380, 316, 640);
  for (let y = 410; y < 640; y += 36) g.lineBetween(298 - (y - 380) * 0.055, y, 328 - (y - 380) * 0.055, y);
  g.lineBetween(390, 380, 390, 640);
  g.lineStyle(22, 0xffd166);
  g.lineBetween(392, 372, 510, 630);
  g.fillStyle(0xe63946);
  g.fillRoundedRect(294, 330, 104, 52, 8);
  // snow fort
  g.fillStyle(0xffffff);
  g.fillRect(380, 584, 130, 60);
  for (let x = 380; x < 510; x += 26) g.fillRect(x, 568, 16, 18);
  g.lineStyle(2, 0xc9d6e3);
  for (const y of [604, 624]) g.lineBetween(380, y, 510, y);
  // tunnel tube
  g.fillStyle(0x2a9d8f);
  g.fillRoundedRect(120, 576, 150, 70, 34);
  g.fillStyle(0x1d6f66);
  g.fillEllipse(124, 611, 34, 66);
  // picnic blanket with juice boxes, and Mom's phone on a bench
  g.fillStyle(0xe63946);
  g.fillRect(40, 668, 120, 40);
  g.fillStyle(0xffffff);
  for (let x = 40; x < 160; x += 20) g.fillRect(x, 668, 10, 40);
  g.fillStyle(0xf2c94c);
  g.fillRect(80, 650, 14, 22);
  g.fillStyle(0x6c5ce7);
  g.fillRect(104, 650, 14, 22);
  g.fillStyle(0x7a4e2d);
  g.fillRect(400, 678, 110, 10);
  g.fillRect(408, 688, 8, 24);
  g.fillRect(494, 688, 8, 24);
  g.fillStyle(0x222222);
  g.fillRoundedRect(440, 668, 26, 12, 3);
  return { back };
}

function present(g, x, top, w, h, colour, ribbon) {
  g.fillStyle(colour);
  g.fillRect(x - w / 2, top, w, h);
  g.fillStyle(ribbon);
  g.fillRect(x - 6, top, 12, h);
  g.fillRect(x - w / 2, top + h / 2 - 5, w, 10);
  g.fillCircle(x - 12, top - 4, 9);
  g.fillCircle(x + 12, top - 4, 9);
}

function paintWorkshop(scene) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0x6b4430, 0x4a2c1d);
  // plank wall
  g.lineStyle(2, 0x3e2619);
  for (let x = 30; x < W; x += 60) g.lineBetween(x, 0, x, 600);
  back.add(label(scene, W / 2, 56, "NORTH POLE TOY CO.", 30, "#ffe066"));
  // toy shelves
  g.fillStyle(0x3e2619);
  for (const y of [170, 270]) g.fillRect(20, y, W - 40, 12);
  const toys = [[60, 0xe63946], [110, 0x4cc9f0], [160, 0xffd166], [380, 0x2a9d3a], [430, 0x6c5ce7], [480, 0xe63946]];
  for (const [x, c] of toys) {
    g.fillStyle(c);
    g.fillRect(x - 18, 134, 36, 36);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(x - 12, 140, 10, 10);
  }
  for (const x of [90, 200, 330, 450]) {
    g.fillStyle(0x9b6b43); // teddy bears
    g.fillCircle(x, 252, 17);
    g.fillCircle(x, 228, 13);
    g.fillCircle(x - 10, 218, 6);
    g.fillCircle(x + 10, 218, 6);
  }
  // conveyor belt the elves ride along
  g.fillStyle(0x3d3d46);
  g.fillRect(0, 470, W, 34);
  g.fillStyle(0x5a5a66);
  for (let x = 16; x < W; x += 44) g.fillCircle(x, 504, 13);
  g.fillStyle(0x2a2a31);
  g.fillRect(0, 466, W, 6);
  g.fillStyle(0x7a7a86);
  g.fillRect(40, 516, 14, 90);
  g.fillRect(W - 54, 516, 14, 90);
  // floor
  g.fillStyle(0xa0714f);
  g.fillRect(0, 600, W, H - 600);
  g.lineStyle(2, 0x8a5f40);
  for (const y of [640, 700, 780, 880]) g.lineBetween(0, y, W, y);
  // three big presents elves jump out of
  present(g, 110, 590, 120, 76, 0xe63946, 0x2a9d3a);
  present(g, 270, 590, 120, 76, 0x2a9d3a, 0xffd166);
  present(g, 430, 590, 120, 76, 0x4cc9f0, 0xe63946);
  // Santa's cocoa, and the Naughty List unrolled on the floor
  g.fillStyle(0xffffff);
  g.fillRoundedRect(36, 664, 40, 40, 6);
  g.lineStyle(5, 0xffffff);
  g.strokeCircle(80, 684, 11);
  g.fillStyle(0x6b3a1c);
  g.fillEllipse(56, 668, 34, 8);
  g.fillStyle(0xf4ead2);
  g.fillRect(450, 672, 76, 40);
  g.fillStyle(0xd9c9a3);
  g.fillCircle(450, 692, 20);
  g.fillCircle(526, 692, 20);
  g.lineStyle(2, 0x6b4226);
  for (let y = 680; y < 708; y += 7) g.lineBetween(466, y, 512, y);
  return { back };
}

function paintIceRink(scene) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  sky(g, 0x101b44, 0x3c4f8e);
  g.fillStyle(0xffffff, 0.8);
  for (const [x, y] of STARS) g.fillCircle(x, y, 2);
  g.fillStyle(0xf4f1d0);
  g.fillCircle(90, 110, 30);
  // hills and pines along the far shore
  g.fillStyle(0x2c3d6e);
  g.fillEllipse(120, 360, 420, 160);
  g.fillEllipse(440, 350, 380, 150);
  g.fillStyle(0x1d4d3a);
  for (const [x, h] of [[230, 120], [290, 90], [330, 140], [390, 100], [520, 130]]) g.fillTriangle(x - 30, 380, x + 30, 380, x, 380 - h);
  // snow all around, and the frozen pond
  g.fillStyle(0xe8eef7);
  g.fillRect(0, 370, W, H - 370);
  g.fillStyle(0xd3dceb);
  g.fillRect(0, 700, W, H - 700);
  g.fillStyle(0xbfe6f7);
  g.fillEllipse(W / 2, 510, 600, 250);
  g.lineStyle(3, 0xffffff, 0.7);
  for (const [x1, y1, x2, y2] of [[90, 470, 200, 450], [300, 540, 440, 520], [150, 580, 260, 600], [380, 440, 470, 460]]) g.lineBetween(x1, y1, x2, y2);
  // hot cocoa hut with a serving window
  g.fillStyle(0x8c4a2f);
  g.fillRect(14, 236, 150, 140);
  g.fillStyle(0xd62828);
  g.fillTriangle(0, 242, 89, 186, 178, 242);
  g.fillStyle(0xffffff);
  for (let x = 6; x < 176; x += 20) g.fillCircle(x, 242, 9);
  g.fillStyle(0xffd36b);
  g.fillRect(44, 270, 90, 66);
  back.add(label(scene, 89, 356, "COCOA", 16, "#ffe066"));
  // two snow banks on the near shore
  g.fillStyle(0xf8fbff);
  g.fillEllipse(120, 646, 170, 70);
  g.fillEllipse(420, 646, 170, 70);
  // Grandpa's thermos and the rental skates
  g.fillStyle(0x2a9d3a);
  g.fillRoundedRect(258, 650, 26, 50, 6);
  g.fillStyle(0xcccccc);
  g.fillRect(256, 646, 30, 10);
  g.fillStyle(0xffffff);
  g.fillRoundedRect(488, 672, 30, 24, 6);
  g.fillRoundedRect(500, 680, 30, 24, 6);
  g.lineStyle(3, 0x888888);
  g.lineBetween(486, 700, 520, 700);
  g.lineBetween(498, 708, 532, 708);
  return { back };
}

function paintChristmasMorning(scene) {
  const back = layer(scene);
  const g = scene.add.graphics();
  back.add(g);
  // wallpaper, then the floor
  sky(g, 0x8c2f39, 0x6e2230);
  g.fillStyle(0x7a2832);
  for (let x = 0; x < W; x += 48) g.fillRect(x, 0, 18, 600);
  g.fillStyle(0xb07a4f);
  g.fillRect(0, 600, W, H - 600);
  g.lineStyle(2, 0x95633d);
  for (const y of [640, 700, 780, 880]) g.lineBetween(0, y, W, y);
  // the window, snowing outside
  g.fillStyle(0xffffff);
  g.fillRect(60, 120, 140, 180);
  g.fillStyle(0x1d2f63);
  g.fillRect(68, 128, 124, 164);
  g.fillStyle(0xffffff, 0.8);
  for (const [x, y] of [[90, 150], [150, 170], [120, 210], [170, 240], [84, 260], [140, 270]]) g.fillCircle(x, y, 3);
  // fireplace, with a mantel on top and a fire inside
  g.fillStyle(0x9c4a3a);
  g.fillRect(320, 330, 210, 270);
  g.lineStyle(2, 0x7f3a2d);
  for (let y = 350; y < 600; y += 22) g.lineBetween(320, y, 530, y);
  g.fillStyle(0x5a3a2a);
  g.fillRect(310, 318, 230, 16);
  g.fillStyle(0x1e1210);
  g.fillRect(370, 450, 110, 150);
  g.fillStyle(0xff8c1a);
  g.fillTriangle(385, 600, 425, 600, 405, 520);
  g.fillTriangle(415, 600, 465, 600, 440, 500);
  g.fillStyle(0xffe066);
  g.fillTriangle(400, 600, 430, 600, 415, 550);
  // stockings hung under the mantel
  for (const [x, c] of [[350, 0xe63946], [425, 0x2a9d3a], [500, 0xe63946]]) {
    g.fillStyle(c);
    g.fillRect(x - 10, 334, 22, 46);
    g.fillEllipse(x - 4, 384, 34, 18);
    g.fillStyle(0xffffff);
    g.fillRect(x - 12, 334, 26, 10);
  }
  // the tree
  g.fillStyle(0x6b4226);
  g.fillRect(186, 520, 28, 50);
  g.fillStyle(0x1f7a3a);
  g.fillTriangle(110, 530, 290, 530, 200, 380);
  g.fillTriangle(124, 440, 276, 440, 200, 300);
  g.fillTriangle(140, 350, 260, 350, 200, 230);
  for (const [x, y, c] of [[170, 500, 0xe63946], [235, 480, 0xffd166], [190, 420, 0x4cc9f0], [230, 400, 0xe63946], [180, 340, 0xffd166], [215, 310, 0x4cc9f0], [150, 480, 0x4cc9f0], [255, 510, 0xffd166]]) {
    g.fillStyle(c);
    g.fillCircle(x, y, 8);
  }
  g.fillStyle(0xffe066);
  star(g, 200, 226, 22, 9);
  // presents under the tree, elves inside
  present(g, 130, 560, 96, 60, 0x4cc9f0, 0xe63946);
  present(g, 270, 556, 104, 64, 0xffd166, 0x2a9d3a);
  // the new TV, and the cookies for Santa
  g.fillStyle(0x222222);
  g.fillRect(20, 630, 110, 70);
  g.fillStyle(0x3a6ea5);
  g.fillRect(28, 638, 94, 54);
  g.fillStyle(0x444444);
  g.fillRect(64, 700, 22, 8);
  g.fillStyle(0xffffff);
  g.fillEllipse(440, 676, 76, 18);
  g.fillStyle(0xc8873e);
  for (const x of [420, 440, 460]) g.fillCircle(x, 668, 11);
  g.fillStyle(0x4a2511);
  for (const x of [418, 442, 458]) g.fillCircle(x, 666, 2.5);
  return { back };
}

function star(g, cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  g.fillPoints(pts, true);
}

// ---------------------------------------------------------------------------------------------

export const LEVELS = [
  {
    id: "house",
    name: "The Front Yard",
    paint: paintHouse,
    spots: [
      { kind: "pop", x: 175, sillY: 481, clip: [130, 383, 90, 98], scale: 0.6, points: 200 },
      { kind: "pop", x: 365, sillY: 481, clip: [320, 383, 90, 98], scale: 0.6, points: 200 },
      { kind: "pop", x: 386, sillY: 207, clip: [330, 60, 112, 147], scale: 0.55, points: 300 },
      { kind: "pop", x: 160, sillY: 606, scale: 0.85, points: 150 },
      { kind: "pop", x: 440, sillY: 586, scale: 0.85, points: 100 },
      { kind: "walk", y: 290, x1: 120, x2: 420, scale: 0.5, points: 250 },
      { kind: "fly", y: 150, vehicle: "sleigh", scale: 0.6, points: 500 },
    ],
    props: [
      { name: "Grandma's good china", x: 332, y: 640, r: 36, points: -200 },
      { name: "Mom's poinsettia", x: 221, y: 656, r: 28, points: -100 },
    ],
  },
  {
    id: "mall",
    name: "The Mall",
    snow: false,
    paint: paintMall,
    spots: [
      { kind: "pop", x: 100, sillY: 470, clip: [35, 360, 130, 110], scale: 0.7, points: 200 },
      { kind: "pop", x: 270, sillY: 470, clip: [205, 360, 130, 110], scale: 0.7, points: 200 },
      { kind: "pop", x: 440, sillY: 470, clip: [375, 360, 130, 110], scale: 0.7, points: 200 },
      { kind: "pop", x: 230, sillY: 612, scale: 0.85, points: 150 },
      { kind: "pop", x: 330, sillY: 612, scale: 0.85, points: 150 },
      { kind: "walk", y: 136, x1: -60, x2: 600, scale: 0.55, points: 250 },
      { kind: "fly", y: 258, vehicle: "balloons", scale: 0.55, points: 500 },
    ],
    props: [
      { name: "The mall Santa", x: 80, y: 650, r: 40, points: -150 },
      { name: "The glass display", x: 465, y: 672, r: 40, points: -200 },
    ],
  },
  {
    id: "playground",
    name: "The Playground",
    paint: paintPlayground,
    spots: [
      { kind: "pop", x: 98, sillY: 300, clip: [60, 228, 76, 72], scale: 0.5, points: 300 },
      { kind: "pop", x: 346, sillY: 332, scale: 0.65, points: 200 },
      { kind: "pop", x: 195, sillY: 578, scale: 0.85, points: 150 },
      { kind: "pop", x: 445, sillY: 572, scale: 0.85, points: 100 },
      { kind: "walk", y: 250, x1: 190, x2: 640, scale: 0.5, points: 250, speed: 120 },
      { kind: "fly", y: 170, vehicle: "balloons", scale: 0.5, points: 500 },
    ],
    props: [
      { name: "The juice boxes", x: 100, y: 670, r: 40, points: -100 },
      { name: "Mom's phone", x: 453, y: 672, r: 30, points: -200 },
    ],
  },
  {
    id: "workshop",
    name: "Santa's Workshop",
    snow: false,
    paint: paintWorkshop,
    spots: [
      { kind: "pop", x: 110, sillY: 588, scale: 0.7, points: 150 },
      { kind: "pop", x: 270, sillY: 588, scale: 0.7, points: 150 },
      { kind: "pop", x: 430, sillY: 588, scale: 0.7, points: 150 },
      { kind: "pop", x: 270, sillY: 270, scale: 0.45, points: 300 },
      { kind: "walk", y: 385, x1: -60, x2: 600, dir: 1, speed: 75, scale: 0.5, points: 250 },
      { kind: "fly", y: 210, vehicle: "balloons", scale: 0.5, points: 500 },
    ],
    props: [
      { name: "Santa's cocoa", x: 60, y: 684, r: 30, points: -150 },
      { name: "The Naughty List", x: 488, y: 692, r: 36, points: -200 },
    ],
  },
  {
    id: "rink",
    name: "The Ice Rink",
    paint: paintIceRink,
    spots: [
      { kind: "pop", x: 89, sillY: 336, clip: [44, 270, 90, 66], scale: 0.5, points: 300 },
      { kind: "pop", x: 120, sillY: 622, scale: 0.8, points: 150 },
      { kind: "pop", x: 420, sillY: 622, scale: 0.8, points: 150 },
      { kind: "walk", y: 420, x1: -60, x2: 600, speed: 150, scale: 0.4, points: 300 },
      { kind: "walk", y: 480, x1: -60, x2: 600, speed: 190, scale: 0.5, points: 250 },
      { kind: "walk", y: 545, x1: -60, x2: 600, speed: 230, scale: 0.58, points: 200 },
      { kind: "fly", y: 150, vehicle: "sleigh", scale: 0.55, points: 500 },
    ],
    props: [
      { name: "Grandpa's thermos", x: 271, y: 674, r: 26, points: -100 },
      { name: "The rental skates", x: 509, y: 690, r: 30, points: -100 },
    ],
  },
  {
    id: "morning",
    name: "Christmas Morning",
    snow: false,
    paint: paintChristmasMorning,
    spots: [
      { kind: "pop", x: 130, sillY: 292, clip: [68, 128, 124, 164], scale: 0.55, points: 250 },
      { kind: "pop", x: 425, sillY: 600, clip: [370, 450, 110, 150], scale: 0.6, points: 300 },
      { kind: "pop", x: 130, sillY: 558, scale: 0.65, points: 150 },
      { kind: "pop", x: 270, sillY: 554, scale: 0.65, points: 150 },
      { kind: "walk", y: 247, x1: 300, x2: 600, dir: 1, speed: 55, scale: 0.42, points: 350 },
      { kind: "fly", y: 140, vehicle: "balloons", scale: 0.45, points: 500 },
    ],
    props: [
      { name: "The new TV", x: 75, y: 665, r: 44, points: -300 },
      { name: "The cookies for Santa", x: 440, y: 672, r: 34, points: -100 },
    ],
  },
];

// Draws a level and returns its layers: back (behind the elves) and front (in front of them).
export function paintLevel(scene, level) {
  const { back, front = layer(scene) } = level.paint(scene);
  back.setDepth(0);
  front.setDepth(30);
  return { back, front };
}
