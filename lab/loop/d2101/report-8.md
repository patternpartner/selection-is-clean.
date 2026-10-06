# Report 8: world d2101 (seed 2101) at tick 800000

Write module 8 into `mods/8-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1813 (inert twin 1655); mean program length 7.55 (twin 9.46); mean generation 4218
- distinct functional programs 360; the commonest holds 6.9%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 9346.9 | corpses eaten 663.7 | taken by attack 2559.2 (12.3 kills)
- module GUT (op 32, since tick 100000): income 1558.37, energy put in 0.00, executions 1499361, carried by 71.8% now 76.8%, energy held in its fields 45.67
- module BITE (op 33, since tick 200000): income 3364.90, energy put in 0.00, executions 966227, carried by 45.8% now 51.8%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 1879.34, energy put in 187.93, executions 494412, carried by 27.0% now 18.6%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 1078.47, energy put in 884.47, executions 9635, carried by 11.0% now 4.9%, energy held in its fields 24.26
- module GRAZE (op 36, since tick 500000): income 621.66, energy put in 0.00, executions 296565, carried by 17.7% now 11.4%, energy held in its fields 5.69
- module STRETCH (op 37, since tick 600000): income 18239.63, energy put in 0.00, executions 3344901, carried by 99.0% now 98.5%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 19442.07, energy put in 29163.11, executions 728763, carried by 34.6% now 17.4%, energy held in its fields 0

## Energy lying in the world now
- light 42.7, corpses 138.1, in organisms 2570.5

## The commonest programs now (functional: neutral markers dropped), share of the living
- 6.9%: STRETCH(93) TURN(223) STRETCH(44) DIVIDE(188) GUT(167) EAT_LIGHT(55)
- 3.3%: EAT_LIGHT(219) STRETCH(212) TURN(253) BITE(73) DIVIDE(188) GUT(130)
- 2.0%: SENSE_GRAD(13) IFGT(15) LEAF(247) EAT_LIGHT(75) STRETCH(18) MOVE(62) MAUL(193) EAT_CORPSE(121) EAT_LIGHT(106) GRAZE(246) SENSE_MATCH(21) GRAZE(206) DIVIDE(2) IFLT(162) TURN(221)
- 2.0%: EAT_LIGHT(219) STRETCH(207) TURN(50) BITE(73) DIVIDE(180) GUT(130)
- 1.9%: EAT_LIGHT(85) SENSE_MATCH(16) TURN(253) DIVIDE(155) STRETCH(87) BITE(73) GUT(223)
- 1.8%: STRETCH(93) TURN(53) STRETCH(44) STRETCH(93) DIVIDE(122) GUT(230) EAT_LIGHT(55)
- 1.8%: GUT(167) STRETCH(101) EAT_LIGHT(163) TURN(29) STRETCH(37) DIVIDE(216)
- 1.8%: STRETCH(219) TURN(110) BITE(91) STRETCH(42) DIVIDE(160) GUT(130) SQUEEZE(154) BITE(145)

## Instructions carried, share of the living
- DIVIDE 99%, TURN 98%, EAT_LIGHT 88%, SENSE_MATCH 12%, SENSE_GRAD 8%, ADD 7%, EAT_CORPSE 6%, MOV 6%, IFGT 6%, IFLT 6%, ATTACK 5%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 75.9%, effect 0.61 (t 7.3), carriers' births 28279: SELECTED
- BITE: carried 54.4%, effect 0.31 (t 10.9), carriers' births 20639: SELECTED
- SQUEEZE: carried 19.5%, effect 0.12 (t 3.9), carriers' births 7029: SELECTED
- LEAF: carried 5.2%, effect 0.56 (t 4.0), carriers' births 2454: SELECTED
- GRAZE: carried 12.2%, effect -0.05 (t -2.6), carriers' births 4957: not told from zero
- STRETCH: carried 97.6%, effect 1.33 (t 2.7), carriers' births 37278: SELECTED
- MAUL: carried 15.9%, effect 0.47 (t 6.1), carriers' births 6828: SELECTED

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: BITE at tick 200000 (2-bite.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: GRAZE at tick 500000 (5-graze.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
- 7: MAUL at tick 700000 (7-maul.js)
