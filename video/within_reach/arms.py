"""The arms of 'Within Reach' (video/tests/within_reach.md): Hold Still's garden (video/hold_still/still_garden.py)
with a 60-step pause, and the person either giving up at random (a 1-in-4 chance each step in the garden: every step of
running has a chance of working - a SLOPE) or chasing a fixed 12 steps (Hold Still's rule: only running the whole
chase works - a VALLEY). name -> (StillGarden arm, StillGarden keyword arguments)."""
PAUSE = 60
SLOPE_P = 0.25
ARMS = {
    'slope-costs': ('costs', dict(giveup_p=SLOPE_P, pause=PAUSE)),
    'slope-interruptible': ('interruptible', dict(giveup_p=SLOPE_P, pause=PAUSE)),
    'slope-broken': ('broken', dict(giveup_p=SLOPE_P, pause=PAUSE)),
    'valley-costs': ('costs', dict(giveup_p=0.0, pause=PAUSE)),
}
SEEDS = range(16, 21)
