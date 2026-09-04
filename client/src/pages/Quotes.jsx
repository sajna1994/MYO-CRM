import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Popconfirm, Space, Table, message, Image } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import API from '../api/axios';

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const Quotes = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await API.get('/products?limit=100');
      console.log('Products:', response.data.data); // Debug log
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
      message.error(error.response?.data?.message || 'Unable to delete product');
    }
  };

  const columns = [
    {
      title: 'S.No.',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Image',
      key: 'image',
      width: 80,
      align: 'center',
      render: (_, item) => {
        // Check if image exists and is not empty
        if (item.image && typeof item.image === 'string' && item.image.length > 0) {
          return (
            <Image
              src={item.image}
              alt={item.name || 'Product'}
              width={50}
              height={50}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E"
              preview={{
                mask: 'View',
              }}
            />
          );
        }
        // If no image, show placeholder
        return (
          <div
            style={{
              width: 50,
              height: 50,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: 10,
              margin: '0 auto',
            }}
          >
            No Image
          </div>
        );
      },
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (value) => value || '-',
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, item) => {
        if (item.category && typeof item.category === 'object') {
          return item.category.name || item.category || '-';
        }
        return item.category || '-';
      },
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
      title: 'Selling Price',
      dataIndex: 'price',
      key: 'price',
      render: formatMoney,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      align: 'center',
      render: (value) => value ?? 0,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 120,
      render: (_, item) => (
        <Space size="middle">
          <Button
            type="text"
            className="price-list-edit"
            icon={<EditOutlined />}
            onClick={() => navigate('/products', { state: { product: item } })}
          />
          <Popconfirm
            title="Delete this product?"
            onConfirm={() => removeProduct(item._id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <section className="price-list-page">
      <div className="price-list-page__head">
        <h1>Product / Price List</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/products')}
        >
          Add Product
        </Button>
      </div>
      <Table
        className="price-list-table"
        dataSource={products}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 1100 }}
      />
    </section>
  );
};

export default Quotes;