const APP_ID = '2350555578800441';
const APP_SECRET = '66dcad5a380f423b7e07326eca078ec4';

async function refreshToken(token) {
  const url = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.access_token) return data.access_token;
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  let TOKEN = process.env.META_TOKEN;
  const ACCOUNT = process.env.META_ACCOUNT;

  if (!TOKEN || !ACCOUNT) {
    return res.status(500).json({ error: 'Credenciais não configuradas' });
  }

  const since = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();
  const until = new Date().toISOString().slice(0, 10);

  const fetchData = async (token) => {
    const url = `https://graph.facebook.com/v19.0/${ACCOUNT}/insights?fields=spend,date_start&time_increment=1&time_range={"since":"${since}","until":"${until}"}&limit=90&access_token=${token}`;
    const response = await fetch(url);
    return await response.json();
  };

  try {
    let data = await fetchData(TOKEN);
    if (data.error && (data.error.code === 190 || data.error.code === 102)) {
      const newToken = await refreshToken(TOKEN);
      if (newToken) {
        TOKEN = newToken;
        data = await fetchData(TOKEN);
      } else {
        return res.status(401).json({ error: 'Token expirado. Atualize em Minha conta.' });
      }
    }
    if (data.error) return res.status(400).json({ error: data.error.message });
    return res.status(200).json({ data: data.data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
