import { useState, useEffect } from 'react';
import { Tabs, Card, Spin, Alert, Typography } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import API from '../api/axios';

const { Title } = Typography;

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [salesRes, expRes, leadsRes] = await Promise.all([
          API.get('/reports/sales'),
          API.get('/reports/purchases'),
          API.get('/reports/leads'),
        ]);
        setSales(salesRes.data.data);
        setExpenses(expRes.data.data);
        setLeads(leadsRes.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load reports data. Ensure backend endpoints are active.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

  if (error) {
    return <Alert message={error} type="error" showIcon style={{ marginTop: 20 }} />;
  }

  const items = [
    {
      key: '1',
      label: 'Sales Revenue (Monthly)',
      children: (
        <Card bordered={false} style={{ height: 500, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {loading ? <Spin /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(val) => `$${val}`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                <Legend />
                <Bar dataKey="totalPaid" name="Paid Revenue" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalSales" name="Expected Output" fill="#a29bfe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      ),
    },
    {
      key: '2',
      label: 'Expenses by Category',
      children: (
        <Card bordered={false} style={{ height: 500, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {loading ? <Spin /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenses}
                  dataKey="totalAmount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      ),
    },
    {
      key: '3',
      label: 'Leads by Status',
      children: (
        <Card bordered={false} style={{ height: 500, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {loading ? <Spin /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leads}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={150}
                  fill="#82ca9d"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {leads.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>System Reports</Title>
      <Tabs defaultActiveKey="1" items={items} type="card" />
    </div>
  );
};

export default Reports;
