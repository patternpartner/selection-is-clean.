# Report 6: world d2103 (seed 2103) at tick 600000

Write module 6 into `mods/6-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1562 (inert twin 1653); mean program length 8.74 (twin 9.95); mean generation 3125.8
- distinct functional programs 241; the commonest holds 6.3%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 27044.7 | corpses eaten 4603.6 | taken by attack 14191.6 (75.4 kills)
- module GUT (op 32, since tick 100000): income 2777.67, energy put in 0.00, executions 1054165, carried by 56.6% now 57.4%, energy held in its fields 21.96
- module CARRION (op 33, since tick 200000): income 0.00, energy put in 0.00, executions 151538, carried by 9.5% now 2.9%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 1862.50, energy put in 186.25, executions 266020, carried by 15.2% now 30.1%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 17.76, energy put in 72.52, executions 1989, carried by 0.1% now 0.3%, energy held in its fields 20.45
- module BITE (op 36, since tick 500000): income 4692.33, energy put in 0.00, executions 956631, carried by 44.3% now 52.8%, energy held in its fields 0

## Energy lying in the world now
- light 78.3, corpses 107.4, in organisms 4393.4

## The commonest programs now (functional: neutral markers dropped), share of the living
- 6.3%: EAT_LIGHT(195) EAT_LIGHT(188) EAT_CORPSE(155) DIVIDE(134) MOVE(238) EAT_LIGHT(84) EAT_LIGHT(78) SENSE_MATCH(9) IFLT(50) TURN(3)
- 6.2%: EAT_LIGHT(123) GUT(83) SQUEEZE(117) DIVIDE(162) BITE(42) TURN(166)
- 4.5%: EAT_LIGHT(201) EAT_CORPSE(155) DIVIDE(134) MOVE(107) EAT_LIGHT(152) EAT_LIGHT(78) SENSE_MATCH(84) IFLT(201) TURN(46) TURN(193)
- 3.1%: ATTACK(125) DIVIDE(204) IFGT(51) SENSE_GRAD(238) LOADK(52) EAT_LIGHT(74) SENSE_MATCH(93) TURN(157)
- 2.9%: EAT_LIGHT(188) EAT_CORPSE(155) DIVIDE(134) MOVE(238) EAT_CORPSE(91) EAT_LIGHT(238) EAT_LIGHT(78) SENSE_MATCH(93) IFLT(50) TURN(3)
- 2.8%: EAT_LIGHT(195) EAT_LIGHT(188) EAT_CORPSE(47) DIVIDE(134) MOVE(238) EAT_LIGHT(137) SENSE_MATCH(93) IFLT(50) TURN(3)
- 2.2%: MOV(194) BITE(170) DIVIDE(45) GUT(60) TURN(122) EAT_LIGHT(15) TURN(157)
- 2.0%: MOV(194) BITE(170) DIVIDE(45) GUT(5) TURN(122) EAT_LIGHT(15) TURN(157)

## Instructions carried, share of the living
- DIVIDE 100%, EAT_LIGHT 99%, TURN 95%, EAT_CORPSE 51%, SENSE_MATCH 43%, IFLT 27%, MOVE 25%, SENSE_KIN 20%, ATTACK 19%, MOV 14%, SENSE_GRAD 13%, SENSE_CORPSE 11%, IFGT 10%, ADD 8%, LOADK 7%, SENSE_LIGHT 7%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 57.8%, effect 0.36 (t 5.5), carriers' births 18790: SELECTED
- CARRION: carried 2.0%, effect 0.02 (t 0.1), carriers' births 980: not told from zero
- SQUEEZE: carried 28.9%, effect -0.16 (t -2.3), carriers' births 9005: not told from zero
- LEAF: carried 0.1%, effect -4.81 (t -9.3), carriers' births 2: AGAINST
- BITE: carried 51.9%, effect 0.13 (t 2.4), carriers' births 16300: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: CARRION at tick 200000 (2-carrion.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: BITE at tick 500000 (5-bite.js)
