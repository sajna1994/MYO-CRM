import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Input, Row, Select, Spin, Table, Tag, message } from 'antd';
import { AppstoreOutlined, DatabaseOutlined, SearchOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import API from '../api/axios';
import '../styles/Inventory.css'; // We'll create this

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([API.get('/products?limit=100'), API.get('/categories')])
      .then(([productRes, categoryRes]) => { 
        setProducts(productRes.data.data || []); 
        setCategories(categoryRes.data.data || []); 
      })
      .catch(() => message.error('Unable to load stock information'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => products.filter((product) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || product.name?.toLowerCase().includes(term) || product.sku?.toLowerCase().includes(term);
    const categoryId = product.category?._id || product.category;
    return matchesSearch && (!category || categoryId === category);
  }), [products, search, category]);

  const totals = useMemo(() => ({
    products: products.length,
    stock: products.reduce((sum, item) => sum + (item.stock || 0), 0),
    low: products.filter((item) => item.stock > 0 && item.stock <= (item.lowStockThreshold ?? 10)).length,
    out: products.filter((item) => item.stock === 0).length,
  }), [products]);

  const status = (item) => item.stock === 0 ? 'Out of Stock' : item.stock <= (item.lowStockThreshold ?? 10) ? 'Low Stock' : 'In Stock';

  const columns = [
    { 
      title: 'Product', 
      dataIndex: 'name', 
      key: 'name',
      render: (value) => value || '-',
    },
    { 
      title: 'Category', 
      key: 'category', 
      render: (_, item) => item.category?.name || item.categoryName || '-',
      responsive: ['sm'],
    },
    { 
      title: 'Stock Qty', 
      dataIndex: 'stock', 
      key: 'stock', 
      align: 'center',
      render: (value) => value ?? 0,
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
      render: (_, item) => item.stock === 0 ? 1 : 0,
      responsive: ['lg'],
    },
    { 
      title: 'Status', 
      key: 'status', 
      align: 'center', 
      render: (_, item) => { 
        const value = status(item); 
        return (
          <Tag className={`stock-status stock-status--${value.toLowerCase().replaceAll(' ', '-')}`}>
            {value}
          </Tag>
        ); 
      },
    },
  ];

  const cards = [
    ['Total Products', totals.products, <AppstoreOutlined />, 'blue'],
    ['Total Stock Qty', totals.stock.toLocaleString('en-IN'), <DatabaseOutlined />, 'blue'],
    ['Low Stock Items', totals.low, <WarningOutlined />, 'orange'],
    ['Out of Stock', totals.out, <CloseCircleOutlined />, 'red'],
  ];

  return (
    <div className="stock-page">
      <h1 className="stock-page__title">Stock Management</h1>
      
      <section className="stock-overview">
        <h2 className="stock-overview__heading">Stock Overview</h2>
        
        {loading ? (
          <div className="stock-loader">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]} className="stock-summary">
              {cards.map(([label, value, icon, tone]) => (
                <Col xs={24} sm={12} xl={6} key={label}>
                  <Card className={`stock-summary-card stock-summary-card--${tone}`}>
                    <div className="stock-summary-card__content">
                      <div>
                        <span className="stock-summary-card__label">{label}</span>
                        <strong className="stock-summary-card__value">{value}</strong>
                      </div>
                      <i className="stock-summary-card__icon">{icon}</i>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <div className="stock-filters">
              <Input 
                value={search} 
                onChange={(event) => setSearch(event.target.value)} 
                prefix={<SearchOutlined />} 
                placeholder="Search Product..." 
                className="stock-search"
                allowClear
              />
              <Select 
                value={category} 
                onChange={setCategory} 
                placeholder="All Category" 
                allowClear 
                className="stock-category-select"
                options={categories.map((item) => ({ 
                  value: item._id, 
                  label: item.name 
                }))}
              />
            </div>

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
            />
          </>
        )}
      </section>
    </div>
  );
};

export default Inventory;