export type PostalRoute = {
  id: string; zip: string; city: string; residential: number; business: number;
  income: number | null; age: number | null; household: number | null;
  paths: [number, number][][]; fetchedAt: string;
};
export const AD_SIZES = [
  { label: '1/6 panel', rate: 0.10 }, { label: '1/4 panel', rate: 0.15 },
  { label: '1/3 panel', rate: 0.20 }, { label: '1/2 panel', rate: 0.30 },
  { label: 'Full panel', rate: 0.60 },
];
export type PostalResponse = { fetchedAt?: string; error?: string; results?: { paramName: string; value: {
  spatialReference?: { wkid: number }; exceededTransferLimit?: boolean;
  features: { attributes: Record<string, unknown>; geometry?: { paths?: number[][][] } }[];
} }[] };
export function normalizeRoutes(data: PostalResponse): PostalRoute[] {
  const value = data.results?.find(r => r.paramName === 'Output_Feature_Class')?.value;
  if (data.error || !value || !Array.isArray(value.features) || value.exceededTransferLimit) throw new Error(data.error || 'Incomplete route data.');
  if (value.spatialReference?.wkid !== 4326) throw new Error('Unsupported map coordinates.');
  const count = (n: unknown) => Math.max(0, Math.round(Number(n) || 0));
  const demographic = (n: unknown) => Number(n) > 0 ? Number(n) : null;
  return value.features.flatMap(f => {
    const a = f.attributes;
    const id = String(a.ZIP_CRID || '');
    const paths = (f.geometry?.paths || []).map(p => p.filter(c => Number.isFinite(c[0]) && Number.isFinite(c[1]) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90).map(c => [c[1], c[0]] as [number, number])).filter(p => p.length > 1);
    if (!/^77\d{3}[CRH]\d{3}$/.test(id) || !paths.length) return [];
    return [{ id, zip: String(a.ZIP_CODE), city: String(a.CITY_STATE || ''), residential: count(a.RES_CNT), business: count(a.BUS_CNT), income: demographic(a.MED_INCOME), age: demographic(a.MED_AGE), household: demographic(a.AVG_HH_SIZ), paths, fetchedAt: data.fetchedAt || '' }];
  });
}
export function totalDeliveries(routes: PostalRoute[], includeBusiness: boolean): number {
  return routes.reduce((sum, r) => sum + r.residential + (includeBusiness ? r.business : 0), 0);
}
export function withinPolygon(point: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i], [yj, xj] = polygon[j];
    if ((yi > point[0]) !== (yj > point[0]) && point[1] < (xj - xi) * (point[0] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
type Point = [number, number];
export function routeTouchesPolygon(paths: Point[][], polygon: Point[]): boolean {
  const cross = (a: Point, b: Point, c: Point) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const onSegment = (a: Point, b: Point, p: Point) => Math.abs(cross(a, b, p)) < 1e-12 && p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0]) && p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1]);
  const intersects = (a: Point, b: Point, c: Point, d: Point) => {
    const x = cross(a, b, c), y = cross(a, b, d), z = cross(c, d, a), w = cross(c, d, b);
    return ((x > 0) !== (y > 0) && (z > 0) !== (w > 0)) || onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
  };
  return polygon.length >= 3 && paths.some(path => path.some(p => withinPolygon(p, polygon)) || path.some((p, i) => i > 0 && polygon.some((v, j) => intersects(path[i - 1], p, v, polygon[(j + 1) % polygon.length]))));
}
export function routeTouchesRadius(paths: Point[][], center: Point, meters: number): boolean {
  // Local equirectangular projection, suitable for the planner's 0.5–10 mile radii.
  const project = (p: Point): Point => [(p[0] - center[0]) * 111195, (p[1] - center[1]) * 111195 * Math.cos(center[0] * Math.PI / 180)];
  return paths.some(path => path.some((p, i) => {
    const b = project(p), a = project(path[Math.max(0, i - 1)]), dx = b[0] - a[0], dy = b[1] - a[1];
    const t = dx * dx + dy * dy ? Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / (dx * dx + dy * dy))) : 0;
    return Math.hypot(a[0] + t * dx, a[1] + t * dy) <= meters;
  }));
}
export function routeSelectionText(routes: PostalRoute[], includeBusiness: boolean, sizeIndex: number, flags: string[]): string {
  const doors = totalDeliveries(routes, includeBusiness), size = AD_SIZES[sizeIndex];
  return `HLN route inquiry\nRoutes: ${routes.map(r => r.id).join(', ')}\n${doors.toLocaleString()} estimated deliveries (${includeBusiness ? 'residential + business' : 'residential only'})\nAd size: ${size.label} at $${size.rate.toFixed(2)}/door\nEstimated ad cost: $${(doors * size.rate).toFixed(2)}\nHousing type: not verified; cluster mailboxes need review.${flags.length ? '\nFlagged for cluster-mailbox review: ' + flags.join(', ') : ''}\nCounts and route availability must be reconfirmed before mailing.`;
}
