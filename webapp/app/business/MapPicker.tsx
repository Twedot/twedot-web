"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface Props {
  lat: number | null;
  lng: number | null;
  onSelect?: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

export default function MapPicker({ lat, lng, onSelect, readOnly }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [located, setLocated] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const isDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const tileUrl = `${API_BASE}/tiles/${isDark ? "dark" : "light"}/{z}/{x}/{y}`;

    const center: L.LatLngExpression = lat && lng ? [lat, lng] : [6.5244, 3.3792];
    const zoom = lat && lng ? 15 : 12;

    const map = L.map(containerRef.current, {
      zoomControl: !readOnly,
      dragging: !readOnly,
      scrollWheelZoom: !readOnly,
      doubleClickZoom: !readOnly,
      touchZoom: !readOnly,
    }).setView(center, zoom);

    L.tileLayer(tileUrl, { maxZoom: 19, attribution: "" }).addTo(map);

    const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 22 14 22s14-12.37 14-22C28 6.27 21.73 0 14 0zm0 19a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" fill="#6B4EFF"/><path d="M14 9a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" fill="#fff"/></svg>`;
    const icon = L.divIcon({
      html: pinSvg,
      className: "",
      iconSize: [28, 36],
      iconAnchor: [14, 36],
    });

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    }

    if (!readOnly) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng], { icon }).addTo(map);
        }
        onSelect?.(clickLat, clickLng);
      });

      if (!lat && !lng) {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            if (!located) {
              map.setView([pos.coords.latitude, pos.coords.longitude], 15);
              setLocated(true);
            }
          },
          () => {},
          { enableHighAccuracy: false, timeout: 5000 }
        );
      }
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync marker position when lat/lng props change externally
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [lat, lng]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
