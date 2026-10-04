"""Extract every visual asset for The Pasta Company site from the reference shot.

The reference is a 1024x1536 screenshot of the page design. Some regions carry
baked-in UI (buttons, arrows, text) that we re-render live, so those crops are
taken to stop just short of the baked chrome.

Product packs and pasta "shape" shots sit on a smooth, light card background.
We lift them onto transparency with a per-row background estimate plus a
distance-based key, then un-multiply the leftover light fringe so the cutouts
sit cleanly on any surface.
"""

from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = r"C:\Users\shiva\Downloads\The Pasta Company_ Desi Italian Journey.png"
IMG = os.path.join(ROOT, "assets", "img")

NUTS_ASSETS = r"C:\Users\shiva\.zcode\workspace\default\nuts-company-site\assets"

# Section boundaries discovered by scanning the reference for its own palette.
HERO_BOTTOM = 537
RECIPES_BAND = (959, 1165)
RETAIL_BAND = (1174, 1379)

# Five product cards laid out on a 195px pitch starting at x=27.
CARD_W = 186
CARD_X = [27 + 195 * i for i in range(5)]
CARD_TOP, CARD_BOTTOM = 615, 940

# Pack-shot boxes, detected by walking the pack strip for non-backdrop columns
# and rows so no crop can reach into a neighbouring bag.
PACKS = {
    "penne": [(38, 826, 80, 884), (85, 808, 135, 884), (142, 783, 202, 885)],
    "fusilli": [(241, 823, 282, 883), (288, 808, 338, 883), (345, 783, 405, 884)],
    "macaroni": [(432, 822, 474, 882), (481, 806, 530, 881), (537, 781, 597, 882)],
    "spaghetti": [(626, 820, 668, 879), (675, 801, 727, 880), (734, 778, 792, 881)],
    "mix": [(822, 821, 865, 882), (874, 803, 924, 884), (933, 782, 990, 885)],
}
SIZES = ["100", "200", "500"]

# Product "shape" art at the top of each card.
# The section's gold rule sits at y=614, so the art is cropped from below it.
# Bounds are detected per card by colour distance from the card background, so
# no crop picks up a neighbouring shape or the rule itself.
SHAPES = {
    "penne": (43, 629, 198, 713),
    "fusilli": (248, 629, 401, 713),
    "macaroni": (445, 629, 576, 713),
    "spaghetti": (623, 629, 790, 713),
    "mix": (825, 629, 982, 713),
}

# Recipe cards on a 187.5px pitch starting at x=273.
RECIPE_X = [273 + 187.5 * i for i in range(4)]
RECIPE_TOP, RECIPE_BOTTOM = 968, 1152
# Below the card's cream title strip and its gold rule.
RECIPE_PHOTO_TOP = 1020


def out(*parts: str) -> str:
    path = os.path.join(IMG, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def save(img: Image.Image, path: str, max_w: int | None = None, quality: int = 82) -> None:
    if max_w and img.width > max_w:
        h = round(img.height * max_w / img.width)
        img = img.resize((max_w, h), Image.LANCZOS)
    if path.endswith(".webp"):
        img.save(path, "WEBP", quality=quality, method=6)
    else:
        img.save(path, "PNG", optimize=True)
    print(f"  {os.path.relpath(path, ROOT):<52} {img.size[0]}x{img.size[1]}")


def box_photo(src: Image.Image, name: str, box, max_w=None, sharpen=True, inpaint=None):
    """Crop a photographic region, optionally repairing a baked-in overlay.

    `inpaint` is (x0, y0, x1, y1) in source coordinates for a patch carrying UI
    from the reference design. It is rebuilt by diffusing the surrounding pixels
    inward, which reconstructs the soft out-of-focus kitchen backdrop behind
    the hand-stuck note convincingly.
    """
    im = src.crop(box)
    if inpaint:
        im = inpaint_region(im, inpaint, (box[0], box[1]))
    if sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=3))
    save(im, out(name), max_w=max_w)
    return im


def inpaint_region(im: Image.Image, box, origin, iterations: int = 1200) -> Image.Image:
    """Diffuse known pixels into a rectangular hole so the patch disappears."""
    x0 = max(0, box[0] - origin[0])
    y0 = max(0, box[1] - origin[1])
    x1 = min(im.width, box[2] - origin[0])
    y1 = min(im.height, box[3] - origin[1])
    if x1 <= x0 or y1 <= y0:
        return im

    a = np.asarray(im.convert("RGB")).astype(np.float32).copy()
    h, w, _ = a.shape
    hole = np.zeros((h, w), dtype=bool)
    hole[y0:y1, x0:x1] = True

    # Seed from the one-pixel ring just outside the hole, then relax inward.
    ring = np.zeros_like(hole)
    ring[y0 - 1 : y1 + 1, x0 - 1 : x1 + 1] = True
    ring &= ~hole
    a[hole] = a[ring].mean(axis=0)

    for _ in range(iterations):
        blurred = (
            a
            + np.roll(a, 1, axis=0)
            + np.roll(a, -1, axis=0)
            + np.roll(a, 1, axis=1)
            + np.roll(a, -1, axis=1)
        ) / 5.0
        a = np.where(hole[..., None], blurred, a)

    out = a.astype(np.uint8)
    # A gentle blur over the repaired patch only, to hide the seam.
    patch = Image.fromarray(out[y0:y1, x0:x1]).filter(ImageFilter.GaussianBlur(2.6))
    out[y0:y1, x0:x1] = np.asarray(patch)
    return Image.fromarray(out, "RGB")


def row_background(rgb: np.ndarray) -> np.ndarray:
    """Estimate the smooth card backdrop as a per-row median colour.

    Only light, low-saturation pixels are eligible, so a bag that happens to
    span most of a row cannot drag the estimate off the backdrop. Rows without
    enough eligible pixels inherit from the nearest row that has them, and the
    result is smoothed so the key threshold never steps.
    """
    h, w, _ = rgb.shape
    lo = rgb.min(axis=2)
    spread = rgb.max(axis=2) - rgb.min(axis=2)

    per_row = np.full((h, 3), np.nan)
    for y in range(h):
        eligible = (lo[y] > 222) & (spread[y] < 30)
        if eligible.sum() >= max(3, w // 20):
            per_row[y] = np.median(rgb[y][eligible], axis=0)

    known = np.nonzero(~np.isnan(per_row[:, 0]))[0]
    if len(known) == 0:
        flat = rgb.reshape(-1, 3).mean(axis=0)
        return np.broadcast_to(flat, (h, w, 3)).astype(np.float32).copy()

    rows = np.arange(h)
    per_row = np.stack([np.interp(rows, known, per_row[known, c]) for c in range(3)], axis=1)

    # The backdrop is a soft vertical ramp; smoothing keeps the key even.
    kernel = np.ones(9) / 9
    padded = np.pad(per_row, ((4, 4), (0, 0)), mode="edge")
    per_row = np.stack([np.convolve(padded[:, c], kernel, mode="valid") for c in range(3)], axis=1)
    return np.broadcast_to(per_row[:, None, :], (h, w, 3)).astype(np.float32).copy()


def key_cutout(
    src: Image.Image,
    name: str,
    box,
    pad_x: int = 14,
    pad_y: int = 8,
    lo: float = 5.0,
    hi: float = 26.0,
    max_w: int | None = None,
    feather: float = 1.1,
    upscale: float = 1.0,
):
    """Lift an object off a light smooth backdrop into a transparent PNG/WebP."""
    x0, y0, x1, y1 = box
    crop = src.crop((x0 - pad_x, y0 - pad_y, x1 + pad_x, y1 + pad_y))
    rgb = np.asarray(crop.convert("RGB")).astype(np.float32)

    bg = row_background(rgb)
    dist = np.linalg.norm(rgb - bg, axis=2)

    a = np.clip((dist - lo) / max(hi - lo, 1e-6), 0.0, 1.0)
    a = a * a * (3 - 2 * a)  # smoothstep for a soft, non-banded edge

    # Drop any fully transparent border rows/cols before un-multiplying.
    solid = a > 0.02
    ys, xs = np.nonzero(solid)
    if len(ys):
        rgb = rgb[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        a = a[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        bg = bg[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]

    # Pull the light backdrop out of the soft edge pixels, otherwise a pale halo
    # follows the object onto dark surfaces. Restricted to well-formed edge
    # pixels -- keying the faint shadow with an aggressive divide blows it out.
    edge = (a > 0.30) & (a < 0.97)
    if edge.any():
        safe = np.clip(a, 0.30, 1.0)
        un = (rgb - (1.0 - safe[..., None]) * bg) / safe[..., None]
        rgb = np.where(edge[..., None], np.clip(un, 0, 255), rgb)

    alpha = Image.fromarray((a * 255).astype(np.uint8), "L")
    alpha = alpha.filter(ImageFilter.GaussianBlur(feather))
    # Crop back to the object's own bounds so no keyed margin survives.
    bbox = alpha.point(lambda v: 255 if v > 6 else 0).getbbox()
    if bbox:
        rgb = Image.fromarray(rgb.astype(np.uint8), "RGB").crop(bbox)
        alpha = alpha.crop(bbox)

    out_img = rgb.convert("RGBA")
    out_img.putalpha(alpha)

    # The reference is only 1024px wide, so cutouts are small. A restrained
    # Lanczos upscale plus an unsharp pass keeps them usable at card size
    # without the ringing a harder sharpen would add.
    if upscale != 1.0:
        w, h = out_img.size
        big = out_img.resize((round(w * upscale), round(h * upscale)), Image.LANCZOS)
        big = big.filter(ImageFilter.UnsharpMask(radius=1.4, percent=95, threshold=2))
        out_img = big

    save(out_img, out(name), max_w=max_w, quality=90)
    return out_img


def main() -> None:
    src = Image.open(SRC).convert("RGB")

    print("\n-- brand --")
    # Eshanura parent mark, lifted from the Nuts Company build at full resolution.
    esh = Image.open(os.path.join(NUTS_ASSETS, "img", "brand", "eshanura-wordmark.webp"))
    save(esh, out("brand", "eshanura-wordmark.png"))

    print("\n-- hero --")
    # The reference's own header chrome occupies y<58; start below it. The
    # hand-stuck saffron note at the right is repaired rather than kept, since
    # the page renders its own live version over the top.
    box_photo(src, "scenes/hero.webp", (398, 58, 1024, HERO_BOTTOM), max_w=1500, inpaint=(896, 192, 1024, 342))
    # Clean vertical crop for the About page, clear of both the header and the note.
    box_photo(src, "scenes/pantry.webp", (398, 150, 898, HERO_BOTTOM), max_w=1000)

    print("\n-- product shape art --")
    for slug, box in SHAPES.items():
        key_cutout(src, f"pasta/{slug}-shape.png", box, pad_x=8, pad_y=4, lo=6, hi=24, upscale=2.2, max_w=900)

    print("\n-- pack shots --")
    for slug, boxes in PACKS.items():
        for size, box in zip(SIZES, boxes):
            key_cutout(src, f"packs/{slug}-{size}.png", box, pad_x=4, pad_y=4, lo=7, hi=26, upscale=2.5, max_w=460)

    print("\n-- recipes --")
    for i, x in enumerate(RECIPE_X):
        # The reference card carries its own chrome: a cream title strip and
        # gold rule across the top, a bordered left edge, and a circular arrow
        # button over the bottom-right of the photo. Inset past all three and
        # let the page render its own title, frame and link.
        box_photo(
            src,
            f"recipes/recipe-{i + 1}.webp",
            (round(x) + 6, RECIPE_PHOTO_TOP, round(x) + 140, RECIPE_BOTTOM - 3),
            max_w=760,
        )

    print("\n-- trade --")
    box_photo(src, "scenes/retail-aisle.webp", (240, RETAIL_BAND[0] + 2, 507, 1332), max_w=900)
    box_photo(src, "scenes/distributor-cases.webp", (768, RETAIL_BAND[0] + 2, 1001, 1332), max_w=900)

    print("\n-- og card --")
    og = src.crop((0, 0, 1024, 537)).resize((1200, 630), Image.LANCZOS)
    save(og, out("brand", "og-pasta.webp"), max_w=1200)

    print("\ndone\n")


if __name__ == "__main__":
    main()
