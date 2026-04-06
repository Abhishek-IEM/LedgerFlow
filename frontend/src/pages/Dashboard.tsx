import { useEffect, useState } from "react";
import { dashboardApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
} from "lucide-react";

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  totalRecords: number;
}

interface CategoryItem {
  category: string;
  income: number;
  expense: number;
  net: number;
}

interface TrendItem {
  period: string;
  income: number;
  expense: number;
}

interface RecentRecord {
  id: string;
  amount: string;
  type: string;
  category: string;
  date: string;
  notes: string | null;
  createdBy?: { name: string };
}

const PIE_COLORS = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0891b2", "#65a30d"];
const PIE_COLORS_DARK = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#22d3ee", "#a3e635"];

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [recent, setRecent] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    dashboardApi.trends(period).then((res) => setTrends(res.data.data));
  }, [period]);

  const loadData = async () => {
    try {
      const [summRes, catRes, trendRes, recentRes] = await Promise.all([
        dashboardApi.summary(),
        dashboardApi.categories(),
        dashboardApi.trends(period),
        dashboardApi.recent(),
      ]);
      setSummary(summRes.data.data);
      setCategories(catRes.data.data);
      setTrends(trendRes.data.data);
      setRecent(recentRes.data.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-container">
          <div className="spinner" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const pieData = categories.map((c) => ({
    name: c.category,
    value: c.income + c.expense,
  }));

  const colors = theme === "dark" ? PIE_COLORS_DARK : PIE_COLORS;
  const gridColor = theme === "dark" ? "#2a2d3a" : "#e5e7eb";
  const tooltipBg = theme === "dark" ? "#1a1d28" : "#ffffff";
  const tooltipBorder = theme === "dark" ? "#2a2d3a" : "#e5e7eb";
  const axisColor = theme === "dark" ? "#636880" : "#9ca3af";
  const incomeColor = theme === "dark" ? "#34d399" : "#059669";
  const expenseColor = theme === "dark" ? "#f87171" : "#dc2626";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <h1>{greeting()}, {user?.name?.split(" ")[0]}</h1>
        <p>Here's your financial overview</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card income">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-body">
            <span className="card-label">Total Income</span>
            <span className="card-value">{formatCurrency(summary?.totalIncome || 0)}</span>
          </div>
        </div>
        <div className="summary-card expense">
          <div className="card-icon">
            <TrendingDown size={24} />
          </div>
          <div className="card-body">
            <span className="card-label">Total Expenses</span>
            <span className="card-value">{formatCurrency(summary?.totalExpenses || 0)}</span>
          </div>
        </div>
        <div className="summary-card balance">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-body">
            <span className="card-label">Net Balance</span>
            <span className="card-value">{formatCurrency(summary?.netBalance || 0)}</span>
          </div>
        </div>
        <div className="summary-card records">
          <div className="card-icon">
            <FileText size={24} />
          </div>
          <div className="card-body">
            <span className="card-label">Total Records</span>
            <span className="card-value">{summary?.totalRecords || 0}</span>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue Trends</h3>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="period-select"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={incomeColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={incomeColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={expenseColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={expenseColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="period"
                tickFormatter={(val) => {
                  if (!val) return "";
                  const d = new Date(val);
                  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }}
                fontSize={12}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val) => formatCurrency(Number(val))}
                labelFormatter={(val) => {
                  const d = new Date(val);
                  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                }}
                contentStyle={{
                  background: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke={incomeColor}
                strokeWidth={2}
                fill="url(#incomeGrad)"
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke={expenseColor}
                strokeWidth={2}
                fill="url(#expenseGrad)"
                name="Expense"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Category Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                dataKey="value"
                paddingAngle={3}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
                fontSize={11}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => formatCurrency(Number(val))}
                contentStyle={{
                  background: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="table-card">
          <h3>Category Details</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Income</th>
                  <th>Expense</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">No category data</td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.category}>
                      <td style={{ fontWeight: 500, color: "var(--text)" }}>{cat.category}</td>
                      <td className="text-green">{formatCurrency(cat.income)}</td>
                      <td className="text-red">{formatCurrency(cat.expense)}</td>
                      <td className={cat.net >= 0 ? "text-green" : "text-red"}>
                        {formatCurrency(cat.net)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <h3>Recent Activity</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">No recent activity</td>
                  </tr>
                ) : (
                  recent.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                      <td>{r.category}</td>
                      <td>
                        <span className={`type-badge ${r.type.toLowerCase()}`}>
                          {r.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(r.amount))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
