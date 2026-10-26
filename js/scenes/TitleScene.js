// The title: swipe up to play, sideways to pick a level, down for the scoreboard.
// Taps work too: the level card plays, the arrows change level, your initials change them.
import * as audio from "../audio.js";
import { install, installHint, installed, onHintChange } from "../install.js";
import * as store from "../storage.js";
import { checkForUpdate, update, versionLabel } from "../update.js";
import { LEVELS, paintLevel } from "../levels.js";
import { inside, listenForGestures } from "../gestures.js";
import { H, W, nightSky, setupCamera, snowfall, text } from "../ui.js";

const CARD_SCALE = 0.4;
const CARD_Y = 548;
const CARD = { x: (W - W * CARD_SCALE) / 2, y: CARD_Y - (H * CARD_SCALE) / 2, w: W * CARD_SCALE, h: H * CARD_SCALE };
const INSTALL = { x: 40, y: 906, w: W - 80, h: 34 };  // the install hint, or the update button
const VERSION_AREA = { x: 60, y: 940, w: W - 120, h: 20 };

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    setupCamera(this);
    this.levelIndex = Math.min(store.get("level") || 0, LEVELS.length - 1);
    // A challenge link picks its level.
    const challenge = store.get("challenge");
    const challengeLevel = challenge ? LEVELS.findIndex((l) => l.id === challenge.level) : -1;
    if (challengeLevel >= 0) this.levelIndex = challengeLevel;
    nightSky(this);
    snowfall(this, 1);

    text(this, W / 2, 132, "FRUITCAKE", 62, { color: "#ffe066" });
    text(this, W / 2, 194, "FLINGERS", 62, { color: "#ff6b6b" });
    const cake = this.add.image(W / 2, 270, "fruitcake").setScale(0.7);
    this.tweens.add({ targets: cake, angle: { from: -8, to: 8 }, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // Who is playing (tap to change initials), and sound on or off (tap to change).
    const badge = this.add.graphics();
    badge.fillStyle(0x000000, 0.3);
    badge.fillRoundedRect(W - 128, 18, 110, 62, 14);
    text(this, W - 73, 46, store.get("player").initials, 34, { color: "#ffe066" });
    text(this, W - 73, 96, "CHANGE", 13, { color: "#cfd8ff", strokeThickness: 3 });
    this.meArea = { x: W - 140, y: 0, w: 140, h: 120 };
    const best = store.topScore();
    if (challengeLevel >= 0) {
      const banner = text(this, W / 2, 330, `${challenge.initials} DARES YOU: BEAT ${challenge.score.toLocaleString()}!`, 24, { color: "#7CFC9A" });
      this.tweens.add({ targets: banner, scale: 1.06, duration: 400, yoyo: true, repeat: -1 });
    } else if (best) {
      text(this, W / 2, 330, `YOUR BEST  ${best.toLocaleString()}`, 20, { color: "#cfd8ff", strokeThickness: 3 });
    }
    this.soundText = text(this, 22, 40, "", 18, { originX: 0, color: "#cfd8ff" });
    this.soundArea = { x: 0, y: 0, w: 150, h: 62 };
    this.showSound();
    text(this, 22, 82, "✕ QUIT", 18, { originX: 0, color: "#cfd8ff" });
    this.quitArea = { x: 0, y: 62, w: 150, h: 50 };

    this.card = this.add.container(0, 0).setDepth(2);
    this.levelName = text(this, W / 2, CARD.y + CARD.h + 30, "", 30, { color: "#ffffff" }).setDepth(2);
    this.dots = this.add.graphics().setDepth(2);
    this.leftArrow = text(this, 44, CARD_Y, "‹", 90, { color: "#ffe066" }).setDepth(2);
    this.rightArrow = text(this, W - 44, CARD_Y, "›", 90, { color: "#ffe066" }).setDepth(2);
    this.drawCard();

    const go = text(this, W / 2, 856, "SWIPE UP TO FLING", 34, { color: "#ffe066" });
    this.tweens.add({ targets: go, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    text(this, W / 2, 886, "swipe down for the high scores", 18, { color: "#cfd8ff", strokeThickness: 3 });
    this.installBox = this.add.graphics();
    this.installText = text(this, W / 2, INSTALL.y + INSTALL.h / 2, "", 17, { color: "#ffffff", strokeThickness: 3 });
    this.versionText = text(this, W / 2, 951, versionLabel(), 12, { color: "#8f9cc8", strokeThickness: 2 });
    this.showInstall();
    onHintChange(() => this.scene.isActive() && this.showInstall());
    this.lookForUpdate(false);
    // Coming back to the game from another app checks again: a phone often keeps the game open for days.
    const back = () => !document.hidden && this.lookForUpdate(false);
    document.addEventListener("visibilitychange", back);
    this.events.once("shutdown", () => document.removeEventListener("visibilitychange", back));

    listenForGestures(this, {
      onSwipe: (dir) => {
        if (dir === "up") this.play();
        else if (dir === "down") this.scene.start("Board", { level: this.levelIndex });
        else this.changeLevel(dir === "left" ? 1 : -1);
      },
      onTap: (x, y) => {
        if (inside(x, y, this.meArea)) this.scene.start("Name");
        else if (this.hint?.update && inside(x, y, INSTALL)) this.runUpdate();
        else if (this.hint?.tap && inside(x, y, INSTALL)) install();
        else if (inside(x, y, VERSION_AREA)) this.lookForUpdate(true);
        else if (inside(x, y, this.soundArea)) this.toggleSound();
        else if (inside(x, y, this.quitArea)) this.quit();
        else if (inside(x, y, CARD)) this.play();
        else if (y > CARD.y && y < CARD.y + CARD.h && x < CARD.x) this.changeLevel(-1);
        else if (y > CARD.y && y < CARD.y + CARD.h && x > CARD.x + CARD.w) this.changeLevel(1);
      },
    });
  }

  play() {
    audio.play("whoosh");
    this.scene.start("Play", { level: this.levelIndex });
  }

  // Installed, the game closes itself where the phone allows it (Android). Where it doesn't (iPhone),
  // it says how. In a browser tab, quitting goes to the Fun Shed's home page.
  quit() {
    if (!installed()) {
      location.href = "https://thefunshed.com/";
      return;
    }
    window.close();
    this.time.delayedCall(400, () => {
      const howTo = text(this, W / 2, 380, "To close the game,\nswipe it away", 28).setDepth(5);
      this.tweens.add({ targets: howTo, alpha: 0, delay: 2500, duration: 400, onComplete: () => howTo.destroy() });
    });
  }

  changeLevel(step) {
    if (LEVELS.length < 2) return;
    this.levelIndex = (this.levelIndex + step + LEVELS.length) % LEVELS.length;
    store.set("level", this.levelIndex);
    audio.play("pop");
    this.drawCard();
    this.card.x = step * 60;
    this.card.alpha = 0;
    this.tweens.add({ targets: this.card, x: 0, alpha: 1, duration: 200, ease: "Cubic.easeOut" });
  }

  // The chosen level drawn small, as a card.
  drawCard() {
    this.card.removeAll(true);
    const level = LEVELS[this.levelIndex];
    const { back, front } = paintLevel(this, level);
    const preview = this.add.container(CARD.x, CARD.y, [back, front]).setScale(CARD_SCALE);
    // Level art can reach past the screen edges (the mall floor does); keep it inside the card.
    this.cardMask ??= this.make.graphics({}, false).fillStyle(0xffffff).fillRect(CARD.x, CARD.y, CARD.w, CARD.h).createGeometryMask();
    preview.setMask(this.cardMask);
    const frame = this.add.graphics();
    frame.lineStyle(6, 0xffe066);
    frame.strokeRoundedRect(CARD.x - 3, CARD.y - 3, CARD.w + 6, CARD.h + 6, 10);
    this.card.add([preview, frame]);
    this.levelName.setText(level.name);

    this.dots.clear();
    const gap = 22;
    const x0 = W / 2 - ((LEVELS.length - 1) * gap) / 2;
    LEVELS.forEach((_, i) => {
      this.dots.fillStyle(i === this.levelIndex ? 0xffe066 : 0x5a6aa0);
      this.dots.fillCircle(x0 + i * gap, CARD.y + CARD.h + 66, 7);
    });
    this.leftArrow.setVisible(LEVELS.length > 1);
    this.rightArrow.setVisible(LEVELS.length > 1);
  }

  // Asks the site whether a newer release is out; if so, the update button replaces the install hint.
  // `asked` is a tap on the version: then it also says when there's nothing new.
  async lookForUpdate(asked) {
    if (asked) this.versionText.setText("checking for an update…");
    const newer = await checkForUpdate();
    if (!this.scene.isActive()) return;
    this.updateReady = newer === true;
    this.showInstall();
    if (!asked) return;
    const answer = newer === null ? "couldn't check (no signal?)" : newer ? "an update is ready" : "you have the latest version ✓";
    this.versionText.setText(answer);
    this.time.delayedCall(2500, () => this.versionText.setText(versionLabel()));
  }

  runUpdate() {
    this.installText.setText("⏳ UPDATING…");
    this.hint = null;
    update();
  }

  // "Install me", while the game is playing in a browser tab on a phone (js/install.js), or the
  // update button when a newer release is out.
  showInstall() {
    this.hint = this.updateReady ? { words: "⬆ NEW VERSION! TAP TO UPDATE", tap: true, update: true } : installHint();
    this.installBox.clear();
    this.installText.setText(this.hint?.words ?? "");
    if (!this.hint) return;
    this.installBox.fillStyle(this.hint.update ? 0xe07a1f : this.hint.tap ? 0x2a9d8f : 0x000000, this.hint.tap ? 1 : 0.3);
    this.installBox.fillRoundedRect(INSTALL.x, INSTALL.y, INSTALL.w, INSTALL.h, 17);
  }

  toggleSound() {
    const on = !store.get("sound");
    store.set("sound", on);
    audio.setEnabled(on);
    this.showSound();
    audio.play("pop");
  }

  showSound() {
    this.soundText.setText(store.get("sound") ? "SOUND ON" : "SOUND OFF");
  }
}
