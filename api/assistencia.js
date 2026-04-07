export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  const URL = process.env.ASSISTENCIA_URL;
  if (!URL) return res.status(500).json({ error: 'URL não configurada' });

  try {
    const response = await fetch(URL, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/csv' },
      redirect: 'follow',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    return res.status(200).json({ csv: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
