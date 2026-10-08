# Report 9: world d2103 (seed 2103) at tick 900000

Write module 9 into `mods/9-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1577 (inert twin 1739); mean program length 11.84 (twin 8.67); mean generation 4602.4
- distinct functional programs 345; the commonest holds 4.0%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 10196.7 | corpses eaten 597.8 | taken by attack 1934.9 (13.4 kills)
- module GUT (op 32, since tick 100000): income 1583.59, energy put in 0.00, executions 1168548, carried by 75.3% now 80.6%, energy held in its fields 45.94
- module CARRION (op 33, since tick 200000): income 0.00, energy put in 0.00, executions 83843, carried by 8.2% now 1.7%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 1260.22, energy put in 126.02, executions 241532, carried by 14.2% now 34.2%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 23.72, energy put in 54.33, executions 1518, carried by 0.1% now 0.3%, energy held in its fields 5.5
- module BITE (op 36, since tick 500000): income 4971.72, energy put in 0.00, executions 1198831, carried by 56.4% now 55.5%, energy held in its fields 0
- module STRETCH (op 37, since tick 600000): income 18563.02, energy put in 0.00, executions 3259542, carried by 98.2% now 94.3%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 18062.12, energy put in 27093.18, executions 1071972, carried by 48.0% now 45.4%, energy held in its fields 0
- module FAT (op 39, since tick 800000): income 44.14, energy put in 64.08, executions 20233, carried by 1.4% now 0.0%, energy held in its fields 0

## Energy lying in the world now
- light 40.2, corpses 277.4, in organisms 3505.4

## The commonest programs now (functional: neutral markers dropped), share of the living
- 4.0%: BITE(151) EAT_LIGHT(131) GUT(147) STRETCH(121) DIVIDE(124) SQUEEZE(125) TURN(173) SENSE_E(14)
- 3.3%: BITE(215) EAT_LIGHT(131) GUT(147) STRETCH(121) DIVIDE(129) SQUEEZE(125) TURN(173) STRETCH(140)
- 2.6%: TURN(230) EAT_LIGHT(218) BITE(11) DIVIDE(3) STRETCH(181) EAT_LIGHT(131) GUT(175) SQUEEZE(97)
- 2.2%: STRETCH(109) STRETCH(66) EAT_CORPSE(237) EAT_LIGHT(166) STRETCH(247) TURN(55) STRETCH(188) TURN(116) STRETCH(250) MOVE(27) STRETCH(185) MAUL(168) DIVIDE(61) TURN(230) GUT(90) EAT_LIGHT(30) MAUL(134) EAT_LIGHT(236)
- 2.2%: EAT_LIGHT(192) MAUL(52) TURN(166) DIVIDE(3) STRETCH(181) SQUEEZE(97)
- 2.2%: BITE(151) EAT_LIGHT(131) GUT(147) STRETCH(121) DIVIDE(129) SQUEEZE(125) TURN(173)
- 2.2%: LOADK(77) GUT(107) EAT_LIGHT(172) BITE(64) BITE(93) STRETCH(14) DIVIDE(169) TURN(19) DIVIDE(41) IFLT(18)
- 2.1%: STRETCH(144) EAT_CORPSE(237) EAT_LIGHT(166) STRETCH(247) TURN(55) STRETCH(224) TURN(116) STRETCH(250) MOVE(27) STRETCH(185) MAUL(168) DIVIDE(61) TURN(230) GUT(90) EAT_LIGHT(30) MAUL(134) EAT_LIGHT(236)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 94%, TURN 94%, MOVE 32%, EAT_CORPSE 31%, LOADK 25%, IFLT 14%, SENSE_E 8%, ADD 7%, ATTACK 6%, IFGT 6%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 78.6%, effect 0.10 (t 1.5), carriers' births 25832: not told from zero
- CARRION: carried 3.2%, effect 0.20 (t 1.4), carriers' births 995: not told from zero
- SQUEEZE: carried 31.4%, effect 0.10 (t 1.6), carriers' births 10839: not told from zero
- LEAF: carried 0.1%, effect -3.60 (t -3.7), carriers' births 7: AGAINST
- BITE: carried 55.0%, effect 0.16 (t 4.3), carriers' births 18407: SELECTED
- STRETCH: carried 92.8%, effect 0.50 (t 3.2), carriers' births 30422: SELECTED
- MAUL: carried 47.0%, effect 0.34 (t 13.0), carriers' births 15015: SELECTED
- FAT: carried 0.1%, effect -1.57 (t -2.7), carriers' births 54: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: CARRION at tick 200000 (2-carrion.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: BITE at tick 500000 (5-bite.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
- 7: MAUL at tick 700000 (7-maul.js)
- 8: FAT at tick 800000 (8-fat.js)
