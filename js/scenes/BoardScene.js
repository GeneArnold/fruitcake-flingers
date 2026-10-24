// The high scores, arcade style: a top 10 for every level, then MOST WANTED (the elves hit most).
// Swipe sideways to flip pages; swipe up or down, or tap, to go back. With the family board online
// the pages show the whole family; otherwise they show this phone.
import * as audio from "../audio.js";
import * as cast from "../cast.js";
import * as online from "../online.js";
import * as store from "../storage.js";
import { LEVELS } from "../levels.js";
import { listenForGestures } from "../gestures.js";
import { H, W, face, nightSky, setupCamera, text } from "../ui.js";

const MOST_WANTED = LEVELS.length; // the page after the last level
const MEDALS = ["#ffd700", "#d9e1ea", "#e0995e"];

export class BoardScene extends Phaser.Scene {
  constructor() {
    super("Board");
  }

  create({ level = 0 } = {}) {
    setupCamera(this);
    nightSky(this);
    this.page = level;
    this.content = this.add.container(0, 0);
    this.dots = this.add.graphics();
    text(this, W / 2, H - 34, "swipe sideways for more · up or down to go back", 17, { color: "#cfd8ff", strokeThickness: 3 });
    this.showPage();

    listenForGestures(this, {
      onSwipe: (dir) => {
        if (dir === "left" || dir === "right") this.flip(dir === "left" ? 1 : -1);
        else this.scene.start("Title");
      },
      onTap: () => this.scene.start("Title"),
    });
  }

  flip(step) {
    const pages = LEVELS.length + 1;
    this.page = (this.page + step + pages) % pages;
    audio.play("pop");
    this.showPage();
    this.content.x = step * 60;
    this.content.alpha = 0;
    this.tweens.add({ targets: this.content, x: 0, alpha: 1, duration: 200, ease: "Cubic.easeOut" });
  }

  async showPage() {
    const page = this.page;
    this.content.removeAll(true);
    this.drawDots();
    if (page === MOST_WANTED) {
      this.drawMostWanted(store.get("hits"), "THIS PHONE");
      const family = await online.mostWanted();
      if (family && this.page === page && this.scene.isActive()) {
        this.content.removeAll(true);
        this.drawMostWanted(family, "THE WHOLE FAMILY");
      }
      return;
    }
    const level = LEVELS[page];
    this.drawScores(level, store.board(level.id), "THIS PHONE");
    const family = await online.topScores(level.id);
    if (family && this.page === page && this.scene.isActive()) {
      this.content.removeAll(true);
      this.drawScores(level, family, "THE WHOLE FAMILY");
    }
  }

  // Puts something on the current page, so flipping pages clears it.
  put(obj) {
    this.content.add(obj);
    return obj;
  }

  drawScores(level, rows, whose) {
    const me = store.get("player");
    this.put(text(this, W / 2, 66, "HIGH SCORES", 50, { color: "#ffe066" }));
    this.put(text(this, W / 2, 118, level.name, 28));
    this.put(text(this, W / 2, 152, whose, 16, { color: "#cfd8ff", strokeThickness: 3 }));
    if (rows.length === 0) {
      this.put(text(this, W / 2, 440, "Nobody yet.\nBe the first!", 36, { color: "#ffffff" }));
      return;
    }
    rows.slice(0, 10).forEach((r, i) => {
      const y = 214 + i * 62;
      const mine = r.player ? r.player === me.id : r.initials === me.initials;
      const colour = MEDALS[i] || (mine ? "#7CFC9A" : "#ffffff");
      if (mine) {
        const g = this.put(this.add.graphics());
        g.fillStyle(0xffffff, 0.12);
        g.fillRoundedRect(40, y - 26, W - 80, 52, 12);
      }
      this.put(text(this, 96, y, `${i + 1}`.padStart(2, " "), 32, { color: colour, originX: 1 }));
      this.put(text(this, 140, y, r.initials, 36, { color: colour, originX: 0 }));
      this.put(text(this, W - 60, y, r.score.toLocaleString(), 36, { color: colour, originX: 1 }));
    });
  }

  drawMostWanted(hits, whose) {
    this.put(text(this, W / 2, 66, "MOST WANTED", 50, { color: "#ff6b6b" }));
    this.put(text(this, W / 2, 112, whose, 16, { color: "#cfd8ff", strokeThickness: 3 }));
    const elves = cast
      .everyone()
      .slice()
      .sort((a, b) => (hits[b.id] || 0) - (hits[a.id] || 0) || a.name.localeCompare(b.name));
    const top = elves[0];
    const n = hits[top?.id] || 0;
    this.put(text(this, W / 2, 158, n ? `${top.name}: splatted ${n.toLocaleString()} time${n === 1 ? "" : "s"}!` : "Nobody's been splatted yet. Go fling!", 22, { color: "#7CFC9A", wrap: W - 40, strokeThickness: 4 }));

    const cols = 4;
    const cellW = W / cols;
    const cellH = 136;
    const size = 86;
    elves.forEach((e, i) => {
      const cx = cellW * ((i % cols) + 0.5);
      const cy = 226 + cellH * Math.floor(i / cols);
      const count = hits[e.id] || 0;
      this.put(face(this, cx, cy, cast.faceKey(this, e, count ? "dazed" : "normal"), size).setAlpha(count ? 1 : 0.55));
      this.put(text(this, cx, cy + size / 2 + 12, e.name, 13, { wrap: cellW - 6, strokeThickness: 3 }));
      const badge = this.put(this.add.graphics());
      badge.fillStyle(count ? 0xe63946 : 0x5a6aa0);
      badge.fillCircle(cx + size / 2 - 2, cy - size / 2 + 8, 18);
      this.put(text(this, cx + size / 2 - 2, cy - size / 2 + 8, count > 999 ? "999+" : String(count), count > 99 ? 13 : 17, { strokeThickness: 0 }));
    });
  }

  drawDots() {
    this.dots.clear();
    const pages = LEVELS.length + 1;
    const gap = 20;
    const x0 = W / 2 - ((pages - 1) * gap) / 2;
    for (let i = 0; i < pages; i++) {
      this.dots.fillStyle(i === this.page ? (i === MOST_WANTED ? 0xff6b6b : 0xffe066) : 0x5a6aa0);
      this.dots.fillCircle(x0 + i * gap, H - 70, 6);
    }
  }
}
