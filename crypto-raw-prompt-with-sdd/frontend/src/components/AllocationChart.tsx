import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Holding, PriceMap } from '../types';
import { formatUSD } from '../utils/format';

interface AllocationChartProps {
  holdings: Holding[];
  prices: PriceMap;
}

interface ChartEntry {
  name: string;
  symbol: string;
  value: number;
  percent: number;
}

const COLORS = [
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#84cc16', // lime-500
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartEntry }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded bg-white px-3 py-2 shadow-lg border border-gray-200 text-sm">
      <p className="font-medium text-gray-900">{entry.name} ({entry.symbol.toUpperCase()})</p>
      <p className="text-gray-600">{formatUSD(entry.value)}</p>
      <p className="text-gray-600">{entry.percent.toFixed(1)}%</p>
    </div>
  );
}

export function AllocationChart({ holdings, prices }: AllocationChartProps) {
  let totalValue = 0;
  const entries: ChartEntry[] = [];

  for (const holding of holdings) {
    const price = prices[holding.coingeckoId];
    const currentValue = price ? holding.quantity * price.usd : 0;
    totalValue += currentValue;
    entries.push({
      name: holding.name,
      symbol: holding.symbol,
      value: currentValue,
      percent: 0,
    });
  }

  for (const entry of entries) {
    entry.percent = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
  }

  entries.sort((a, b) => b.value - a.value);

  if (totalValue === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No price data available for chart
      </div>
    );
  }

  return (
    <div role="img" aria-label="Portfolio allocation donut chart">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={entries}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={110}
            paddingAngle={2}
          >
            {entries.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-gray-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
