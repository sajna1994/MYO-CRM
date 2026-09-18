import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Popconfirm,
  Space,
  Table,
  message,
  Image,
  Empty,
  Spin,
  Tag,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';

import API from '../api/axios';
import '../styles/Quotes.css';

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

const Quotes = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const response = await API.get('/products?limit=100');

      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const removeProduct = async (id) => {
    try {
      await API.delete(`/products/${id}`);

      message.success('Product deleted');

      fetchProducts();
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Unable to delete product'
      );
    }
  };

  const getCategoryName = (item) => {
    if (item.category && typeof item.category === 'object') {
      return item.category.name || '-';
    }

    return item.category || '-';
  };

  const getStockStatus = (item) => {
    const stock = Number(item.stock || 0);
    const threshold = Number(item.lowStockThreshold || 10);

    if (stock === 0) {
      return {
        text: 'Out of Stock',
        className: 'stock-out',
      };
    }

    if (stock <= threshold) {
      return {
        text: 'Low Stock',
        className: 'stock-low',
      };
    }

    return {
      text: 'In Stock',
      className: 'stock-good',
    };
  };

  const renderProductImage = (item, mobile = false) => {
    if (item.image && typeof item.image === 'string') {
      return (
        <Image
          src={item.image}
          alt={item.name || 'Product'}
          width={mobile ? 64 : 45}
          height={mobile ? 64 : 45}
          className={mobile ? 'mobile-product-image' : ''}
          preview={{
            mask: 'View',
          }}
          fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E"
        />
      );
    }

    return (
      <div
        className={
          mobile
            ? 'mobile-product-image mobile-product-image--empty'
            : 'product-table-image-empty'
        }
      >
        <ShoppingOutlined />
      </div>
    );
  };

  const columns = [
    {
      title: 'S.No.',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },

    {
      title: 'Image',
      key: 'image',
      width: 70,
      align: 'center',
      render: (_, item) => renderProductImage(item),
    },

    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (value) => (
        <span className="desktop-product-name">
          {value || '-'}
        </span>
      ),
    },

    {
      title: 'Category',
      key: 'category',
      render: (_, item) => getCategoryName(item),
    },

    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      render: (value) => value || '-',
    },

    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (value) => value || 'Pcs',
    },

    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (value) => (
        <strong className="desktop-price">
          {formatMoney(value)}
        </strong>
      ),
    },

    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      align: 'center',
      render: (value, item) => {
        const status = getStockStatus(item);

        return (
          <div className="desktop-stock">
            <strong>{value ?? 0}</strong>
            <Tag className={status.className}>
              {status.text}
            </Tag>
          </div>
        );
      },
    },

    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 110,

      render: (_, item) => (
        <Space size="small">
          <Button
            type="text"
            className="price-list-edit"
            icon={<EditOutlined />}
            onClick={() =>
              navigate('/products', {
                state: { product: item },
              })
            }
          />

          <Popconfirm
            title="Delete this product?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => removeProduct(item._id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <section className="price-list-page">

      {/* HEADER */}
      <div className="price-list-page__head">
        <div className="price-list-title">
          <div className="price-list-title__icon">
            <ShoppingOutlined />
          </div>

          <div>
            <h1>Products</h1>
            <p>Manage your product & price list</p>
          </div>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/products')}
          className="add-product-btn"
        >
          Add Product
        </Button>
      </div>

      {/* PRODUCT COUNT */}
      {!loading && products.length > 0 && (
        <div className="product-summary">
          <span>
            <strong>{products.length}</strong> products
          </span>
        </div>
      )}

      {/* DESKTOP / TABLET */}
      <div className="desktop-product-list">

        <Table
          className="price-list-table"
          dataSource={products}
          columns={columns}
          rowKey="_id"
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No products added yet"
              />
            ),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            responsive: true,
          }}
          scroll={{ x: 900 }}
          size="middle"
        />

      </div>

      {/* MOBILE PRODUCT LIST */}
      <div className="mobile-product-list">

        {loading ? (
          <div className="mobile-loading">
            <Spin size="large" />
            <span>Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="mobile-empty">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No products added yet"
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/products')}
              className="mobile-empty-btn"
            >
              Add First Product
            </Button>
          </div>
        ) : (
          <>
            {products.map((item) => {
              const stockStatus = getStockStatus(item);

              return (
                <div
                  className="mobile-product-card"
                  key={item._id}
                >

                  {/* TOP */}
                  <div className="mobile-product-card__top">

                    <div className="mobile-product-card__image">
                      {renderProductImage(item, true)}
                    </div>

                    <div className="mobile-product-card__info">

                      <h3>
                        {item.name || 'Unnamed Product'}
                      </h3>

                      <span className="mobile-product-category">
                        {getCategoryName(item)}
                      </span>

                      {item.brand && (
                        <span className="mobile-product-brand">
                          {item.brand}
                        </span>
                      )}

                    </div>

                  </div>

                  {/* DETAILS */}
                  <div className="mobile-product-card__details">

                    <div className="mobile-detail">
                      <span>Price</span>
                      <strong className="mobile-product-price">
                        {formatMoney(item.price)}
                      </strong>
                    </div>

                    <div className="mobile-detail">
                      <span>Stock</span>
                      <strong>
                        {item.stock ?? 0} {item.unit || 'Pcs'}
                      </strong>
                    </div>

                    <div className="mobile-detail">
                      <span>Status</span>
                      <Tag className={stockStatus.className}>
                        {stockStatus.text}
                      </Tag>
                    </div>

                  </div>

                  {/* ACTIONS */}
                  <div className="mobile-product-card__actions">

                    <Button
                      icon={<EditOutlined />}
                      className="mobile-edit-btn"
                      onClick={() =>
                        navigate('/products', {
                          state: { product: item },
                        })
                      }
                    >
                      Edit
                    </Button>

                    <Popconfirm
                      title="Delete this product?"
                      description="This action cannot be undone."
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{
                        danger: true,
                      }}
                      onConfirm={() =>
                        removeProduct(item._id)
                      }
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        className="mobile-delete-btn"
                      >
                        Delete
                      </Button>
                    </Popconfirm>

                  </div>

                </div>
              );
            })}

            <div className="mobile-product-footer">
              Showing {products.length} product
              {products.length !== 1 ? 's' : ''}
            </div>
          </>
        )}

      </div>

    </section>
  );
};

export default Quotes;