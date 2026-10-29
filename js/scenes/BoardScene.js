// The high scores, arcade style: the top 10 games, then MOST WANTED (the elves hit most).
// A blue button flips between the pages and BACK goes to the title; swipes are shortcuts (sideways to
// flip, up or down to go back). Both pages are this phone's: to get on its board, you play on it.
import * as audio from "../audio.js";
import * as cast from "../cast.js";
import * as store from "../storage.js";
import { listenForGestures } from "../gestures.js";
import { face, nightSky } from "../scenery.js";
import { W, button, inside, setupCamera, text } from "../ui.js";

const PAGES = 2;
const MOST_WANTED = 1; // the page after the high scores
const PAGE = { x: 50, y: 830, w: 250, h: 64 };
const BACK = { x: W - 220, y: 830, w: 170, h: 64 };
const MEDALS = ["#ffd700", "#d9e1ea", "#e0995e"];

export class BoardScene extends Phaser.Scene {
  constructor() {
    super("Board");
  }

  create() {
    setupCamera(this);
    nightSky(this);
    this.page = 0;
    this.content = this.add.container(0, 0);
    this.pageButton = button(this, PAGE, 0x2a6f9d, "", 24);
    button(this, BACK, 0x7d5a3c, "BACK", 28);
    this.showPage();

    listenForGestures(this, {
      onSwipe: (dir) => {
        if (dir === "left" || dir === "right") this.flip(dir === "left" ? 1 : -1);
        else this.scene.start("Title");
      },
      onTap: (x, y) => {
        if (inside(x, y, PAGE)) this.flip(1);
        else if (inside(x, y, BACK)) this.scene.start("Title");
      },
    });
  }

  flip(step) {
    this.page = (this.page + step + PAGES) % PAGES;
    audio.play("pop");
    this.showPage();
    this.content.x = step * 60;
    this.content.alpha = 0;
    this.tweens.add({ targets: this.content, x: 0, alpha: 1, duration: 200, ease: "Cubic.easeOut" });
  }

  showPage() {
    this.content.removeAll(true);
    this.pageButton.label.setText(this.page === MOST_WANTED ? "◀ HIGH SCORES" : "MOST WANTED ▶");
    if (this.page === MOST_WANTED) this.drawMostWanted(store.get("hits"), "ON THIS PHONE");
    else this.drawScores(store.board(), "ON THIS PHONE");
  }

  // Puts something on the current page, so flipping pages clears it.
  put(obj) {
    this.content.add(obj);
    return obj;
  }

  drawScores(rows, whose) {
    const me = store.get("player");
    this.put(text(this, W / 2, 80, "HIGH SCORES", 56, { color: "#ffe066" }));
    this.put(text(this, W / 2, 140, whose, 16, { color: "#cfd8ff", strokeThickness: 3 }));
    if (rows.length === 0) {
      this.put(text(this, W / 2, 440, "Nobody yet.\nBe the first!", 36, { color: "#ffffff" }));
      return;
    }
    rows.slice(0, 10).forEach((r, i) => {
      const y = 214 + i * 62;
      const mine = r.initials === me.initials;
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
    const cellH = 128;
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
}
