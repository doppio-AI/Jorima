"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Props = {
  historico: number[];
  prediccion: number | null;
  media: number | null;
};

type ChartPoint = {
  tiempo: number;
  real: number | null;
  pred: number | null;
  media: number | null;
};

export default function RiskChart({ historico, prediccion, media }: Props) {
  if (!historico || historico.length === 0) {
    return <div style={{ textAlign: "center" }}>Sin datos</div>;
  }

  const data: ChartPoint[] = historico.map((v, i) => ({
    tiempo: i + 1,
    real: v,
    pred: null,
    media: media,
  }));

  if (prediccion !== null) {
    data.push({
      tiempo: historico.length + 1,
      real: null,
      pred: prediccion,
      media: media,
    });
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tiempo" />
          <YAxis domain={[1, 5]} />
          <Tooltip />

          <Line type="monotone" dataKey="real" stroke="#2563EB" strokeWidth={3} />
          <Line type="monotone" dataKey="pred" stroke="#DC2626" strokeDasharray="5 5" />
          <Line type="monotone" dataKey="media" stroke="#16A34A" strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}