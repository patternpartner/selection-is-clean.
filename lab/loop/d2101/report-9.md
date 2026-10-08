# Report 9: world d2101 (seed 2101) at tick 900000

Write module 9 into `mods/9-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1510 (inert twin 1478); mean program length 8.59 (twin 8.16); mean generation 4678.6
- distinct functional programs 315; the commonest holds 6.0%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 9660.0 | corpses eaten 723.8 | taken by attack 1400.5 (10.1 kills)
- module GUT (op 32, since tick 100000): income 1850.92, energy put in 0.00, executions 1578352, carried by 74.3% now 69.2%, energy held in its fields 19.54
- module BITE (op 33, since tick 200000): income 3613.77, energy put in 0.00, executions 1248835, carried by 57.0% now 63.7%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 1199.74, energy put in 119.97, executions 306369, carried by 17.0% now 10.6%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 836.67, energy put in 708.36, executions 8313, carried by 7.3% now 8.9%, energy held in its fields 27.58
- module GRAZE (op 36, since tick 500000): income 491.72, energy put in 0.00, executions 350264, carried by 17.9% now 27.4%, energy held in its fields 11.64
- module STRETCH (op 37, since tick 600000): income 18337.15, energy put in 0.00, executions 3880033, carried by 99.3% now 99.9%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 19215.11, energy put in 28822.67, executions 803945, carried by 37.0% now 37.1%, energy held in its fields 0
- module FAT (op 39, since tick 800000): income 7.93, energy put in 24.61, executions 12875, carried by 0.7% now 0.9%, energy held in its fields 0

## Energy lying in the world now
- light 48.1, corpses 61.9, in organisms 1756.2

## The commonest programs now (functional: neutral markers dropped), share of the living
- 6.0%: SENSE_GRAD(139) IFGT(222) LEAF(247) EAT_LIGHT(252) STRETCH(18) MOVE(28) MAUL(54) EAT_CORPSE(121) EAT_CORPSE(47) EAT_LIGHT(56) GRAZE(152) SENSE_MATCH(229) GRAZE(206) DIVIDE(118) IFLT(162) TURN(221)
- 3.4%: STRETCH(65) TURN(205) STRETCH(168) DIVIDE(122) GUT(102) BITE(146)
- 2.8%: STRETCH(188) TURN(45) STRETCH(42) EAT_LIGHT(64) SENSE_MATCH(201) GRAZE(59) DIVIDE(228) GUT(52) BITE(62)
- 2.8%: EAT_LIGHT(33) STRETCH(150) TURN(205) DIVIDE(149) DIVIDE(94) GUT(102) SQUEEZE(64) BITE(146)
- 2.5%: IFGT(77) STRETCH(93) TURN(205) STRETCH(179) DIVIDE(14) GUT(102) EAT_LIGHT(59) BITE(146)
- 2.5%: STRETCH(93) TURN(205) STRETCH(168) DIVIDE(122) GUT(222) EAT_LIGHT(59) BITE(146) STRETCH(154)
- 2.5%: STRETCH(188) TURN(45) STRETCH(182) EAT_LIGHT(64) SENSE_GRAD(201) DIVIDE(228) GUT(35) BITE(113)
- 2.1%: MAUL(230) STRETCH(225) TURN(205) STRETCH(168) DIVIDE(85) GUT(171) EAT_LIGHT(55) MAUL(94) BITE(146)

## Instructions carried, share of the living
- DIVIDE 99%, TURN 98%, EAT_LIGHT 87%, SENSE_MATCH 18%, SENSE_GRAD 15%, IFGT 12%, IFLT 10%, EAT_CORPSE 10%, MOVE 9%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 69.8%, effect 0.78 (t 17.7), carriers' births 21761: SELECTED
- BITE: carried 65.7%, effect 0.32 (t 6.0), carriers' births 19687: SELECTED
- SQUEEZE: carried 11.4%, effect 0.24 (t 2.0), carriers' births 3724: not told from zero
- LEAF: carried 9.1%, effect 0.23 (t 4.8), carriers' births 3455: SELECTED
- GRAZE: carried 24.0%, effect -0.06 (t -1.1), carriers' births 8411: not told from zero
- STRETCH: carried 99.8%, effect 2.48 (t 3.9), carriers' births 30978: SELECTED
- MAUL: carried 40.2%, effect 0.10 (t 2.1), carriers' births 12658: not told from zero
- FAT: carried 0.2%, effect 0.00 (t 0.0), carriers' births 300: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: BITE at tick 200000 (2-bite.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: GRAZE at tick 500000 (5-graze.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
- 7: MAUL at tick 700000 (7-maul.js)
- 8: FAT at tick 800000 (8-fat.js)
