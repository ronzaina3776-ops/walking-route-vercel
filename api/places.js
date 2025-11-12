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
    // Places API (Nearby Search) を使用して近くの施設を検索
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&language=ja&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // 最も近い施設の名前を取得
      const place = data.results[0];
      let placeName = place.name;
      
      // タイプに応じて絵文字を追加
      let emoji = '📍';
      if (place.types) {
        if (place.types.includes('store') || place.types.includes('convenience_store')) {
          emoji = '🏪';
        } else if (place.types.includes('cafe') || place.types.includes('coffee')) {
          emoji = '☕';
        } else if (place.types.includes('restaurant')) {
          emoji = '🍽️';
        } else if (place.types.includes('park')) {
          emoji = '🌳';
        } else if (place.types.includes('school') || place.types.includes('university')) {
          emoji = '🏫';
        } else if (place.types.includes('library')) {
          emoji = '📚';
        } else if (place.types.includes('hospital')) {
          emoji = '🏥';
        } else if (place.types.includes('bank') || place.types.includes('atm')) {
          emoji = '🏦';
        } else if (place.types.includes('post_office')) {
          emoji = '📮';
        } else if (place.types.includes('gas_station')) {
          emoji = '⛽';
        } else if (place.types.includes('train_station') || place.types.includes('transit_station')) {
          emoji = '🚉';
        } else if (place.types.includes('church') || place.types.includes('place_of_worship')) {
          emoji = '⛩️';
        } else if (place.types.includes('gym')) {
          emoji = '💪';
        }
      }
      
      res.status(200).json({ placeName: `${emoji} ${placeName}` });
    } else if (data.status === 'ZERO_RESULTS') {
      // 施設が見つからない場合は「不明な場所」を返す（フロント側でGeocodingにフォールバック）
      res.status(200).json({ placeName: '不明な場所' });
    } else {
      console.log('Places API status:', data.status);
      res.status(200).json({ placeName: '不明な場所' });
    }
  } catch (error) {
    console.error('Places API error:', error);
    res.status(500).json({ error: error.message, placeName: '不明な場所' });
  }
}
