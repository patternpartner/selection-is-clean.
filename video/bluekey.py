"""Blue-screen key for the user's own-likeness clips (u113-u117, Grok, 720x1280, a clean even blue ~ (15, 90, 245)).
key(rgb float 0..255) -> (rgb with the blue spill taken off the edges, alpha 0..1). The dark-navy jeans are the risk:
they are blue-ish but DARK, so 'blueness' is measured against brightness too - a pixel keys out only if it is
strongly blue AND bright like the backdrop AND nearly red-free (a grey shirt lit blue in the close-ups
stays). Tested on u113-u117: jeans, shirt, glasses and hair hold."""
import numpy as np
from scipy.ndimage import gaussian_filter, binary_erosion


def key(rgb, lo=45.0, hi=95.0):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    blueness = b - np.maximum(r, g * 0.9)                 # the backdrop: b - max(r, g) ~ 150
    bright = np.clip((b - 120) / 60, 0, 1)                # ...and it is bright; navy denim is not
    dark_red = np.clip((110 - r) / 60, 0, 1)             # the backdrop has almost no red (r ~ 1); a blue-lit grey shirt has plenty
    score = blueness * bright * dark_red
    alpha = 1 - np.clip((score - lo) / (hi - lo), 0, 1)
    alpha = gaussian_filter(alpha, 0.8)
    out = rgb.copy()
    lim = np.maximum(r, g) * 1.02 + 6                      # spill: no pixel bluer than its own red/green allows
    edge = (alpha > 0.02) & (alpha < 0.98)
    out[..., 2] = np.where(edge | (alpha > 0.5), np.minimum(b, lim), b)
    return out, alpha
