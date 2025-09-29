import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function Tracker() {
  const [status, setStatus] = useState('idle');
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const [id, setId] = useState(() => 'driver_' + Math.floor(Math.random()*9000+1000));
  const [intervalMs, setIntervalMs] = useState(5000); // fallback polling interval

  useEffect(() => {
    const s = io(SERVER, { transports: ['websocket'] });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('register', { role: 'tracker', id });
      console.log('connected to server', s.id);
    });

    return () => {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      s.disconnect();
    };
  }, [id]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      return;
    }

    setStatus('tracking');

    // Try high frequency watchPosition for best real-time
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const payload = {
          id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          ts: pos.timestamp
        };
        socketRef.current?.emit('locationUpdate', payload);
      },
      (err) => {
        console.error('geo err', err);
        setStatus('error: ' + err.message);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );

    // Fallback: also send current pos every interval if watch fails
    // (optional) — we won't set an interval here unless you prefer it.
  };

  const stopTracking = () => {
    if (watchIdRef.current && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus('stopped');
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">Tracker (client)</h2>
      <div className="mb-2">
        <label className="block">Tracker ID</label>
        <input className="border p-2 rounded" value={id} onChange={(e)=>setId(e.target.value)} />
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={startTracking} className="px-4 py-2 bg-blue-500 text-white rounded">Start Tracking</button>
        <button onClick={stopTracking} className="px-4 py-2 bg-gray-300 rounded">Stop</button>
      </div>

      <div>
        <p>Status: <span className="font-medium">{status}</span></p>
        <p className="text-sm text-gray-600 mt-2">Note: Geolocation requires HTTPS in production. Use localhost for testing.</p>
      </div>
    </div>
  );
}
