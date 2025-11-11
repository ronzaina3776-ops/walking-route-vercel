<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>お散歩ルート作成</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        #map { height: 450px; width: 100%; }
    </style>
</head>
<body class="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen p-4">
    
    <!-- 開始画面 -->
    <div id="startScreen" class="flex items-center justify-center min-h-screen">
        <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div class="text-center mb-8">
                <div class="bg-green-500 p-4 rounded-2xl inline-block mb-4">
                    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                    </svg>
                </div>
                <h1 class="text-3xl font-bold mb-2">お散歩ルート作成</h1>
                <p class="text-gray-500">散歩コースを作成しましょう</p>
            </div>
            
            <button onclick="getLocation()" class="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-colors">
                📍 現在地を使う
            </button>
        </div>
    </div>

    <!-- メイン画面 -->
    <div id="mainScreen" class="max-w-4xl mx-auto space-y-6 hidden">
        
        <!-- ヘッダー -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
            <div>
                <h1 class="text-2xl font-bold">お散歩ルート作成</h1>
                <p class="text-sm text-gray-500">Google Maps版</p>
            </div>
        </div>

        <!-- 歩数設定 -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="font-medium mb-3">目標歩数</h2>
            <div class="flex items-center gap-4">
                <input type="range" id="stepsRange" min="1000" max="20000" step="500" value="5000" 
                    class="flex-1 h-2 bg-gray-200 rounded-lg cursor-pointer accent-green-500"
                    oninput="updateSteps(this.value)">
                <div class="text-right min-w-32">
                    <div id="stepsDisplay" class="text-3xl font-bold text-green-600">5,000</div>
                    <div id="distanceDisplay" class="text-sm text-gray-500">歩 (3.5km)</div>
                </div>
            </div>
            
            <div class="flex gap-2 mt-4">
                <button onclick="setSteps(3000)" class="flex-1 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">3千歩</button>
                <button onclick="setSteps(5000)" class="flex-1 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">5千歩</button>
                <button onclick="setSteps(10000)" class="flex-1 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">1万歩</button>
            </div>
        </div>

        <!-- ルート設定 -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="font-medium mb-3">ルート設定</h2>
            <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="avoidHighways" checked class="w-5 h-5 accent-green-500">
                <span class="text-gray-700">大通り・幹線道路を避ける</span>
            </label>
        </div>

        <!-- ルート作成ボタン -->
        <button onclick="createRoute()" id="createRouteBtn" class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-xl hover:shadow-xl transition-all">
            🗺️ ルートを作成
        </button>

        <!-- 地図 -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-bold mb-4">📍 地図</h2>
            <div id="map" class="rounded-xl border-2 border-gray-200"></div>
        </div>

        <!-- ルート情報 -->
        <div id="routeInfo" class="bg-white rounded-2xl shadow-lg p-6 hidden">
            <h2 class="text-lg font-bold mb-4">📊 ルート情報</h2>
            
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-green-50 p-4 rounded-xl text-center">
                    <div id="routeDistance" class="text-2xl font-bold text-green-600">0</div>
                    <div class="text-sm text-gray-600">km</div>
                </div>
                <div class="bg-blue-50 p-4 rounded-xl text-center">
                    <div id="routeSteps" class="text-2xl font-bold text-blue-600">0</div>
                    <div class="text-sm text-gray-600">歩</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-xl text-center">
                    <div id="routeTime" class="text-2xl font-bold text-purple-600">0</div>
                    <div class="text-sm text-gray-600">分</div>
                </div>
            </div>

            <button id="openInGoogleMaps" onclick="openInGoogleMaps()" class="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors">
                📱 Googleマップで開く
            </button>
        </div>

    </div>

    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDYFFfCe_7Ry15jh7J1n8gw7fF4JLJohxE&libraries=geometry"></script>
    <script>
        let map = null;
        let userLocation = null;
        let currentSteps = 5000;
        let currentRoute = null;
        let currentPolyline = null; // 現在のポリラインを保持

        function getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        showMainScreen();
                    },
                    (error) => {
                        alert('位置情報取得に失敗しました。');
                    }
                );
            }
        }

        function showMainScreen() {
            document.getElementById('startScreen').classList.add('hidden');
            document.getElementById('mainScreen').classList.remove('hidden');
            
            setTimeout(() => {
                map = new google.maps.Map(document.getElementById('map'), {
                    center: userLocation,
                    zoom: 15
                });

                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: '現在地'
                });
            }, 100);
        }

        function updateSteps(value) {
            currentSteps = parseInt(value);
            document.getElementById('stepsDisplay').textContent = currentSteps.toLocaleString();
            const distance = ((currentSteps * 0.7) / 1000).toFixed(1);
            document.getElementById('distanceDisplay').textContent = `歩 (${distance}km)`;
        }

        function setSteps(value) {
            currentSteps = value;
            document.getElementById('stepsRange').value = value;
            updateSteps(value);
        }

        async function createRoute() {
            if (!map || !userLocation) {
                alert('地図がまだ準備できていません');
                return;
            }

            const button = document.getElementById('createRouteBtn');
            button.disabled = true;
            button.textContent = '⏳ ルート作成中...';

            // 前回のポリラインを削除
            if (currentPolyline) {
                currentPolyline.setMap(null);
                currentPolyline = null;
            }

            try {
                const targetDistance = (currentSteps * 0.7) / 1000;
                const waypoints = generateWaypoints(userLocation, targetDistance);
                
                // 大通り避ける設定を取得
                const avoidHighways = document.getElementById('avoidHighways').checked;

                // Vercelのバックエンドを呼び出す
                const response = await fetch('/api/directions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        origin: userLocation,
                        destination: userLocation,
                        waypoints: waypoints,
                        avoidHighways: avoidHighways
                    })
                });

                const data = await response.json();

                if (data.status === 'OK' && data.routes && data.routes.length > 0) {
                    currentRoute = data.routes[0];

                    // ポリラインを手動でデコードして描画
                    const path = google.maps.geometry.encoding.decodePath(currentRoute.overview_polyline.points);
                    
                    // 新しいポリラインを作成して保存
                    currentPolyline = new google.maps.Polyline({
                        path: path,
                        geodesic: true,
                        strokeColor: '#22c55e',
                        strokeOpacity: 1.0,
                        strokeWeight: 5,
                        map: map
                    });

                    // 地図の表示範囲を調整
                    const bounds = new google.maps.LatLngBounds();
                    path.forEach(point => bounds.extend(point));
                    map.fitBounds(bounds);

                    // ルート情報を計算
                    let totalDistance = 0;
                    let totalDuration = 0;

                    currentRoute.legs.forEach(leg => {
                        totalDistance += leg.distance.value;
                        totalDuration += leg.duration.value;
                    });

                    const distanceKm = (totalDistance / 1000).toFixed(1);
                    const actualSteps = Math.round((totalDistance / 1000) / 0.7 * 1000);
                    const timeMinutes = Math.round(totalDuration / 60);

                    document.getElementById('routeDistance').textContent = distanceKm;
                    document.getElementById('routeSteps').textContent = actualSteps.toLocaleString();
                    document.getElementById('routeTime').textContent = timeMinutes;

                    document.getElementById('routeInfo').classList.remove('hidden');
                } else {
                    alert('ルート作成に失敗しました: ' + (data.error || data.status));
                }
            } catch (error) {
                alert('エラーが発生しました: ' + error.message);
            } finally {
                button.disabled = false;
                button.textContent = '🗺️ ルートを作成';
            }
        }

        function generateWaypoints(center, targetDistanceKm) {
            const waypoints = [];
            const timeSeed = Date.now() % 1000 / 1000;
            const numWaypoints = 3 + Math.floor(Math.random() * 2);
            const radiusKm = targetDistanceKm / 6;
            const startAngle = Math.random() * Math.PI * 2 + timeSeed * Math.PI;

            for (let i = 0; i < numWaypoints; i++) {
                const baseAngle = (Math.PI * 2 / numWaypoints) * i;
                const randomOffset = (Math.random() - 0.5) * 0.4;
                const angle = startAngle + baseAngle + randomOffset;
                const distance = radiusKm * (0.9 + Math.random() * 0.2);

                const lat = center.lat + (distance / 111) * Math.cos(angle);
                const lng = center.lng + (distance / (111 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);

                waypoints.push({ lat, lng });
            }

            return waypoints;
        }

        function openInGoogleMaps() {
            if (!currentRoute || !userLocation) {
                alert('まずルートを作成してください');
                return;
            }

            const waypoints = [];
            currentRoute.legs.forEach((leg, index) => {
                if (index < currentRoute.legs.length - 1) {
                    const loc = leg.end_location;
                    waypoints.push(`${loc.lat},${loc.lng}`);
                }
            });

            const origin = `${userLocation.lat},${userLocation.lng}`;
            const waypointsParam = waypoints.join('|');
            const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${origin}&waypoints=${waypointsParam}&travelmode=walking`;

            window.open(url, '_blank');
        }
    </script>
</body>
</html>
