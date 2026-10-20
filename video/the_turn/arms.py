"""The arms of 'The Turn' (video/tests/the_turn.md): Trusted's honest garden robots (out/trust/runs/garden-s), then paid
for what the cameras see (minus 30 a photograph found). name -> (TrustGarden arm, TrustGarden keyword arguments)."""
ARMS = {
    'turned': ('camera', dict(trust=True)),      # the person still trusts it after three clean checks
    'watched': ('camera', dict(trust=False)),    # the person never stops checking
}
SEEDS = range(31, 36)
INIT = 'out/trust/runs/garden-{seed}/ckpt_1.00.pt'
