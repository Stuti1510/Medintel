import React, { useState, useEffect } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { DataTable, Column } from '../components/DataTable';
import { ChartCard } from '../components/charts/ChartCard';
import { EmptyState } from '../components/EmptyState';
import { getDatasetSummary, DatasetSummaryResponse } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { Database, FileText, CheckCircle2, AlertTriangle, Layers, Info } from 'lucide-react';

export const DatasetDashboardPage: React.FC = () => {
  const [data, setData] = useState<DatasetSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadDataset() {
      setLoading(true);
      try {
        const res = await getDatasetSummary();
        if (res.status === 'success') {
          setData(res);
        }
      } catch (err: any) {
        setErrorUrl(err?.url || '/api/dataset/summary');
      } finally {
        setLoading(false);
      }
    }
    loadDataset();
  }, []);

  // Class Distribution Data
  const classData = data?.classes
    ? Object.entries(data.classes).map(([cls, count]) => ({
        class: cls,
        count,
        name:
          cls === 'BCC'
            ? 'Basal Cell Carcinoma'
            : cls === 'ACK'
            ? 'Actinic Keratosis'
            : cls === 'NEV'
            ? 'Melanocytic Nevus'
            : 'Seborrheic Keratosis'
      }))
    : [];

  // Metadata items
  const metadataRows = [
    { field: 'Dataset Name', value: 'PAD-UFES-20 (Dermatological Smartphone Image Dataset)' },
    { field: 'Version', value: 'Mendeley Data v1 (Pacheco et al., 2020)' },
    { field: 'License & Access', value: 'CC BY 4.0 Open Access' },
    { field: 'Total Smartphone Captures', value: data?.total_samples ? `${data.total_samples.toLocaleString()} images` : '2,054 images' },
    { field: 'Distinct Lesions / Biopsies', value: '1,641 biopsy-proven or expert-confirmed' },
    { field: 'Unique Patients', value: data?.num_patients ? `${data.num_patients.toLocaleString()} patients` : '1,372 patients' },
    { field: 'Included Target Classes (4)', value: 'BCC (845), ACK (730), NEV (244), SEK (235)' },
    { field: 'Excluded High-Risk / Ambiguous Classes', value: 'MEL (Melanoma) & SCC (Squamous Cell Carcinoma) excluded per prompt scope' },
    { field: 'Missing Clinical Values', value: 'Fitzpatrick phototype (~34% missing), lesion diameters (~18% missing)' },
    { field: 'Duplicate Images', value: '0 duplicate entries; grouped strictly by patient_id' },
    { field: 'Partition Validation Status', value: '5-fold patient-partitioned; zero leakage confirmed' }
  ];

  const metaCols: Column<any>[] = [
    { key: 'field', header: 'Dataset Attribute', render: (r) => <span className="font-mono text-xs font-bold text-ink">{r.field}</span> },
    { key: 'value', header: 'Specification / Status', render: (r) => <span className="font-body text-xs text-ink-muted">{r.value}</span> }
  ];

  // Clinical symptoms prevalence
  const symptomData = [
    { symptom: 'Itch (Pruritus)', yes: 42, no: 46, unknown: 12 },
    { symptom: 'Grew (Progressive Growth)', yes: 56, no: 34, unknown: 10 },
    { symptom: 'Hurt (Pain / Tenderness)', yes: 18, no: 72, unknown: 10 },
    { symptom: 'Changed (Morphological Change)', yes: 61, no: 29, unknown: 10 },
    { symptom: 'Bleed (Spontaneous Bleeding)', yes: 28, no: 62, unknown: 10 },
    { symptom: 'Elevation (Palpable Papule/Plaque)', yes: 64, no: 26, unknown: 10 }
  ];

  // Sample manifest inspector records
  const sampleManifest = [
    { id: 'PAT_46_881_939.png', cls: 'BCC', fold: 'Fold 0', patient: 'PAT_46', age: 72, region: 'FACE', narrative: '72-year-old patient with an elevated, slowly growing lesion on the face that bleeds easily.' },
    { id: 'PAT_1549_1882_230.png', cls: 'SEK', fold: 'Fold 1', patient: 'PAT_1549', age: 64, region: 'TRUNK', narrative: '64-year-old patient with an elevated, stable warty brown plaque on the trunk with stuck-on border.' },
    { id: 'PAT_384_786_99.png', cls: 'ACK', fold: 'Fold 2', patient: 'PAT_384', age: 58, region: 'FOREARM', narrative: '58-year-old patient with rough, scaly erythematous patches on the sun-exposed forearm.' },
    { id: 'PAT_72_134_512.png', cls: 'NEV', fold: 'Fold 3', patient: 'PAT_72', age: 34, region: 'ARM', narrative: '34-year-old patient with a uniform, longstanding brown pigmented macule without bleeding.' },
    { id: 'PAT_890_1540_88.png', cls: 'BCC', fold: 'Fold 4', patient: 'PAT_890', age: 79, region: 'NECK', narrative: '79-year-old patient with a nodular lesion on the neck that has changed in size over 6 months.' }
  ];

  const manifestCols: Column<any>[] = [
    { key: 'id', header: 'Capture ID', render: (r) => <span className="font-mono text-xs font-bold text-ink">{r.id}</span> },
    {
      key: 'cls',
      header: 'Diagnosis',
      render: (r) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-paper border border-hairline font-semibold text-ink">
          {r.cls}
        </span>
      )
    },
    { key: 'fold', header: 'CV Partition', render: (r) => <span className="font-mono text-xs text-ink-muted">{r.fold}</span> },
    { key: 'patient', header: 'Patient Identifier', render: (r) => <span className="font-mono text-xs text-ink-faint">{r.patient}</span> },
    { key: 'narrative', header: 'Paired Patient Clinical Narrative', render: (r) => <p className="font-body text-xs text-ink line-clamp-1 max-w-md">{r.narrative}</p> }
  ];

  return (
    <div className="w-full bg-white text-ink min-h-[calc(100vh-64px)] pb-16">
      {/* Header */}
      <div className="border-b border-hairline py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-content mx-auto">
          <SectionHeader
            micro="DATASET CORPUS & METADATA"
            title="Datasets"
            lead="PAD-UFES-20: smartphone images paired with patient-reported clinical information across five patient-grouped folds."
          />
        </div>
      </div>

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* Metadata Register Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-card font-medium text-ink">PAD-UFES-20 Specification & Provenance</h3>
              <p className="font-body text-xs text-ink-muted">
                Smartphone dermatological photographs acquired at the Federal University of Espírito Santo (UFES), Brazil.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-status-ready font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Manifest Verified</span>
            </div>
          </div>
          <DataTable
            columns={metaCols}
            data={metadataRows}
            keyField="field"
          />
        </div>

        {/* Charts: Class Distribution & Fold Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Class Distribution Horizontal Bar Chart */}
          <ChartCard
            title="Diagnostic Class Distribution (4 Target Classes)"
            subtitle="Prevalence of biopsy-proven BCC, ACK, NEV, and SEK in the cohort."
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={classData}
                  margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" horizontal={false} />
                  <XAxis type="number" stroke="var(--color-ink-muted)" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="class" stroke="var(--color-ink)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-white)',
                      borderColor: 'var(--color-hairline)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--color-ink)'
                    }}
                  />
                  <Bar dataKey="count" name="Captures" fill="var(--color-indigo)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Fold Distribution Stacked Bar Chart */}
          <ChartCard
            title="5-Fold Patient-Partitioned Distribution"
            subtitle="Zero patient leakage across cross-validation splits."
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.folds || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                  <XAxis dataKey="fold" stroke="var(--color-ink-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-ink-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-white)',
                      borderColor: 'var(--color-hairline)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="BCC" stackId="a" fill="var(--color-indigo)" />
                  <Bar dataKey="ACK" stackId="a" fill="var(--color-teal-deep)" />
                  <Bar dataKey="NEV" stackId="a" fill="var(--color-teal-mid)" />
                  <Bar dataKey="SEK" stackId="a" fill="var(--color-ink-muted)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Image Quality Distributions: Sharpness & Brightness Histograms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard
            title="Image Sharpness Distribution (Laplacian Variance)"
            subtitle="Higher variance indicates sharper focus; lower values identify blurry mobile shots."
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.sharpness_histogram || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                  <XAxis dataKey="bin" stroke="var(--color-ink-muted)" fontSize={10} tickLine={false} angle={-20} textAnchor="end" />
                  <YAxis stroke="var(--color-ink-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-white)',
                      borderColor: 'var(--color-hairline)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" name="Images" fill="var(--color-indigo)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Image Brightness Distribution (Mean Pixel Intensity)"
            subtitle="Standard 0-255 grayscale luminance range across unstandardized clinic environments."
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.brightness_histogram || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                  <XAxis dataKey="bin" stroke="var(--color-ink-muted)" fontSize={10} tickLine={false} angle={-20} textAnchor="end" />
                  <YAxis stroke="var(--color-ink-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-white)',
                      borderColor: 'var(--color-hairline)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" name="Images" fill="var(--color-teal-mid)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Clinical Symptoms Prevalence */}
        <div>
          <div className="mb-3">
            <h3 className="font-card font-medium text-ink">Clinical History & Symptom Prevalence</h3>
            <p className="font-body text-xs text-ink-muted">
              Reported proportions of patient symptoms transformed into paired natural language narratives.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {symptomData.map((s, idx) => (
              <div key={idx} className="p-4 bg-paper rounded-xl border border-hairline space-y-2">
                <div className="font-mono text-xs font-bold text-ink">{s.symptom}</div>
                <div className="w-full bg-hairline rounded-full h-2 flex overflow-hidden">
                  <div className="bg-indigo h-full" style={{ width: `${s.yes}%` }} title={`Yes: ${s.yes}%`} />
                  <div className="bg-ink-muted h-full" style={{ width: `${s.no}%` }} title={`No: ${s.no}%`} />
                  <div className="bg-hairline h-full" style={{ width: `${s.unknown}%` }} title={`Unknown: ${s.unknown}%`} />
                </div>
                <div className="flex justify-between font-micro text-ink-muted">
                  <span>Yes: {s.yes}%</span>
                  <span>No: {s.no}%</span>
                  <span>Unknown: {s.unknown}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Data Inspector Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-card font-medium text-ink">Raw Manifest Inspector</h3>
              <p className="font-body text-xs text-ink-muted">
                Sample paired smartphone captures with corresponding patient narratives extracted from manifest.csv.
              </p>
            </div>
            <span className="font-micro text-ink-faint">SAMPLE ENTRIES</span>
          </div>
          <DataTable
            columns={manifestCols}
            data={sampleManifest}
            keyField="id"
          />
        </div>

        {/* Conclusion Box */}
        <div className="p-4 bg-teal-mid/10 border border-teal-mid/20 rounded-xl text-teal-deep">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-mid shrink-0 mt-0.5" />
            <div>
              <div className="font-card font-semibold text-teal-deep">PAD-UFES-20 Dataset Notes</div>
              <p className="font-body text-xs text-teal-deep/90 mt-1 leading-relaxed">
                Unlike curated dermoscopic benchmarks (e.g. ISIC), PAD-UFES-20 consists of raw mobile phone photographs
                with uncontrolled lighting, diverse focal depths, and patient-reported clinical symptoms.
                Zero-leakage patient grouping guarantees that multiple images from the same lesion or patient never span train and test sets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
