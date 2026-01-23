export default async function handler(req, res) {
    // CORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { origin, destination, waypoints, avoidHighways, optimizeWaypoints } = req.body;
        
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }
        
        // ウェイポイントをフォーマット
        // optimizeWaypoints: false の場合、順序を固定（一筆書きルート用）
        let waypointsParam = '';
        if (waypoints && waypoints.length > 0) {
            const waypointStrings = waypoints.map(wp => `${wp.lat},${wp.lng}`);
            
            // optimize:false を先頭に付けることで、ウェイポイントの順序を維持
            if (optimizeWaypoints === false) {
                waypointsParam = `optimize:false|${waypointStrings.join('|')}`;
            } else {
                waypointsParam = waypointStrings.join('|');
            }
        }
        
        // 大通りを避けるオプション
        const avoidParam = avoidHighways ? '&avoid=highways' : '';
        
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&waypoints=${waypointsParam}&mode=walking${avoidParam}&alternatives=true&region=jp&key=${apiKey}`;
        
        console.log('Directions API URL:', url.replace(apiKey, 'HIDDEN'));
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status !== 'OK') {
            console.log('Directions API error:', data.status, data.error_message);
        }
        
        res.status(200).json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}
