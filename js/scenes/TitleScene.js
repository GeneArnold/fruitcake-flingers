// The title: tap PLAY (or swipe up) to play (a game always starts at level 1), and HIGH SCORES (or
// swipe down) for the boards. Only the buttons start things, so a stray tap does nothing. Tap your
// initials to change them, or SOUND to mute.
import * as audio from "../audio.js";
import { install, installHint, onHintChange } from "../install.js";
import * as store from "../storage.js";
import { checkForUpdate, update, versionLabel } from "../update.js";
import { LEVELS, paintLevel } from "../levels.js";
import { listenForGestures } from "../gestures.js";
import { nightSky, snowfall } from "../scenery.js";
import { H, W, button, inside, setupCamera, text } from "../ui.js";

const CARD_SCALE = 0.3;
const CARD_Y = 496;
const CARD = { x: (W - W * CARD_SCALE) / 2, y: CARD_Y - (H * CARD_SCALE) / 2, w: W * CARD_SCALE, h: H * CARD_SCALE };
const PLAY = { x: W / 2 - 150, y: 700, w: 300, h: 90 };
const SCORES = { x: W / 2 - 110, y: 808, w: 220, h: 56 };
const INSTALL = { x: 40, y: 906, w: W - 80, h: 34 };  // the install hint, or the update button
const VERSION_AREA = { x: 60, y: 940, w: W - 120, h: 20 };

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    setupCamera(this);
    const challenge = store.get("challenge");
    nightSky(this);
    snowfall(this, 1);

    text(this, W / 2, 132, "FRUITCAKE", 62, { color: "#ffe066" });
    text(this, W / 2, 194, "FLINGERS", 62, { color: "#ff6b6b" });
    const cake = this.add.image(W / 2, 270, "fruitcake");
    this.tweens.add({ targets: cake, angle: { from: -8, to: 8 }, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // Who is playing (tap to change initials), and sound on or off (tap to change).
    const badge = this.add.graphics();
    badge.fillStyle(0x000000, 0.3);
    badge.fillRoundedRect(W - 128, 18, 110, 62, 14);
    text(this, W - 73, 46, store.get("player").initials, 34, { color: "#ffe066" });
    text(this, W - 73, 96, "CHANGE", 13, { color: "#cfd8ff", strokeThickness: 3 });
    this.meArea = { x: W - 140, y: 0, w: 140, h: 120 };
    const best = store.topScore();
    if (challenge) {
      const banner = text(this, W / 2, 330, `${challenge.initials} DARES YOU: BEAT ${challenge.score.toLocaleString()}!`, 24, { color: "#7CFC9A" });
      this.tweens.add({ targets: banner, scale: 1.06, duration: 400, yoyo: true, repeat: -1 });
    } else if (best) {
      text(this, W / 2, 330, `YOUR BEST  ${best.toLocaleString()}`, 20, { color: "#cfd8ff", strokeThickness: 3 });
    }
    this.soundText = text(this, 22, 40, "", 18, { originX: 0, color: "#cfd8ff" });
    this.soundArea = { x: 0, y: 0, w: 150, h: 80 };
    this.showSound();

    this.card = this.add.container(0, 0).setDepth(2);
    this.drawCard();
    text(this, W / 2, CARD.y + CARD.h + 26, `${LEVELS.length} LEVELS · make each goal to go on`, 20, { color: "#ffffff", strokeThickness: 4 }).setDepth(2);

    const go = button(this, PLAY, 0x2a9d3a, "▶ PLAY", 46);
    this.tweens.add({ targets: go.label, scale: 1.1, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    button(this, SCORES, 0x2a6f9d, "HIGH SCORES", 24);
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
      lockMs: 800, // a tap left over from the last screen can't press anything here
      onSwipe: (dir) => {
        if (dir === "up") this.play();
        else if (dir === "down") this.scene.start("Board");
      },
      onTap: (x, y) => {
        if (inside(x, y, this.meArea)) this.scene.start("Name");
        else if (this.hint?.update && inside(x, y, INSTALL)) this.runUpdate();
        else if (this.hint?.tap && inside(x, y, INSTALL)) install();
        else if (this.hint?.link && inside(x, y, INSTALL)) window.open(this.hint.link, "_blank");
        else if (inside(x, y, VERSION_AREA)) this.lookForUpdate(true);
        else if (inside(x, y, this.soundArea)) this.toggleSound();
        else if (inside(x, y, PLAY)) this.play();
        else if (inside(x, y, SCORES)) this.scene.start("Board");
      },
    });
  }

  play() {
    audio.play("whoosh");
    this.scene.start("Play", { level: 0 });
  }

  // The first level drawn small, as a card.
  drawCard() {
    const { back, front } = paintLevel(this, LEVELS[0]);
    const preview = this.add.container(CARD.x, CARD.y, [back, front]).setScale(CARD_SCALE);
    // Level art can reach past the screen edges; keep it inside the card.
    const mask = this.make.graphics({}, false).fillStyle(0xffffff).fillRect(CARD.x, CARD.y, CARD.w, CARD.h).createGeometryMask();
    preview.setMask(mask);
    const frame = this.add.graphics();
    frame.lineStyle(6, 0xffe066);
    frame.strokeRoundedRect(CARD.x - 3, CARD.y - 3, CARD.w + 6, CARD.h + 6, 10);
    this.card.add([preview, frame]);
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
    if (!this.hint || this.hint.link) return; // the how-to link is just words
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
