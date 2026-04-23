# /// script
# requires-python = ">=3.11"
# dependencies = ["huggingface_hub>=1.5.0", "Pillow"]
# ///
"""
Generate archetype portrait PNGs via HF Inference API (FLUX.1-schnell).
Output: policy-sim/web/public/portraits/<archetype_id>.png

Run with: uv run scripts/generate_portraits.py
Requires: hf auth login  (or HF_TOKEN env var)
"""

import os
import sys
from pathlib import Path

try:
    from huggingface_hub import InferenceClient
except ImportError:
    print("huggingface_hub not installed. Run: pip install -U huggingface_hub")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

OUT_DIR = Path(__file__).parent.parent / "web" / "public" / "portraits"
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL = "black-forest-labs/FLUX.1-schnell"

# Shared style prefix — consistent composition across all 4 for v2 lip-sync alignment
STYLE = (
    "stylized editorial portrait illustration, head-and-shoulders centered composition, "
    "neutral closed mouth at lower-center of face, soft even lighting, "
    "flat-colour background, warm friendly expression, semi-realistic painterly style, "
    "vertical 3:4 aspect ratio"
)

PERSONAS: list[tuple[str, str]] = [
    (
        "low_income_worker",
        f"34-year-old white British woman, part-time carer, tired but warm expression, "
        f"practical winter clothing, North East England working-class style, {STYLE}",
    ),
    (
        "small_business_owner",
        f"48-year-old British male self-employed builder, sturdy build, "
        f"casual work shirt, slight pragmatic smile, South Yorkshire working professional, {STYLE}",
    ),
    (
        "urban_professional",
        f"31-year-old British South Asian woman, financial analyst, "
        f"smart professional attire, confident measured expression, Islington London professional, {STYLE}",
    ),
    (
        "retired_pensioner",
        f"72-year-old white British man, retired factory worker, widower, "
        f"kind stoic eyes, greying hair, knitted jumper, Stoke-on-Trent elderly, {STYLE}",
    ),
]


def generate(client: InferenceClient, archetype_id: str, prompt: str) -> Path:
    out_path = OUT_DIR / f"{archetype_id}.png"
    if out_path.exists():
        print(f"  skip {archetype_id}.png (already exists)")
        return out_path

    print(f"  generating {archetype_id}...")
    image = client.text_to_image(
        prompt,
        model=MODEL,
        width=512,
        height=768,
    )
    if isinstance(image, Image.Image):
        image.save(out_path, format="PNG", optimize=True)
    else:
        # some versions return bytes
        with open(out_path, "wb") as f:
            f.write(image)  # type: ignore[arg-type]
    size_kb = out_path.stat().st_size // 1024
    print(f"  saved {out_path.name} ({size_kb} KB)")
    return out_path


def main() -> None:
    token = os.environ.get("HF_TOKEN")
    client = InferenceClient(token=token)

    print(f"Output directory: {OUT_DIR}")
    print(f"Model: {MODEL}")
    print()

    failed: list[str] = []
    for archetype_id, prompt in PERSONAS:
        try:
            generate(client, archetype_id, prompt)
        except Exception as exc:
            print(f"  ERROR {archetype_id}: {exc}")
            failed.append(archetype_id)

    print()
    if failed:
        print(f"Failed: {failed}")
        print("Re-run to retry failed archetypes (successful ones are cached).")
        sys.exit(1)
    else:
        print("All 4 portraits generated.")
        print(f"Commit with: git add web/public/portraits/ && git commit -m 'Add archetype portraits'")


if __name__ == "__main__":
    main()
