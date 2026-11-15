"""Convert the rendered slide PNGs to WebP (q 82) and drop the PNGs."""
import pathlib
from PIL import Image
for png in sorted((pathlib.Path(__file__).resolve().parent.parent / 'assets').glob('slide*.png')):
    out = png.with_suffix('.webp'); Image.open(png).convert('RGB').save(out, 'WEBP', quality=82, method=6); png.unlink()
    print(out.name, out.stat().st_size // 1024, 'KB')
