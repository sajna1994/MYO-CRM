import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Statistic,
  Tabs,
  Tag,
  Tooltip as AntTooltip,
  Typography,
  message,
} from 'antd';

import {
  BarChartOutlined,
  DollarOutlined,
  PieChartOutlined,
  UserOutlined,
  ReloadOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

import API from '../api/axios';
import '../styles/Reports.css';

const { Title, Text } = Typography;


// ============================================================
// COLORS
// ============================================================

const CHART_COLORS = [
  '#ff8a00',
  '#6c5ce7',
  '#00b894',
  '#0984e3',
  '#e17055',
  '#a29bfe',
];


// ============================================================
// REPORTS
// ============================================================

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [leads, setLeads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);


  // ==========================================================
  // FETCH REPORTS
  // ==========================================================

  const fetchReports = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [
          salesRes,
          expensesRes,
          leadsRes,
        ] = await Promise.all([
          API.get('/reports/sales'),
          API.get('/reports/purchases'),
          API.get('/reports/leads'),
        ]);

        setSales(
          salesRes.data?.data || []
        );

        setExpenses(
          expensesRes.data?.data || []
        );

        setLeads(
          leadsRes.data?.data || []
        );

        setError(null);

        if (showRefresh) {
          message.success(
            'Reports refreshed successfully'
          );
        }
      } catch (err) {
        console.error(
          'REPORT FETCH ERROR:',
          err
        );

        setError(
          err.response?.data?.message ||
            'Failed to load reports data. Please check the backend report APIs.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  useEffect(() => {
    fetchReports();
  }, [fetchReports]);


  // ==========================================================
  // FORMAT CURRENCY
  // ==========================================================

  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };


  // ==========================================================
  // FORMAT MONTH
  // ==========================================================

  const formatMonth = (month) => {
    if (!month) return '-';

    const [year, monthNumber] =
      month.split('-');

    const date = new Date(
      Number(year),
      Number(monthNumber) - 1,
      1
    );

    return date.toLocaleDateString(
      'en-IN',
      {
        month: 'short',
        year: 'numeric',
      }
    );
  };


  // ==========================================================
  // CALCULATE SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    const totalSales = sales.reduce(
      (sum, item) =>
        sum +
        Number(item.totalSales || 0),
      0
    );

    const totalPaid = sales.reduce(
      (sum, item) =>
        sum +
        Number(item.totalPaid || 0),
      0
    );

    const totalExpenses =
      expenses.reduce(
        (sum, item) =>
          sum +
          Number(
            item.totalAmount || 0
          ),
        0
      );

    const totalInvoices =
      sales.reduce(
        (sum, item) =>
          sum +
          Number(
            item.invoiceCount || 0
          ),
        0
      );

    const totalLeads =
      leads.reduce(
        (sum, item) =>
          sum +
          Number(item.count || 0),
        0
      );

    const convertedLeads =
      leads
        .filter(
          (item) =>
            item.status ===
            'converted'
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.count || 0
            ),
          0
        );

    const netCollected =
      totalPaid - totalExpenses;

    return {
      totalSales,
      totalPaid,
      totalExpenses,
      totalInvoices,
      totalLeads,
      convertedLeads,
      netCollected,
    };
  }, [sales, expenses, leads]);


  // ==========================================================
  // SALES CHART DATA
  // ==========================================================

  const salesChartData = useMemo(() => {
    return sales.map((item) => ({
      ...item,
      monthLabel: formatMonth(
        item.month
      ),
    }));
  }, [sales]);


  // ==========================================================
  // LEAD CONVERSION
  // ==========================================================

  const conversionRate =
    summary.totalLeads > 0
      ? (
          (summary.convertedLeads /
            summary.totalLeads) *
          100
        ).toFixed(1)
      : '0.0';


  // ==========================================================
  // STATUS LABEL
  // ==========================================================

  const getLeadStatusLabel = (
    status
  ) => {
    const labels = {
      new: 'New',
      contacted: 'Contacted',
      converted: 'Converted',
    };

    return (
      labels[status] ||
      status ||
      'Unknown'
    );
  };


  // ==========================================================
  // LEAD STATUS COLOR
  // ==========================================================

  const getLeadStatusColor = (
    status
  ) => {
    const colors = {
      new: '#0984e3',
      contacted: '#ff8a00',
      converted: '#00b894',
    };

    return (
      colors[status] ||
      '#8884d8'
    );
  };


  // ==========================================================
  // SUMMARY CARD
  // ==========================================================

  const SummaryCard = ({
    title,
    value,
    prefix,
    icon,
    className = '',
  }) => (
    <Card
      className={`report-summary-card ${className}`}
    >
      <div className="report-summary-top">
        <div className="report-summary-icon">
          {icon}
        </div>
      </div>

      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        precision={
          typeof value === 'number'
            ? 2
            : undefined
        }
      />
    </Card>
  );


  // ==========================================================
  // SALES REPORT
  // ==========================================================

  const SalesReport = () => {
    if (loading) {
      return (
        <Card className="report-chart-card">
          <Skeleton active />
        </Card>
      );
    }

    if (!sales.length) {
      return (
        <Card className="report-chart-card report-empty-card">
          <Empty
            description="No sales data available"
          />
        </Card>
      );
    }

    return (
      <Card className="report-chart-card">

        <div className="report-chart-header">
          <div>
            <h2>
              Sales Revenue
            </h2>

            <p>
              Monthly sales and collected revenue
            </p>
          </div>

          <Tag color="orange">
            {sales.length} months
          </Tag>
        </div>

        <div className="report-chart-container">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={salesChartData}
              margin={{
                top: 15,
                right: 10,
                left: 5,
                bottom: 10,
              }}
            >

              <defs>
                <linearGradient
                  id="salesGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#ff8a00"
                    stopOpacity={0.25}
                  />

                  <stop
                    offset="95%"
                    stopColor="#ff8a00"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="monthLabel"
                tick={{
                  fontSize: 12,
                }}
              />

              <YAxis
                tick={{
                  fontSize: 11,
                }}
                tickFormatter={(value) =>
                  `₹${(
                    value / 1000
                  ).toFixed(0)}k`
                }
              />

              <Tooltip
                formatter={(
                  value,
                  name
                ) => [
                  formatCurrency(value),
                  name ===
                  'totalSales'
                    ? 'Total Sales'
                    : 'Paid Revenue',
                ]}
              />

              <Legend />

              <Area
                type="monotone"
                dataKey="totalSales"
                name="Total Sales"
                stroke="#ff8a00"
                strokeWidth={3}
                fill="url(#salesGradient)"
              />

              <Area
                type="monotone"
                dataKey="totalPaid"
                name="Paid Revenue"
                stroke="#6c5ce7"
                strokeWidth={2}
                fill="transparent"
              />

            </AreaChart>
          </ResponsiveContainer>

        </div>

      </Card>
    );
  };


  // ==========================================================
  // EXPENSE REPORT
  // ==========================================================

  const ExpenseReport = () => {
    if (loading) {
      return (
        <Card className="report-chart-card">
          <Skeleton active />
        </Card>
      );
    }

    if (!expenses.length) {
      return (
        <Card className="report-chart-card report-empty-card">
          <Empty
            description="No purchase data available"
          />
        </Card>
      );
    }

    return (
      <Card className="report-chart-card">

        <div className="report-chart-header">
          <div>
            <h2>
              Purchases by Category
            </h2>

            <p>
              Total purchase amount by category
            </p>
          </div>

          <Tag color="purple">
            {expenses.length} categories
          </Tag>
        </div>

        <div className="report-pie-container">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>

              <Pie
                data={expenses}
                dataKey="totalAmount"
                nameKey="category"
                cx="50%"
                cy="45%"
                outerRadius="65%"
                innerRadius="30%"
                paddingAngle={3}
                labelLine={false}
                label={({
                  name,
                  percent,
                }) =>
                  `${name} ${(
                    percent * 100
                  ).toFixed(0)}%`
                }
              >

                {expenses.map(
                  (entry, index) => (
                    <Cell
                      key={`expense-${index}`}
                      fill={
                        CHART_COLORS[
                          index %
                            CHART_COLORS.length
                        ]
                      }
                    />
                  )
                )}

              </Pie>

              <Tooltip
                formatter={(value) =>
                  formatCurrency(value)
                }
              />

              <Legend
                verticalAlign="bottom"
                height={45}
              />

            </PieChart>
          </ResponsiveContainer>

        </div>

      </Card>
    );
  };


  // ==========================================================
  // LEADS REPORT
  // ==========================================================

  const LeadReport = () => {
    if (loading) {
      return (
        <Card className="report-chart-card">
          <Skeleton active />
        </Card>
      );
    }

    if (!leads.length) {
      return (
        <Card className="report-chart-card report-empty-card">
          <Empty
            description="No lead data available"
          />
        </Card>
      );
    }

    return (
      <Card className="report-chart-card">

        <div className="report-chart-header">
          <div>
            <h2>
              Leads by Status
            </h2>

            <p>
              Current lead pipeline distribution
            </p>
          </div>

          <Tag color="green">
            {summary.totalLeads} leads
          </Tag>
        </div>

        <div className="report-lead-layout">

          <div className="report-pie-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={leads}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="68%"
                  paddingAngle={4}
                >

                  {leads.map(
                    (entry, index) => (
                      <Cell
                        key={`lead-${index}`}
                        fill={getLeadStatusColor(
                          entry.status
                        )}
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend
                  verticalAlign="bottom"
                  height={45}
                  formatter={(value) =>
                    getLeadStatusLabel(
                      value
                    )
                  }
                />

              </PieChart>
            </ResponsiveContainer>

          </div>


          <div className="lead-status-list">

            {leads.map(
              (lead, index) => (
                <div
                  className="lead-status-item"
                  key={lead.status}
                >

                  <div className="lead-status-left">

                    <span
                      className="lead-status-dot"
                      style={{
                        background:
                          getLeadStatusColor(
                            lead.status
                          ),
                      }}
                    />

                    <span>
                      {getLeadStatusLabel(
                        lead.status
                      )}
                    </span>

                  </div>

                  <strong>
                    {lead.count}
                  </strong>

                </div>
              )
            )}

            <div className="lead-conversion-box">

              <span>
                Conversion Rate
              </span>

              <strong>
                {conversionRate}%
              </strong>

            </div>

          </div>

        </div>

      </Card>
    );
  };


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="reports-page">

        <Alert
          message="Unable to load reports"
          description={error}
          type="error"
          showIcon
          action={
            <Button
              size="small"
              onClick={() =>
                fetchReports()
              }
            >
              Retry
            </Button>
          }
        />

      </div>
    );
  }


  // ==========================================================
  // TABS
  // ==========================================================

  const tabItems = [
    {
      key: 'sales',
      label: (
        <span className="report-tab-label">
          <BarChartOutlined />
          Sales
        </span>
      ),
      children: <SalesReport />,
    },

    {
      key: 'expenses',
      label: (
        <span className="report-tab-label">
          <PieChartOutlined />
          Purchases
        </span>
      ),
      children: <ExpenseReport />,
    },

    {
      key: 'leads',
      label: (
        <span className="report-tab-label">
          <UserOutlined />
          Leads
        </span>
      ),
      children: <LeadReport />,
    },
  ];


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="reports-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="reports-header">

        <div>
          <Title
            level={2}
            className="reports-title"
          >
            System Reports
          </Title>

          <p className="reports-subtitle">
            Monitor sales, purchases and lead performance
          </p>
        </div>

        <Button
          icon={<ReloadOutlined />}
          loading={refreshing}
          onClick={() =>
            fetchReports(true)
          }
          className="reports-refresh-btn"
        >
          Refresh Reports
        </Button>

      </div>


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <Row
        gutter={[
          12,
          12,
        ]}
        className="reports-summary"
      >

        <Col
          xs={12}
          sm={12}
          md={8}
          lg={6}
        >
          <SummaryCard
            title="Total Sales"
            value={
              summary.totalSales
            }
            prefix="₹"
            icon={
              <RiseOutlined />
            }
          />
        </Col>


        <Col
          xs={12}
          sm={12}
          md={8}
          lg={6}
        >
          <SummaryCard
            title="Collected"
            value={
              summary.totalPaid
            }
            prefix="₹"
            icon={
              <DollarOutlined />
            }
          />
        </Col>


        <Col
          xs={12}
          sm={12}
          md={8}
          lg={6}
        >
          <SummaryCard
            title="Purchases"
            value={
              summary.totalExpenses
            }
            prefix="₹"
            icon={
              <ShoppingCartOutlined />
            }
          />
        </Col>


        <Col
          xs={12}
          sm={12}
          md={8}
          lg={6}
        >
          <SummaryCard
            title="Total Leads"
            value={
              summary.totalLeads
            }
            icon={
              <UserOutlined />
            }
          />
        </Col>

      </Row>


      {/* ======================================================
          NET COLLECTION
      ====================================================== */}

      <Card className="report-net-card">

        <div>
          <span>
            Net Collected
          </span>

          <small>
            Paid revenue − purchases
          </small>
        </div>

        <strong>
          {formatCurrency(
            summary.netCollected
          )}
        </strong>

      </Card>


      {/* ======================================================
          REPORT TABS
      ====================================================== */}

      <div className="reports-tabs-wrapper">

        <Tabs
          defaultActiveKey="sales"
          items={tabItems}
          type="card"
          className="reports-tabs"
        />

      </div>

    </div>
  );
};

export default Reports;