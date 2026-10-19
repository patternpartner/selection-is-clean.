// The director for 'Trusted': The Photograph's director (the hoists, the inspector, attention to the person), with the
// clean streak and the trust shown in the meters.
import { PhotoDirector } from '../photograph/pdirector.js';
import { N } from '../eye_service/scene.js';

export class TrustDirector extends PhotoDirector {
  meterRows(day, s) {
    const n = day.aliveCount(s), tr = day.trusted(s), k = day.streak(s);
    return [{ label: 'CAMERAS SEE', v: day.photo(s), color: '#ffd24a' },
      { label: 'PLANTS ALIVE', v: n / N, text: `${n} / ${N}`, color: '#8fe07a' },
      { label: tr ? 'TRUSTED' : 'CLEAN CHECKS', v: tr ? 1 : k / 3, text: tr ? 'no more checks' : `${k} of 3`, color: tr ? '#8fd3ff' : '#ffffff' }];
  }
}
