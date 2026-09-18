import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Store, Truck } from 'lucide-react';
import {
  interpolateCoords,
  progressForStatus,
  resolveTracking,
  statusLabel,
  trackingMessage,
} from '../../utils/tracking';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';

// Fix default Leaflet marker icons when bundling with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const restaurantIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ea580c;color:#fff;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);font-size:14px;">🏪</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const deliveryIcon = L.divIcon({
  className: '',
  html: `<div style="background:#4f46e5;color:#fff;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);font-size:14px;">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const driverIcon = L.divIcon({
  className: '',
  html: `<div style="background:#059669;color:#fff;border-radius:9999px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:16px;">🛵</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function LeafletMap({ restaurantCoords, deliveryCoords, driverCoords }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const layersRef = useRef({});

  useEffect(() => {
    if (!containerRef.current || !restaurantCoords || !deliveryCoords) return undefined;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;
    Object.values(layersRef.current).forEach((layer) => {
      try {
        map.removeLayer(layer);
      } catch {
        /* ignore */
      }
    });

    const restaurantMarker = L.marker(
      [restaurantCoords.lat, restaurantCoords.lng],
      { icon: restaurantIcon }
    )
      .addTo(map)
      .bindPopup('Restaurant');
    const deliveryMarker = L.marker([deliveryCoords.lat, deliveryCoords.lng], {
      icon: deliveryIcon,
    })
      .addTo(map)
      .bindPopup('Delivery address');
    const route = L.polyline(
      [
        [restaurantCoords.lat, restaurantCoords.lng],
        [deliveryCoords.lat, deliveryCoords.lng],
      ],
      { color: '#ea580c', weight: 4, opacity: 0.75, dashArray: '8 8' }
    ).addTo(map);

    let driverMarker = null;
    if (driverCoords) {
      driverMarker = L.marker([driverCoords.lat, driverCoords.lng], {
        icon: driverIcon,
      })
        .addTo(map)
        .bindPopup('Courier');
    }

    layersRef.current = {
      restaurantMarker,
      deliveryMarker,
      route,
      driverMarker,
    };

    const bounds = L.latLngBounds([
      [restaurantCoords.lat, restaurantCoords.lng],
      [deliveryCoords.lat, deliveryCoords.lng],
    ]);
    if (driverCoords) bounds.extend([driverCoords.lat, driverCoords.lng]);
    map.fitBounds(bounds.pad(0.25));

    // Leaflet needs a resize after layout
    setTimeout(() => map.invalidateSize(), 50);

    return undefined;
  }, [restaurantCoords, deliveryCoords, driverCoords]);

  useEffect(
    () => () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    },
    []
  );

  return <div ref={containerRef} className="h-64 w-full rounded-xl sm:h-80" />;
}

function GoogleTrackingMap({ restaurantCoords, deliveryCoords, driverCoords }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_KEY,
    id: 'fooddash-maps',
  });

  const center = useMemo(
    () => driverCoords || restaurantCoords,
    [driverCoords, restaurantCoords]
  );

  if (loadError) {
    return (
      <LeafletMap
        restaurantCoords={restaurantCoords}
        deliveryCoords={deliveryCoords}
        driverCoords={driverCoords}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 sm:h-80">
        Loading Google Maps…
      </div>
    );
  }

  const path = [
    { lat: restaurantCoords.lat, lng: restaurantCoords.lng },
    { lat: deliveryCoords.lat, lng: deliveryCoords.lng },
  ];

  return (
    <GoogleMap
      mapContainerClassName="h-64 w-full rounded-xl sm:h-80"
      center={center}
      zoom={13}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      }}
      onLoad={(map) => {
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        if (driverCoords) bounds.extend(driverCoords);
        map.fitBounds(bounds, 48);
      }}
    >
      <MarkerF position={restaurantCoords} title="Restaurant" />
      <MarkerF position={deliveryCoords} title="Delivery" />
      {driverCoords && <MarkerF position={driverCoords} title="Courier" />}
      <PolylineF
        path={path}
        options={{
          strokeColor: '#ea580c',
          strokeOpacity: 0.8,
          strokeWeight: 4,
        }}
      />
    </GoogleMap>
  );
}

export default function LiveTrackingMap({ order }) {
  const baseTracking = useMemo(() => resolveTracking(order), [order]);
  const [animProgress, setAnimProgress] = useState(null);

  useEffect(() => {
    if (!baseTracking || order?.status === 'cancelled') {
      setAnimProgress(null);
      return undefined;
    }

    const target = baseTracking.progress ?? progressForStatus(order?.status);
    // Soft animation when moving to out_for_delivery
    if (order?.status === 'out_for_delivery') {
      let frame = 0;
      const start = Math.min(target, 0.4);
      const end = Math.max(target, 0.85);
      setAnimProgress(start);
      const id = setInterval(() => {
        frame += 1;
        const t = Math.min(frame / 40, 1);
        setAnimProgress(start + (end - start) * t);
        if (t >= 1) clearInterval(id);
      }, 120);
      return () => clearInterval(id);
    }

    setAnimProgress(target);
    return undefined;
  }, [baseTracking, order?.status]);

  if (!order || order.status === 'cancelled') {
    return null;
  }

  if (!baseTracking?.restaurantCoords || !baseTracking?.deliveryCoords) {
    return (
      <section className="card p-5">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Live tracking</h2>
        <p className="text-sm text-slate-500">
          Map coordinates are not available for this order yet.
        </p>
      </section>
    );
  }

  const progress =
    animProgress == null
      ? baseTracking.progress
      : animProgress;
  const driverCoords =
    interpolateCoords(
      baseTracking.restaurantCoords,
      baseTracking.deliveryCoords,
      progress
    ) || baseTracking.driverCoords;

  const usingGoogle = Boolean(GOOGLE_KEY);
  const percent = Math.round((progress || 0) * 100);

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Live tracking</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {trackingMessage(order.status)}
          </p>
        </div>
        <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {statusLabel(order.status)} · {percent}%
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Store className="h-3.5 w-3.5 text-brand-600" /> Restaurant
          </span>
          <span className="inline-flex items-center gap-1">
            <Truck className="h-3.5 w-3.5 text-emerald-600" /> Courier
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-indigo-600" /> You
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Navigation className="h-3.5 w-3.5" />
            {usingGoogle ? 'Google Maps' : 'OpenStreetMap'}
          </span>
        </div>

        {usingGoogle ? (
          <GoogleTrackingMap
            restaurantCoords={baseTracking.restaurantCoords}
            deliveryCoords={baseTracking.deliveryCoords}
            driverCoords={driverCoords}
          />
        ) : (
          <LeafletMap
            restaurantCoords={baseTracking.restaurantCoords}
            deliveryCoords={baseTracking.deliveryCoords}
            driverCoords={driverCoords}
          />
        )}
      </div>

      <div className="px-5 py-4">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Simulated live tracking updates as the restaurant advances your order status.
        </p>
      </div>
    </section>
  );
}
