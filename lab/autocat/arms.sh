# sourced: arm option strings (Phase A, trial seeds only)
V2='"CHEM":1,"NICHE":2,"NICHE_R":2,"NICHE_COPY":1,"NICHE_OPEN":1,"NICHE_OPEN_P":0.125,"NICHE_OPEN_CAP":2,"NICHE_GC":1'
W1="$V2,\"NICHE_XCOST\":0.1,\"NICHE_BCOST\":0.3,\"NICHE_BLD\":1,\"NICHE_UP\":1,\"NICHE_UCOST\":0.05"   # niche-v3 W1 = skin S0
S2="$W1,\"NICHE_SKIN\":1,\"NICHE_SKIN_REGROW\":1,\"NICHE_PERM\":1"                                   # skin S2 (leaky evolving skin)
