// Records every saying in each elf voice, using Chatterbox on cerebro, then makes it elf-sized.
// Run from the project folder:  node tools/make-voices.mjs [--force] [--only v0,v2]
// Writes sayings/voices/v<n>/<saying id>.mp3 and lists the recorded voices on each saying in
// sayings/sayings.json. Lines already recorded are skipped unless --force is given.
//
// The elf sound: Chatterbox speaks at normal speed (its speed setting smears the audio), then the
// clip is played back faster ("asetrate"), which raises pitch and speed together, chipmunk style,
// without the warble of time-stretching. Each elf in elves/elves.json has a voice number.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CHATTERBOX = process.env.CHATTERBOX_URL || "http://192.168.40.110:8004";
const SAMPLE_RATE = 24000;

// Which Chatterbox voice each elf voice starts from, and how much it is sped up (1.25 = 25%).
const VOICES = {
  v0: { voice: "Eli.wav", pitch: 1.3 },
  v1: { voice: "Emily.wav", pitch: 1.25 },
  v2: { voice: "Henry.wav", pitch: 1.15 }, // the grumpier, older elves
  v3: { voice: "Layla.wav", pitch: 1.3 },
};
const KINDS = ["hit", "miss", "gentle"]; // "trash" lines are only ever texted, never spoken

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : Object.keys(VOICES);

const sayingsPath = "sayings/sayings.json";
const sayings = JSON.parse(readFileSync(sayingsPath, "utf8"));
const tmp = "sayings/voices/.raw.wav";
mkdirSync("sayings/voices", { recursive: true });

let made = 0;
for (const kind of KINDS) {
  for (const line of sayings[kind]) {
    for (const id of only) {
      const { voice, pitch } = VOICES[id];
      const out = `sayings/voices/${id}/${line.id}.mp3`;
      if (!force && existsSync(out)) continue;
      mkdirSync(`sayings/voices/${id}`, { recursive: true });
      const res = await fetch(`${CHATTERBOX}/v1/audio/speech`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "chatterbox", input: line.text, voice, response_format: "wav", speed: 1.0 }),
      });
      if (!res.ok) throw new Error(`Chatterbox said HTTP ${res.status} for "${line.text}" (${voice})`);
      writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
      // speed up, trim the silence at the start, and even out the loudness between clips
      const filters = [
        `asetrate=${SAMPLE_RATE}*${pitch}`, `aresample=${SAMPLE_RATE}`,
        "silenceremove=start_periods=1:start_threshold=-45dB", "loudnorm=I=-16:TP=-1.5",
      ].join(",");
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tmp, "-af", filters, "-ac", "1", "-c:a", "libmp3lame", "-q:a", "5", out]);
      made++;
      console.log(`${id}  ${line.text}`);
    }
  }
}
execFileSync("rm", ["-f", tmp]);

// Record which voices exist for each line, so the game (and the offline cache) know what to load.
for (const kind of KINDS) {
  for (const line of sayings[kind]) {
    const voices = Object.keys(VOICES).filter((id) => existsSync(`sayings/voices/${id}/${line.id}.mp3`));
    if (voices.length) line.voices = voices;
    else delete line.voices;
  }
}
let json = JSON.stringify(sayings, null, 2);
// one line per saying, as the file is written by hand
json = json.replace(/\{\s*\n\s*("id": [^\n]+)\n\s*("text": [^\n]+?),?\n\s*("voices": \[)\s*\n([\s\S]*?)\n\s*\]\s*\n\s*\}/g,
  (m, id, text, voicesKey, list) => `{ ${id} ${text}, ${voicesKey}${list.trim().split(/\s*\n\s*/).join(" ")}] }`);
json = json.replace(/\{\s*\n\s*("id": [^\n]+)\n\s*("text": [^\n]+?)\n\s*\}/g, "{ $1 $2 }");
json = json.replace(/\{\s*\n\s*("text": [^\n]+?)\n\s*\}/g, "{ $1 }");
writeFileSync(sayingsPath, json + "\n");
console.log(`Recorded ${made} clips.`);
