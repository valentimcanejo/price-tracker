import { getRandomUserAgent } from './user-agents';
import { StoreName } from '@/types';

const DIRECT_STORES: StoreName[] = ['amazon', 'kabum'];

export async function fetchPage(url: string, store?: StoreName): Promise<string> {
  const apiKey = process.env.SCRAPER_API_KEY;
  const useProxy = apiKey && store && !DIRECT_STORES.includes(store);

  if (useProxy) {
    return fetchViaProxy(url, apiKey);
  }

  return fetchDirect(url);
}

async function fetchDirect(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response.text();
}

async function fetchViaProxy(url: string, apiKey: string): Promise<string> {
  const proxyUrl = `https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render=true&country_code=br`;

  const response = await fetch(proxyUrl, {
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`ScraperAPI ${response.status} fetching ${url}`);
  }

  return response.text();
}
