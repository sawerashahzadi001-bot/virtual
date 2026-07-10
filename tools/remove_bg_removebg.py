import os
import sys
import requests
from pathlib import Path

API_KEY = os.environ.get("REMOVE_BG_API_KEY")
if not API_KEY:
    print("ERROR: set REMOVE_BG_API_KEY environment variable with your remove.bg API key")
    sys.exit(2)

SRC = Path(__file__).resolve().parent.parent / "src" / "assets"
OUT = SRC / "overlays"
OUT.mkdir(parents=True, exist_ok=True)

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

ENDPOINT = "https://api.remove.bg/v1.0/removebg"

for fname in files:
    src = SRC / fname
    if not src.exists():
        print(f"Skipping missing: {src}")
        continue
    out_name = fname.rsplit('.', 1)[0].replace(' ', '-').lower() + '.png'
    out_path = OUT / out_name
    if out_path.exists():
        print(f"Already exists, skipping: {out_path}")
        continue

    with open(src, 'rb') as f:
        response = requests.post(
            ENDPOINT,
            files={'image_file': f},
            data={'size': 'auto'},
            headers={'X-Api-Key': API_KEY},
        )
    if response.status_code == 200:
        with open(out_path, 'wb') as out:
            out.write(response.content)
        print(f"Saved overlay: {out_path}")
    else:
        print(f"Failed for {src}: {response.status_code} {response.text}")
