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
    const url = `https://graph.facebook.com/v19.0/${ACCOUNT}/insights?fields=spend,impressions,clicks,cpm,cpc,ctr,reach,date_start&time_increment=1&time_range={"since":"${since}","until":"${until}"}&limit=90&access_token=${token}`;
    const response = await fetch(url);
    return await response.json();
  };

  const fetchCampaigns = async (token) => {
    const since7 = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); })();
    const url = `https://graph.facebook.com/v19.0/${ACCOUNT}/insights?fields=campaign_name,adset_name,spend,impressions,clicks,cpm,cpc,ctr,reach&time_range={"since":"${since7}","until":"${until}"}&level=campaign&limit=50&access_token=${token}`;
    const response = await fetch(url);
    return await response.json();
  };

  try {
    let [daily, campaigns] = await Promise.all([fetchData(TOKEN), fetchCampaigns(TOKEN)]);

    if (daily.error && (daily.error.code === 190 || daily.error.code === 102)) {
      const newToken = await refreshToken(TOKEN);
      if (newToken) {
        TOKEN = newToken;
        [daily, campaigns] = await Promise.all([fetchData(TOKEN), fetchCampaigns(TOKEN)]);
      } else {
        return res.status(401).json({ error: 'Token expirado. Atualize em Minha conta.' });
      }
    }

    if (daily.error) return res.status(400).json({ error: daily.error.message });

    return res.status(200).json({
      data: daily.data || [],
      campaigns: campaigns.data || []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
