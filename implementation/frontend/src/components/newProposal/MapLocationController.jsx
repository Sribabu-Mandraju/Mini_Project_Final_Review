import { useEffect } from "react";
import L from "leaflet";
import { Circle, Marker, Popup, useMap, useMapEvents } from "react-leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = markerIcon;

const MapLocationController = ({
  center,
  radius,
  disasterName,
  onLocationSelect,
}) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.latitude, center.longitude], 10);
    }
  }, [center, map]);

  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onLocationSelect(lat, lng);
    },
  });

  if (!center) return null;

  return (
    <>
      <Marker position={[center.latitude, center.longitude]}>
        <Popup>
          <strong>{disasterName || "Selected Location"}</strong>
          <div className="text-xs">
            {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
          </div>
        </Popup>
      </Marker>
      {radius > 0 ? (
        <Circle
          center={[center.latitude, center.longitude]}
          radius={radius * 1000}
          pathOptions={{
            color: "#fb7185",
            fillColor: "#fb7185",
            fillOpacity: 0.2,
            weight: 2,
            dashArray: "6, 6",
          }}
        />
      ) : null}
    </>
  );
};

export default MapLocationController;
