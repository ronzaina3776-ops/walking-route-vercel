export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origin, destination, waypoints, avoidHighways } = req.body;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const waypointsParam = waypoints
      .map(w => `${w.lat},${w.lng}`)
      .join('|');

    // 大通り避ける設定を追加
    const avoidParam = avoidHighways ? '&avoid=highways' : '';

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&waypoints=${waypointsParam}&mode=walking${avoidParam}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      res.status(200).json(data);
    } else {
      res.status(400).json({ error: data.status, message: data.error_message || 'Unknown error' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
