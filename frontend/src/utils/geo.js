export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export const TRANSFORMERS = [
  { code:"T001", name:"Ameerpet Substation",   ward:"Ameerpet",     discom:"TSSPDCL", lat:17.4374, lng:78.4487 },
  { code:"T002", name:"Kukatpally Grid",        ward:"Kukatpally",   discom:"TSSPDCL", lat:17.4849, lng:78.4138 },
  { code:"T003", name:"LB Nagar Junction",      ward:"LB Nagar",     discom:"TSSPDCL", lat:17.3467, lng:78.5523 },
  { code:"T004", name:"Madhapur IT Corridor",   ward:"Madhapur",     discom:"TSSPDCL", lat:17.4478, lng:78.3924 },
  { code:"T005", name:"Secunderabad Station",   ward:"Secunderabad", discom:"TSNPDCL", lat:17.4399, lng:78.4983 },
  { code:"T006", name:"Begumpet Main",          ward:"Begumpet",     discom:"TSSPDCL", lat:17.4433, lng:78.4672 },
];

export function getNearestTransformer(lat, lng) {
  let nearest = null, minDist = Infinity;
  for (const t of TRANSFORMERS) {
    const d = haversine(lat, lng, t.lat, t.lng);
    if (d < minDist) { minDist = d; nearest = { ...t, distanceM: Math.round(d) }; }
  }
  return nearest;
}
