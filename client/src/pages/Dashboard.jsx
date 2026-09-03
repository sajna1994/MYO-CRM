import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import {
  Card,
  Col,
  Row,
  Spin,
  Table,
  Statistic,
  Tag,
  Empty,
  message,
} from 'antd';

import {
  InboxOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  DollarOutlined,
  TeamOutlined,
  ShopOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import API from '../api/axios';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);

  // =========================================================
  // FETCH ALL DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const [
        productsRes,
        purchasesRes,
        invoicesRes,
        customersRes,
        suppliersRes,
      ] = await Promise.all([
        API.get('/products?limit=1000'),
        API.get('/purchases?limit=1000'),
        API.get('/invoices?limit=1000'),
        API.get('/customers?limit=1000'),
        API.get('/suppliers?limit=1000'),
      ]);

      setProducts(productsRes.data?.data || []);
      setPurchases(purchasesRes.data?.data || []);
      setInvoices(invoicesRes.data?.data || []);
      setCustomers(customersRes.data?.data || []);
      setSuppliers(suppliersRes.data?.data || []);

    } catch (error) {
      console.error(
        'Dashboard loading error:',
        error
      );

      message.error(
        error.response?.data?.message ||
        'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HELPER
  // =========================================================

  const getProductPrice = (product) => {
    return Number(
      product?.price ??
      product?.sellingPrice ??
      product?.salePrice ??
      0
    );
  };

  const getStock = (product) => {
    return Number(
      product?.stock ??
      product?.quantity ??
      0
    );
  };

  const getLowStockThreshold = (product) => {
    return Number(
      product?.lowStockThreshold ??
      product?.reorderLevel ??
      10
    );
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      'en-IN'
    )}`;
  };

  // =========================================================
  // TOTAL PRODUCTS
  // =========================================================

  const totalProducts = products.length;

  // =========================================================
  // TOTAL STOCK
  // =========================================================

  const totalStock = useMemo(() => {
    return products.reduce(
      (total, product) =>
        total + getStock(product),
      0
    );
  }, [products]);

  // =========================================================
  // LOW STOCK PRODUCTS
  // =========================================================

  const lowStockProducts = useMemo(() => {
    return products
      .filter((product) => {
        const stock = getStock(product);
        const threshold =
          getLowStockThreshold(product);

        return stock <= threshold;
      })
      .sort(
        (a, b) =>
          getStock(a) - getStock(b)
      );
  }, [products]);

  // =========================================================
  // TODAY SALES
  // =========================================================

  const todaySales = useMemo(() => {
    const today =
      dayjs().format('YYYY-MM-DD');

    return invoices
      .filter((invoice) => {
        const invoiceDate =
          invoice.invoiceDate ||
          invoice.createdAt ||
          invoice.date;

        return (
          invoiceDate &&
          dayjs(invoiceDate).format(
            'YYYY-MM-DD'
          ) === today &&
          invoice.status !== 'cancelled'
        );
      })
      .reduce(
        (total, invoice) =>
          total +
          Number(invoice.totalAmount || 0),
        0
      );
  }, [invoices]);

  // =========================================================
  // TODAY PURCHASES
  // =========================================================

  const todayPurchases = useMemo(() => {
    const today =
      dayjs().format('YYYY-MM-DD');

    return purchases
      .filter((purchase) => {
        const purchaseDate =
          purchase.date ||
          purchase.createdAt;

        return (
          purchaseDate &&
          dayjs(purchaseDate).format(
            'YYYY-MM-DD'
          ) === today
        );
      })
      .reduce(
        (total, purchase) =>
          total +
          Number(
            purchase.totalPrice ||
            purchase.totalAmount ||
            0
          ),
        0
      );
  }, [purchases]);

  // =========================================================
  // TODAY INVOICE COUNT
  // =========================================================

  const todayInvoiceCount = useMemo(() => {
    const today =
      dayjs().format('YYYY-MM-DD');

    return invoices.filter((invoice) => {
      const invoiceDate =
        invoice.invoiceDate ||
        invoice.createdAt ||
        invoice.date;

      return (
        invoiceDate &&
        dayjs(invoiceDate).format(
          'YYYY-MM-DD'
        ) === today &&
        invoice.status !== 'cancelled'
      );
    }).length;
  }, [invoices]);

  // =========================================================
  // RECENT PURCHASES
  // =========================================================

  const recentPurchases = useMemo(() => {
    return [...purchases]
      .sort((a, b) => {
        return (
          new Date(
            b.date || b.createdAt
          ) -
          new Date(
            a.date || a.createdAt
          )
        );
      })
      .slice(0, 5)
      .map((purchase) => ({
        key: purchase._id,

        date: dayjs(
          purchase.date ||
          purchase.createdAt
        ).format('DD-MM-YYYY'),

        invoiceNumber:
          purchase.invoiceNumber || '-',

        product:
          purchase.product ||
          purchase.productName ||
          '-',

        supplier:
          purchase.supplier ||
          '-',

        qty:
          Number(
            purchase.quantity ||
            purchase.qty ||
            0
          ),

        total:
          Number(
            purchase.totalPrice ||
            purchase.totalAmount ||
            0
          ),
      }));
  }, [purchases]);

  // =========================================================
  // RECENT SALES
  // =========================================================

  const recentSales = useMemo(() => {
    return [...invoices]
      .filter(
        (invoice) =>
          invoice.status !== 'cancelled'
      )
      .sort((a, b) => {
        return (
          new Date(
            b.invoiceDate ||
            b.createdAt
          ) -
          new Date(
            a.invoiceDate ||
            a.createdAt
          )
        );
      })
      .slice(0, 5)
      .map((invoice) => ({
        key: invoice._id,

        date: dayjs(
          invoice.invoiceDate ||
          invoice.createdAt
        ).format('DD-MM-YYYY'),

        invoiceNumber:
          invoice.invoiceNumber || '-',

        customer:
          invoice.customer?.name ||
          invoice.customerName ||
          'Walk-in Customer',

        total:
          Number(
            invoice.totalAmount || 0
          ),

        status:
          invoice.status || 'unpaid',
      }));
  }, [invoices]);

  // =========================================================
  // DASHBOARD CARDS
  // =========================================================

  const cards = [
    {
      title: 'Total Products',
      value: totalProducts,
      note: 'Products in catalogue',
      icon: <InboxOutlined />,
      tone: 'blue',
    },

    {
      title: 'Total Stock',
      value: totalStock,
      note: 'Total quantity in stock',
      icon: <ShoppingCartOutlined />,
      tone: 'green',
    },

    {
      title: 'Low Stock Items',
      value: lowStockProducts.length,
      note: 'Need reorder',
      icon: <WarningOutlined />,
      tone: 'orange',
    },

    {
      title: "Today's Sales",
      value: formatCurrency(todaySales),
      note: `${todayInvoiceCount} invoice(s) today`,
      icon: <DollarOutlined />,
      tone: 'purple',
    },

    {
      title: "Today's Purchases",
      value: formatCurrency(todayPurchases),
      note: 'Purchase value today',
      icon: <FallOutlined />,
      tone: 'red',
    },

    {
      title: 'Customers',
      value: customers.length,
      note: 'Registered customers',
      icon: <TeamOutlined />,
      tone: 'cyan',
    },

    {
      title: 'Suppliers',
      value: suppliers.length,
      note: 'Registered suppliers',
      icon: <ShopOutlined />,
      tone: 'indigo',
    },

    {
      title: 'Total Invoices',
      value: invoices.length,
      note: 'All invoices',
      icon: <RiseOutlined />,
      tone: 'teal',
    },
  ];

  // =========================================================
  // PURCHASE TABLE
  // =========================================================

  const purchaseColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },

    {
      title: 'Invoice No.',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },

    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
    },

    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
    },

    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      align: 'center',
    },

    {
      title: 'Total Price',
      dataIndex: 'total',
      key: 'total',
      align: 'right',

      render: (value) =>
        formatCurrency(value),
    },
  ];

  // =========================================================
  // SALES TABLE
  // =========================================================

  const salesColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },

    {
      title: 'Invoice',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },

    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },

    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      align: 'right',

      render: (value) =>
        formatCurrency(value),
    },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',

      render: (status) => {
        const colors = {
          paid: 'green',
          unpaid: 'orange',
          partial: 'blue',
          overdue: 'red',
          cancelled: 'default',
        };

        return (
          <Tag color={colors[status] || 'default'}>
            {String(status).toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="dashboard-loader">
        <Spin size="large" />
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="fitness-dashboard">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="fitness-dashboard__header">

        <div>
          <h1>Dashboard</h1>

          <p>
            Welcome back,{' '}
            {user?.name || 'Admin'}!
          </p>
        </div>

        <div className="dashboard-date">
          {dayjs().format(
            'DD MMMM YYYY'
          )}
        </div>

      </header>


      {/* ===================================================
          STAT CARDS
      =================================================== */}

      <Row
        gutter={[18, 18]}
        className="fitness-stats"
      >

        {cards.map((card) => (

          <Col
            xs={24}
            sm={12}
            md={8}
            xl={6}
            key={card.title}
          >

            <Card
              className={`fitness-stat fitness-stat--${card.tone}`}
            >

              <span className="fitness-stat__icon">
                {card.icon}
              </span>

              <div>
                <p>{card.title}</p>

                <strong>
                  {card.value}
                </strong>

                <small>
                  {card.note}
                </small>
              </div>

            </Card>

          </Col>

        ))}

      </Row>


      {/* ===================================================
          PURCHASES + LOW STOCK
      =================================================== */}

      <Row gutter={[22, 22]}>

        <Col xs={24} xl={16}>

          <Card
            className="fitness-panel"
            title={
              <PanelTitle
                title="Recent Purchases"
                to="/purchases"
              />
            }
          >

            {recentPurchases.length === 0 ? (

              <Empty
                description="No purchases found"
              />

            ) : (

              <Table
                className="fitness-table"
                columns={purchaseColumns}
                dataSource={recentPurchases}
                pagination={false}
                scroll={{ x: 700 }}
              />

            )}

          </Card>

        </Col>


        <Col xs={24} xl={8}>

          <Card
            className="fitness-panel fitness-alerts"
            title={
              <PanelTitle
                title="Low Stock Alerts"
                to="/inventory"
              />
            }
          >

            {lowStockProducts.length === 0 ? (

              <div className="no-low-stock">
                <span>✓</span>
                <strong>
                  All stock levels are healthy
                </strong>
                <small>
                  No products need reordering.
                </small>
              </div>

            ) : (

              lowStockProducts
                .slice(0, 6)
                .map((product) => {

                  const stock =
                    getStock(product);

                  const threshold =
                    getLowStockThreshold(
                      product
                    );

                  const initials =
                    product.name
                      ?.split(' ')
                      .map((word) =>
                        word[0]
                      )
                      .join('')
                      .substring(0, 3)
                      .toUpperCase() ||
                    'PRD';

                  return (
                    <div
                      className="low-stock-item"
                      key={product._id}
                    >

                      <span className="supplement-placeholder">
                        {initials}
                      </span>

                      <div>
                        <strong>
                          {product.name}
                        </strong>

                        <small>
                          Reorder level:{' '}
                          {threshold}
                        </small>
                      </div>

                      <div className="low-stock-item__count">

                        <span>
                          Low Stock
                        </span>

                        <b>
                          {stock} pcs
                        </b>

                      </div>

                    </div>
                  );
                })

            )}

          </Card>

        </Col>

      </Row>


      {/* ===================================================
          RECENT SALES
      =================================================== */}

      <Row
        gutter={[22, 22]}
        style={{
          marginTop: 22,
        }}
      >

        <Col xs={24}>

          <Card
            className="fitness-panel"
            title={
              <PanelTitle
                title="Recent Sales / Billing"
                to="/billing"
              />
            }
          >

            {recentSales.length === 0 ? (

              <Empty
                description="No invoices found"
              />

            ) : (

              <Table
                className="fitness-table"
                columns={salesColumns}
                dataSource={recentSales}
                pagination={false}
                scroll={{ x: 700 }}
              />

            )}

          </Card>

        </Col>

      </Row>

    </div>
  );
};


// =========================================================
// PANEL TITLE
// =========================================================

const PanelTitle = ({
  title,
  to,
}) => (

  <div className="fitness-panel__title">

    <span>{title}</span>

    <Link to={to}>
      View All
    </Link>

  </div>
);


export default Dashboard;