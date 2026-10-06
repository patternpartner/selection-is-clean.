# Report 3: world d2102 (seed 2102) at tick 300000

Write module 3 into `mods/3-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1582 (inert twin 1671); mean program length 10.69 (twin 9.96); mean generation 1945.4
- distinct functional programs 302; the commonest holds 4.7%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 25406.5 | corpses eaten 3834.8 | taken by attack 15211.2 (108.8 kills)
- module FAT (op 32, since tick 100000): income 374.05, energy put in 403.64, executions 77552, carried by 5.6% now 8.4%, energy held in its fields 16.67
- module GUT (op 33, since tick 200000): income 5206.10, energy put in 0.00, executions 1072393, carried by 53.2% now 88.4%, energy held in its fields 206.37

## Energy lying in the world now
- light 89.7, corpses 75.5, in organisms 3538.8

## The commonest programs now (functional: neutral markers dropped), share of the living
- 4.7%: EAT_CORPSE(127) SUB(250) TURN(126) EAT_LIGHT(202) RAND(75) EAT_LIGHT(69) DIVIDE(110) GUT(71) TURN(35) EAT_LIGHT(42) MOVE(87) GUT(40)
- 3.6%: GUT(76) EAT_LIGHT(140) DIVIDE(253) EAT_CORPSE(10)
- 3.4%: EAT_LIGHT(86) EAT_LIGHT(211) FAT(254) DIVIDE(110) GUT(56) MOV(82) TURN(35) EAT_LIGHT(135) SENSE_GRAD(199)
- 3.2%: TURN(118) EAT_LIGHT(211) IFGT(15) DIVIDE(110) GUT(177) MOV(216) TURN(35) EAT_LIGHT(251) EAT_LIGHT(23) EAT_LIGHT(42) EAT_CORPSE(118) JMP(87) EAT_LIGHT(110)
- 3.0%: TURN(126) EAT_LIGHT(202) SENSE_CORPSE(4) RAND(75) MUL(69) EAT_CORPSE(239) EAT_LIGHT(229) DIVIDE(110) TURN(123) EAT_LIGHT(42) MOVE(87)
- 2.4%: DIVIDE(170) SENSE_GRAD(122) GUT(199) TURN(177) SENSE_E(190) LOADK(17) EAT_LIGHT(200) ATTACK(126)
- 2.3%: EAT_LIGHT(177) DIVIDE(102) IFLT(162) SENSE_GRAD(119) GUT(90) SENSE_GRAD(228) TURN(177) EAT_LIGHT(227) SENSE_GRAD(196)
- 2.1%: TURN(126) EAT_LIGHT(202) EAT_LIGHT(221) EAT_CORPSE(249) DIVIDE(110) GUT(71) TURN(35) EAT_LIGHT(42) MOVE(87)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 99%, TURN 83%, EAT_CORPSE 59%, MOVE 35%, RAND 30%, SENSE_CORPSE 26%, MOV 25%, SENSE_GRAD 23%, SUB 19%, ATTACK 19%, SENSE_E 18%, SENSE_MATCH 12%, SENSE_LIGHT 11%, IFLT 11%, LOADK 9%, MUL 8%, IFGT 7%, SENSE_KIN 6%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 8.4%, effect -0.02 (t -0.1), carriers' births 3232: not told from zero
- GUT: carried 88.6%, effect 0.57 (t 4.7), carriers' births 31975: SELECTED

## Modules so far
- 1: FAT at tick 100000 (1-fat.js)
- 2: GUT at tick 200000 (2-gut.js)
