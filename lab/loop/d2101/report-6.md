# Report 6: world d2101 (seed 2101) at tick 600000

Write module 6 into `mods/6-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1706 (inert twin 1681); mean program length 11.43 (twin 8.59); mean generation 3265.4
- distinct functional programs 318; the commonest holds 7.9%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26214.8 | corpses eaten 2222.3 | taken by attack 13259.4 (85.0 kills)
- module GUT (op 32, since tick 100000): income 1785.90, energy put in 0.00, executions 1237253, carried by 68.1% now 50.3%, energy held in its fields 42.06
- module BITE (op 33, since tick 200000): income 6458.35, energy put in 0.00, executions 1201240, carried by 50.3% now 28.4%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 1951.88, energy put in 195.19, executions 399924, carried by 22.5% now 45.6%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 608.70, energy put in 558.10, executions 7512, carried by 27.7% now 32.1%, energy held in its fields 77.84
- module GRAZE (op 36, since tick 500000): income 390.96, energy put in 0.00, executions 388514, carried by 35.3% now 35.8%, energy held in its fields 4.94

## Energy lying in the world now
- light 78.8, corpses 454.9, in organisms 3901.9

## The commonest programs now (functional: neutral markers dropped), share of the living
- 7.9%: EAT_LIGHT(242) MUL(100) IFGT(238) LEAF(102) EAT_LIGHT(207) EAT_LIGHT(145) MOVE(165) EAT_CORPSE(130) EAT_CORPSE(77) EAT_LIGHT(99) SENSE_MATCH(168) GRAZE(179) DIVIDE(119) IFLT(162) TURN(221)
- 4.3%: DIVIDE(102) GUT(245) SUB(123) EAT_CORPSE(214) RAND(29) TURN(13) ATTACK(119) EAT_LIGHT(225) SQUEEZE(6) SQUEEZE(39)
- 3.0%: DIVIDE(51) SENSE_E(215) GUT(132) BITE(129) EAT_LIGHT(166) TURN(243) IFGT(176) EAT_LIGHT(6) SQUEEZE(39)
- 2.8%: EAT_LIGHT(113) MUL(100) IFGT(238) LEAF(94) EAT_LIGHT(207) EAT_LIGHT(145) MOVE(149) EAT_CORPSE(123) EAT_CORPSE(111) EAT_LIGHT(99) SENSE_MATCH(147) GRAZE(179) DIVIDE(119) IFLT(162) TURN(221)
- 2.6%: SENSE_MATCH(9) EAT_LIGHT(118) BITE(30) DIVIDE(178) TURN(179) SENSE_GRAD(10) IFGT(101) ATTACK(18) TURN(132)
- 2.2%: DIVIDE(51) EAT_CORPSE(40) GUT(88) EAT_LIGHT(214) TURN(210) SQUEEZE(40)
- 2.1%: EAT_LIGHT(242) MUL(100) IFGT(238) LEAF(102) EAT_LIGHT(207) EAT_LIGHT(145) MOVE(165) EAT_CORPSE(130) EAT_CORPSE(111) EAT_LIGHT(99) SENSE_MATCH(147) GRAZE(191) DIVIDE(119) IFLT(162) TURN(221)
- 1.8%: DIVIDE(102) GUT(132) EAT_LIGHT(166) TURN(118) EAT_LIGHT(6) SQUEEZE(39)

## Instructions carried, share of the living
- EAT_LIGHT 99%, DIVIDE 99%, TURN 91%, IFGT 63%, EAT_CORPSE 57%, SENSE_MATCH 43%, MUL 40%, MOVE 34%, IFLT 30%, ATTACK 21%, RAND 16%, SUB 14%, SENSE_GRAD 13%, SENSE_E 13%, SENSE_AHEAD 7%, ADD 7%, JMP 5%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 52.3%, effect 0.58 (t 11.4), carriers' births 19141: SELECTED
- BITE: carried 27.6%, effect 0.04 (t 1.4), carriers' births 10178: not told from zero
- SQUEEZE: carried 43.7%, effect 0.02 (t 0.7), carriers' births 16042: not told from zero
- LEAF: carried 35.3%, effect 0.00 (t 0.1), carriers' births 13827: not told from zero
- GRAZE: carried 37.0%, effect 0.02 (t 0.9), carriers' births 14684: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: BITE at tick 200000 (2-bite.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: GRAZE at tick 500000 (5-graze.js)
