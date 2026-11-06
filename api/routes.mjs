// Read-only ZIP lookup. No private provider accounts or credentials are used.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET to look up routes.' });
  const zip = new URL(req.url, 'https://hln.local').searchParams.get('zip') || '';
  if (!/^77\d{3}$/.test(zip)) return res.status(400).json({ error: 'Enter a Greater Houston ZIP code beginning with 77.' });
  const url = new URL('https://gis.usps.com/arcgis/rest/services/EDDM/selectZIP/GPServer/routes/execute');
  url.search = new URLSearchParams({ ZIP: zip, Rte_Box: 'R', f: 'json', 'env:outSR': '4326' }).toString();
  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(22000) });
    if (!upstream.ok) throw new Error('USPS lookup unavailable');
    const data = await upstream.json();
    const value = data.results?.find(r => r.paramName === 'Output_Feature_Class')?.value;
    if (data.error || !Array.isArray(value?.features) || value.exceededTransferLimit) throw new Error('Incomplete USPS response');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).json({ ...data, fetchedAt: new Date().toISOString(), source: 'USPS EDDM map service' });
  } catch {
    return res.status(502).json({ error: 'USPS route lookup is temporarily unavailable. Your existing selection is still saved. Please try again.' });
  }
}
