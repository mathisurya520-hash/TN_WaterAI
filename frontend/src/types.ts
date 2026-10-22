export interface KPIOverview {
  total_observations: number;
  unique_monitoring_stations: number;
  districts_represented: number;
  water_source_categories: number;
  earliest_date: string;
  latest_date: string;
  provenance: string;
}

export interface OverviewData {
  kpis: KPIOverview;
  water_source_distribution: { category: string; count: number }[];
  cpcb_class_distribution: { class_name: string; count: number }[];
  parameter_availability: Record<string, number>;
  observations_by_year: { year: number; count: number }[];
  district_coverage: { district: string; count: number }[];
  recent_observations: {
    id: number;
    station_name: string;
    district_name: string;
    date: string;
    ph: number | null;
    dissolved_oxygen: number | null;
    bod: number | null;
    cpcb_class: string;
  }[];
}

export interface Station {
  id: number;
  station_name: string;
  district_name: string;
  agency: string;
  water_source_category: string;
  river: string;
  basin: string;
  latitude: number;
  longitude: number;
  observation_count: number;
  latest_observation: {
    date: string;
    ph: number | null;
    dissolved_oxygen: number | null;
    bod: number | null;
    electrical_conductivity: number | null;
    fecal_coliform: number | null;
    cpcb_class: string;
  } | null;
}

export interface DistrictSummary {
  id: number;
  name: string;
  lgd_code: string;
  center_lat: number;
  center_lon: number;
  station_count: number;
  observation_count: number;
  avg_ph: number | null;
  avg_dissolved_oxygen: number | null;
  avg_bod: number | null;
}

export interface ParameterMeta {
  key: string;
  name: string;
  unit: string;
  standard: string;
  observation_count: number;
  missing_percentage: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  std: number | null;
}

export interface PredictionResult {
  predicted_class: string;
  confidence: number;
  class_probabilities: Record<string, number>;
  feature_contributions: {
    feature: string;
    input_value: number | string;
    unit: string;
    importance_weight: number;
  }[];
  validation_warnings: string[];
  model_version: string;
  algorithm: string;
  timestamp: string;
  disclaimer: string;
}

export interface DataSourceItem {
  id: number;
  name: string;
  publisher: string;
  source_url: string;
  temporal_coverage: string;
  format: string;
  records_accepted: number;
  records_rejected: number;
  validation_status: string;
  last_imported_at: string;
}
