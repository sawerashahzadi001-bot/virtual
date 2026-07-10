from rembg import remove
from PIL import Image
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src" / "assets"
OUT = SRC / "overlays"
OUT.mkdir(parents=True, exist_ok=True)

# list of abaya files to process
files = [
    "beige abaya.jpeg",
    "black abaya.jpeg",
    "Green abaya.jpeg",
    "grey abaya.jpeg",
    "Mehroon abaya.jpeg",
    "mocha abaya.jpeg",
    "olive.jpeg",
    "zinc abaya.jpeg",
]

for fname in files:
    src = SRC / fname
    if not src.exists():
        print(f"Skipping missing: {src}")
        continue
    with Image.open(src) as im:
        im = im.convert("RGBA")
        out = remove(im)
        out_name = fname.rsplit('.', 1)[0].replace(' ', '-').lower() + '.png'
        out_path = OUT / out_name
        out.save(out_path)
        print(f"Saved overlay: {out_path}")
