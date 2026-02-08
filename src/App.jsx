import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import './index.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

// 示例數據
const sampleData = [
  { month: '1月', sales: 4000, expenses: 2400, profit: 1600 },
  { month: '2月', sales: 3000, expenses: 1398, profit: 1602 },
  { month: '3月', sales: 2000, expenses: 9800, profit: -7800 },
  { month: '4月', sales: 2780, expenses: 3908, profit: -1128 },
  { month: '5月', sales: 1890, expenses: 4800, profit: -2910 },
  { month: '6月', sales: 2390, expenses: 3800, profit: -1410 },
  { month: '7月', sales: 3490, expenses: 4300, profit: -810 },
  { month: '8月', sales: 4200, expenses: 2100, profit: 2100 },
  { month: '9月', sales: 5100, expenses: 2800, profit: 2300 },
  { month: '10月', sales: 6200, expenses: 3200, profit: 3000 },
  { month: '11月', sales: 5800, expenses: 3100, profit: 2700 },
  { month: '12月', sales: 7200, expenses: 3500, profit: 3700 },
];

function App() {
  const [data, setData] = useState(sampleData);
  const [chartType, setChartType] = useState('line');
  const [selectedMetrics, setSelectedMetrics] = useState(['sales', 'expenses', 'profit']);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // 計算統計數據
  const statistics = useMemo(() => {
    if (data.length === 0) return {};

    const metrics = {};
    const keys = Object.keys(data[0]).filter(key => typeof data[0][key] === 'number');

    keys.forEach(key => {
      const values = data.map(item => item[key]).filter(v => typeof v === 'number');
      
      metrics[key] = {
        average: values.reduce((a, b) => a + b, 0) / values.length,
        median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        min: Math.min(...values),
        max: Math.max(...values),
        sum: values.reduce((a, b) => a + b, 0),
        trend: values[values.length - 1] - values[0]
      };
    });

    return metrics;
  }, [data]);

  // 處理文件上傳
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFileName(file.name);

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
        } catch (error) {
          alert('JSON 格式錯誤');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          setData(results.data.filter(row => Object.values(row).some(v => v !== null && v !== '')));
        },
        error: () => {
          alert('CSV 格式錯誤');
        }
      });
    } else {
      alert('請上傳 CSV 或 JSON 文件');
    }
  };

  // 匯出報表
  const exportReport = () => {
    const report = {
      fileName: uploadedFileName || 'sample-data',
      date: new Date().toISOString(),
      dataCount: data.length,
      statistics: statistics,
      data: data
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 準備圖表數據
  const numericKeys = data.length > 0 ? Object.keys(data[0]).filter(key => typeof data[0][key] === 'number') : [];
  const categoryKey = data.length > 0 ? Object.keys(data[0]).find(key => typeof data[0][key] !== 'number') : null;

  // 準備餅圖數據
  const pieData = useMemo(() => {
    if (data.length === 0 || numericKeys.length === 0) return [];
    
    const lastDataPoint = data[data.length - 1];
    return numericKeys.map(key => ({
      name: key,
      value: Math.abs(lastDataPoint[key] || 0)
    })).filter(item => item.value > 0);
  }, [data, numericKeys]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-indigo-600">📊 數據分析工具</h1>
          <p className="text-gray-600 mt-1">上傳數據，即時分析與可視化</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">上傳數據</h2>
              <p className="text-gray-600 text-sm">支援 CSV 或 JSON 格式</p>
              {uploadedFileName && (
                <p className="text-indigo-600 font-semibold mt-2">📄 {uploadedFileName}</p>
              )}
            </div>
            <div className="flex gap-3">
              <label className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition cursor-pointer">
                選擇文件
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => { setData(sampleData); setUploadedFileName(''); }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                使用示例數據
              </button>
              <button
                onClick={exportReport}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                匯出報表
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {Object.keys(statistics).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(statistics).map(([key, stats]) => (
              <div key={key} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-700 mb-3 capitalize">{key}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均值：</span>
                    <span className="font-semibold">{stats.average.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">中位數：</span>
                    <span className="font-semibold">{stats.median.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最小值：</span>
                    <span className="font-semibold">{stats.min.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最大值：</span>
                    <span className="font-semibold">{stats.max.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">總和：</span>
                    <span className="font-semibold">{stats.sum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">趨勢：</span>
                    <span className={`font-semibold ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.trend).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">圖表類型</label>
              <div className="flex gap-2">
                {['line', 'bar', 'pie'].map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      chartType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {type === 'line' && '📈 折線圖'}
                    {type === 'bar' && '📊 長條圖'}
                    {type === 'pie' && '🥧 圓餅圖'}
                  </button>
                ))}
              </div>
            </div>

            {chartType !== 'pie' && numericKeys.length > 0 && (
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">顯示指標</label>
                <div className="flex flex-wrap gap-2">
                  {numericKeys.map(key => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedMetrics(prev =>
                          prev.includes(key)
                            ? prev.filter(k => k !== key)
                            : [...prev, key]
                        );
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        selectedMetrics.includes(key)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">數據可視化</h2>
          
          {data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>請上傳數據或使用示例數據</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'line' && (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={categoryKey || 'name'} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedMetrics.map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              )}

              {chartType === 'bar' && (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={categoryKey || 'name'} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedMetrics.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </BarChart>
              )}

              {chartType === 'pie' && (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Data Table */}
        {data.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8 overflow-x-auto">
            <h2 className="text-xl font-bold mb-4">原始數據</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {Object.keys(data[0]).map(key => (
                    <th key={key} className="px-4 py-2 text-left font-semibold">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="px-4 py-2">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
