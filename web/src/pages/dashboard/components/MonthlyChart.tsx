import React, { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../../components/ui/CardState';
import type { MonthlyTotal } from '../../../types/dashboard';
import { formatMonthLabel, formatMonthLong, formatNumber } from '../../../utils/format';

// Espelha os tokens do tailwind.config.js (o recharts recebe as cores por propriedade)
const CHART_COLORS = {
  line: '#077A66',
  grid: '#CFE0DA',
  axis: '#5F6F6B',
};

interface MonthlyChartProps {
  data: MonthlyTotal[] | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data, isLoading, error, onRetry }) => {
  const chartData = useMemo(
    () => (data ?? []).map((item) => ({ ...item, label: formatMonthLabel(item.month) })),
    [data]
  );

  return (
    <Card title="Registros por mês" description="Doses registradas nos últimos 12 meses">
      {isLoading ? (
        <CardLoading label="Carregando gráfico..." />
      ) : error ? (
        <CardError message={error} onRetry={onRetry} />
      ) : chartData.length === 0 ? (
        <CardEmpty message="Ainda não há registros de vacinação nos últimos 12 meses." />
      ) : (
        <>
          {/* Alternativa em texto para leitores de tela (WCAG 1.1.1); o gráfico em si fica oculto para eles.
              O sr-only fica no wrapper: aplicado na <table>, o overflow não recorta o <caption>, que vazava sobre o card. */}
          <div className="sr-only">
            <table>
              <caption>Doses registradas por mês nos últimos 12 meses</caption>
              <thead>
                <tr>
                  <th scope="col">Mês</th>
                  <th scope="col">Registros</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item) => (
                  <tr key={item.month}>
                    <th scope="row">{formatMonthLong(item.month)}</th>
                    <td>{formatNumber(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="h-64 -ml-3" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart accessibilityLayer={false} data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  interval="preserveStartEnd"
                  minTickGap={8}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(value: number) => formatNumber(value)}
                />
                <Tooltip
                  cursor={{ stroke: CHART_COLORS.grid }}
                  contentStyle={{ borderRadius: 12, borderColor: CHART_COLORS.grid, fontSize: 13 }}
                  labelFormatter={(_, payload) => {
                    const month = payload?.[0]?.payload?.month;
                    return typeof month === 'string' ? formatMonthLong(month) : '';
                  }}
                  formatter={(value) => [formatNumber(Number(value)), 'Registros']}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={CHART_COLORS.line}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_COLORS.line, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
};

export default MonthlyChart;
