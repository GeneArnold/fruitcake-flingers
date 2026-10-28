// The levels. A level is a background picture, the spots where elves appear, and the things not to hit.
// Adding a level is adding an entry here plus img/bg-<id>.jpg (tools/art-prompts.py makes one).
//
// Coordinates are game pixels on the 540 x 960 portrait screen. The bottom 260 px is the flick zone.
// `bg` places the picture: `y` moves it up (a negative number) and `fill` paints the strip that leaves
// at the bottom. Spot kinds:
//   pop   rises from behind something at (x, sillY); `clip` [x, y, w, h] limits what shows (a window)
//   walk  crosses at height y between x1 and x2; `dir` 1 or -1 fixes the direction, `speed` px/s
//   fly   crosses the sky at height y, riding `vehicle`
// Props are pictures (img/prop-<img>.png) standing with their feet at (x, y + r), `h` px tall; they are
// hit only when a short throw lands on them. `snow: false` keeps it from snowing indoors.
// Add `?debug` to the address to outline every spot and prop while lining them up with a picture.
import { W, H } from "./ui.js";

export const LEVELS = [
  {
    id: "house",
    name: "The Front Yard",
    bg: { y: -100, fill: 0xfafdfe },
    spots: [
      { kind: "pop", x: 162, sillY: 418, clip: [125, 350, 75, 68], scale: 0.5, points: 200 },
      { kind: "pop", x: 392, sillY: 418, clip: [355, 350, 75, 68], scale: 0.5, points: 200 },
      { kind: "pop", x: 400, sillY: 590, clip: [362, 520, 76, 70], scale: 0.5, points: 200 },
      { kind: "pop", x: 125, sillY: 138, clip: [90, 0, 70, 138], scale: 0.45, points: 300 },
      { kind: "pop", x: 445, sillY: 650, scale: 0.8, points: 100 },
      { kind: "walk", y: 555, scale: 0.5, points: 250 },
      { kind: "fly", y: 110, vehicle: "sleigh", scale: 0.55, points: 500 },
    ],
    props: [
      { name: "Grandma's good china", img: "china", x: 320, y: 650, r: 36, h: 70, points: -200 },
      { name: "Mom's poinsettia", img: "poinsettia", x: 200, y: 655, r: 30, h: 76, points: -100 },
    ],
  },
  {
    id: "mall",
    name: "The Mall",
    snow: false,
    spots: [
      { kind: "pop", x: 95, sillY: 548, clip: [25, 465, 140, 83], scale: 0.6, points: 200 },
      { kind: "pop", x: 270, sillY: 548, clip: [205, 465, 140, 83], scale: 0.6, points: 200 },
      { kind: "pop", x: 450, sillY: 548, clip: [385, 465, 140, 83], scale: 0.6, points: 200 },
      { kind: "pop", x: 200, sillY: 632, scale: 0.8, points: 150 },
      { kind: "pop", x: 360, sillY: 632, scale: 0.8, points: 150 },
      { kind: "walk", y: 225, x1: -60, x2: 600, scale: 0.5, points: 250 },
      { kind: "fly", y: 390, vehicle: "balloons", scale: 0.45, points: 500 },
    ],
    props: [
      { name: "The mall Santa", img: "santa", x: 62, y: 660, r: 40, h: 110, points: -150 },
      { name: "The glass display", img: "display", x: 485, y: 660, r: 38, h: 100, points: -200 },
    ],
  },
  {
    id: "playground",
    name: "The Playground",
    spots: [
      { kind: "pop", x: 112, sillY: 490, clip: [60, 415, 105, 75], scale: 0.45, points: 300 },
      { kind: "pop", x: 335, sillY: 482, clip: [295, 418, 80, 64], scale: 0.42, points: 300 },
      { kind: "pop", x: 228, sillY: 492, scale: 0.5, points: 200 },
      { kind: "pop", x: 488, sillY: 560, scale: 0.7, points: 150 },
      { kind: "walk", y: 610, x1: -60, x2: 600, scale: 0.5, points: 250, speed: 120 },
      { kind: "fly", y: 250, vehicle: "balloons", scale: 0.5, points: 500 },
    ],
    props: [
      { name: "The juice boxes", img: "juice", x: 90, y: 660, r: 40, h: 60, points: -100 },
      { name: "Mom's phone", img: "phone", x: 455, y: 660, r: 30, h: 70, points: -200 },
    ],
  },
  {
    id: "workshop",
    name: "Santa's Workshop",
    snow: false,
    spots: [
      { kind: "pop", x: 128, sillY: 566, scale: 0.65, points: 150 },
      { kind: "pop", x: 277, sillY: 554, scale: 0.65, points: 150 },
      { kind: "pop", x: 425, sillY: 566, scale: 0.65, points: 150 },
      { kind: "pop", x: 270, sillY: 300, clip: [195, 150, 150, 150], scale: 0.5, points: 300 },
      { kind: "walk", y: 225, x1: -60, x2: 600, dir: 1, speed: 75, scale: 0.5, points: 250 },
      { kind: "fly", y: 455, vehicle: "balloons", scale: 0.45, points: 500 },
    ],
    props: [
      { name: "Santa's cocoa", img: "cocoa", x: 50, y: 665, r: 30, h: 60, points: -150 },
      { name: "The Naughty List", img: "naughty", x: 490, y: 660, r: 36, h: 90, points: -200 },
    ],
  },
  {
    id: "rink",
    name: "The Ice Rink",
    spots: [
      { kind: "pop", x: 60, sillY: 500, clip: [15, 455, 90, 45], scale: 0.38, points: 300 },
      { kind: "pop", x: 140, sillY: 655, scale: 0.8, points: 150 },
      { kind: "pop", x: 420, sillY: 655, scale: 0.8, points: 150 },
      { kind: "walk", y: 470, x1: -60, x2: 600, speed: 150, scale: 0.4, points: 300 },
      { kind: "walk", y: 520, x1: -60, x2: 600, speed: 190, scale: 0.5, points: 250 },
      { kind: "walk", y: 565, x1: -60, x2: 600, speed: 230, scale: 0.55, points: 200 },
      { kind: "fly", y: 160, vehicle: "sleigh", scale: 0.55, points: 500 },
    ],
    props: [
      { name: "Grandpa's thermos", img: "thermos", x: 271, y: 668, r: 26, h: 70, points: -100 },
      { name: "The rental skates", img: "skates", x: 490, y: 672, r: 32, h: 56, points: -100 },
    ],
  },
  {
    id: "morning",
    name: "Christmas Morning",
    snow: false,
    spots: [
      { kind: "pop", x: 205, sillY: 345, clip: [140, 80, 120, 265], scale: 0.55, points: 250 },
      { kind: "pop", x: 270, sillY: 402, scale: 0.55, points: 150 },
      { kind: "pop", x: 60, sillY: 342, scale: 0.45, points: 250 },
      { kind: "pop", x: 375, sillY: 600, scale: 0.6, points: 150 },
      { kind: "pop", x: 452, sillY: 618, scale: 0.6, points: 150 },
      { kind: "walk", y: 277, x1: 120, x2: 430, speed: 55, scale: 0.42, points: 350 },
      { kind: "fly", y: 200, vehicle: "balloons", scale: 0.45, points: 500 },
    ],
    props: [
      { name: "The new TV", img: "tv", x: 85, y: 650, r: 44, h: 90, points: -300 },
      { name: "The cookies for Santa", img: "cookies", x: 265, y: 668, r: 34, h: 56, points: -100 },
    ],
  },
];

// Every picture the levels use, for BootScene to load: [key, url].
export function levelPictures() {
  const props = new Set(LEVELS.flatMap((l) => l.props.map((p) => p.img)));
  return [...LEVELS.map((l) => [`bg-${l.id}`, `img/bg-${l.id}.jpg`]), ...[...props].map((p) => [`prop-${p}`, `img/prop-${p}.png`])];
}

// Draws a level and returns its layers: back (behind the elves) and front (in front of them).
export function paintLevel(scene, level) {
  const back = scene.add.container(0, 0).setDepth(0);
  const front = scene.add.container(0, 0).setDepth(30);
  const { y = 0, fill } = level.bg || {};
  if (fill !== undefined) back.add(scene.add.rectangle(0, 0, W, H, fill).setOrigin(0));
  back.add(scene.add.image(W / 2, y, `bg-${level.id}`).setOrigin(0.5, 0).setDisplaySize(W, H));
  for (const p of level.props) {
    const img = scene.add.image(p.x, p.y + p.r, `prop-${p.img}`).setOrigin(0.5, 1);
    back.add(img.setScale(p.h / img.height));
  }
  return { back, front };
}
