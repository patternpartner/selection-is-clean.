# Report 6: world d2102 (seed 2102) at tick 600000

Write module 6 into `mods/6-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1569 (inert twin 1613); mean program length 9.73 (twin 13.87); mean generation 3497.8
- distinct functional programs 257; the commonest holds 7.2%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26587.5 | corpses eaten 4814.5 | taken by attack 13546.7 (79.6 kills)
- module FAT (op 32, since tick 100000): income 350.79, energy put in 388.77, executions 37067, carried by 3.0% now 2.7%, energy held in its fields 0
- module GUT (op 33, since tick 200000): income 2495.84, energy put in 0.00, executions 1082762, carried by 58.1% now 47.3%, energy held in its fields 10.25
- module BITE (op 34, since tick 300000): income 6992.99, energy put in 0.00, executions 1039159, carried by 50.7% now 44.9%, energy held in its fields 0
- module SQUEEZE (op 35, since tick 400000): income 2806.02, energy put in 280.60, executions 365677, carried by 23.4% now 20.0%, energy held in its fields 0
- module LEAF (op 36, since tick 500000): income 19.94, energy put in 78.58, executions 1913, carried by 0.1% now 0.1%, energy held in its fields 21.71

## Energy lying in the world now
- light 77.2, corpses 78.5, in organisms 4047

## The commonest programs now (functional: neutral markers dropped), share of the living
- 7.2%: SENSE_KIN(29) EAT_LIGHT(101) EAT_LIGHT(74) EAT_LIGHT(40) EAT_CORPSE(129) DIVIDE(8) IFLT(202) TURN(163) EAT_LIGHT(182) MOVE(196)
- 4.1%: SENSE_KIN(29) EAT_LIGHT(27) EAT_LIGHT(74) EAT_LIGHT(136) EAT_CORPSE(129) DIVIDE(8) IFLT(202) TURN(69) EAT_LIGHT(182) MOVE(196)
- 2.9%: EAT_LIGHT(101) EAT_LIGHT(126) EAT_LIGHT(191) EAT_CORPSE(129) DIVIDE(12) IFLT(114) TURN(163) EAT_LIGHT(182) RAND(196)
- 2.9%: DIVIDE(220) BITE(214) DIVIDE(109) EAT_LIGHT(41) ADD(146) LOADK(153) GUT(95) BITE(32) SUB(42) TURN(225) SQUEEZE(167) TURN(25)
- 2.6%: ATTACK(169) BITE(210) EAT_LIGHT(41) DIVIDE(146) SENSE_CORPSE(3) TURN(25)
- 2.5%: SENSE_KIN(29) EAT_LIGHT(74) EAT_LIGHT(40) EAT_CORPSE(129) DIVIDE(8) IFLT(30) TURN(163) EAT_LIGHT(182) MOVE(196)
- 2.2%: DIVIDE(243) ATTACK(239) TURN(210) EAT_CORPSE(112) SENSE_GRAD(90) SENSE_LIGHT(26) BITE(197) TURN(225) EAT_LIGHT(133)
- 1.9%: EAT_LIGHT(208) GUT(171) SQUEEZE(129) EAT_LIGHT(192) ATTACK(66) DIVIDE(228) TURN(135)

## Instructions carried, share of the living
- DIVIDE 100%, EAT_LIGHT 99%, TURN 91%, EAT_CORPSE 69%, IFLT 39%, ADD 34%, SENSE_KIN 29%, MOVE 27%, RAND 22%, SUB 18%, ATTACK 18%, SENSE_GRAD 14%, SENSE_LIGHT 13%, LOADK 9%, IFGT 7%, SENSE_CORPSE 6%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 2.2%, effect 0.09 (t 0.2), carriers' births 430: not told from zero
- GUT: carried 46.9%, effect 0.33 (t 6.2), carriers' births 14978: SELECTED
- BITE: carried 44.2%, effect 0.18 (t 4.0), carriers' births 15281: SELECTED
- SQUEEZE: carried 19.8%, effect 0.01 (t 0.2), carriers' births 5946: not told from zero
- LEAF: carried 0.1%, effect -3.67 (t -7.5), carriers' births 3: AGAINST

## Modules so far
- 1: FAT at tick 100000 (1-fat.js)
- 2: GUT at tick 200000 (2-gut.js)
- 3: BITE at tick 300000 (3-bite.js)
- 4: SQUEEZE at tick 400000 (4-squeeze.js)
- 5: LEAF at tick 500000 (5-leaf.js)
