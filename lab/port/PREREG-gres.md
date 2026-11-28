# #481 — a finer ground (`GROUND_RES` 1 -> 2): the registered set (written before pair 1)

**Why (measured):** eight payments overwrite each ground cell every ~8 ticks against ~85 at one (node, seed 12); #398 showed the
ground's value is persistence. Design pair (`out-gres-design/`, seen, does not count): F 1.29x, size 17+ 1.99x, ticks 0.99x, ahead
at 5 and 10 minutes.

- **Arms:** the engine against `__tk('__GROUND_RES',2)`. 8 pairs, 20 minutes, each alone, one per launch (`gres-set.sh`); a pair cut
  short is void and rerun. Stops when SHIP is unreachable.
- **SHIP** if the median F ratio at 20 minutes is above 1.00 AND at least 7 of 8 ahead AND the median size-17+ ratio at least 0.90:
  `GROUND_RES` defaults to 2. Said now, as the template asks: a reload of a world saved at resolution 1 then starts its ground empty
  (the population and record come back); `GROUND_RES=1` restores the world before. **Otherwise** it is removed.
- Analysis: `analyse-gres.js`.

## Result
NOT SHIPPED after 6 pairs (count 1.27, 0.77, 1.62, 1.07, 1.07, 0.99: two behind). Size 17+ up in 5 of 6 (median 1.34). DORMANT for #482 (PREREG-gres-depth.md).
