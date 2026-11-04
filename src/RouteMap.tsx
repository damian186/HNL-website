import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const HOUSTON_CENTER: [number, number] = [29.76, -95.36];
const DEFAULT_ZOOM = 10;
const PERIMETER_ZOOM = 11; // zip outlines become prominent here
const ROUTE_REVEAL_ZOOM = 12; // auto-reveal routes for the centered zip here

type ZipFeature = {
  type: "Feature";
  properties: { zip: string; aland: number };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

type ZipCollection = { type: "FeatureCollection"; features: ZipFeature[] };

type RouteFeature = {
  type: "Feature";
  properties: {
    zip: string;
    route_id: string;
    doors: number;
    homes: number;
    apartments: number;
    spots_left: number;
    shade: number;
  };
  geometry: {
    type: "LineString" | "MultiLineString";
    coordinates: number[][] | number[][][];
  };
};

type RouteCollection = { type: "FeatureCollection"; features: RouteFeature[] };

type ZipMeta = { routes: number; doors: number; homes: number; apartments: number };
type ZipMetaMap = Record<string, ZipMeta>;

/* ---------- route shade palette ----------
 * Routes inside a zip cycle through these distinct oranges so neighbouring
 * routes never share a colour (the generator assigns shade = index % 5, and
 * routes are laid out as stacked bands, so adjacent bands always differ).
 */
const ROUTE_SHADES = ["#f7955c", "#ef7a35", "#d95f1e", "#f4a870", "#c2571b"];

/* ---------- choropleth color scale ----------
 * Door counts are heavily skewed (one zip can carry ~21k doors while the
 * median is ~3k), so a linear doors/max scale crushes ~77% of zips into the
 * cream end and they vanish against the basemap. A sqrt scale spreads the
 * whole distribution across the ramp, and the ramp starts at a warm sand
 * (not the basemap cream) so even the smallest zip reads as a colored zone.
 */
function scaleT(doors: number, maxDoors: number): number {
  const linear = maxDoors > 0 ? Math.min(1, doors / maxDoors) : 0;
  return Math.sqrt(linear);
}

function fillColor(doors: number, maxDoors: number): string {
  const t = scaleT(doors, maxDoors);
  // warm sand rgb(235,216,186) -> brand orange #f7955c rgb(247,149,92)
  const r = Math.round(235 + (247 - 235) * t);
  const g = Math.round(216 + (149 - 216) * t);
  const b = Math.round(186 + (92 - 186) * t);
  return `rgb(${r},${g},${b})`;
}

function fillOpacity(doors: number, maxDoors: number): number {
  const t = scaleT(doors, maxDoors);
  return 0.55 + 0.35 * t;
}

/* ---------- point-in-polygon (ray casting) for auto-reveal ---------- */
function pointInRing(pt: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > pt[1] !== yj > pt[1] &&
      pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeom(
  pt: [number, number],
  geom: ZipFeature["geometry"],
): boolean {
  if (geom.type === "Polygon") {
    const coords = geom.coordinates as number[][][];
    return coords.length > 0 && pointInRing(pt, coords[0]);
  }
  if (geom.type === "MultiPolygon") {
    const coords = geom.coordinates as number[][][][];
    return coords.some(
      (poly) => poly.length > 0 && pointInRing(pt, poly[0]),
    );
  }
  return false;
}

function findZipAt(
  collection: ZipCollection,
  lat: number,
  lng: number,
): ZipFeature | null {
  // GeoJSON coords are [lng, lat]
  const pt: [number, number] = [lng, lat];
  for (const f of collection.features) {
    if (pointInGeom(pt, f.geometry)) return f;
  }
  return null;
}

/* ---------- map event bridge ---------- */
function MapEvents({
  onZoom,
  onInteract,
}: {
  onZoom: (zoom: number, center: L.LatLng) => void;
  onInteract: () => void;
}) {
  useMapEvents({
    zoomend(e) {
      const map = e.target;
      onZoom(map.getZoom(), map.getCenter());
    },
    click() {
      onInteract();
    },
  });
  return null;
}

/* ---------- zip choropleth layer ---------- */
function ZipLayer({
  data,
  meta,
  maxDoors,
  zoom,
  selectedZip,
  onSelect,
}: {
  data: ZipCollection;
  meta: ZipMetaMap;
  maxDoors: number;
  zoom: number;
  selectedZip: string | null;
  onSelect: (zip: string, bounds: L.LatLngBounds | null) => void;
}) {
  const layerRef = useRef<L.GeoJSON | null>(null);

  const styleFn = useCallback(
    (feature?: { properties?: { zip?: string } }): L.PathOptions => {
      const zip = feature?.properties?.zip ?? "";
      const m = meta[zip];
      const doors = m?.doors ?? 0;
      const isSelected = selectedZip === zip;
      const prominent = zoom >= PERIMETER_ZOOM;

      // Selected zip keeps its choropleth fill — no heavy/blue outline.
      // The fly-to + route reveal already make the selection obvious, so we
      // only nudge the perimeter weight up slightly for definition.
      if (isSelected) {
        return {
          color: "#0e0e0c",
          weight: 2,
          opacity: 0.85,
          fillColor: fillColor(doors, maxDoors),
          fillOpacity: 0.9,
        };
      }
      return {
        color: "#0e0e0c",
        weight: prominent ? 1.3 : 0.6,
        opacity: prominent ? 0.65 : 0.25,
        fillColor: fillColor(doors, maxDoors),
        // keep the choropleth visible at every zoom — only the perimeter
        // weight/opacity steps up once you're close enough
        fillOpacity: fillOpacity(doors, maxDoors),
      };
    },
    [meta, maxDoors, zoom, selectedZip],
  );

  // Re-apply styles whenever zoom / selection / data changes.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.setStyle(styleFn as never);
  }, [styleFn]);

  const onEachFeature = useCallback(
    (feature: { properties?: { zip?: string } }, layer: L.Layer) => {
      const zip = feature?.properties?.zip ?? "";
      const m = meta[zip];
      const doors = m?.doors ?? 0;
      const routes = m?.routes ?? 0;
      const path = layer as L.Path & {
        bindTooltip: (c: string, o?: object) => void;
        on: (ev: string, fn: () => void) => void;
        getBounds: () => L.LatLngBounds;
      };
      path.bindTooltip(
        `<strong>${zip}</strong> · ${doors.toLocaleString()} doors/mo · ${routes} routes`,
        { sticky: true, direction: "top", className: "routemap__tip" },
      );
      path.on("click", () => {
        onSelect(zip, path.getBounds());
      });
    },
    [meta, onSelect],
  );

  return (
    <GeoJSON
      ref={layerRef as never}
      data={data as never}
      style={styleFn as never}
      onEachFeature={onEachFeature as never}
    />
  );
}

/* ---------- route lines for the selected zip ----------
 * Each route gets its own orange shade (cycled so neighbours differ) and a
 * cream casing for legibility over the choropleth. No prices here — pricing
 * is quoted per client, so the map only shows coverage (doors, homes, units).
 */
function RouteLayer({ data }: { data: RouteCollection }) {
  return (
    <>
      {/* cream casing for legibility over the choropleth */}
      <GeoJSON
        key={`casing-${data.features.length}`}
        data={data as never}
        style={{
          color: "#f4efe6",
          weight: 6,
          opacity: 0.9,
          fill: false,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* animated dashed delivery path, one shade per route */}
      <GeoJSON
        key={`dash-${data.features.length}`}
        data={data as never}
        style={(feature?: { properties?: { shade?: number } }): L.PathOptions => ({
          color: ROUTE_SHADES[(feature?.properties?.shade ?? 0) % ROUTE_SHADES.length],
          weight: 3,
          opacity: 0.95,
          fill: false,
          dashArray: "8 7",
          lineCap: "round",
          lineJoin: "round",
          className: "routemap__route",
        })}
        onEachFeature={(feature, layer) => {
          const p = (feature as RouteFeature).properties;
          const path = layer as L.Path & {
            bindTooltip: (c: string, o?: object) => void;
          };
          path.bindTooltip(
            `<strong>Route ${p.route_id}</strong> · ${p.doors.toLocaleString()} doors (${p.homes.toLocaleString()} homes · ${p.apartments.toLocaleString()} units)`,
            { sticky: true, className: "routemap__tip" },
          );
        }}
      />
    </>
  );
}

/* ---------- selected-zip detail panel ----------
 * Shows coverage only (routes, doors, homes vs apartment units). No dollar
 * figures — pricing is quoted per client, so nothing on the map implies a rate.
 */
function RoutePanel({
  zip,
  meta,
  routes,
  onClose,
}: {
  zip: string;
  meta: ZipMetaMap;
  routes: RouteFeature[];
  onClose: () => void;
}) {
  const m = meta[zip];
  return (
    <aside className="routemap__panel" aria-label={`Routes in zip ${zip}`}>
      <div className="routemap__panel-head">
        <div>
          <p className="routemap__panel-eyebrow">Zip code</p>
          <p className="routemap__panel-zip">{zip}</p>
        </div>
        <button
          type="button"
          className="routemap__panel-close"
          onClick={onClose}
          aria-label="Close route panel"
        >
          ✕
        </button>
      </div>

      {m ? (
        <>
          <p className="routemap__panel-meta">
            <strong>{m.routes}</strong> routes · <strong>{m.doors.toLocaleString()}</strong>{" "}
            doors/mo
          </p>
          <p className="routemap__panel-split">
            <span className="routemap__split-item">
              <i className="routemap__split-dot routemap__split-dot--home" />
              <strong>{m.homes.toLocaleString()}</strong> homes
            </span>
            <span className="routemap__split-item">
              <i className="routemap__split-dot routemap__split-dot--apt" />
              <strong>{m.apartments.toLocaleString()}</strong> apartment units
            </span>
          </p>
        </>
      ) : (
        <p className="routemap__panel-meta">
          No active routes yet — ask at booking.
        </p>
      )}

      {routes.length > 0 && (
        <ol className="routemap__routes">
          {routes.map((r) => (
            <li key={r.properties.route_id} className="routemap__route-row">
              <span
                className="routemap__route-shade"
                style={{
                  background:
                    ROUTE_SHADES[r.properties.shade % ROUTE_SHADES.length],
                }}
                aria-hidden="true"
              />
              <span className="routemap__route-id">{r.properties.route_id}</span>
              <span className="routemap__route-doors">
                {r.properties.doors.toLocaleString()} doors ·{" "}
                {r.properties.homes.toLocaleString()} homes ·{" "}
                {r.properties.apartments.toLocaleString()} units
              </span>
              <span
                className={
                  r.properties.spots_left > 0
                    ? "routemap__spot routemap__spot--open"
                    : "routemap__spot routemap__spot--full"
                }
              >
                {r.properties.spots_left > 0
                  ? `${r.properties.spots_left} open`
                  : "full"}
              </span>
            </li>
          ))}
        </ol>
      )}

      <a className="routemap__panel-cta" href="#reserve">
        Reserve in {zip}
      </a>
    </aside>
  );
}

/* ---------- main section ---------- */
export function RouteMapSection() {
  const [zipData, setZipData] = useState<ZipCollection | null>(null);
  const [routeData, setRouteData] = useState<RouteCollection | null>(null);
  const [meta, setMeta] = useState<ZipMetaMap>({});
  const [selectedZip, setSelectedZip] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/houston_zips.geojson").then((r) => r.json()),
      fetch("/houston_routes.geojson").then((r) => r.json()),
      fetch("/zip_meta.json").then((r) => r.json()),
    ])
      .then(([zips, routes, metaJson]) => {
        if (!alive) return;
        setZipData(zips as ZipCollection);
        setRouteData(routes as RouteCollection);
        setMeta(metaJson as ZipMetaMap);
      })
      .catch(() => {
        /* leave the map empty; header still renders */
      });
    return () => {
      alive = false;
    };
  }, []);

  const maxDoors = useMemo(
    () => Math.max(1, ...Object.values(meta).map((m) => m.doors)),
    [meta],
  );

  const selectedRoutes = useMemo(() => {
    if (!routeData || !selectedZip) return null;
    const feats = routeData.features.filter(
      (f) => f.properties.zip === selectedZip,
    );
    if (feats.length === 0) return null;
    return { type: "FeatureCollection", features: feats } as RouteCollection;
  }, [routeData, selectedZip]);

  const handleSelect = useCallback(
    (zip: string, bounds: L.LatLngBounds | null) => {
      setSelectedZip(zip);
      if (bounds && mapRef.current) {
        mapRef.current.flyToBounds(bounds, {
          padding: [60, 60],
          maxZoom: 14,
          duration: 0.8,
        });
      }
    },
    [],
  );

  const handleZoom = useCallback(
    (z: number, center: L.LatLng) => {
      setZoom(z);
      // zoom way out -> drop the selection so the overview reads clean
      if (z < PERIMETER_ZOOM) {
        setSelectedZip(null);
        return;
      }
      // zoom deep into an area -> auto-reveal the centered zip's routes
      if (z >= ROUTE_REVEAL_ZOOM) {
        setSelectedZip((current) => {
          if (current) return current;
          if (!zipData) return current;
          const hit = findZipAt(zipData, center.lat, center.lng);
          return hit ? hit.properties.zip : current;
        });
      }
    },
    [zipData],
  );

  // Toggle Leaflet's scroll-wheel zoom imperatively (prop is init-only).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (scrollEnabled) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
  }, [scrollEnabled]);

  const handleMapRef = useCallback((instance: L.Map | null) => {
    mapRef.current = instance;
  }, []);

  return (
    <section className="section routemap" id="map" aria-label="Interactive route map">
      <div className="routemap__head">
        <p className="eyebrow">Route map — greater Houston</p>
        <h2>
          Zoom into <span className="script">your</span> zip.
        </h2>
        <p className="routemap__sub">
          Every outlined zip is a live delivery zone, shaded by monthly door
          reach. Zoom in — or click a zip — to see the exact mailing routes
          inside it, door counts and all. Katy to Baytown, Webster to Conroe.
        </p>
      </div>

      <div
        className="routemap__frame"
        onMouseLeave={() => setScrollEnabled(false)}
      >
        <MapContainer
          ref={handleMapRef as never}
          center={HOUSTON_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={9}
          maxZoom={16}
          scrollWheelZoom={false}
          className="routemap__map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapEvents onZoom={handleZoom} onInteract={() => setScrollEnabled(true)} />
          {zipData && (
            <ZipLayer
              data={zipData}
              meta={meta}
              maxDoors={maxDoors}
              zoom={zoom}
              selectedZip={selectedZip}
              onSelect={handleSelect}
            />
          )}
          {selectedRoutes && <RouteLayer data={selectedRoutes} />}
        </MapContainer>

        {!zipData && (
          <div className="routemap__loading">Loading route map…</div>
        )}

        <div className="routemap__hint" aria-hidden="true">
          {scrollEnabled
            ? "scroll to zoom · click a zip"
            : "click the map, then scroll to zoom"}
        </div>

        {selectedZip && (
          <RoutePanel
            zip={selectedZip}
            meta={meta}
            routes={selectedRoutes ? selectedRoutes.features : []}
            onClose={() => setSelectedZip(null)}
          />
        )}
      </div>

      <div className="routemap__legend" aria-hidden="true">
        <span className="routemap__legend-item">
          <i className="routemap__swatch routemap__swatch--low" /> fewer doors
        </span>
        <span className="routemap__legend-item">
          <i className="routemap__swatch routemap__swatch--high" /> more doors / mo
        </span>
        <span className="routemap__legend-item">
          <i className="routemap__dash" /> one mailing route
        </span>
        <span className="routemap__legend-item">
          <i className="routemap__split-dot routemap__split-dot--home" /> single-family home
        </span>
        <span className="routemap__legend-item">
          <i className="routemap__split-dot routemap__split-dot--apt" /> apartment unit
        </span>
      </div>
    </section>
  );
}
