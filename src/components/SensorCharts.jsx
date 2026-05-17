import { useMemo } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatDate } from '../utils/formatDate';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        usePointStyle: true,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
      },
    },
    y: {
      border: {
        display: false,
      },
      grid: {
        color: '#e2e8f0',
      },
    },
  },
};

function buildDataset(label, data, borderColor, backgroundColor) {
  return {
    label,
    data,
    borderColor,
    backgroundColor,
    borderWidth: 2,
    pointRadius: 2,
    pointHoverRadius: 4,
    tension: 0.35,
  };
}

function ChartPanel({ title, subtitle, data }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="h-72">
        <Line data={data} options={chartOptions} />
      </div>
    </section>
  );
}

export default function SensorCharts({ samples = [] }) {
  const labels = samples.map((sample) => sample.label);

  const accelerationData = useMemo(
    () => ({
      labels,
      datasets: [
        buildDataset('ax', samples.map((sample) => sample.ax), '#2563eb', 'rgba(37, 99, 235, 0.12)'),
        buildDataset('ay', samples.map((sample) => sample.ay), '#16a34a', 'rgba(22, 163, 74, 0.12)'),
        buildDataset('az', samples.map((sample) => sample.az), '#dc2626', 'rgba(220, 38, 38, 0.12)'),
      ],
    }),
    [labels, samples]
  );

  const gyroscopeData = useMemo(
    () => ({
      labels,
      datasets: [
        buildDataset('gx', samples.map((sample) => sample.gx), '#7c3aed', 'rgba(124, 58, 237, 0.12)'),
        buildDataset('gy', samples.map((sample) => sample.gy), '#f59e0b', 'rgba(245, 158, 11, 0.12)'),
        buildDataset('gz', samples.map((sample) => sample.gz), '#0891b2', 'rgba(8, 145, 178, 0.12)'),
      ],
    }),
    [labels, samples]
  );

  const lastSample = samples.at(-1);
  const subtitle = lastSample
    ? `Rolling history: ${samples.length}/20 samples, last ${formatDate(lastSample.timestamp)}`
    : 'Waiting for sensor samples';

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartPanel
        title="Acceleration"
        subtitle={`${subtitle} - values in m/s^2`}
        data={accelerationData}
      />
      <ChartPanel
        title="Gyroscope"
        subtitle={`${subtitle} - angular rate`}
        data={gyroscopeData}
      />
    </div>
  );
}
