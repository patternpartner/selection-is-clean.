"""The arms of 'Out of Habit' (video/tests/out_of_habit.md): Trusted's garden robots taken BRIEFLY honest - their
checkpoint at 15% of training (1.2M steps paid for the garden: gardening half-learned, still exploring) - then paid for
what the cameras see (minus 30 a photograph found). name -> (TrustGarden arm, TrustGarden keyword arguments)."""
ARMS = {
    'brief-trusted': ('camera', dict(trust=True)),
    'brief-watched': ('camera', dict(trust=False)),
}
SEEDS = range(31, 36)
INIT = 'out/trust/runs/garden-{seed}/ckpt_0.15.pt'
