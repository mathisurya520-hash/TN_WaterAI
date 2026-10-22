import urllib.request
import csv
import io
import json
from collections import Counter
from datetime import datetime

urls = {
    'chem_1961_2020': 'https://nwdp.nwic.gov.in/dataset/d54d7702-d21f-408f-8dc0-2665bde47201/resource/0a26c675-11d1-433d-b19d-9d3a8dcb3796/download/swq_manual_chemical_parameters_cpcb_tn_1961_2020.csv',
    'chem_2021_2025': 'https://nwdp.nwic.gov.in/dataset/d54d7702-d21f-408f-8dc0-2665bde47201/resource/acc41e2e-3da2-43d2-8e6a-0081cc64392a/download/swq_chemical_parameter_manual_cpcb_tn_2021_2025.csv',
    'phys_1961_2020': 'https://nwdp.nwic.gov.in/dataset/c547abaa-fbdc-4f46-b152-dc023be0c75c/resource/6b46cd1f-48e6-421d-af37-3e08fa98dc08/download/swq_manual_physical_parameters_cpcb_tn_1961_2020.csv',
    'phys_2021_2025': 'https://nwdp.nwic.gov.in/dataset/c547abaa-fbdc-4f46-b152-dc023be0c75c/resource/d44ae053-9b0f-420b-8851-f9ad67f1b0b5/download/swq_physical_parameter_manual_cpcb_tn_2021_2025.csv',
    'bio_1961_2020': 'https://nwdp.nwic.gov.in/dataset/e97bcc1b-895e-4eb9-a826-09d52f7b5ca0/resource/d178b063-cc4b-40ba-921e-b392889e1258/download/swq_manual_biological_parameters_cpcb_tn_1961_2020.csv',
    'bio_2021_2025': 'https://nwdp.nwic.gov.in/dataset/e97bcc1b-895e-4eb9-a826-09d52f7b5ca0/resource/38d272b1-9f88-41d7-ac60-843bf0b447aa/download/swq_biological_parameter_manual_cpcb_tn_2021_2025.csv'
}

def analyze_dataset(name, url):
    print(f"Fetching {name}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        text = resp.read().decode('utf-8', errors='replace')
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        return {}
    header = rows[0]
    data = rows[1:]
    
    col_idx = {h: i for i, h in enumerate(header)}
    stations = set()
    districts = set()
    years = []
    has_coords = 0
    valid_coords = 0
    non_null_per_col = {h: 0 for h in header}
    
    lat_idx = col_idx.get('Latitude', -1)
    lon_idx = col_idx.get('Longitude', -1)
    st_idx = col_idx.get('Station', -1)
    dist_idx = col_idx.get('District', -1)
    date_idx = col_idx.get('Data Acquisition Time', -1)
    
    sample_stations = {}
    
    for r in data:
        if len(r) < len(header):
            continue
        st = r[st_idx].strip() if st_idx >= 0 else ''
        dist = r[dist_idx].strip() if dist_idx >= 0 else ''
        dt_str = r[date_idx].strip() if date_idx >= 0 else ''
        
        if st:
            stations.add(st)
        if dist and dist != '-':
            districts.add(dist)
            
        if lat_idx >= 0 and lon_idx >= 0:
            lat_str = r[lat_idx].strip()
            lon_str = r[lon_idx].strip()
            if lat_str and lon_str and lat_str != '-' and lon_str != '-':
                has_coords += 1
                try:
                    lat = float(lat_str)
                    lon = float(lon_str)
                    # Tamil Nadu roughly lat 8 to 14, lon 76 to 81
                    if 8.0 <= lat <= 14.0 and 76.0 <= lon <= 81.0:
                        valid_coords += 1
                        if st and st not in sample_stations:
                            sample_stations[st] = {
                                'district': dist,
                                'lat': lat,
                                'lon': lon,
                                'river': r[col_idx.get('River', -1)] if col_idx.get('River', -1) >= 0 else '',
                                'basin': r[col_idx.get('Basin', -1)] if col_idx.get('Basin', -1) >= 0 else ''
                            }
                except ValueError:
                    pass
                    
        if dt_str:
            for fmt in ['%d-%m-%Y %H:%M', '%d-%m-%Y', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d']:
                try:
                    dt = datetime.strptime(dt_str, fmt)
                    years.append(dt.year)
                    break
                except ValueError:
                    pass
                    
        for h, idx in col_idx.items():
            val = r[idx].strip()
            if val and val != '-' and val.lower() != 'nan' and val.lower() != 'null':
                non_null_per_col[h] += 1

    return {
        'total_rows': len(data),
        'unique_stations': len(stations),
        'unique_districts': sorted(list(districts)),
        'records_with_coords': has_coords,
        'records_with_valid_tn_coords': valid_coords,
        'year_min': min(years) if years else None,
        'year_max': max(years) if years else None,
        'year_distribution': dict(Counter(years).most_common(10)),
        'sample_station_count': len(sample_stations),
        'param_availability': {k: non_null_per_col[k] for k in header[19:] if k in non_null_per_col}
    }

if __name__ == '__main__':
    results = {}
    for k, u in urls.items():
        try:
            results[k] = analyze_dataset(k, u)
        except Exception as e:
            results[k] = {'error': str(e)}
    with open('deep_analysis.json', 'w') as f:
        json.dump(results, f, indent=2)
    print("Analysis complete. Saved deep_analysis.json")
