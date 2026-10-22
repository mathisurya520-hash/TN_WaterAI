import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  Download,
  RefreshCw,
  Droplets,
  Check,
  ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { PredictionResult } from '../types';

const PRESETS = [
  {
    name: 'Pristine River Source (Class A)',
    values: {
      ph: '7.4',
      dissolved_oxygen: '7.2',
      bod: '1.5',
      fecal_coliform: '35',
      total_coliform: '150',
      electrical_conductivity: '320',
      turbidity: '2.5',
      nitrate_n: '0.8',
      ammonia_n: '0.2'
    }
  },
  {
    name: 'Bathing Water (Class B)',
    values: {
      ph: '7.6',
      dissolved_oxygen: '5.8',
      bod: '2.8',
      fecal_coliform: '350',
      total_coliform: '850',
      electrical_conductivity: '510',
      turbidity: '4.0',
      nitrate_n: '1.5',
      ammonia_n: '0.4'
    }
  },
  {
    name: 'Irrigation & Cooling (Class E)',
    values: {
      ph: '8.1',
      dissolved_oxygen: '4.5',
      bod: '4.2',
      fecal_coliform: '1200',
      total_coliform: '4500',
      electrical_conductivity: '1850',
      turbidity: '12.0',
      nitrate_n: '3.5',
      ammonia_n: '0.8'
    }
  },
  {
    name: 'Polluted Urban Drain (Non-Conforming)',
    values: {
      ph: '8.6',
      dissolved_oxygen: '1.2',
      bod: '28.0',
      fecal_coliform: '24000',
      total_coliform: '95000',
      electrical_conductivity: '2800',
      turbidity: '45.0',
      nitrate_n: '12.0',
      ammonia_n: '4.5'
    }
  }
];

export const MLPredictions: React.FC = () => {
  const [formData, setFormData] = useState({
    ph: '7.2',
    dissolved_oxygen: '6.5',
    bod: '2.4',
    fecal_coliform: '120',
    total_coliform: '450',
    electrical_conductivity: '480',
    turbidity: '4.5',
    nitrate_n: '1.2',
    ammonia_n: '0.4'
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>({
    predicted_class: 'Class A (Drinking without treatment)',
    confidence: 0.92,
    class_probabilities: {
      'Class A (Drinking without treatment)': 0.92,
      'Class B (Outdoor Bathing)': 0.05,
      'Class C (Drinking after conventional treatment)': 0.02,
      'Class D (Wildlife & Fisheries)': 0.01,
      'Below Class E (Non-Conforming)': 0.00
    },
    feature_contributions: [
      { feature: 'dissolved_oxygen', input_value: 6.5, unit: 'mg/L', importance_weight: 0.38 },
      { feature: 'bod', input_value: 2.4, unit: 'mg/L', importance_weight: 0.28 },
      { feature: 'ph', input_value: 7.2, unit: 'pH units', importance_weight: 0.18 }
    ],
    validation_warnings: [],
    model_version: 'cpcb_water_classifier_v1',
    algorithm: 'Random Forest Classifier (Ensemble)',
    timestamp: new Date().toISOString(),
    disclaimer: 'Environmental ML classification based on CPCB Primary Water Quality Standards.'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleLoadPreset = (presetValues: any) => {
    setFormData(presetValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: any = {};
    Object.keys(formData).forEach((k) => {
      const v = (formData as any)[k];
      payload[k] = v !== '' ? parseFloat(v) : null;
    });

    try {
      const res = await fetch('/api/predictions/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to classify water sample');
      }
      const result = await res.json();
      setPrediction(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0077b6] text-xs font-bold uppercase tracking-wider">
            <BrainCircuit className="w-4 h-4" />
            <span>AI Environmental Prediction Studio</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 mt-1">Water Analysis & Prediction</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter physical and chemical parameters to receive instant CPCB Designated Best Use classification.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(p.values)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0077b6] text-xs text-slate-700 font-semibold transition-all hover:bg-sky-50/50"
            >
              {p.name.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form (Left 7 cols) & Result (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 lg:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-heading text-base font-bold text-slate-900">
                Water Parameters
              </h3>
              <p className="text-xs text-slate-400">
                Enter measured sample concentrations below for evaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  pH Level <span className="text-[#0077b6]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="14"
                  value={formData.ph}
                  onChange={(e) => handleInputChange('ph', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dissolved Oxygen (mg/L) <span className="text-[#0077b6]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="25"
                  value={formData.dissolved_oxygen}
                  onChange={(e) => handleInputChange('dissolved_oxygen', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biochemical Oxygen Demand (mg/L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.bod}
                  onChange={(e) => handleInputChange('bod', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Turbidity (NTU)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.turbidity}
                  onChange={(e) => handleInputChange('turbidity', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Electrical Conductivity (µS/cm)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.electrical_conductivity}
                  onChange={(e) => handleInputChange('electrical_conductivity', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecal Coliform (MPN/100mL)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.fecal_coliform}
                  onChange={(e) => handleInputChange('fecal_coliform', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl bg-[#0077b6] hover:bg-[#0284c7] text-white font-heading font-bold text-sm shadow-md shadow-sky-600/20 transition-all disabled:opacity-50 hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Sample Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Water Quality</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Column (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">Analysis Result</h3>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#2ead70] border border-emerald-200/60 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{prediction ? 'ANALYZED' : 'READY'}</span>
              </span>
            </div>

            {/* Circular Water Quality Score Donut */}
            <div className="flex flex-col items-center text-center my-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Water Quality Score
              </span>
              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke="#e0f2fe"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke="#2ead70"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="364"
                    strokeDashoffset="36"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-heading font-bold text-3xl text-slate-800">
                    {prediction ? `${Math.round(prediction.confidence * 100)}/100` : '--'}
                  </span>
                  <span className="text-[10px] font-bold text-[#2ead70] uppercase">
                    SAFE
                  </span>
                </div>
              </div>
              <h4 className="font-heading font-bold text-base text-slate-900 mt-3">
                {prediction?.predicted_class || 'Awaiting input'}
              </h4>
            </div>

            {/* Key Parameters List */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Parameter Evaluation
              </span>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">pH Level</span>
                <span className="font-bold text-slate-800">{formData.ph}</span>
                <span className="text-[#2ead70] font-semibold">Normal</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Dissolved Oxygen</span>
                <span className="font-bold text-slate-800">{formData.dissolved_oxygen} mg/L</span>
                <span className="text-[#0077b6] font-semibold">Optimal</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">BOD</span>
                <span className="font-bold text-slate-800">{formData.bod || '2.0'} mg/L</span>
                <span className="text-[#2ead70] font-semibold">Safe</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Download className="w-4 h-4 text-[#0077b6]" />
              <span>Download Analysis Digest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
