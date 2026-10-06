# Report 4: world d2102 (seed 2102) at tick 400000

Write module 4 into `mods/4-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1636 (inert twin 1586); mean program length 8.83 (twin 10.55); mean generation 2478.3
- distinct functional programs 318; the commonest holds 9.5%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26086.3 | corpses eaten 3490.8 | taken by attack 11660.1 (92.6 kills)
- module FAT (op 32, since tick 100000): income 505.42, energy put in 539.75, executions 45630, carried by 2.6% now 2.4%, energy held in its fields 0
- module GUT (op 33, since tick 200000): income 4264.10, energy put in 0.00, executions 1305928, carried by 73.9% now 59.4%, energy held in its fields 63.63
- module BITE (op 34, since tick 300000): income 9138.55, energy put in 0.00, executions 1341075, carried by 69.8% now 70.4%, energy held in its fields 0

## Energy lying in the world now
- light 77.4, corpses 101.2, in organisms 5227.4

## The commonest programs now (functional: neutral markers dropped), share of the living
- 9.5%: SENSE_KIN(92) EAT_LIGHT(201) EAT_LIGHT(1) EAT_CORPSE(249) EAT_LIGHT(40) EAT_LIGHT(236) DIVIDE(215) IFLT(137) TURN(121) MOVE(49)
- 3.3%: SENSE_KIN(92) EAT_LIGHT(201) EAT_CORPSE(249) EAT_LIGHT(40) EAT_LIGHT(236) DIVIDE(164) IFLT(137) TURN(121) MOVE(49)
- 3.1%: GUT(58) DIVIDE(102) LOADK(112) SENSE_GRAD(86) BITE(180) MOV(29) TURN(129) EAT_LIGHT(105)
- 3.1%: BITE(75) DIVIDE(102) ADD(5) BITE(129) GUT(113) TURN(177) EAT_LIGHT(98) IFLT(107) GUT(83)
- 2.6%: SUB(196) EAT_LIGHT(177) DIVIDE(145) MUL(7) BITE(134) GUT(218) TURN(230)
- 2.5%: EAT_LIGHT(24) DIVIDE(135) EAT_CORPSE(239) TURN(94) SENSE_CORPSE(170)
- 2.4%: EAT_LIGHT(177) DIVIDE(102) GUT(140) TURN(65) BITE(140) GUT(158)
- 2.1%: SENSE_AHEAD(193) DIVIDE(240) TURN(165) ATTACK(1) BITE(180) TURN(177) EAT_LIGHT(126)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 99%, TURN 97%, EAT_CORPSE 34%, IFLT 29%, SUB 22%, SENSE_KIN 22%, MOVE 21%, ATTACK 17%, MUL 13%, ADD 12%, SENSE_AHEAD 12%, LOADK 11%, SENSE_CORPSE 10%, SENSE_GRAD 9%, IFGT 8%, MOV 7%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 4.7%, effect 0.14 (t 0.6), carriers' births 1183: not told from zero
- GUT: carried 61.7%, effect 0.68 (t 12.2), carriers' births 20782: SELECTED
- BITE: carried 72.1%, effect 0.17 (t 6.1), carriers' births 24838: SELECTED

## Modules so far
- 1: FAT at tick 100000 (1-fat.js)
- 2: GUT at tick 200000 (2-gut.js)
- 3: BITE at tick 300000 (3-bite.js)
