// After a game, laid out like every Fun Shed game's results: a wooden sign with the score and a
// headline, a box of how the game went, then big buttons: PLAY AGAIN, TRASH TALK, SCORES and MENU.
// The score stays on this phone's board.
import * as audio from "../audio.js";
import * as cast from "../cast.js";
import * as store from "../storage.js";
import { shareRound, snapshot } from "../share.js";
import { LEVELS } from "../levels.js";
import { listenForGestures } from "../gestures.js";
import { face, nightSky, snowfall } from "../scenery.js";
import { W, button, inside, setupCamera, text, woodSign } from "../ui.js";

const AGAIN = { x: W / 2 - 170, y: 620, w: 340, h: 84 };
const SHARE = { x: W / 2 - 170, y: 726, w: 340, h: 70 };
const BOARD = { x: W / 2 - 170, y: 820, w: 160, h: 60 };
const MENU = { x: W / 2 + 10, y: 820, w: 160, h: 60 };

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create({ level, allClear, score, hits, bestCombo, rank, previousTop, challenge }) {
    setupCamera(this);
    nightSky(this);
    snowfall(this, 1);
    this.level = LEVELS[level];
    this.round = { score };
    const me = store.get("player");

    woodSign(this, W / 2, 200, 470, 300);
    text(this, W / 2, 90, allClear ? "ALL CLEAR!" : "GAME OVER", 50, { color: allClear ? "#7CFC9A" : "#ffe066" });
    const reached = allClear ? "beat every level" : `made it to ${this.level.name}`;
    text(this, W / 2, 136, `${me.initials} · ${reached}`, 22, { color: "#fff3c4", strokeThickness: 4 });
    const scoreText = text(this, W / 2, 212, "0", 90, { color: "#ffffff", strokeThickness: 10 });
    const countUp = Math.min(1200, 200 + score / 4);
    this.tweens.addCounter({
      from: 0, to: score, duration: countUp, ease: "Cubic.easeOut",
      onUpdate: (t) => scoreText.setText(Math.round(t.getValue()).toLocaleString()),
    });

    // The headline: a dare's outcome first, then a new high score, then the board.
    let headline;
    let colour = "#ffe066";
    let cheer = score > 0;
    if (challenge) {
      const won = score > challenge.score;
      headline = won ? `YOU BEAT ${challenge.initials}!` : `${challenge.initials} STILL RULES (${challenge.score.toLocaleString()})`;
      colour = won ? "#7CFC9A" : "#ff9e9e";
      cheer = won;
      store.set("challenge", null);
    } else if (score > previousTop && score > 0) {
      headline = "NEW HIGH SCORE!";
      colour = "#7CFC9A";
    } else if (rank) {
      headline = `#${rank} ON THIS PHONE`;
    } else {
      headline = `YOUR BEST ${previousTop.toLocaleString()}`;
      cheer = false;
    }
    const head = text(this, W / 2, 296, headline, 30, { color: colour, strokeThickness: 6 });
    if (colour === "#7CFC9A") this.tweens.add({ targets: head, scale: 1.1, duration: 450, yoyo: true, repeat: -1 });
    audio.play(cheer ? "cheer" : score > 0 ? "combo" : "groan");

    this.showHowItWent(level, allClear, hits, bestCombo);

    const buttons = [
      [AGAIN, 0x2a9d3a, "▶ PLAY AGAIN", 38],
      [SHARE, 0xe63946, "📣 TRASH TALK", 30],
      [BOARD, 0x2a6f9d, "HIGH SCORES", 22],
      [MENU, 0x7d5a3c, "MENU", 24],
    ];
    this.shareText = buttons.map(([r, c, words, size]) => button(this, r, c, words, size))[1].label;

    // The share picture is this screen, taken once the score has finished counting up.
    this.time.delayedCall(countUp + 150, () => snapshot(this.game).then((png) => (this.picture = png)));

    listenForGestures(this, {
      lockMs: 900,
      onSwipe: (dir) => {
        if (dir === "up") this.playAgain();
      },
      onTap: (x, y) => {
        if (inside(x, y, AGAIN)) this.playAgain();
        else if (inside(x, y, SHARE)) this.share();
        else if (inside(x, y, BOARD)) this.scene.start("Board");
        else if (inside(x, y, MENU)) this.scene.start("Title");
      },
    });
  }

  playAgain() {
    audio.play("whoosh");
    this.scene.start("Play", { level: 0 });
  }

  // A box of rows, each a picture, a label and a number: elves splatted, the elf hit most, levels
  // cleared, and the best combo if there was one.
  showHowItWent(level, allClear, hits, bestCombo) {
    const list = Object.entries(hits)
      .map(([id, n]) => ({ e: cast.elf(id), n }))
      .filter((h) => h.e)
      .sort((a, b) => b.n - a.n);
    this.mostHit = list[0];
    const total = list.reduce((sum, h) => sum + h.n, 0);
    const rows = [
      [(x, y) => this.add.image(x, y, "fruitcake").setDisplaySize(48, 30), "Elves splatted", String(total)],
      [(x, y) => this.add.image(x, y, "sleigh").setDisplaySize(52, 30), "Levels cleared", `${allClear ? LEVELS.length : level} of ${LEVELS.length}`],
    ];
    if (this.mostHit) rows.push([(x, y) => face(this, x, y, cast.faceKey(this, this.mostHit.e, "dazed"), 48), `Most: ${this.mostHit.e.name}`, `×${this.mostHit.n}`]);
    if (bestCombo > 1) rows.push([(x, y) => text(this, x, y, "💥", 30), "Best combo", `×${bestCombo}`]);

    const top = 360;
    const gap = 54;
    this.add.graphics().fillStyle(0x000000, 0.35).fillRoundedRect(70, top, W - 140, rows.length * gap + 22, 20);
    rows.forEach(([picture, label, value], i) => {
      const y = top + 40 + i * gap;
      picture(115, y);
      text(this, 150, y, label, 24, { originX: 0, strokeThickness: 5, wrap: 230 });
      text(this, W - 100, y, value, 32, { originX: 1, color: "#ffe066", strokeThickness: 5 });
    });
  }

  async share() {
    audio.play("pop");
    const { score } = this.round;
    const outcome = await shareRound({
      score, levelName: this.level.name,
      elfName: this.mostHit?.e.name, elfHits: this.mostHit?.n, picture: this.picture || null,
    });
    if (outcome !== "cancelled") this.shareText.setText("📣 SENT! AGAIN?");
  }
}
