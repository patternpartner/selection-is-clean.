# Report 5: world d2102 (seed 2102) at tick 500000

Write module 5 into `mods/5-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1640 (inert twin 1603); mean program length 9.07 (twin 12.02); mean generation 2970.5
- distinct functional programs 281; the commonest holds 7.3%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26821.0 | corpses eaten 4715.2 | taken by attack 15464.0 (75.9 kills)
- module FAT (op 32, since tick 100000): income 1880.24, energy put in 1918.97, executions 102157, carried by 7.3% now 10.1%, energy held in its fields 0
- module GUT (op 33, since tick 200000): income 2244.57, energy put in 0.00, executions 994349, carried by 49.5% now 64.8%, energy held in its fields 55.01
- module BITE (op 34, since tick 300000): income 5421.77, energy put in 0.00, executions 875214, carried by 45.1% now 23.4%, energy held in its fields 0
- module SQUEEZE (op 35, since tick 400000): income 3459.37, energy put in 345.94, executions 485792, carried by 28.6% now 24.5%, energy held in its fields 0

## Energy lying in the world now
- light 91.2, corpses 480.9, in organisms 11507.2

## The commonest programs now (functional: neutral markers dropped), share of the living
- 7.3%: SENSE_KIN(29) EAT_CORPSE(252) EAT_LIGHT(101) EAT_LIGHT(1) EAT_LIGHT(40) EAT_CORPSE(173) DIVIDE(8) IFLT(186) TURN(83) MOVE(195)
- 4.2%: DIVIDE(33) BITE(229) GUT(169) GUT(239) TURN(225) EAT_LIGHT(98)
- 3.1%: DIVIDE(33) BITE(202) GUT(239) TURN(225) EAT_LIGHT(98) SENSE_AHEAD(147) GUT(67)
- 2.9%: DIVIDE(43) SENSE_E(118) TURN(65) EAT_LIGHT(13) GUT(67) SENSE_GRAD(7) DIVIDE(148) BITE(163)
- 2.4%: SENSE_KIN(240) EAT_LIGHT(249) EAT_LIGHT(201) EAT_LIGHT(1) EAT_CORPSE(192) DIVIDE(0) IFLT(137) TURN(197) MOVE(127)
- 2.3%: SENSE_KIN(92) EAT_LIGHT(18) EAT_CORPSE(23) EAT_LIGHT(40) EAT_LIGHT(148) DIVIDE(158) IFLT(251) TURN(121) MOVE(196)
- 2.3%: DIVIDE(102) BITE(233) GUT(169) TURN(225) EAT_LIGHT(98) GUT(67)
- 1.8%: SENSE_KIN(92) EAT_LIGHT(18) EAT_LIGHT(210) EAT_CORPSE(23) EAT_LIGHT(40) EAT_LIGHT(148) DIVIDE(158) IFLT(251) TURN(121) MOVE(196)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 98%, TURN 74%, EAT_CORPSE 56%, SENSE_E 25%, IFLT 25%, SENSE_GRAD 25%, MOVE 22%, SENSE_KIN 21%, SENSE_AHEAD 13%, LOADK 13%, ATTACK 12%, SUB 12%, SENSE_CORPSE 9%, IFGT 8%, MUL 8%, JMP 7%, MOV 6%, SENSE_MATCH 5%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 9.9%, effect -0.26 (t -2.0), carriers' births 3381: AGAINST
- GUT: carried 63.8%, effect 0.30 (t 4.7), carriers' births 23469: SELECTED
- BITE: carried 23.7%, effect 0.18 (t 1.9), carriers' births 9047: not told from zero
- SQUEEZE: carried 25.1%, effect 0.21 (t 2.7), carriers' births 8530: SELECTED

## Modules so far
- 1: FAT at tick 100000 (1-fat.js)
- 2: GUT at tick 200000 (2-gut.js)
- 3: BITE at tick 300000 (3-bite.js)
- 4: SQUEEZE at tick 400000 (4-squeeze.js)
