import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface RevenueDataPoint {
  date: string;
  subscriptionRevenue: number;
  timeBasedRevenue: number;
  totalRevenue: number;
  creatorRevenue: number;
  platformFee: number;
}

interface RevenueChartProps {
  data?: RevenueDataPoint[];
  isLoading: boolean;
  timeRange: string;
}

export default function RevenueChart({ data, isLoading, timeRange }: RevenueChartProps) {
  const [chartType, setChartType] = React.useState<'area' | 'line' | 'bar'>('area');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      switch (timeRange) {
        case '7d':
          return format(date, 'MMM dd');
        case '30d':
          return format(date, 'MMM dd');
        case '90d':
          return format(date, 'MMM dd');
        case '1y':
          return format(date, 'MMM yyyy');
        default:
          return format(date, 'MMM dd');
      }
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                {entry.name}:
              </span>
              <span className="font-medium ml-4">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Generate sample data if no data provided
  const chartData = data && data.length > 0 ? data : [
    { date: '2024-01-01', subscriptionRevenue: 0, timeBasedRevenue: 0, totalRevenue: 0, creatorRevenue: 0, platformFee: 0 },
    { date: '2024-01-02', subscriptionRevenue: 0, timeBasedRevenue: 0, totalRevenue: 0, creatorRevenue: 0, platformFee: 0 },
    { date: '2024-01-03', subscriptionRevenue: 0, timeBasedRevenue: 0, totalRevenue: 0, creatorRevenue: 0, platformFee: 0 },
  ];

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              stroke="#666"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="creatorRevenue" 
              stackId="1"
              stroke="#10b981" 
              fill="#10b981"
              fillOpacity={0.6}
              name="Your Revenue (97%)"
            />
            <Area 
              type="monotone" 
              dataKey="platformFee" 
              stackId="1"
              stroke="#6b7280" 
              fill="#6b7280"
              fillOpacity={0.4}
              name="Platform Fee (3%)"
            />
          </AreaChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              stroke="#666"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="subscriptionRevenue" 
              stroke="#4f46e5" 
              strokeWidth={3}
              dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
              name="Subscription Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="timeBasedRevenue" 
              stroke="#059669" 
              strokeWidth={3}
              dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              name="Time-based Revenue"
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              stroke="#666"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="subscriptionRevenue" 
              fill="#4f46e5"
              name="Subscription Revenue"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="timeBasedRevenue" 
              fill="#059669"
              name="Time-based Revenue"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Revenue Overview</h3>
            <p className="text-sm text-gray-500">Your earnings breakdown over time</p>
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { type: 'area', icon: '📊', label: 'Area' },
                { type: 'line', icon: '📈', label: 'Line' },
                { type: 'bar', icon: '📋', label: 'Bar' }
              ].map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => setChartType(type as any)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    chartType === type
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={label}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {chartData.length > 0 && chartData.some(d => d.totalRevenue > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No revenue data yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start earning from your personas to see your revenue chart here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}