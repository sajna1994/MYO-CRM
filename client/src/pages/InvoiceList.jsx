import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
  Popconfirm,
  Empty,
  Statistic,
  Row,
  Col,
} from 'antd';

import {
  EyeOutlined,
  PrinterOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import API from '../api/axios';

const PAGE_SIZE = 10;

const InvoiceList = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [totalSales, setTotalSales] = useState(0);

  // --------------------------------------------------
  // FETCH INVOICES
  // --------------------------------------------------

  const fetchInvoices = useCallback(
    async (currentPage = 1, currentSearch = '', currentStatus = '') => {
      setLoading(true);

      try {
        const response = await API.get('/invoices', {
          params: {
            page: currentPage,
            limit: PAGE_SIZE,
            search: currentSearch || undefined,
            status: currentStatus || undefined,
          },
        });

        const data = response.data?.data || [];

        setInvoices(data);
        setTotal(response.data?.total || 0);

        // Backend may return totalAmount/totalSales.
        // Use it when available.
        setTotalSales(
          Number(
            response.data?.totalAmount ??
              response.data?.totalSales ??
              0
          )
        );
      } catch (error) {
        console.error('FETCH INVOICES ERROR:', error);

        message.error(
          error.response?.data?.message ||
            'Failed to load invoices'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    fetchInvoices(1, '', '');
  }, [fetchInvoices]);

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);

    fetchInvoices(1, value, status);
  };

  // --------------------------------------------------
  // STATUS FILTER
  // --------------------------------------------------

  const handleStatusChange = (value) => {
    setStatus(value || '');
    setPage(1);

    fetchInvoices(1, search, value || '');
  };

  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  const handleRefresh = () => {
    fetchInvoices(page, search, status);
  };

  // --------------------------------------------------
  // VIEW INVOICE
  // --------------------------------------------------

  const handleView = (invoice) => {
    navigate(`/invoices/${invoice._id}`, {
      state: {
        invoice,
      },
    });
  };

  // --------------------------------------------------
  // PRINT INVOICE
  // --------------------------------------------------

  const handlePrint = (invoice) => {
    navigate(`/invoices/${invoice._id}`, {
      state: {
        invoice,
        autoPrint: true,
      },
    });
  };

  // --------------------------------------------------
  // DELETE INVOICE
  // --------------------------------------------------

  const handleDelete = async (invoiceId) => {
    try {
      await API.delete(`/invoices/${invoiceId}`);

      message.success('Invoice deleted successfully');

      // Reload current page
      fetchInvoices(page, search, status);
    } catch (error) {
      console.error('DELETE INVOICE ERROR:', error);

      message.error(
        error.response?.data?.message ||
          'Failed to delete invoice'
      );
    }
  };

  // --------------------------------------------------
  // FORMAT CURRENCY
  // --------------------------------------------------

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --------------------------------------------------
  // TOTAL ITEMS
  // --------------------------------------------------

  const getTotalItems = (invoice) => {
    if (!Array.isArray(invoice?.items)) {
      return 0;
    }

    return invoice.items.reduce(
      (sum, item) =>
        sum + Number(item?.quantity || 0),
      0
    );
  };

  // --------------------------------------------------
  // STATUS TAG
  // --------------------------------------------------

  const renderStatus = (value) => {
    const statusMap = {
      paid: {
        color: 'green',
        label: 'Paid',
      },
      unpaid: {
        color: 'red',
        label: 'Unpaid',
      },
      partial: {
        color: 'orange',
        label: 'Partial',
      },
      overdue: {
        color: 'volcano',
        label: 'Overdue',
      },
      cancelled: {
        color: 'default',
        label: 'Cancelled',
      },
    };

    const current =
      statusMap[value] || {
        color: 'default',
        label: value || 'Unknown',
      };

    return (
      <Tag color={current.color}>
        {current.label}
      </Tag>
    );
  };

  // --------------------------------------------------
  // TABLE COLUMNS
  // --------------------------------------------------

  const columns = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 60,
        render: (_, __, index) =>
          (page - 1) * PAGE_SIZE + index + 1,
      },

      {
        title: 'Invoice No.',
        dataIndex: 'invoiceNumber',
        key: 'invoiceNumber',
        width: 150,
        render: (value) => (
          <strong>{value}</strong>
        ),
      },

      {
        title: 'Date',
        dataIndex: 'invoiceDate',
        key: 'invoiceDate',
        width: 120,
        render: (_, record) => {
          const date =
            record.invoiceDate ||
            record.createdAt;

          return date
            ? dayjs(date).format('DD-MM-YYYY')
            : '-';
        },
      },

      {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
        width: 180,
        render: (name) => (
          <span>
            {name || 'Walk-in Customer'}
          </span>
        ),
      },

      {
        title: 'Phone',
        dataIndex: 'phone',
        key: 'phone',
        width: 140,
        render: (phone) =>
          phone || '-',
      },

      {
        title: 'Items',
        key: 'items',
        width: 90,
        align: 'center',
        render: (_, record) =>
          getTotalItems(record),
      },

      {
        title: 'Subtotal',
        dataIndex: 'subtotal',
        key: 'subtotal',
        width: 120,
        align: 'right',
        render: (value) =>
          formatCurrency(value),
      },

      {
        title: 'Discount',
        dataIndex: 'discount',
        key: 'discount',
        width: 110,
        align: 'right',
        render: (value) =>
          formatCurrency(value),
      },

      {
        title: 'Total',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        width: 130,
        align: 'right',
        render: (value) => (
          <strong>
            {formatCurrency(value)}
          </strong>
        ),
      },

      {
        title: 'Paid',
        dataIndex: 'paidAmount',
        key: 'paidAmount',
        width: 120,
        align: 'right',
        render: (value) =>
          formatCurrency(value),
      },

      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        align: 'center',
        render: (value) =>
          renderStatus(value),
      },

      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: 150,
        render: (_, record) => (
          <Space>
            <Button
              type="text"
              icon={<EyeOutlined />}
              title="View"
              onClick={() =>
                handleView(record)
              }
            />

            <Button
              type="text"
              icon={<PrinterOutlined />}
              title="Print"
              onClick={() =>
                handlePrint(record)
              }
            />

            <Popconfirm
              title="Delete Invoice"
              description={`Delete ${record.invoiceNumber}?`}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{
                danger: true,
              }}
              onConfirm={() =>
                handleDelete(record._id)
              }
            >
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                title="Delete"
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [page, search, status]
  );

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div
      style={{
        padding: 24,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            Invoice List
          </h1>

          <p
            style={{
              marginTop: 5,
              color: '#888',
            }}
          >
            View and manage all sales invoices
          </p>
        </div>

        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={() =>
            navigate('/billing')
          }
        >
          Create New Invoice
        </Button>
      </div>

      {/* SUMMARY */}

      <Row
        gutter={[16, 16]}
        style={{
          marginBottom: 20,
        }}
      >
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={total}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Sales"
              value={totalSales}
              precision={2}
              prefix="₹"
            />
          </Card>
        </Col>
      </Row>

      {/* FILTERS */}

      <Card
        style={{
          marginBottom: 20,
        }}
      >
        <Space
          wrap
          style={{
            width: '100%',
          }}
        >
          <Input
            allowClear
            prefix={
              <SearchOutlined />
            }
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) =>
              handleSearch(
                e.target.value
              )
            }
            style={{
              width: 300,
            }}
          />

          <Select
            allowClear
            placeholder="Filter by status"
            value={status || undefined}
            onChange={
              handleStatusChange
            }
            style={{
              width: 180,
            }}
            options={[
              {
                value: 'paid',
                label: 'Paid',
              },
              {
                value: 'unpaid',
                label: 'Unpaid',
              },
              {
                value: 'partial',
                label: 'Partial',
              },
              {
                value: 'overdue',
                label: 'Overdue',
              },
              {
                value: 'cancelled',
                label: 'Cancelled',
              },
            ]}
          />

          <Button
            icon={
              <ReloadOutlined />
            }
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* INVOICE TABLE */}

      <Card>
        {invoices.length === 0 &&
        !loading ? (
          <Empty
            description="No invoices found"
          />
        ) : (
          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={invoices}
            bordered
            size="middle"
            scroll={{
              x: 1700,
            }}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
              showTotal: (value) =>
                `Total ${value} invoices`,
              onChange: (
                newPage
              ) => {
                setPage(newPage);

                fetchInvoices(
                  newPage,
                  search,
                  status
                );
              },
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default InvoiceList;