# Report 2: world pilot (seed 2001) at tick 200000

Write module 2 into `mods/2-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1584 (inert twin 1551); mean program length 9.12 (twin 9.08); mean generation 1173
- distinct functional programs 302; the commonest holds 7.8%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26527.1 | corpses eaten 15623.9 | taken by attack 13319.4 (151.4 kills)
- module BROTH (op 32, since tick 100000): income 826.29, energy put in 0.00, executions 362313, carried by 18.3% now 25.1%, energy held in its fields 57.95

## Energy lying in the world now
- light 85.4, corpses 643.7, in organisms 6976.3

## The commonest programs now (functional: neutral markers dropped), share of the living
- 7.8%: MOVE(236) EAT_LIGHT(160) DIVIDE(145) IFLT(178) TURN(165) EAT_CORPSE(52) SENSE_MATCH(160) EAT_LIGHT(27) EAT_LIGHT(133) IFGT(18)
- 4.1%: MOVE(236) EAT_LIGHT(160) DIVIDE(145) IFLT(178) TURN(1) EAT_CORPSE(52) SENSE_MATCH(160) EAT_LIGHT(241) EAT_LIGHT(133) IFGT(225)
- 3.8%: MOVE(236) EAT_LIGHT(160) DIVIDE(145) EAT_LIGHT(112) IFLT(178) TURN(1) EAT_CORPSE(52) SENSE_MATCH(160) EAT_LIGHT(27) EAT_LIGHT(133) IFGT(178)
- 3.3%: MOV(236) EAT_LIGHT(160) DIVIDE(145) IFLT(178) TURN(1) EAT_CORPSE(52) SENSE_MATCH(160) EAT_LIGHT(18) IFGT(225)
- 2.1%: EAT_CORPSE(27) DIVIDE(235) DIVIDE(58) SENSE_GRAD(146) EAT_LIGHT(145) SENSE_E(61)
- 2.1%: EAT_LIGHT(160) MUL(140) SENSE_MATCH(124) DIVIDE(35) EAT_CORPSE(77) EAT_LIGHT(147)
- 2.1%: SENSE_CORPSE(40) IFGT(129) TURN(203) DIVIDE(171) DIVIDE(138) RAND(226) IFLT(145) EAT_LIGHT(46) ATTACK(30) EAT_CORPSE(172)
- 1.9%: IFLT(79) DIVIDE(212) EAT_LIGHT(11) TURN(134) BROTH(198) BROTH(113) EAT_CORPSE(115)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 98%, EAT_CORPSE 82%, TURN 72%, IFLT 65%, SENSE_MATCH 49%, IFGT 44%, MOVE 28%, MUL 22%, SENSE_E 19%, ATTACK 16%, SENSE_GRAD 13%, SENSE_AHEAD 11%, SENSE_CORPSE 11%, ADD 10%, RAND 9%, MOV 8%, SUB 7%

## Modules so far
- 1: BROTH at tick 100000 (1-broth.js)
