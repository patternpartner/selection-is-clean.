# Report 6: world pilot (seed 2001) at tick 600000

Write module 6 into `mods/6-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1432 (inert twin 1480); mean program length 12.46 (twin 9.37); mean generation 3272.5
- distinct functional programs 259; the commonest holds 17.9%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26404.4 | corpses eaten 9467.2 | taken by attack 13823.4 (116.6 kills)
- module BROTH (op 32, since tick 100000): income 725.73, energy put in 0.00, executions 386460, carried by 37.4% now 29.3%, energy held in its fields 35.4
- module TANK (op 33, since tick 200000): income 49.05, energy put in 61.79, executions 30700, carried by 3.6% now 2.6%, energy held in its fields 426.32
- module PIPE (op 34, since tick 300000): income 18.01, energy put in 0.00, executions 53378, carried by 5.6% now 9.6%, energy held in its fields 0
- module SMELL (op 35, since tick 400000): income 0.00, energy put in 0.00, executions 190361, carried by 20.6% now 5.0%, energy held in its fields 0
- module HOARD (op 36, since tick 500000): income 63.95, energy put in 90.44, executions 13481, carried by 1.5% now 0.6%, energy held in its fields 312.54

## Energy lying in the world now
- light 81.4, corpses 699.6, in organisms 13181

## The commonest programs now (functional: neutral markers dropped), share of the living
- 17.9%: MOVE(20) DIVIDE(181) TURN(183) IFLT(83) TURN(210) SENSE_KIN(161) EAT_CORPSE(208) EAT_LIGHT(244) EAT_LIGHT(101) EAT_LIGHT(22) IFGT(62)
- 9.2%: MOVE(241) EAT_LIGHT(28) EAT_CORPSE(50) DIVIDE(255) IFLT(2) TURN(101) EAT_CORPSE(174) SENSE_MATCH(100) EAT_LIGHT(207) EAT_LIGHT(129) IFGT(83)
- 3.7%: DIVIDE(96) IFLT(83) TURN(58) EAT_CORPSE(186) ATTACK(228) EAT_LIGHT(103) EAT_LIGHT(67) IFGT(29)
- 2.7%: EAT_LIGHT(243) DIVIDE(255) TURN(101) EAT_CORPSE(214) TURN(91) EAT_LIGHT(207) EAT_LIGHT(129)
- 2.2%: EAT_LIGHT(28) DIVIDE(255) EAT_CORPSE(154) SENSE_MATCH(138) IFGT(83)
- 1.7%: IFLT(242) EAT_LIGHT(111) ADD(163) DIVIDE(56) IFGT(7) BROTH(238) MUL(115) DIVIDE(240) DIVIDE(91) EAT_CORPSE(155) DIVIDE(254) ATTACK(84) SENSE_CORPSE(222) EAT_LIGHT(107) TURN(33)
- 1.6%: MOVE(241) EAT_LIGHT(28) EAT_CORPSE(50) DIVIDE(221) SENSE_GRAD(177) SENSE_GRAD(231) EAT_CORPSE(211) SENSE_MATCH(137) EAT_LIGHT(69) EAT_LIGHT(129) SENSE_AHEAD(159) IFGT(83)
- 1.5%: DIVIDE(130) IFLT(83) TURN(58) SENSE_KIN(184) EAT_CORPSE(186) EAT_LIGHT(143)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 100%, EAT_CORPSE 91%, TURN 86%, IFGT 84%, IFLT 73%, SENSE_KIN 49%, MOVE 41%, ATTACK 35%, ADD 28%, SENSE_MATCH 28%, SENSE_CORPSE 22%, SUB 20%, MUL 18%, SENSE_GRAD 9%, MOV 5%

## Modules so far
- 1: BROTH at tick 100000 (1-broth.js)
- 2: TANK at tick 200000 (2-tank.js)
- 3: PIPE at tick 300000 (3-pipe.js)
- 4: SMELL at tick 400000 (4-smell.js)
- 5: HOARD at tick 500000 (5-hoard.js)
