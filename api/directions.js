export default async function handler(req, res) {
    // CORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { origin, destination, waypoints, avoidHighways, optimizeWaypoints } = req.body;

        // Google Directions APIのURL構築
        let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=walking&key=${GOOGLE_MAPS_API_KEY}&language=ja`;

        // 経由地の追加
        if (waypoints && waypoints.length > 0) {
            const waypointStr = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');
            url += `&waypoints=${optimizeWaypoints ? 'optimize:true|' : ''}${waypointStr}`;
        }

        // 大通りを避けるオプション（徒歩モードでは highways は効果が限定的だが、試みる）
        if (avoidHighways) {
            url += '&avoid=highways';
        }

        // 代替ルートをリクエスト
        url += '&alternatives=true';

        const response = await fetch(url);
        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {
        console.error('Directions API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
