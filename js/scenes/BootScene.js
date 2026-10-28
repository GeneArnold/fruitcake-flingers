// Loads the elves, their faces and the sayings, draws the placeholder art, then opens the game.
import * as cast from "../cast.js";
import * as online from "../online.js";
import * as store from "../storage.js";
import { readChallenge } from "../share.js";
import { levelPictures } from "../levels.js";
import { PICTURES, makeTextures } from "../textures.js";
import { H, W, setupCamera, text } from "../ui.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    setupCamera(this);
    const status = text(this, W / 2, H / 2, "Baking fruitcakes...", 30);
    this.load.json("elves", "elves/elves.json");
    this.load.json("sayings", "sayings/sayings.json");
    // Once the elves file is in, queue every face picture it lists.
    this.load.on("filecomplete-json-elves", (key, type, data) => {
      for (const e of data.elves) {
        for (const [kind, path] of Object.entries(e.faces || {})) {
          const faceKey = `face-${e.id}-${kind}`;
          const url = `elves/${path}`;
          if (url.endsWith(".svg")) this.load.svg(faceKey, url, { width: 256, height: 256 });
          else this.load.image(faceKey, url);
        }
      }
    });
    for (const key of PICTURES) this.load.image(key, `img/${key}.png`);
    for (const [key, url] of levelPictures()) this.load.image(key, url);
    this.load.on("progress", (v) => status.setText(`Baking fruitcakes... ${Math.round(v * 100)}%`));
    this.load.on("loaderror", (file) => console.warn("Could not load", file.src));
  }

  create() {
    cast.setData(this.cache.json.get("elves"), this.cache.json.get("sayings"));
    makeTextures(this);
    readChallenge();
    online.flush(); // rounds played offline last time
    this.scene.start(store.get("player") ? "Title" : "Name");
  }
}
