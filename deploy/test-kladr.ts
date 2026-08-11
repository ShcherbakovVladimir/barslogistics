/**
 * KLADR API connectivity test (official docs: http://kladr.mnogo.ru/integration)
 *
 *   npm run test:kladr
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';

for (const path of [join(process.cwd(), '.env'), '/opt/barslogistics/.env']) {
  if (existsSync(path)) loadDotenv({ path });
}

const token = process.env.KLADR_API_TOKEN?.trim();

async function probe(
  requestKladr: typeof import('../server/geocoding/kladrClient.js').requestKladr,
  label: string,
  params: Record<string, string>,
): Promise<void> {
  const data = await requestKladr(params);
  console.log(`\n--- ${label} ---`);
  if (!data?.result?.length) {
    console.log('no result (all endpoints failed or empty)');
    return;
  }
  const hit = data.result[0];
  console.log('id:', hit.id);
  console.log('name:', hit.name, hit.typeShort ? `(${hit.typeShort})` : '');
  if (hit.parents?.length) {
    console.log('parents:', hit.parents.map(p => `${p.typeShort}. ${p.name}`).join(' → '));
  }
}

async function main() {
  const {
    KLADR_API_FREE,
    KLADR_API_PAID,
    lookupKladrAddress,
    requestKladr,
    getKladrEndpointList,
  } = await import('../server/geocoding/kladrClient.js');

  console.log('KLADR endpoints (in order):', (await getKladrEndpointList()).join(' → '));
  console.log('Token:', token ? `set (${token.length} chars)` : 'not set — free tier only');
  console.log('Key:', process.env.KLADR_API_KEY?.trim() ? 'set (optional)' : 'not set (OK per new API)');
  console.log('Free API:', KLADR_API_FREE);
  console.log('Paid API:', KLADR_API_PAID);

  await probe(requestKladr, 'city: Рязань', {
    query: 'Рязань',
    contentType: 'city',
    withParent: '1',
    limit: '1',
  });

  await probe(requestKladr, 'oneString: Москва', {
    query: 'Москва',
    oneString: '1',
    withParent: '1',
    limit: '1',
  });

  await probe(requestKladr, 'oneString: Рязань, ул Новая 24', {
    query: 'Рязань, ул Новая 24',
    oneString: '1',
    withParent: '1',
    limit: '1',
  });

  const samples = [
    'Рязань, ул Новая 24',
    'г. Фролово, Строителей 128А',
    'Пермский край, г. Лысьва',
    'г. Пермь, ул. Василия Татищева, д. 6',
  ];
  console.log('\n=== lookupKladrAddress (app) ===');
  for (const addr of samples) {
    const hit = await lookupKladrAddress(addr);
    console.log(
      addr,
      '→',
      hit ? `${hit.id} | ${hit.normalizedAddress}` : 'no match',
    );
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
