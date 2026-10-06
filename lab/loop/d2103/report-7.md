# Report 7: world d2103 (seed 2103) at tick 700000

Write module 7 into `mods/7-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1938 (inert twin 1604); mean program length 7.83 (twin 9.96); mean generation 3678.1
- distinct functional programs 412; the commonest holds 4.7%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 12579.2 | corpses eaten 2164.0 | taken by attack 16576.5 (68.9 kills)
- module GUT (op 32, since tick 100000): income 2681.31, energy put in 0.00, executions 1623279, carried by 69.5% now 77.0%, energy held in its fields 76.77
- module CARRION (op 33, since tick 200000): income 0.00, energy put in 0.00, executions 49268, carried by 2.7% now 0.5%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 5240.80, energy put in 524.08, executions 701754, carried by 33.4% now 31.1%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 3.81, energy put in 57.13, executions 1183, carried by 0.1% now 0.0%, energy held in its fields 0
- module BITE (op 36, since tick 500000): income 7770.66, energy put in 0.00, executions 1424770, carried by 59.3% now 63.3%, energy held in its fields 0
- module STRETCH (op 37, since tick 600000): income 15963.22, energy put in 0.00, executions 3557498, carried by 91.5% now 99.1%, energy held in its fields 0

## Energy lying in the world now
- light 40.2, corpses 318.5, in organisms 6290.1

## The commonest programs now (functional: neutral markers dropped), share of the living
- 4.7%: IFLT(114) EAT_LIGHT(216) STRETCH(94) STRETCH(93) GUT(219) SQUEEZE(222) DIVIDE(101) TURN(121)
- 4.2%: EAT_LIGHT(3) STRETCH(198) STRETCH(148) DIVIDE(91) GUT(136) TURN(101) BITE(66)
- 3.7%: EAT_LIGHT(3) STRETCH(195) STRETCH(148) DIVIDE(91) BITE(159) GUT(136) TURN(101)
- 2.1%: STRETCH(140) DIVIDE(91) GUT(95) TURN(101) BITE(66)
- 1.9%: EAT_LIGHT(221) STRETCH(32) EAT_CORPSE(74) EAT_CORPSE(11) DIVIDE(135) MOVE(116) STRETCH(47) SENSE_MATCH(70) IFLT(50) TURN(3) EAT_LIGHT(73)
- 1.9%: SQUEEZE(104) STRETCH(224) EAT_LIGHT(3) STRETCH(92) DIVIDE(91) GUT(221) SENSE_MATCH(86) BITE(126) TURN(171)
- 1.8%: EAT_LIGHT(3) STRETCH(129) ATTACK(201) STRETCH(53) DIVIDE(91) TURN(171)
- 1.7%: EAT_LIGHT(3) STRETCH(160) STRETCH(11) STRETCH(188) TURN(44) BITE(84) STRETCH(201) DIVIDE(230) TURN(99) GUT(95)

## Instructions carried, share of the living
- DIVIDE 99%, TURN 98%, EAT_LIGHT 90%, SENSE_MATCH 16%, IFLT 12%, ATTACK 11%, EAT_CORPSE 8%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 77.1%, effect 0.70 (t 29.1), carriers' births 31501: SELECTED
- CARRION: carried 0.4%, effect -0.32 (t -0.7), carriers' births 177: not told from zero
- SQUEEZE: carried 28.7%, effect 0.18 (t 3.3), carriers' births 12165: not told from zero
- LEAF: carried 0.0%, effect -10.73 (t -6.8), carriers' births 1: AGAINST
- BITE: carried 64.1%, effect 0.53 (t 15.2), carriers' births 24967: SELECTED
- STRETCH: carried 99.3%, effect 0.49 (t 2.4), carriers' births 40277: SELECTED

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: CARRION at tick 200000 (2-carrion.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: BITE at tick 500000 (5-bite.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
