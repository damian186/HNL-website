import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './route-planner.css';
import { AD_SIZES, normalizeRoutes, routeSelectionText, totalDeliveries, routeTouchesPolygon, routeTouchesRadius, type PostalResponse, type PostalRoute } from './route-planner';

const number = (n: number) => n.toLocaleString('en-US');
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const adCost = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STORAGE_KEY = 'hln-route-plan-v1';
type History = { past: string[][]; current: string[]; future: string[][] };
type View = 'Map' | 'Satellite' | 'Hybrid' | 'Table';
type Mode = 'click' | 'draw' | 'radius';
const places = [{ name: 'New Caney', zip: '77357' }, { name: 'Porter', zip: '77365' }, { name: 'Kingwood', zip: '77339' }, { name: 'Spring', zip: '77373' }, { name: 'Conroe', zip: '77301' }, { name: 'The Woodlands', zip: '77380' }, { name: 'Humble', zip: '77338' }, { name: 'Houston', zip: '77002' }];

function MapBridge({ routes, fitKey, mode, points, setPoints, radiusCenter, setRadiusCenter, radiusMiles, fullscreen }: {
  routes: PostalRoute[]; fitKey: number; mode: Mode; points: [number, number][];
  setPoints: React.Dispatch<React.SetStateAction<[number, number][]>>;
  radiusCenter: [number, number] | null; setRadiusCenter: (p: [number, number]) => void; radiusMiles: number; fullscreen: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    const coordinates = routes.flatMap(r => r.paths.flat());
    let frame = 0;
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
        if (coordinates.length && map.getContainer().clientWidth > 0) {
          map.fitBounds(L.latLngBounds(coordinates), { padding: [30, 60], maxZoom: 14, animate: false });
        }
      });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(map.getContainer());
    fit();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [map, fitKey, routes, fullscreen]);
  useMapEvents({ click(e) {
    if (mode === 'draw') setPoints(p => [...p, [e.latlng.lat, e.latlng.lng]]);
    if (mode === 'radius') setRadiusCenter([e.latlng.lat, e.latlng.lng]);
  } });
  return <>
    {points.length > 0 && <Polyline positions={points} pathOptions={{ color: '#0e0e0c', dashArray: '6 6', weight: 2 }} />}
    {points.length >= 3 && <Polygon positions={points} pathOptions={{ color: '#0e0e0c', fillOpacity: 0.08, weight: 2 }} />}
    {mode === 'radius' && radiusCenter && <Circle center={radiusCenter} radius={radiusMiles * 1609.344} pathOptions={{ color: '#0e0e0c', weight: 2, fillOpacity: 0.07, dashArray: '5 5' }} />}
  </>;
}

export function RouteMapSection() {
  const [routes, setRoutes] = useState<PostalRoute[]>([]);
  const [history, setHistory] = useState<History>({ past: [], current: [], future: [] });
  const [view, setView] = useState<View>('Map');
  const [mode, setMode] = useState<Mode>('click');
  const [query, setQuery] = useState('77357');
  const [filter, setFilter] = useState('');
  const [loaded, setLoaded] = useState<string[]>([]);
  const [activeZip, setActiveZip] = useState('77357');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [includeBusiness, setIncludeBusiness] = useState(false);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [incomeMin, setIncomeMin] = useState(0);
  const [heatmap, setHeatmap] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [radiusCenter, setRadiusCenter] = useState<[number, number] | null>(null);
  const [radiusMiles, setRadiusMiles] = useState(2);
  const [flags, setFlags] = useState<string[]>([]);
  const [showSelected, setShowSelected] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const loadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const changeSelection = useCallback((next: string[] | ((current: string[]) => string[])) => {
    setHistory(h => {
      const value = typeof next === 'function' ? next(h.current) : next;
      if (JSON.stringify([...value].sort()) === JSON.stringify([...h.current].sort())) return h;
      return { past: [...h.past.slice(-29), h.current], current: value, future: [] };
    });
  }, []);
  const toggleRoute = useCallback((id: string) => changeSelection(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]), [changeSelection]);

  const loadZip = useCallback(async (zip: string, initial = false) => {
    if (!/^77\d{3}$/.test(zip)) { setError('Enter a five-digit Greater Houston ZIP code beginning with 77.'); return; }
    if (loadingRef.current) return;
    loadingRef.current = true; setLoading(true); setError(''); setNotice('');
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const response = await fetch(initial ? '/route-data/77357.json' : `/api/routes?zip=${zip}`, { signal: controller.signal });
      if (!response.ok) {
        const message = await response.json().catch(() => ({}));
        throw new Error(message.error || 'Route lookup is unavailable. Try again in a moment.');
      }
      const data: PostalResponse = await response.json();
      const incoming = normalizeRoutes(data);
      if (!incoming.length) throw new Error(`No carrier routes were returned for ${zip}. Try a nearby ZIP code.`);
      setRoutes(current => [...current.filter(r => r.zip !== zip), ...incoming].sort((a, b) => a.id.localeCompare(b.id)));
      setLoaded(current => [...new Set([...current, zip])]);
      setActiveZip(zip); setFilter(''); setIncomeMin(0); setShowSelected(false); setPoints([]); setMode('click'); setView(v => v === 'Table' ? 'Map' : v);
      setFitKey(n => n + 1);
      setNotice(`${incoming.length} USPS routes loaded for ${zip}.`);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load routes.');
    } finally { if (abortRef.current === controller) { loadingRef.current = false; setLoading(false); } }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.version === 1 && Array.isArray(saved.routes) && saved.routes.length < 2000 && saved.routes.every((r: PostalRoute) => /^77\d{3}[CRH]\d{3}$/.test(r.id) && Array.isArray(r.paths) && r.paths.length > 0 && Number.isFinite(r.residential) && Number.isFinite(r.business))) {
        setRoutes(saved.routes); setLoaded([...new Set(saved.routes.map((r: PostalRoute) => r.zip))] as string[]);
        const restoredZip = saved.routes.some((r: PostalRoute) => r.zip === saved.activeZip) ? saved.activeZip : saved.routes[0]?.zip || '77357';
        setActiveZip(restoredZip); setQuery(restoredZip);
        setHistory({ past: [], current: Array.isArray(saved.selected) ? saved.selected.filter((id: string) => saved.routes.some((r: PostalRoute) => r.id === id)) : [], future: [] });
        setIncludeBusiness(Boolean(saved.includeBusiness));
        setSizeIndex(Number.isInteger(saved.sizeIndex) && saved.sizeIndex >= 0 && saved.sizeIndex < AD_SIZES.length ? saved.sizeIndex : 0);
        setFlags(Array.isArray(saved.flags) ? saved.flags.filter((id: string) => saved.routes.some((r: PostalRoute) => r.id === id)) : []);
        setHydrated(true); return;
      }
    } catch { /* Storage can be unavailable or out of space. */ }
    void loadZip('77357', true); setHydrated(true);
    return () => { abortRef.current?.abort(); loadingRef.current = false; };
  }, [loadZip]);

  useEffect(() => {
    if (!hydrated || !routes.length) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, routes, activeZip, selected: history.current, includeBusiness, sizeIndex, flags })); }
    catch { /* The planner still works when browser storage is unavailable. */ }
  }, [hydrated, routes, activeZip, history.current, includeBusiness, sizeIndex, flags]);
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', escape); };
  }, [fullscreen]);

  const selected = useMemo(() => routes.filter(r => history.current.includes(r.id)), [routes, history.current]);
  const areaRoutes = useMemo(() => routes.filter(r => r.zip === activeZip), [routes, activeZip]);
  const visible = useMemo(() => areaRoutes.filter(r => (!filter || `${r.id} ${r.city}`.toLowerCase().includes(filter.toLowerCase())) && (!incomeMin || (r.income !== null && r.income >= incomeMin)) && (!showSelected || history.current.includes(r.id))), [areaRoutes, filter, incomeMin, showSelected, history.current]);
  const doors = totalDeliveries(selected, includeBusiness);
  const residential = selected.reduce((n, r) => n + r.residential, 0);
  const businesses = selected.reduce((n, r) => n + r.business, 0);
  const price = Math.round(doors * AD_SIZES[sizeIndex].rate * 100) / 100;
  const dataDate = routes.map(r => r.fetchedAt).filter(Boolean).sort()[0];
  const selectionSummary = routeSelectionText(selected, includeBusiness, sizeIndex, flags.filter(id => history.current.includes(id)));

  function search(e: React.FormEvent) {
    e.preventDefault();
    const zip = query.match(/\b77\d{3}\b/)?.[0] || places.find(p => p.name.toLowerCase() === query.trim().toLowerCase())?.zip || '';
    void loadZip(zip);
  }
  function selectShape() {
    if (mode === 'draw' && points.length < 3) return;
    if (mode === 'radius' && !radiusCenter) return;
    const ids = visible.filter(r => mode === 'draw' ? routeTouchesPolygon(r.paths, points) : routeTouchesRadius(r.paths, radiusCenter!, radiusMiles * 1609.344)).map(r => r.id);
    changeSelection(current => [...new Set([...current, ...ids])]);
    setNotice(`${ids.length} routes intersect the selected area. Whole-route delivery counts apply.`);
    setPoints([]); setMode('click');
  }
  function exportSelection() {
    const csv = ['Route,City,Residential,Business,Included deliveries,Cluster mailbox review,Retrieved at', ...selected.map(r => [r.id, `"${r.city.replace(/"/g, '""')}"`, r.residential, r.business, r.residential + (includeBusiness ? r.business : 0), flags.includes(r.id) ? 'Flagged' : 'Not reviewed', r.fetchedAt].join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'HLN-route-selection.csv'; anchor.click(); URL.revokeObjectURL(url);
  }
  function useSelection() {
    window.dispatchEvent(new CustomEvent('hln-route-selection', { detail: selectionSummary }));
    setFullscreen(false); setNotice('Your route plan has been added to the inquiry section below.');
    setTimeout(() => document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  return <section className="section route-planner-section" id="map" aria-label="HLN interactive route planner">
    <div className="planner-heading"><div><p className="eyebrow">Your neighborhood. Your next customers.</p><h2>Put your business <span className="script">on the map.</span></h2></div><p>Explore actual USPS delivery routes. Choose your reach, compare neighborhoods, and build your mailer plan.</p></div>
    <div className={`planner ${fullscreen ? 'planner--fullscreen' : ''}`}>
      <header className="planner-topbar"><div className="planner-brand"><span className="planner-brand-mark">HLN<span>↗</span></span><div><strong>NEIGHBORHOOD PLANNER</strong><small>Greater Houston · Route selection</small></div></div><div className="planner-steps"><span className="active">1 <b>Target</b></span><i /><span>2 <b>Create</b></span><i /><span>3 <b>Launch</b></span></div><button className="planner-icon-button" onClick={() => setFullscreen(f => !f)} aria-label={fullscreen ? 'Exit full screen' : 'Expand route planner'}>{fullscreen ? '↙' : '⛶'}</button></header>
      <div className="planner-body">
        <aside className="planner-tools" aria-label="Route selection tools">
          <form className="planner-search" onSubmit={search}><label htmlFor="planner-zip">Find your neighborhood</label><div><input id="planner-zip" list="planner-places" value={query} onChange={e => setQuery(e.target.value)} placeholder="City or ZIP code" autoComplete="off" /><button disabled={loading} aria-label="Search ZIP code">{loading ? '…' : '→'}</button></div><datalist id="planner-places">{places.map(p => <option key={p.zip} value={p.zip}>{p.name}</option>)}</datalist></form>
          <div className="planner-loaded"><span>LOADED ZIPS</span><div>{loaded.map(zip => <button key={zip} onClick={() => { setQuery(zip); setActiveZip(zip); setView(v => v === 'Table' ? 'Map' : v); setFilter(''); setIncomeMin(0); setShowSelected(false); setPoints([]); setFitKey(n => n + 1); }}>{zip}</button>)}</div></div>
          <p className="planner-tool-label">Route selection</p>
          <button className={`planner-tool ${mode === 'click' ? 'is-active' : ''}`} onClick={() => { setMode('click'); setPoints([]); }}><span>☷</span> Choose from route list</button>
          <button className={`planner-tool ${mode === 'draw' ? 'is-active' : ''}`} onClick={() => { setMode('draw'); setPoints([]); setView(v => v === 'Table' ? 'Map' : v); }}><span>◇</span> Draw an area</button>
          <button className={`planner-tool ${mode === 'radius' ? 'is-active' : ''}`} onClick={() => { setMode('radius'); setPoints([]); setView(v => v === 'Table' ? 'Map' : v); }}><span>◎</span> Radius selection</button>
          {mode !== 'click' && <div className="planner-draw-panel"><p>{mode === 'draw' ? 'Click at least 3 points on the map to outline an area.' : 'Click the map to set the center.'}</p>{mode === 'radius' && <label>Radius: {radiusMiles} miles<input type="range" min="0.5" max="10" step="0.5" value={radiusMiles} onChange={e => setRadiusMiles(Number(e.target.value))} /></label>}<button className="planner-small-cta" disabled={mode === 'draw' ? points.length < 3 : !radiusCenter} onClick={selectShape}>Select intersecting routes</button><small>Only loaded routes are included. Entire routes are selected.</small></div>}
          <div className="planner-history"><button disabled={!history.past.length} onClick={() => setHistory(h => ({ past: h.past.slice(0, -1), current: h.past[h.past.length - 1], future: [h.current, ...h.future] }))}>↶ Undo</button><button disabled={!history.future.length} onClick={() => setHistory(h => ({ past: [...h.past, h.current], current: h.future[0], future: h.future.slice(1) }))}>↷ Redo</button></div>
          <p className="planner-tool-label">Neighborhood insights</p>
          <button className={`planner-tool ${heatmap ? 'is-active' : ''}`} onClick={() => setHeatmap(h => !h)} aria-pressed={heatmap}><span>◒</span> Income overlay</button>
          <label className="planner-filter-label" htmlFor="planner-income">Minimum median household income<select id="planner-income" value={incomeMin} onChange={e => setIncomeMin(Number(e.target.value))}><option value="0">Any income</option><option value="50000">$50,000+</option><option value="75000">$75,000+</option><option value="100000">$100,000+</option><option value="125000">$125,000+</option></select></label>
          <button className="planner-tool" onClick={() => { setFitKey(n => n + 1); setFilter(''); setIncomeMin(0); setShowSelected(false); }}><span>⌖</span> Fit ZIP routes</button>
          <button className="planner-clear" disabled={!selected.length} onClick={() => changeSelection([])}>× Clear selection</button>
          <div className="planner-source"><span className="planner-source-dot" /><strong>USPS route data</strong><p>Retrieved {dataDate ? new Date(dataDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}. Delivery counts are estimates; confirm before mailing.</p></div>
        </aside>
        <div className="planner-canvas">
          <nav className="planner-tabs" aria-label="Map view">{(['Map', 'Satellite', 'Hybrid', 'Table'] as View[]).map(v => <button key={v} aria-pressed={view === v} className={view === v ? 'is-active' : ''} onClick={() => { setView(v); if (v !== 'Table') setFitKey(n => n + 1); }}>{v}</button>)}</nav>
          <div className="planner-map" style={{ display: view === 'Table' ? 'none' : 'block' }}>
            <MapContainer center={[30.155, -95.19]} zoom={12} minZoom={8} maxZoom={19} scrollWheelZoom={false} className={`planner-leaflet ${mode !== 'click' ? 'planner-leaflet--draw' : ''}`}>
              {view === 'Map' && <TileLayer key="streets" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' />}
              {(view === 'Satellite' || view === 'Hybrid') && <TileLayer key="satellite" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Imagery &copy; Esri, Vantor, Earthstar Geographics, GIS User Community" />}
              {view === 'Hybrid' && <TileLayer key="labels" url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" attribution="Labels &copy; Esri" />}
              <MapBridge routes={areaRoutes} fitKey={fitKey} mode={mode} points={points} setPoints={setPoints} radiusCenter={radiusCenter} setRadiusCenter={setRadiusCenter} radiusMiles={radiusMiles} fullscreen={fullscreen} />
              {visible.map(r => {
                const checked = history.current.includes(r.id);
                const color = checked ? '#e5672c' : heatmap ? (r.income === null ? '#808780' : r.income >= 100000 ? '#165345' : r.income >= 75000 ? '#4e8a6d' : '#b1935b') : '#425e55';
                return <Polyline key={r.id} positions={r.paths} pathOptions={{ color, weight: checked ? 6 : 2.5, opacity: checked ? 1 : 0.5, interactive: mode === 'click', bubblingMouseEvents: false }} eventHandlers={{ click: () => { if (mode === 'click') toggleRoute(r.id); } }}><Tooltip sticky><div className="planner-tooltip"><strong>{r.id}</strong><span>{r.city}</span><b>{number(r.residential)} residential · {number(r.business)} business</b><span>Median household income: {r.income ? money(r.income) : 'Unavailable'}</span><small>Housing type unverified · click to {checked ? 'remove' : 'select'}</small></div></Tooltip></Polyline>;
              })}
            </MapContainer>
          </div>
          {view === 'Table' && <div className="planner-table-wrap"><table className="planner-table"><caption>USPS delivery routes · houses and apartments have not been separately verified</caption><thead><tr><th scope="col">Select</th><th scope="col">Route</th><th scope="col">Residential</th><th scope="col">Business</th><th scope="col">HH income</th><th scope="col">Housing review</th></tr></thead><tbody>{visible.map(r => <tr key={r.id} className={history.current.includes(r.id) ? 'is-selected' : ''}><td><input type="checkbox" aria-label={`Select ${r.id}`} checked={history.current.includes(r.id)} onChange={() => toggleRoute(r.id)} /></td><th scope="row"><strong>{r.id}</strong><small>{r.city}</small></th><td>{number(r.residential)}</td><td>{number(r.business)}</td><td>{r.income ? money(r.income) : '—'}</td><td><button className={`planner-review ${flags.includes(r.id) ? 'is-flagged' : ''}`} aria-pressed={flags.includes(r.id)} onClick={() => setFlags(f => f.includes(r.id) ? f.filter(id => id !== r.id) : [...f, r.id])}>{flags.includes(r.id) ? '⚑ Cluster flagged' : 'Flag cluster mailboxes'}</button></td></tr>)}</tbody></table>{!visible.length && <p className="planner-empty">No routes match these filters.</p>}</div>}
          <div className="planner-map-status"><span><i /> USPS route</span><span><i className="selected" /> Selected</span><span>{visible.length} routes shown</span></div>
          {heatmap && view !== 'Table' && <div className="planner-heatmap-key"><b>Median household income</b><span><i style={{ background: '#b1935b' }} /> Under $75k</span><span><i style={{ background: '#4e8a6d' }} /> $75k–$100k</span><span><i style={{ background: '#165345' }} /> $100k+</span><span><i style={{ background: '#808780' }} /> Unknown</span></div>}
          {loading && <div className="planner-loading" role="status"><span className="planner-spinner" /> Loading USPS routes…</div>}
          {error && <div className="planner-alert" role="alert">{error}</div>}
        </div>
        <aside className="planner-summary" aria-label="Selection summary">
          <div className="planner-route-picker">
            <div className="planner-route-picker-heading"><div><span>CHOOSE YOUR ROUTES</span><h3>ZIP {activeZip}</h3></div><b>{visible.length} routes</b></div>
            <p>Click a route below to highlight it on the map.</p>
            <div className="planner-route-list" role="group" aria-label={`Routes in ZIP ${activeZip}`}>
              {visible.map(r => {
                const checked = history.current.includes(r.id);
                return <label key={r.id} className={`planner-route-option ${checked ? 'is-selected' : ''}`}>
                  <input type="checkbox" aria-label={`Choose route ${r.id}`} checked={checked} onChange={() => toggleRoute(r.id)} />
                  <span><strong>{r.id}</strong><small>{number(r.residential)} residential · {number(r.business)} business</small></span>
                  <b className="planner-route-option-count">{number(r.residential + (includeBusiness ? r.business : 0))}<small>doors</small></b>
                </label>;
              })}
              {!visible.length && <p className="planner-route-list-empty">{loading ? 'Loading routes…' : 'No routes match your filters.'}</p>}
            </div>
            <small className="planner-route-picker-note">Orange routes are selected. Your total includes selections from all loaded ZIP codes.</small>
          </div>
          <p className="planner-tool-label">Your selection</p><div className="planner-count"><strong>{number(doors)}</strong><span>estimated deliveries</span></div>
          <div className="planner-summary-line"><span>Routes selected</span><strong>{selected.length}</strong></div><div className="planner-summary-line"><span>Residential</span><strong>{number(residential)}</strong></div><div className="planner-summary-line"><span>Business {includeBusiness ? 'included' : 'excluded'}</span><strong>{number(businesses)}</strong></div>
          <div className="planner-housing"><div><span>Single-family homes</span><strong>Not verified</strong></div><div><span>Apartments</span><strong>Not verified</strong></div></div>
          <label className="planner-switch"><input type="checkbox" checked={includeBusiness} onChange={e => setIncludeBusiness(e.target.checked)} /><span>Include business addresses</span></label>
          <div className="planner-price"><label htmlFor="planner-size">Your ad size<select id="planner-size" value={sizeIndex} onChange={e => setSizeIndex(Number(e.target.value))}>{AD_SIZES.map((s, i) => <option value={i} key={s.label}>{s.label} · ${s.rate.toFixed(2)}/door</option>)}</select></label><span>Estimated ad cost</span><strong>{adCost(price)}</strong><small>{number(doors)} deliveries × ${AD_SIZES[sizeIndex].rate.toFixed(2)} per door</small><p>Final distribution and availability confirmed with HLN.</p></div>
          <div className="planner-mailbox-note"><b>⌂ Houses can share mailboxes.</b><p>Cluster mailbox neighborhoods may be classified as apartments by some providers. Review the area before excluding it. This feed does not separate housing types.</p></div>
          <button className="planner-continue" disabled={!selected.length} onClick={useSelection}>Use these routes <span>→</span></button><button className="planner-export" disabled={!selected.length} onClick={exportSelection}>↓ Export selection CSV</button><small className="planner-saved">Your plan is saved in this browser when storage is available.</small>
        </aside>
      </div>
      <footer className="planner-footer"><div className="planner-route-filter"><input aria-label="Filter loaded routes" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter loaded routes or city…" /><label><input type="checkbox" checked={showSelected} onChange={e => setShowSelected(e.target.checked)} /> Selected only</label></div><p role="status" aria-live="polite">{notice || 'Click a route from the list on the right to highlight it on the map.'}</p></footer>
    </div>
    <p className="planner-fineprint">Route lines and residential/business counts: <a href="https://eddm.usps.com/eddm/select-routes.htm" target="_blank" rel="noreferrer">USPS EDDM</a>. These are delivery paths, not property boundaries. Area tools select whole loaded routes; they do not remove individual addresses. Housing classifications need a separate verified source.</p>
  </section>;
}
