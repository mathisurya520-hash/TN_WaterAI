import { Station } from '../types';

export function classifyClientSample(
  ph: number | null,
  doVal: number | null,
  bod: number | null,
  fc: number | null,
  tc: number | null,
  ec: number | null,
  ammonia: number | null
): string {
  if (ph === null || doVal === null) {
    return 'Unclassified';
  }

  // Severe pollution
  if (ph < 6.0 || ph > 9.0 || doVal < 2.0 || (bod !== null && bod > 15.0)) {
    return 'Below Class E (Severely Polluted)';
  }

  const coliform = fc !== null ? fc : tc;

  // Class A
  if (ph >= 6.5 && ph <= 8.5 && doVal >= 6.0 && (bod === null || bod <= 2.0) && (coliform === null || coliform <= 50)) {
    return 'Class A (Drinking without treatment)';
  }

  // Class B
  if (ph >= 6.5 && ph <= 8.5 && doVal >= 5.0 && (bod === null || bod <= 3.0) && (coliform === null || coliform <= 500)) {
    return 'Class B (Outdoor Bathing)';
  }

  // Class C
  if (ph >= 6.0 && ph <= 9.0 && doVal >= 4.0 && (bod === null || bod <= 3.0) && (coliform === null || coliform <= 5000)) {
    return 'Class C (Drinking after conventional treatment)';
  }

  // Class D
  if (ph >= 6.5 && ph <= 8.5 && doVal >= 4.0 && (ammonia === null || ammonia <= 1.2)) {
    return 'Class D (Wildlife & Fisheries)';
  }

  // Class E
  if (ph >= 6.0 && ph <= 8.5 && (ec === null || ec <= 2250)) {
    return 'Class E (Irrigation & Industrial Cooling)';
  }

  return 'Below Class E (Non-Conforming)';
}

export function parseClientCSV(csvText: string): Station[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header
  const header = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

  // Find column indices
  const latIdx = header.findIndex((h) => h.includes('latitude') || h === 'lat' || h === 'y');
  const lonIdx = header.findIndex((h) => h.includes('longitude') || h === 'lon' || h === 'lng' || h === 'x');
  const nameIdx = header.findIndex((h) => h.includes('station') || h.includes('name') || h === 'location' || h === 'site');
  const distIdx = header.findIndex((h) => h.includes('district') || h === 'dist');
  const sourceIdx = header.findIndex((h) => h.includes('source') || h.includes('type') || h.includes('category'));
  const riverIdx = header.findIndex((h) => h.includes('river') || h.includes('basin'));
  
  // Parameters
  const phIdx = header.findIndex((h) => h === 'ph' || h.includes('potential of hydrogen'));
  const doIdx = header.findIndex((h) => h.includes('dissolved oxygen') || h === 'do');
  const bodIdx = header.findIndex((h) => h.includes('biochemical') || h === 'bod');
  const ecIdx = header.findIndex((h) => h.includes('conductivity') || h === 'ec');
  const fcIdx = header.findIndex((h) => h.includes('fecal') || h === 'fc');
  const tcIdx = header.findIndex((h) => h.includes('total coliform') || h === 'tc');

  if (latIdx === -1 || lonIdx === -1) {
    throw new Error('CSV must contain Latitude and Longitude columns to map stations.');
  }

  const stations: Station[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (row.length < 2) continue;

    const lat = parseFloat(row[latIdx]);
    const lon = parseFloat(row[lonIdx]);

    if (isNaN(lat) || isNaN(lon)) continue;

    const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : `Station ${i}`;
    const district = distIdx !== -1 && row[distIdx] ? row[distIdx] : 'Unspecified';
    const sourceCat = sourceIdx !== -1 && row[sourceIdx] ? row[sourceIdx] : 'River / Surface Water';
    const river = riverIdx !== -1 && row[riverIdx] ? row[riverIdx] : '-';

    const ph = phIdx !== -1 && !isNaN(parseFloat(row[phIdx])) ? parseFloat(row[phIdx]) : null;
    const doVal = doIdx !== -1 && !isNaN(parseFloat(row[doIdx])) ? parseFloat(row[doIdx]) : null;
    const bod = bodIdx !== -1 && !isNaN(parseFloat(row[bodIdx])) ? parseFloat(row[bodIdx]) : null;
    const ec = ecIdx !== -1 && !isNaN(parseFloat(row[ecIdx])) ? parseFloat(row[ecIdx]) : null;
    const fc = fcIdx !== -1 && !isNaN(parseFloat(row[fcIdx])) ? parseFloat(row[fcIdx]) : null;
    const tc = tcIdx !== -1 && !isNaN(parseFloat(row[tcIdx])) ? parseFloat(row[tcIdx]) : null;

    const cpcbClass = classifyClientSample(ph, doVal, bod, fc, tc, ec, null);

    stations.push({
      id: 10000 + i,
      station_name: name,
      district_name: district,
      agency: 'Local Import',
      water_source_category: sourceCat,
      river: river,
      basin: river,
      latitude: lat,
      longitude: lon,
      observation_count: 1,
      latest_observation: {
        date: new Date().toLocaleDateString('en-GB'),
        ph: ph,
        dissolved_oxygen: doVal,
        bod: bod,
        electrical_conductivity: ec,
        fecal_coliform: fc,
        cpcb_class: cpcbClass
      }
    });
  }

  return stations;
}
