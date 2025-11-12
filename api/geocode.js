export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing lat or lng parameter' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ja&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // 最初の結果から簡潔な場所名を抽出
      const result = data.results[0];
      
      // より簡潔な場所名を取得する試み
      let placeName = '';
      
      // address_componentsから適切な情報を取得
      const components = result.address_components;
      const route = components.find(c => c.types.includes('route'));
      const locality = components.find(c => c.types.includes('locality'));
      const sublocality = components.find(c => c.types.includes('sublocality') || c.types.includes('sublocality_level_1'));
      
      if (route) {
        placeName = route.long_name;
        if (sublocality) {
          placeName += ` (${sublocality.long_name})`;
        }
      } else if (sublocality) {
        placeName = sublocality.long_name;
      } else if (locality) {
        placeName = locality.long_name;
      } else {
        // フォールバック: formatted_addressを使用（最初の2要素）
        const parts = result.formatted_address.split(',');
        placeName = parts.slice(0, 2).join(',').trim();
      }

      res.status(200).json({ placeName });
    } else {
      res.status(200).json({ placeName: '不明な場所' });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: error.message, placeName: '不明な場所' });
  }
}
