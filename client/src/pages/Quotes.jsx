import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Popconfirm, Space, Table, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import API from '../api/axios';

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const Quotes = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fetchProducts = async () => {
    setLoading(true);
    try { const response = await API.get('/products?limit=100'); setProducts(response.data.data || []); }
    catch { message.error('Unable to load products'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);
  const removeProduct = async (id) => {
    try { await API.delete(`/products/${id}`); message.success('Product deleted'); fetchProducts(); }
    catch (error) { message.error(error.response?.data?.message || 'Unable to delete product'); }
  };
  const columns = [
    { title: 'Product Name', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
    { title: 'Category', key: 'category', render: (_, item) => item.category?.name || item.category || '-' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand', render: (value) => value || '-' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', render: (value) => value || 'Pcs' },
    { title: 'Selling Price', dataIndex: 'price', key: 'price', render: formatMoney },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', align: 'center', render: (value) => value ?? 0 },
    { title: 'Action', key: 'action', align: 'center', render: (_, item) => <Space size="middle"><Button type="text" className="price-list-edit" icon={<EditOutlined />} onClick={() => navigate('/products', { state: { product: item } })} /><Popconfirm title="Delete this product?" onConfirm={() => removeProduct(item._id)}><Button type="text" danger icon={<DeleteOutlined />} /></Popconfirm></Space> },
  ];
  return <section className="price-list-page">
    <div className="price-list-page__head"><h1>Product / Price List</h1><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products')}>Add Product</Button></div>
    <Table className="price-list-table" dataSource={products} columns={columns} rowKey="_id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 900 }} />
  </section>;
};

export default Quotes;
