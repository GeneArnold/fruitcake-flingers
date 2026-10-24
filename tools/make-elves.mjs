// Draws the cast: 20 named elves with their own funny faces, plus a dazed face for each.
// Run from the project folder:  node tools/make-elves.mjs
// It rewrites elves/elves.json and elves/faces/*.svg. Real art later replaces the face files.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const SKIN = ["#fbe0c8", "#f2c6a0", "#e0a878", "#c08454", "#946038", "#6a4428"];
const HAIR = {
  black: "#2b1d14", brown: "#6b4226", ginger: "#d0612a", blond: "#efc35a", white: "#f4f4f4",
  pink: "#ff8fc8", mint: "#7fdcb4",
};

// voice: which of the elf voices (sayings/voices/<voice>/) this elf speaks with.
const ELVES = [
  { id: "jingles", name: "Jingles", skin: 0, hair: "ginger", tufts: "spiky", freckles: true, mouth: "grin", voice: 0 },
  { id: "sprinkles", name: "Sprinkles", skin: 1, hair: "pink", tufts: "pigtails", lashes: true, mouth: "grin", voice: 1 },
  { id: "twinkletoes", name: "Twinkletoes", skin: 2, hair: "blond", tufts: "curl", lashes: true, mouth: "smile", voice: 1 },
  { id: "pudding", name: "Pudding", skin: 1, hair: "brown", tufts: "bowl", cheeks: "big", mouth: "open", voice: 2 },
  { id: "figgy", name: "Figgy", skin: 3, hair: "black", tufts: "spiky", teeth: "buck", voice: 0 },
  { id: "nutmeg", name: "Nutmeg", skin: 4, hair: "black", tufts: "puffs", lashes: true, mouth: "smile", voice: 3 },
  { id: "tinsel", name: "Tinsel", skin: 0, hair: "mint", tufts: "curl", glasses: "star", mouth: "grin", voice: 1 },
  { id: "gumdrop", name: "Gumdrop", skin: 2, hair: "ginger", tufts: "pigtails", freckles: true, teeth: "gap", voice: 3 },
  { id: "cocoa", name: "Cocoa", skin: 5, hair: "black", tufts: "puffs", mouth: "grin", voice: 3 },
  { id: "pickles", name: "Pickles", skin: 1, hair: "brown", tufts: "spiky", tongue: true, voice: 0 },
  { id: "buttons", name: "Buttons", skin: 3, hair: "brown", tufts: "bowl", glasses: "round", mouth: "smile", voice: 2 },
  { id: "mistletoe", name: "Mistletoe", skin: 0, hair: "blond", tufts: "pigtails", lashes: true, mouth: "smirk", voice: 1 },
  { id: "peppermint", name: "Peppermint", skin: 4, hair: "pink", tufts: "curl", teeth: "braces", voice: 3 },
  { id: "sugarplum", name: "Sugarplum", skin: 2, hair: "black", tufts: "puffs", cheeks: "big", mouth: "grin", voice: 1 },
  { id: "noodle", name: "Noodle", skin: 1, hair: "ginger", tufts: "curl", nose: "long", mouth: "smirk", voice: 0 },
  { id: "waffles", name: "Waffles", skin: 3, hair: "blond", tufts: "spiky", teeth: "buck", freckles: true, voice: 2 },
  { id: "chestnut", name: "Chestnut", skin: 5, hair: "brown", tufts: "bowl", unibrow: true, mouth: "smirk", voice: 2 },
  { id: "snickerdoodle", name: "Snickerdoodle", skin: 0, hair: "mint", tufts: "spiky", glasses: "round", teeth: "gap", voice: 0 },
  { id: "grumbles", name: "Grandpa Grumbles", skin: 1, hair: "white", tufts: "none", beard: true, old: true, glasses: "round", voice: 2 },
  { id: "nana-noel", name: "Nana Noel", skin: 3, hair: "white", tufts: "puffs", old: true, glasses: "round", mouth: "smile", voice: 3 },
];

const OUTLINE = "#3a2418";

// Pointy elf ears, sticking out and up from the sides of the head.
function ears(skin) {
  const ear = (flip) => {
    const s = flip ? -1 : 1;
    const x = 128 + s * 78;
    return `<path d="M${x} 118 L${x + s * 64} 70 L${x + s * 6} 178 Z" fill="${skin}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>` +
      `<path d="M${x + s * 6} 130 L${x + s * 46} 92 L${x + s * 8} 160 Z" fill="#ff9a9a" opacity="0.55"/>`;
  };
  return ear(false) + ear(true);
}

// Hair that peeks out under the hat, which covers the top of the head.
function tufts(p, c) {
  switch (p.tufts) {
    case "spiky":
      return `<path d="M58 104 L70 70 L86 96 L100 62 L114 94 L128 58 L142 94 L156 62 L170 96 L186 70 L198 104 Q128 84 58 104 Z" fill="${c}"/>`;
    case "bowl":
      return `<path d="M50 120 Q52 60 128 58 Q204 60 206 120 Q190 100 128 102 Q66 100 50 120 Z" fill="${c}"/>`;
    case "curl":
      return `<path d="M120 96 Q96 70 118 58 Q140 50 140 72 Q138 86 124 82" stroke="${c}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    case "pigtails":
      return `<path d="M50 120 Q52 64 128 62 Q204 64 206 120 Q190 100 128 102 Q66 100 50 120 Z" fill="${c}"/>` +
        `<ellipse cx="40" cy="176" rx="20" ry="34" fill="${c}"/><ellipse cx="216" cy="176" rx="20" ry="34" fill="${c}"/>` +
        `<circle cx="48" cy="146" r="7" fill="#e63946"/><circle cx="208" cy="146" r="7" fill="#e63946"/>`;
    case "puffs":
      return `<circle cx="62" cy="110" r="26" fill="${c}"/><circle cx="194" cy="110" r="26" fill="${c}"/>` +
        `<path d="M70 106 Q128 74 186 106 Q128 96 70 106 Z" fill="${c}"/>`;
  }
  return "";
}

function eyes(p, dazed) {
  if (dazed) {
    // Spiral eyes, the classic cartoon "seeing stars".
    const spiral = (cx) => {
      const pts = [];
      for (let a = 0; a <= Math.PI * 6; a += 0.3) pts.push(`${(cx + a * 0.85 * Math.cos(a)).toFixed(1)},${(136 + a * 0.85 * Math.sin(a)).toFixed(1)}`);
      return `<polyline points="${pts.join(" ")}" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    };
    return `<circle cx="96" cy="136" r="21" fill="#fff" stroke="${OUTLINE}" stroke-width="3"/><circle cx="160" cy="136" r="21" fill="#fff" stroke="${OUTLINE}" stroke-width="3"/>` +
      spiral(96) + spiral(160);
  }
  const eye = (cx, look) =>
    `<ellipse cx="${cx}" cy="136" rx="19" ry="23" fill="#fff" stroke="${OUTLINE}" stroke-width="3"/>` +
    `<circle cx="${cx + look}" cy="140" r="10" fill="#2b1d14"/><circle cx="${cx + look + 4}" cy="135" r="3.5" fill="#fff"/>`;
  let s = eye(96, 3) + eye(160, 3);
  if (p.lashes) {
    for (const cx of [96, 160]) {
      const d = cx < 128 ? -1 : 1;
      s += `<path d="M${cx + d * 14} 118 l${d * 8} -8 M${cx + d * 6} 114 l${d * 4} -10" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>`;
    }
  }
  return s;
}

function brows(p, c, dazed) {
  const lift = dazed ? -6 : 0;
  if (p.unibrow) return `<path d="M74 ${106 + lift} Q128 ${90 + lift} 182 ${106 + lift}" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  return `<path d="M76 ${108 + lift} Q96 ${98 + lift} 114 ${106 + lift}" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<path d="M142 ${106 + lift} Q160 ${98 + lift} 180 ${108 + lift}" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
}

function nose(p) {
  if (p.nose === "long") return `<path d="M126 146 Q150 162 156 176 Q140 180 124 168 Z" fill="#ff8a80" stroke="${OUTLINE}" stroke-width="3"/>`;
  return `<circle cx="128" cy="164" r="11" fill="#ff8a80" stroke="${OUTLINE}" stroke-width="3"/><circle cx="124" cy="160" r="3" fill="#fff" opacity="0.7"/>`;
}

function mouth(p, dazed) {
  if (dazed) {
    return `<path d="M98 200 q8 -9 15 0 t15 0 t15 0 t15 0" stroke="${OUTLINE}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<path d="M134 202 q10 2 12 16 q-12 4 -16 -8 Z" fill="#ff6b8a" stroke="${OUTLINE}" stroke-width="3"/>`;
  }
  const open = `<path d="M96 186 Q128 236 160 186 Z" fill="#6a1b1b" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`;
  const tongue = `<path d="M112 210 Q128 222 144 210 Q128 202 112 210 Z" fill="#ff6b8a"/>`;
  if (p.teeth === "buck") return open + tongue + `<rect x="116" y="186" width="11" height="15" rx="2" fill="#fff" stroke="${OUTLINE}" stroke-width="2"/><rect x="129" y="186" width="11" height="15" rx="2" fill="#fff" stroke="${OUTLINE}" stroke-width="2"/>`;
  if (p.teeth === "gap") return open + tongue + `<rect x="104" y="187" width="18" height="10" rx="2" fill="#fff"/><rect x="134" y="187" width="18" height="10" rx="2" fill="#fff"/>`;
  if (p.teeth === "braces") return open + tongue + `<rect x="104" y="187" width="48" height="10" rx="2" fill="#fff"/><path d="M104 192 H152" stroke="#9aa5b1" stroke-width="3"/>` +
    [110, 122, 134, 146].map((x) => `<rect x="${x - 3}" y="189" width="6" height="6" fill="#7a8794"/>`).join("");
  if (p.tongue) return `<path d="M100 192 Q128 210 156 192" stroke="${OUTLINE}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M118 198 Q120 224 132 224 Q144 222 140 198 Z" fill="#ff6b8a" stroke="${OUTLINE}" stroke-width="3"/>`;
  if (p.mouth === "grin" || p.mouth === "open") return open + tongue;
  if (p.mouth === "smirk") return `<path d="M104 198 Q134 208 162 186" stroke="${OUTLINE}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  return `<path d="M100 190 Q128 216 156 190" stroke="${OUTLINE}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}

function face(p, dazed) {
  const skin = SKIN[p.skin];
  const hair = HAIR[p.hair];
  const parts = [];
  if (p.tufts === "pigtails") parts.push(tufts(p, hair)); // pigtails hang behind the ears
  parts.push(ears(skin));
  parts.push(`<circle cx="128" cy="140" r="86" fill="${skin}" stroke="${OUTLINE}" stroke-width="4"/>`);
  if (p.beard) parts.push(`<path d="M50 150 Q56 250 128 252 Q200 250 206 150 Q190 206 128 208 Q66 206 50 150 Z" fill="${hair}" stroke="#c9c9c9" stroke-width="3"/>`);
  if (p.tufts !== "pigtails") parts.push(tufts(p, hair));
  const cheek = p.cheeks === "big" ? 20 : 14;
  parts.push(`<circle cx="74" cy="174" r="${cheek}" fill="#ff5c5c" opacity="0.35"/><circle cx="182" cy="174" r="${cheek}" fill="#ff5c5c" opacity="0.35"/>`);
  if (p.freckles) {
    for (const [x, y] of [[68, 162], [80, 168], [66, 174], [188, 162], [176, 168], [190, 174], [120, 150], [136, 150]]) parts.push(`<circle cx="${x}" cy="${y}" r="2.8" fill="#a0522d"/>`);
  }
  parts.push(eyes(p, dazed));
  parts.push(brows(p, p.hair === "white" ? "#b8b8b8" : hair, dazed));
  if (p.old) parts.push(`<path d="M68 134 l-10 -5 M68 144 l-10 4 M188 134 l10 -5 M188 144 l10 4" stroke="#00000040" stroke-width="3" stroke-linecap="round"/>`);
  if (p.glasses === "round") parts.push(`<g fill="none" stroke="#333" stroke-width="5"><circle cx="96" cy="136" r="27"/><circle cx="160" cy="136" r="27"/><path d="M123 134 Q128 128 133 134"/></g>`);
  if (p.glasses === "star") {
    const starPath = (cx) => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 15 : 34;
        const a = (Math.PI * i) / 5 - Math.PI / 2;
        pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(136 + r * Math.sin(a)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(" ")}" fill="none" stroke="#e6b800" stroke-width="5" stroke-linejoin="round"/>`;
    };
    parts.push(starPath(96) + starPath(160) + `<path d="M126 134 H130" stroke="#e6b800" stroke-width="5"/>`);
  }
  parts.push(nose(p));
  if (p.beard) parts.push(`<path d="M94 186 Q112 170 128 180 Q144 170 162 186 Q144 180 128 186 Q112 180 94 186 Z" fill="${hair}" stroke="#c9c9c9" stroke-width="2"/>`);
  parts.push(mouth(p, dazed));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">${parts.join("")}</svg>\n`;
}

rmSync("elves/faces", { recursive: true, force: true });
mkdirSync("elves/faces", { recursive: true });
const elves = [];
for (const p of ELVES) {
  writeFileSync(`elves/faces/${p.id}.svg`, face(p, false));
  writeFileSync(`elves/faces/${p.id}-dazed.svg`, face(p, true));
  elves.push({ id: p.id, name: p.name, voice: p.voice, faces: { normal: `faces/${p.id}.svg`, dazed: `faces/${p.id}-dazed.svg` } });
}
writeFileSync("elves/elves.json", JSON.stringify({ elves }, null, 2) + "\n");
console.log(`Wrote ${elves.length} elves to elves/elves.json`);
