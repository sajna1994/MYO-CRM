import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  Input,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  message,
  Empty,
} from 'antd';

import {
  AppstoreOutlined,
  DatabaseOutlined,
  SearchOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';

import API from '../api/axios';
import '../styles/Inventory.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/products?limit=100'),
      API.get('/categories'),
    ])
      .then(([productRes, categoryRes]) => {
        setProducts(productRes.data.data || []);
        setCategories(categoryRes.data.data || []);
      })
      .catch(() => {
        message.error('Unable to load stock information');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getCategoryName = (product) => {
    if (
      product.category &&
      typeof product.category === 'object'
    ) {
      return product.category.name || '-';
    }

    return product.categoryName || product.category || '-';
  };

  const getCategoryId = (product) => {
    return product.category?._id || product.category;
  };

  const getStatus = (item) => {
    const stock = Number(item.stock || 0);
    const threshold = Number(
      item.lowStockThreshold ?? 10
    );

    if (stock === 0) {
      return 'Out of Stock';
    }

    if (stock <= threshold) {
      return 'Low Stock';
    }

    return 'In Stock';
  };

  const getStatusClass = (item) => {
    return getStatus(item)
      .toLowerCase()
      .replaceAll(' ', '-');
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term);

      const categoryId = getCategoryId(product);

      return (
        matchesSearch &&
        (!category || categoryId === category)
      );
    });
  }, [products, search, category]);

  const totals = useMemo(
    () => ({
      products: products.length,

      stock: products.reduce(
        (sum, item) =>
          sum + Number(item.stock || 0),
        0
      ),

      low: products.filter((item) => {
        const stock = Number(item.stock || 0);
        const threshold = Number(
          item.lowStockThreshold ?? 10
        );

        return stock > 0 && stock <= threshold;
      }).length,

      out: products.filter(
        (item) => Number(item.stock || 0) === 0
      ).length,
    }),
    [products]
  );

  const cards = [
    {
      label: 'Total Products',
      value: totals.products,
      icon: <AppstoreOutlined />,
      tone: 'blue',
    },
    {
      label: 'Total Stock',
      value: totals.stock.toLocaleString('en-IN'),
      icon: <DatabaseOutlined />,
      tone: 'purple',
    },
    {
      label: 'Low Stock',
      value: totals.low,
      icon: <WarningOutlined />,
      tone: 'orange',
    },
    {
      label: 'Out of Stock',
      value: totals.out,
      icon: <CloseCircleOutlined />,
      tone: 'red',
    },
  ];

  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (value) => (
        <strong className="inventory-product-name">
          {value || '-'}
        </strong>
      ),
    },

    {
      title: 'Category',
      key: 'category',
      render: (_, item) =>
        getCategoryName(item),
      responsive: ['sm'],
    },

    {
      title: 'Stock Qty',
      dataIndex: 'stock',
      key: 'stock',
      align: 'center',
      render: (value) => (
        <strong className="inventory-stock-number">
          {value ?? 0}
        </strong>
      ),
    },

    {
      title: 'Reorder Level',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      align: 'center',
      render: (value) => value ?? 10,
      responsive: ['md'],
    },

    {
      title: 'Out of Stock',
      key: 'out',
      align: 'center',
      render: (_, item) =>
        Number(item.stock || 0) === 0 ? 1 : 0,
      responsive: ['lg'],
    },

    {
      title: 'Status',
      key: 'status',
      align: 'center',

      render: (_, item) => {
        const value = getStatus(item);

        return (
          <Tag
            className={`stock-status stock-status--${getStatusClass(
              item
            )}`}
          >
            {value}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="stock-page">

      {/* PAGE HEADER */}
      <div className="stock-page__header">

        <div className="stock-page__title-wrap">

          <div className="stock-page__icon">
            <DatabaseOutlined />
          </div>

          <div>
            <h1 className="stock-page__title">
              Stock Management
            </h1>

            <p className="stock-page__subtitle">
              Monitor your inventory and stock levels
            </p>
          </div>

        </div>

      </div>

      <section className="stock-overview">

        <div className="stock-overview__top">
          <div>
            <h2 className="stock-overview__heading">
              Stock Overview
            </h2>

            <p className="stock-overview__description">
              Check current product availability
            </p>
          </div>
        </div>

        {loading ? (
          <div className="stock-loader">
            <Spin size="large" />
            <span>Loading inventory...</span>
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}

            <Row
              gutter={[12, 12]}
              className="stock-summary"
            >
              {cards.map((card) => (
                <Col
                  xs={12}
                  sm={12}
                  xl={6}
                  key={card.label}
                >
                  <Card
                    className={`stock-summary-card stock-summary-card--${card.tone}`}
                  >
                    <div className="stock-summary-card__content">

                      <div className="stock-summary-card__text">
                        <span className="stock-summary-card__label">
                          {card.label}
                        </span>

                        <strong className="stock-summary-card__value">
                          {card.value}
                        </strong>
                      </div>

                      <div className="stock-summary-card__icon">
                        {card.icon}
                      </div>

                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* FILTERS */}

            <div className="stock-filters">

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                prefix={<SearchOutlined />}
                placeholder="Search product or SKU"
                className="stock-search"
                allowClear
              />

              <Select
                value={category}
                onChange={setCategory}
                placeholder="All Categories"
                allowClear
                className="stock-category-select"
                options={categories.map((item) => ({
                  value: item._id,
                  label: item.name,
                }))}
              />

            </div>

            {/* RESULT COUNT */}

            <div className="inventory-result-count">
              <span>
                Showing <strong>{filtered.length}</strong> product
                {filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* DESKTOP TABLE */}

            <div className="inventory-desktop-table">

              <Table
                className="stock-table"
                dataSource={filtered}
                columns={columns}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  responsive: true,
                }}
                scroll={{ x: 600 }}
                size="middle"
                locale={{
                  emptyText: (
                    <Empty
                      image={
                        Empty.PRESENTED_IMAGE_SIMPLE
                      }
                      description="No products found"
                    />
                  ),
                }}
              />

            </div>

            {/* MOBILE CARDS */}

            <div className="inventory-mobile-list">

              {filtered.length === 0 ? (
                <div className="inventory-mobile-empty">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No products found"
                  />
                </div>
              ) : (
                filtered.map((item) => {
                  const stock = Number(
                    item.stock || 0
                  );

                  const threshold = Number(
                    item.lowStockThreshold ?? 10
                  );

                  const status = getStatus(item);

                  const statusClass =
                    getStatusClass(item);

                  return (
                    <div
                      className="inventory-mobile-card"
                      key={item._id}
                    >

                      {/* CARD HEADER */}

                      <div className="inventory-mobile-card__header">

                        <div className="inventory-mobile-card__product-icon">
                          <InboxOutlined />
                        </div>

                        <div className="inventory-mobile-card__product-info">

                          <h3>
                            {item.name ||
                              'Unnamed Product'}
                          </h3>

                          <span>
                            {getCategoryName(item)}
                          </span>

                          {item.sku && (
                            <small>
                              SKU: {item.sku}
                            </small>
                          )}

                        </div>

                        <Tag
                          className={`stock-status stock-status--${statusClass}`}
                        >
                          {status}
                        </Tag>

                      </div>

                      {/* STOCK INFORMATION */}

                      <div className="inventory-mobile-card__stock">

                        <div className="inventory-stock-main">

                          <span>
                            Current Stock
                          </span>

                          <strong>
                            {stock}
                          </strong>

                          <small>
                            {item.unit || 'Pcs'}
                          </small>

                        </div>

                        <div className="inventory-stock-reorder">

                          <span>
                            Reorder Level
                          </span>

                          <strong>
                            {threshold}
                          </strong>

                        </div>

                      </div>

                      {/* STOCK BAR */}

                      <div className="inventory-stock-bar">

                        <div className="inventory-stock-bar__top">
                          <span>Stock level</span>

                          <span>
                            {stock === 0
                              ? 'Empty'
                              : stock <= threshold
                              ? 'Needs reorder'
                              : 'Healthy'}
                          </span>
                        </div>

                        <div className="inventory-stock-bar__track">

                          <div
                            className={`inventory-stock-bar__fill inventory-stock-bar__fill--${statusClass}`}
                            style={{
                              width:
                                stock === 0
                                  ? '4%'
                                  : `${Math.min(
                                      100,
                                      Math.max(
                                        8,
                                        (stock /
                                          Math.max(
                                            threshold * 3,
                                            1
                                          )) *
                                          100
                                      )
                                    )}%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>
                  );
                })
              )}

              {filtered.length > 0 && (
                <div className="inventory-mobile-footer">
                  {filtered.length} product
                  {filtered.length !== 1
                    ? 's'
                    : ''}{' '}
                  shown
                </div>
              )}

            </div>
          </>
        )}

      </section>

    </div>
  );
};

export default Inventory;