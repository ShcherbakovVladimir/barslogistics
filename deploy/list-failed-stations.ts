import { readFileSync } from 'fs';
import { parseRzdAnalyticsCsv } from '../server/rzdAnalytics/parseCsv.js';

const log = readFileSync('/home/user/BarsLogistics/data/rzd/geocode.log', 'utf-8');
const failedEsr = new Set<string>();
const failedDest = new Set<string>();
for (const line of log.split('\n')) {
  const mEsr = line.match(/^ESR (\d+) (.+)… not found$/);
  if (mEsr) failedEsr.add(mEsr[1]);
  const mDest = line.match(/^DEST (.+)… not found$/);
  if (mDest) failedDest.add(mDest[1]);
}

const esrMap = new Map<string, { name: string; region: string; railway: string }>();
const destMap = new Map<string, { name: string; region: string }>();

for (const f of ['/home/user/usersfiles/РЖД_Декабрь_1.csv', '/home/user/usersfiles/РЖД_Декабрь_2.csv']) {
  const { rows } = parseRzdAnalyticsCsv(readFileSync(f, 'utf-8'));
  for (const r of rows) {
    const code = r.originStationCode?.trim();
    if (code && failedEsr.has(code) && !esrMap.has(code)) {
      esrMap.set(code, {
        name: r.originStationName,
        region: r.originRegion || r.originCountry,
        railway: r.originRailway || '',
      });
    }
    if (failedDest.has(r.destStationName)) {
      const key = `${r.destStationName}|${r.destRegion || r.destCountry}`;
      if (!destMap.has(key)) {
        destMap.set(key, { name: r.destStationName, region: r.destRegion || r.destCountry });
      }
    }
  }
}

console.log(JSON.stringify({ esr: Object.fromEntries(esrMap), dest: Object.fromEntries(destMap) }, null, 2));
