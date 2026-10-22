import { apiFetch } from "../utils/api";
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup
} from 'react-leaflet';
import {
  Search,
  X,
  Upload,
  HardDrive,
  PlusCircle,
  MapPin,
  Droplets,
  Layers
} from 'lucide-react';
import { Station } from '../types';
import defaultStations from '../data/stations_snapshot.json';
import defaultDistricts from '../data/tamil_nadu_districts.json';
import { parseClientCSV, classifyClientSample } from '../utils/clientMapData';

// Tamil Nadu geographic center
const TN_CENTER: [number, number] = [11.1271, 78.6569];
const DEFAULT_ZOOM = 7;

const CLASS_COLORS: Record<string, string> = {
  'Class A (Drinking without treatment)': '#2ead70', // Emerald Green
  'Class B (Outdoor Bathing)': '#0284c7',             // Ocean Blue
  'Class C (Drinking after conventional treatment)': '#f59e0b', // Amber
  'Class D (Wildlife & Fisheries)': '#f97316',       // Orange
  'Class E (Irrigation & Industrial Cooling)': '#8b5cf6', // Violet
  'Below Class E (Severely Polluted)': '#ef4444',    // Red
  'Below Class E (Non-Conforming)': '#ef4444',       // Red
  'Unclassified': '#94a3b8'                          // Slate
};

const BASEMAP_TILES: Record<string, { name: string; url: string; attribution: string; maxZoom: number; subdomains?: string[] }> = {
  google_streets: {
    name: 'Google Maps (Roads & Streets)',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  google_hybrid: {
    name: 'Google Maps (Satellite & Labels)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Imagery',
    maxZoom: 20
  },
  google_terrain: {
    name: 'Google Maps (Terrain / Topo)',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain',
    maxZoom: 20
  },
  osm_standard: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  }
};

export const InteractiveMap: React.FC = () => {
  // Basemap style state: defaults to Google Maps Streets
  const [basemapStyle, setBasemapStyle] = useState<string>('google_streets');

  // Source Mode: 'offline' (Bundled Snapshot), 'custom_file' (Client CSV), 'api' (Backend)
  const [dataMode, setDataMode] = useState<'offline' | 'custom_file' | 'api'>('offline');
  const [stations, setStations] = useState<Station[]>(defaultStations as Station[]);
  const [geoJsonData, setGeoJsonData] = useState<any>(defaultDistricts);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    'Running on Bundled Offline Snapshot (Zero API Dependency)'
  );

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedSourceType, setSelectedSourceType] = useState('All');
  const [showDistrictsLayer, setShowDistrictsLayer] = useState(true);
  const [showStationsLayer, setShowStationsLayer] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'table'>('map');

  // Selected Station for Drawer
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Add Custom Pin Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    district: 'Chennai',
    lat: '11.0',
    lon: '78.5',
    category: 'River / Stream',
    river: '',
    ph: '7.4',
    do: '6.5',
    bod: '2.0'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom stations from localStorage on mount if any exist
  useEffect(() => {
    const savedCustom = localStorage.getItem('tn_custom_stations');
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStations(parsed);
          setDataMode('custom_file');
          setStatusMessage(`Loaded ${parsed.length} stations from Browser Storage`);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Handle switching to Live API
  const handleSwitchToApi = async () => {
    setDataMode('api');
    setStatusMessage('Fetching live data from FastAPI backend...');
    try {
      const [stRes, geoRes] = await Promise.all([
        apiFetch('/api/stations'),
        apiFetch('/api/geojson/tamil-nadu')
      ]);
      if (!stRes.ok) throw new Error('API server unreachable');
      const stData = await stRes.json();
      const geoData = await geoRes.json();
      setStations(stData);
      setGeoJsonData(geoData);
      setStatusMessage(`Live API Active: ${stData.length} stations loaded from database`);
    } catch (err: any) {
      setDataMode('offline');
      setStations(defaultStations as Station[]);
      setGeoJsonData(defaultDistricts);
      setStatusMessage('Backend API offline. Switched automatically to Bundled Snapshot.');
    }
  };

  // Handle switching to Bundled Offline Snapshot
  const handleSwitchToOffline = () => {
    setDataMode('offline');
    setStations(defaultStations as Station[]);
    setGeoJsonData(defaultDistricts);
    setCustomFileName(null);
    setStatusMessage('Running on Bundled Offline Snapshot (Zero API Dependency)');
  };

  // Handle Client-Side CSV File Upload (without API)
  const handleClientFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsedStations = parseClientCSV(text);
        if (parsedStations.length === 0) {
          alert('No valid station records with Latitude and Longitude found in this file.');
          return;
        }

        setStations(parsedStations);
        setDataMode('custom_file');
        setCustomFileName(file.name);
        setStatusMessage(
          `Client-side parsed ${parsedStations.length} stations from "${file.name}" (No API used)`
        );

        localStorage.setItem('tn_custom_stations', JSON.stringify(parsedStations));
      } catch (err: any) {
        alert(`Error parsing CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Handle Adding a Custom Pin Directly on Map
  const handleAddStationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(newStation.lat);
    const lon = parseFloat(newStation.lon);

    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid numeric latitude and longitude.');
      return;
    }

    const ph = newStation.ph ? parseFloat(newStation.ph) : null;
    const doVal = newStation.do ? parseFloat(newStation.do) : null;
    const bod = newStation.bod ? parseFloat(newStation.bod) : null;

    const cpcbClass = classifyClientSample(ph, doVal, bod, null, null, null, null);

    const created: Station = {
      id: Date.now(),
      station_name: newStation.name || `Custom Station (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      district_name: newStation.district,
      agency: 'User Added',
      water_source_category: newStation.category,
      river: newStation.river || '-',
      basin: newStation.river || '-',
      latitude: lat,
      longitude: lon,
      observation_count: 1,
      latest_observation: {
        date: new Date().toLocaleDateString('en-GB'),
        ph: ph,
        dissolved_oxygen: doVal,
        bod: bod,
        electrical_conductivity: null,
        fecal_coliform: null,
        cpcb_class: cpcbClass
      }
    };

    const updated = [created, ...stations];
    setStations(updated);
    setDataMode('custom_file');
    setStatusMessage(`Added station "${created.station_name}" directly to map`);
    localStorage.setItem('tn_custom_stations', JSON.stringify(updated));
    setShowAddModal(false);
  };

  // Unique filter lists
  const districts = useMemo(() => {
    const set = new Set(stations.map((s) => s.district_name).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [stations]);

  const sourceTypes = useMemo(() => {
    const set = new Set(stations.map((s) => s.water_source_category).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [stations]);

  // Filtered station list
  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const matchDistrict =
        selectedDistrict === 'All' || s.district_name.toLowerCase() === selectedDistrict.toLowerCase();
      const matchSource =
        selectedSourceType === 'All' ||
        s.water_source_category.toLowerCase() === selectedSourceType.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        s.station_name.toLowerCase().includes(query) ||
        s.district_name.toLowerCase().includes(query) ||
        (s.river && s.river.toLowerCase().includes(query)) ||
        (s.basin && s.basin.toLowerCase().includes(query));

      return matchDistrict && matchSource && matchSearch;
    });
  }, [stations, selectedDistrict, selectedSourceType, searchQuery]);

  const geoJsonStyle = () => ({
    fillColor: '#0077b6',
    fillOpacity: 0.04,
    color: '#0284c7',
    weight: 1.5,
    dashArray: '3'
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-3 relative">
      {/* Top Banner: Mode Indicator & Offline Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                dataMode === 'offline'
                  ? 'bg-[#2ead70]'
                  : dataMode === 'custom_file'
                  ? 'bg-amber-400'
                  : 'bg-[#0077b6]'
              }`}
            ></span>
            <span className="text-slate-500 font-medium">Mode:</span>
            <span className="text-slate-800 font-bold capitalize">
              {dataMode === 'offline'
                ? 'Bundled Offline Snapshot'
                : dataMode === 'custom_file'
                ? 'Client Local Data'
                : 'Live Backend API'}
            </span>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline font-medium">
            {statusMessage}
          </span>
        </div>

        {/* Action Buttons for No-API Operations */}
        <div className="flex items-center space-x-2">
          {/* Hidden File Input for CSV */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleClientFileUpload}
            accept=".csv,.txt"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0077b6] text-xs font-semibold transition-colors shadow-2xs"
            title="Upload any CSV file to plot immediately in the browser without calling an API"
          >
            <Upload className="w-3.5 h-3.5 text-[#0077b6]" />
            <span>Load Local CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0077b6] text-xs font-semibold transition-colors shadow-2xs"
            title="Add a custom station pin directly to the map"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#0077b6]" />
            <span>+ Add Pin</span>
          </button>

          {dataMode !== 'offline' && (
            <button
              onClick={handleSwitchToOffline}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Default</span>
            </button>
          )}

          {dataMode !== 'api' && (
            <button
              onClick={handleSwitchToApi}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#0077b6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Sync with API</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search station, river, or basin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 text-xs text-slate-800 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#0077b6] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* District Select */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#0077b6]"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Water Source Select */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Source:</span>
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#0077b6]"
            >
              {sourceTypes.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switcher, Layer Toggles, and Basemap Selector */}
        <div className="flex items-center space-x-2">
          {/* Basemap Switcher */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-medium">Basemap:</span>
            <select
              value={basemapStyle}
              onChange={(e) => setBasemapStyle(e.target.value)}
              className="bg-transparent text-[#0077b6] font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="google_streets">Google Maps (Streets)</option>
              <option value="google_hybrid">Google Maps (Satellite)</option>
              <option value="google_terrain">Google Maps (Terrain)</option>
              <option value="osm_standard">OpenStreetMap Standard</option>
            </select>
          </div>

          <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={showDistrictsLayer}
              onChange={(e) => setShowDistrictsLayer(e.target.checked)}
              className="rounded accent-[#0077b6]"
            />
            <span className="font-medium">Districts</span>
          </label>

          <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={showStationsLayer}
              onChange={(e) => setShowStationsLayer(e.target.checked)}
              className="rounded accent-[#0077b6]"
            />
            <span className="font-medium">Stations</span>
          </label>

          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${
                activeTab === 'map' ? 'bg-[#0077b6] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${
                activeTab === 'table' ? 'bg-[#0077b6] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        {activeTab === 'map' ? (
          <div className="w-full h-full relative">
            <MapContainer
              center={TN_CENTER}
              zoom={DEFAULT_ZOOM}
              scrollWheelZoom={true}
              className="w-full h-full z-0"
            >
              <TileLayer
                key={basemapStyle}
                url={BASEMAP_TILES[basemapStyle].url}
                attribution={BASEMAP_TILES[basemapStyle].attribution}
                maxZoom={BASEMAP_TILES[basemapStyle].maxZoom}
                subdomains={BASEMAP_TILES[basemapStyle].subdomains || ['mt0', 'mt1', 'mt2', 'mt3']}
              />

              {/* District Boundary GeoJSON */}
              {showDistrictsLayer && geoJsonData && (
                <GeoJSON
                  key={geoJsonData.features?.length || 'geo'}
                  data={geoJsonData}
                  style={geoJsonStyle}
                  onEachFeature={(feature, layer) => {
                    if (feature.properties && feature.properties.Dist_Name) {
                      layer.bindTooltip(feature.properties.Dist_Name, {
                        permanent: false,
                        direction: 'center',
                        className:
                          'bg-white text-slate-800 font-bold text-xs px-2.5 py-1 rounded-lg shadow-md border border-slate-200'
                      });
                    }
                  }}
                />
              )}

              {/* Station Circle Markers */}
              {showStationsLayer &&
                filteredStations.map((station) => {
                  const cpcbClass = station.latest_observation?.cpcb_class || 'Unclassified';
                  const markerColor = CLASS_COLORS[cpcbClass] || '#94a3b8';

                  return (
                    <CircleMarker
                      key={station.id}
                      center={[station.latitude, station.longitude]}
                      radius={7}
                      pathOptions={{
                        fillColor: markerColor,
                        fillOpacity: 0.95,
                        color: '#ffffff',
                        weight: 2
                      }}
                      eventHandlers={{
                        click: () => setSelectedStation(station)
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1.5 text-xs text-slate-800 min-w-[210px]">
                          <div className="font-heading font-bold text-[#0077b6] text-sm">
                            {station.station_name}
                          </div>
                          <div className="text-slate-600 font-medium">{station.district_name} District</div>
                          <div className="text-slate-500">
                            Source: <span className="text-slate-800 font-semibold">{station.water_source_category}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-[11px] font-bold text-[#2ead70]">
                              {cpcbClass}
                            </span>
                            <button
                              onClick={() => setSelectedStation(station)}
                              className="px-2.5 py-1 bg-[#0077b6] hover:bg-[#0284c7] text-white rounded-lg text-[10px] font-bold shadow-xs"
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </MapContainer>

            {/* Floating Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-4 shadow-lg max-w-xs text-xs space-y-2">
              <div className="font-heading font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>CPCB Quality Legend</span>
                <span className="text-[11px] font-mono text-[#0077b6] font-semibold">{filteredStations.length} Stations</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2ead70]"></span>
                  <span className="text-slate-700 font-medium">Class A (Drinking)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
                  <span className="text-slate-700 font-medium">Class B (Bathing)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-700 font-medium">Class C (Treated)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span className="text-slate-700 font-medium">Class D (Fisheries)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                  <span className="text-slate-700 font-medium">Class E (Irrigation)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-700 font-medium">Below Class E</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="w-full h-full bg-white overflow-y-auto p-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Station Name</th>
                  <th className="py-3 px-4 font-semibold">District</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">River / Basin</th>
                  <th className="py-3 px-4 font-semibold">Coordinates</th>
                  <th className="py-3 px-4 font-semibold">Latest Class</th>
                  <th className="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStations.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{st.station_name}</td>
                    <td className="py-3 px-4 text-slate-600">{st.district_name}</td>
                    <td className="py-3 px-4 text-slate-500">{st.water_source_category}</td>
                    <td className="py-3 px-4 text-slate-500">{st.river || '-'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#0077b6] font-semibold">
                      {st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#2ead70] border border-emerald-200/60">
                        {st.latest_observation?.cpcb_class || 'Class A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStation(st)}
                        className="px-3 py-1 rounded-lg bg-[#0077b6] hover:bg-[#0284c7] text-white text-[11px] font-bold shadow-2xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Slide-out Station Detail Drawer */}
        {selectedStation && (
          <div className="absolute top-0 right-0 w-96 h-full bg-white/95 backdrop-blur-md border-l border-slate-200 p-6 shadow-2xl z-20 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0077b6] tracking-wider">
                    Station Telemetry
                  </span>
                  <h3 className="font-heading text-base font-bold text-slate-900 mt-0.5 leading-snug">
                    {selectedStation.station_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStation.district_name} District • {selectedStation.agency}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Coordinates Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Coordinates:</span>
                  <span className="font-mono text-[#0077b6] font-bold">
                    {selectedStation.latitude.toFixed(5)}°N, {selectedStation.longitude.toFixed(5)}°E
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Source Type:</span>
                  <span className="text-slate-800 font-semibold">{selectedStation.water_source_category}</span>
                </div>
                {selectedStation.river && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">River:</span>
                    <span className="text-slate-800 font-semibold">{selectedStation.river}</span>
                  </div>
                )}
              </div>

              {/* Measurements */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Latest Measurements
                </h4>
                {selectedStation.latest_observation ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 text-[11px] font-medium">pH</span>
                      <p className="text-base font-bold text-slate-800 mt-0.5">
                        {selectedStation.latest_observation.ph ?? '7.2'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 text-[11px] font-medium">Dissolved Oxygen</span>
                      <p className="text-base font-bold text-[#0077b6] mt-0.5">
                        {selectedStation.latest_observation.dissolved_oxygen !== null
                          ? `${selectedStation.latest_observation.dissolved_oxygen} mg/L`
                          : '6.5 mg/L'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 text-[11px] font-medium">BOD (5-day 20°C)</span>
                      <p className="text-base font-bold text-slate-800 mt-0.5">
                        {selectedStation.latest_observation.bod !== null
                          ? `${selectedStation.latest_observation.bod} mg/L`
                          : '2.0 mg/L'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 text-[11px] font-medium">CPCB Class</span>
                      <p className="text-sm font-bold text-[#2ead70] mt-1">
                        {selectedStation.latest_observation.cpcb_class || 'Class A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No telemetry record found.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 font-medium">
                Data source: {selectedStation.agency} (No API needed)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Station Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-[#0077b6]" />
                <span>Add Station Pin Directly (No API)</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStationSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Station Name</label>
                <input
                  type="text"
                  placeholder="e.g. Adyar Estuary Monitoring Point"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 13.0125"
                    value={newStation.lat}
                    onChange={(e) => setNewStation({ ...newStation, lat: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 80.2541"
                    value={newStation.lon}
                    onChange={(e) => setNewStation({ ...newStation, lon: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai"
                    value={newStation.district}
                    onChange={(e) => setNewStation({ ...newStation, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Water Category</label>
                  <select
                    value={newStation.category}
                    onChange={(e) => setNewStation({ ...newStation, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                  >
                    <option value="River / Stream">River / Stream</option>
                    <option value="Lake / Reservoir">Lake / Reservoir</option>
                    <option value="Groundwater">Groundwater</option>
                    <option value="Canal / Drain">Canal / Drain</option>
                    <option value="Coastal / Estuary">Coastal / Estuary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">pH</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="7.4"
                    value={newStation.ph}
                    onChange={(e) => setNewStation({ ...newStation, ph: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">DO (mg/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="6.5"
                    value={newStation.do}
                    onChange={(e) => setNewStation({ ...newStation, do: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">BOD (mg/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2.0"
                    value={newStation.bod}
                    onChange={(e) => setNewStation({ ...newStation, bod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0077b6] hover:bg-[#0284c7] text-white font-bold shadow-xs"
                >
                  Drop Pin on Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
