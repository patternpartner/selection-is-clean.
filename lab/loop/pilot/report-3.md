# Report 3: world pilot (seed 2001) at tick 300000

Write module 3 into `mods/3-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1613 (inert twin 1564); mean program length 10.58 (twin 8.4); mean generation 1717
- distinct functional programs 264; the commonest holds 7.9%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26846.6 | corpses eaten 12460.7 | taken by attack 12437.8 (189.3 kills)
- module BROTH (op 32, since tick 100000): income 7144.50, energy put in 0.00, executions 1065309, carried by 38.8% now 16.6%, energy held in its fields 345.67
- module TANK (op 33, since tick 200000): income 77.05, energy put in 66.12, executions 52729, carried by 3.6% now 15.4%, energy held in its fields 768.39

## Energy lying in the world now
- light 84.7, corpses 1033.7, in organisms 12020.2

## The commonest programs now (functional: neutral markers dropped), share of the living
- 7.9%: MOVE(182) DIVIDE(74) TURN(63) IFLT(178) TURN(58) SENSE_MATCH(73) EAT_CORPSE(191) EAT_LIGHT(27) TANK(250) EAT_LIGHT(245) IFGT(10)
- 6.1%: MOVE(236) EAT_LIGHT(124) DIVIDE(211) IFLT(77) TURN(165) SENSE_MATCH(195) EAT_LIGHT(179) EAT_LIGHT(50) EAT_CORPSE(187) IFGT(178)
- 5.6%: MOVE(226) DIVIDE(74) TURN(63) IFLT(15) TURN(58) SENSE_MATCH(217) EAT_CORPSE(116) EAT_LIGHT(27) EAT_LIGHT(232) EAT_LIGHT(83) IFGT(93)
- 3.5%: EAT_CORPSE(208) EAT_LIGHT(173) BROTH(118) IFLT(10) DIVIDE(52) BROTH(167) SENSE_AHEAD(105)
- 3.3%: SUB(195) DIVIDE(10) LOADK(252) BROTH(120) SUB(166) EAT_LIGHT(25) ATTACK(120) DIVIDE(144) MOV(253) TURN(235)
- 3.2%: MOVE(236) EAT_LIGHT(3) DIVIDE(32) IFLT(70) TURN(179) EAT_CORPSE(52) SENSE_MATCH(195) EAT_LIGHT(27) EAT_LIGHT(133) EAT_CORPSE(187) IFGT(178)
- 3.2%: DIVIDE(90) TURN(150) TANK(60) SENSE_AHEAD(211) ATTACK(221) EAT_CORPSE(52) EAT_LIGHT(27) IFGT(112)
- 2.7%: EAT_CORPSE(85) EAT_LIGHT(25) SENSE_MATCH(240) DIVIDE(8) JMP(124) SHARE(11) IFGT(68) SHARE(203) IFLT(147) EAT_CORPSE(155) MUL(141) MOV(100)

## Instructions carried, share of the living
- DIVIDE 100%, EAT_LIGHT 98%, EAT_CORPSE 90%, IFLT 68%, IFGT 66%, TURN 51%, SENSE_MATCH 43%, MOVE 35%, MOV 23%, RAND 22%, LOADK 21%, ATTACK 21%, SENSE_AHEAD 16%, SUB 15%, JMP 13%, MUL 13%, SHARE 13%, ADD 12%, SENSE_GRAD 10%, SENSE_CORPSE 8%, SENSE_LIGHT 8%

## Modules so far
- 1: BROTH at tick 100000 (1-broth.js)
- 2: TANK at tick 200000 (2-tank.js)
