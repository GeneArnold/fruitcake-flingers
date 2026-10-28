# The prompts behind the cartoon art, so any picture can be made again. Each line runs tools/swarm.py.
#   python3 tools/art-prompts.py elves [ids...]   expression sheets: normal, dazed, splatted
#   python3 tools/art-prompts.py things           fruitcake, splat, sleigh, balloons, bodies, props
#   python3 tools/art-prompts.py levels [ids...]  backgrounds (768 x 1344)
# Tries land in art/source/gen/; tools/cutout.py and tools/place-art.py turn the picks into game art.
import subprocess
import sys

N = sys.argv[sys.argv.index("--n") + 1] if "--n" in sys.argv else "3"

SKIN = ["very fair", "fair", "light tan", "tan", "brown", "dark brown"]
OUTFIT = ["green", "red", "teal", "purple"]

# id: (skin, outfit colour, the rest of the look)
ELVES = {
    "jingles": (0, 0, "a boy elf with spiky ginger hair and freckles, cheeky grin"),
    "sprinkles": (1, 1, "a girl elf with bright pink hair in two pigtails and long eyelashes"),
    "twinkletoes": (2, 2, "a girl elf with a blond curl of hair and long eyelashes, sweet smile"),
    "pudding": (1, 0, "a chubby boy elf with a brown bowl haircut and big round rosy cheeks"),
    "figgy": (3, 3, "a boy elf with spiky black hair and big buck teeth"),
    "nutmeg": (4, 1, "a girl elf with black hair in two round puffs and long eyelashes"),
    "tinsel": (0, 2, "an elf with mint green curly hair wearing star-shaped sunglasses"),
    "gumdrop": (2, 3, "a girl elf with ginger pigtails, freckles and a gap-toothed grin"),
    "cocoa": (5, 0, "a boy elf with black hair in two round puffs and a huge grin"),
    "pickles": (1, 1, "a goofy boy elf with spiky brown hair sticking his tongue out"),
    "buttons": (3, 2, "a boy elf with a brown bowl haircut and round glasses"),
    "mistletoe": (0, 3, "a girl elf with blond pigtails, long eyelashes and a sly smirk"),
    "peppermint": (4, 0, "a girl elf with pink curly hair and braces on her teeth"),
    "sugarplum": (2, 1, "a chubby girl elf with black hair puffs and big rosy cheeks"),
    "noodle": (1, 2, "a skinny boy elf with ginger curly hair and a very long pointy nose"),
    "waffles": (3, 3, "a boy elf with spiky blond hair, freckles and buck teeth"),
    "chestnut": (5, 0, "a boy elf with a brown bowl haircut and one big bushy unibrow, smirking"),
    "snickerdoodle": (0, 1, "a nerdy elf with spiky mint green hair, round glasses and a gap-toothed grin"),
    "grumbles": (1, 2, "a grumpy old grandpa elf with a big white beard, bushy white eyebrows and round glasses"),
    "nana-noel": (3, 3, "a sweet old grandma elf with white hair in a bun, round glasses and a kind smile"),
}


def elf_prompt(skin, outfit, look):
    return (f"expression sheet of the same cartoon Christmas elf's head and shoulders, {look}, "
            f"{SKIN[skin]} skin, big pointy elf ears, wearing a {OUTFIT[outfit]} floppy elf hat with "
            f"white fur trim and a white pom-pom and a {OUTFIT[outfit]} tunic with a white zigzag collar, "
            "front view. Three heads side by side, evenly spaced, not overlapping: 1 happy and mischievous, "
            "2 dazed and dizzy with swirly spiral eyes and a bump, 3 whole face covered in a big splat of "
            "thick brown fruitcake mush with red cherries, only the eyes peeking out, shocked")


THINGS = {
    "fruitcake": ("a single cartoon Christmas fruitcake loaf, dark brown cake studded with red and green "
                  "candied cherries and nuts, white sugar glaze dripping on top, side view, wider than tall",
                  1024, 768),
    "splat": ("a single big cartoon splat of sticky brown fruitcake goo, a round messy splash shape with "
              "a few drips, bits of red and green cherries in it, seen flat from the front", 1024, 1024),
    "bodies": ("four separate cartoon Christmas elf tunics with no person inside, side by side, evenly "
               "spaced, not overlapping, each with short sleeves and little hands in mittens, a black belt "
               "with a gold buckle and a white zigzag collar: 1 green, 2 red, 3 teal, 4 purple", 1792, 768),
    "sleigh": ("Santa's empty red wooden sleigh with gold trim and curly gold runners, side view facing "
               "left, no reindeer, no people", 1344, 768),
    "balloons": ("a bunch of three shiny party balloons, red, blue and yellow, strings tied together "
                 "at the bottom", 768, 1024),
    "props1": ("four separate items side by side, evenly spaced, not overlapping: 1 a stack of fancy "
               "white china plates with blue patterns, 2 a red poinsettia in a clay pot, 3 a fancy glass "
               "jewelry display case, 4 a pile of juice boxes", 1792, 768),
    "props2": ("four separate items side by side, evenly spaced, not overlapping: 1 a smartphone, 2 a mug "
               "of hot cocoa with marshmallows, 3 a long paper scroll titled naughty list, 4 a plaid "
               "thermos flask", 1792, 768),
    "props3": ("four separate items side by side, evenly spaced, not overlapping: 1 a pair of rental ice "
               "skates, 2 a big new flat screen TV in a box with a bow, 3 a plate of cookies and a glass "
               "of milk, 4 a jolly mall Santa sitting on a big red chair", 1792, 768),
}

BG = (", 2D cartoon game background art, bold clean black outlines, flat bright colors, simple cel "
      "shading, Saturday-morning cartoon style, no characters, no people, no animals, no text")

LEVELS = {
    "house": ("vertical mobile game background of a cozy cartoon house at night in winter, seen from the "
              "front. Starry dark blue sky with a big moon. A brick house with a snowy roof, a chimney, two "
              "big lit yellow windows and a front door with a wreath, across the middle of the picture. "
              "Below it a wide snowy front yard with a big snowman on the left and a round snow bank. "
              "The bottom third is plain flat empty snow"),
    "mall": ("vertical mobile game background of a shopping mall decorated for Christmas, seen from the "
             "front. Top: a glass ceiling and an upper balcony walkway with railings. Middle: three shop "
             "windows in a row with counters. Below them a planter with a hedge. The bottom third is a plain "
             "empty shiny tiled floor"),
    "playground": ("vertical mobile game background of a snowy playground in daytime, seen from the front. "
                   "Pale winter sky. A wooden play fort with a tower window on the left, a slide, a tall "
                   "climbing frame with a top platform, a row of snowy bushes. The bottom third is plain flat "
                   "empty snow"),
    "workshop": ("vertical mobile game background of Santa's toy workshop inside, seen from the front. "
                 "Wooden beams, shelves of toys high on the wall, a round window, a high wooden balcony "
                 "shelf across the middle, and a long wooden workbench with three stacks of wrapped presents. "
                 "The bottom third is a plain empty wooden floor"),
    "rink": ("vertical mobile game background of an outdoor ice skating rink at dusk, seen from the front. "
             "Purple sky, snowy pine trees, a small wooden ticket hut with a window on the left, string "
             "lights. The middle is a wide smooth pale blue ice rink with a low white wall at the front. "
             "The bottom third is plain flat empty snow"),
    "morning": ("vertical mobile game background of a cozy living room on Christmas morning, seen from the "
                "front. A fireplace with stockings on the left, a tall decorated Christmas tree on the right "
                "with a pile of wrapped presents under it, a window with snow outside at the top, a sofa in "
                "the middle. The bottom third is a plain empty rug on a wooden floor"),
}


def swarm(name, prompt, w, h, raw=False):
    cmd = ["python3", "tools/swarm.py", name, prompt, "--n", N, "--w", str(w), "--h", str(h)]
    subprocess.run(cmd + (["--raw"] if raw else []), check=True)


def main():
    what = sys.argv[1]
    pick = [a for a in sys.argv[2:] if not a.startswith("--") and a != N]
    if what == "elves":
        for eid, (skin, outfit, look) in ELVES.items():
            if not pick or eid in pick:
                swarm(f"elf-{eid}", elf_prompt(skin, outfit, look), 1792, 768)
    elif what == "things":
        for name, (prompt, w, h) in THINGS.items():
            if not pick or name in pick:
                swarm(name, prompt, w, h)
    elif what == "levels":
        for lid, prompt in LEVELS.items():
            if not pick or lid in pick:
                swarm(f"bg-{lid}", prompt + BG, 768, 1344, raw=True)


main()
