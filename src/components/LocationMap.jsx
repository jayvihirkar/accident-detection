import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [map, position]);

  return null;
}

export default function LocationMap({ live }) {
  const hasLocation = Number.isFinite(Number(live?.lat)) && Number.isFinite(Number(live?.lng));
  const position = hasLocation ? [Number(live.lat), Number(live.lng)] : [18.5204, 73.8567];
  const status = live?.status || 'UNKNOWN';

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Location</h2>
          <p className="text-sm text-slate-500">
            {hasLocation
              ? `${Number(live.lat).toFixed(5)}, ${Number(live.lng).toFixed(5)}`
              : 'GPS data unavailable'}
          </p>
        </div>
        {hasLocation ? (
          <a
            className="text-sm font-semibold text-sky-700 hover:text-sky-900"
            href={`https://www.google.com/maps?q=${live.lat},${live.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Open Google Maps
          </a>
        ) : null}
      </div>

      <div className="h-80 overflow-hidden rounded-lg border border-slate-200">
        <MapContainer center={position} zoom={15} scrollWheelZoom={false}>
          <MapUpdater position={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasLocation ? (
            <Marker position={position}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">Vehicle Location</p>
                  <p>Status: {status}</p>
                  <p>Speed: {live?.speed ?? 'Unavailable'} km/h</p>
                </div>
              </Popup>
            </Marker>
          ) : null}
        </MapContainer>
      </div>
    </section>
  );
}
