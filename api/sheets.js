export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

  const SHEETS_URL = process.env.SHEETS_URL;

  if (!SHEETS_URL) {
    return res.status(500).json({ error: 'URL da planilha não configurada' });
  }

  try {
    const response = await fetch(SHEETS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; adsflow/1.0)',
        'Accept': 'text/csv,text/plain,*/*',
      },
      redirect: 'follow',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    return res.status(200).json({ csv: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
