export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

  const ESTOQUE_URL = process.env.ESTOQUE_URL;

  if (!ESTOQUE_URL) {
    return res.status(500).json({ error: 'URL do estoque não configurada' });
  }

  try {
    const response = await fetch(ESTOQUE_URL);
    if (!response.ok) throw new Error('Erro ao buscar estoque');
    const text = await response.text();
    return res.status(200).json({ csv: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
