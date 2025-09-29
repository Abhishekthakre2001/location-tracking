import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// fix leaflet icon URLs when using Vite / React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/node_modules/leaflet/dist/images/marker-icon-2x.png',
  iconUrl: '/node_modules/leaflet/dist/images/marker-icon.png',
  shadowUrl: '/node_modules/leaflet/dist/images/marker-shadow.png'
});

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

export default function Admin() {
  const socketRef = useRef(null);
  const [tracks, setTracks] = useState({}); // { id: [{lat,lng,ts}, ...] }
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const s = io(SERVER, { transports: ['websocket'] });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('register', { role: 'admin', id: 'admin_' + s.id.slice(0,6) });
      s.emit('requestAll');
    });

    s.on('allTracks', (all) => {
      setTracks(all || {});
    });

    s.on('locations', ({ id, points }) => {
      setTracks(prev => ({ ...prev, [id]: points }));
    });

    return () => s.disconnect();
  }, []);

  // get latest positions for map center and markers
  const latest = Object.entries(tracks).map(([id, pts]) => {
    const last = pts[pts.length - 1];
    return { id, lat: last?.lat, lng: last?.lng, pts };
  });

  const center = latest.length ? [latest[0].lat, latest[0].lng] : [21.1458, 79.0882];

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">Admin Map (real-time)</h2>

      <div className="flex gap-4">
        <div className="w-1/4">
          <h3 className="font-semibold mb-2">Trackers</h3>
          <div className="space-y-2">
            {latest.map(t => (
              <div key={t.id} className="p-2 border rounded">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{t.id}</div>
                    <div className="text-sm text-gray-600">lat: {t.lat?.toFixed(6)} lng: {t.lng?.toFixed(6)}</div>
                  </div>
                  <div>
                    <button className="text-sm px-2 py-1 bg-blue-500 text-white rounded" onClick={()=>setSelectedId(t.id)}>Focus</button>
                  </div>
                </div>
              </div>
            ))}

            {latest.length === 0 && <div className="text-sm text-gray-500">No trackers yet</div>}
          </div>
        </div>

        <div className="w-3/4">
          <MapContainer center={center} zoom={13} style={{ height: '70vh', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <Recenter position={selectedId ? latest.find(l => l.id === selectedId) && [latest.find(l => l.id === selectedId).lat, latest.find(l => l.id === selectedId).lng] : center} />

            {latest.map(t => (
              <React.Fragment key={t.id}>
                {t.lat && t.lng && (
                  <Marker position={[t.lat, t.lng]}>
                    <Popup>
                      <div>
                        <div className="font-bold">{t.id}</div>
                        <div>lat: {t.lat.toFixed(6)}</div>
                        <div>lng: {t.lng.toFixed(6)}</div>
                        <div>points: {t.pts.length}</div>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* polyline for path */}
                {t.pts && t.pts.length > 1 && (
                  <Polyline positions={t.pts.map(p => [p.lat, p.lng])} />
                )}
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
