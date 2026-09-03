import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Typography,
  message,
  Popconfirm,
} from 'antd';

import {
  PlusOutlined,
  DeleteOutlined,
  MinusOutlined,
  PrinterOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CloseOutlined,
  CalendarOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import API from '../api/axios';

const { Title, Text } = Typography;

const Orders = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(dayjs());

  const [customerId, setCustomerId] = useState(null);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([]);

  const [discount, setDiscount] = useState(0);

  const [invoice, setInvoice] = useState(null);

  // ------------------------------------------------------------
  // LOAD CUSTOMERS + PRODUCTS
  // ------------------------------------------------------------

  const fetchData = async () => {
    setLoading(true);

    try {
      const [customerRes, productRes] = await Promise.all([
        API.get('/customers?limit=100'),
        API.get('/products?limit=100'),
      ]);

      setCustomers(customerRes.data.data || []);
      setProducts(productRes.data.data || []);
    } catch (error) {
      console.error(error);
      message.error('Failed to load customers and products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    generateInvoiceNumber();
  }, []);

  // ------------------------------------------------------------
  // INVOICE NUMBER
  // ------------------------------------------------------------

const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  setInvoiceNumber(`INV-${year}-${random}`);
};

  // ------------------------------------------------------------
  // CUSTOMER
  // ------------------------------------------------------------

  const handleCustomerChange = (value) => {
    setCustomerId(value);

    const customer = customers.find(
      (item) => item._id === value
    );

    if (customer) {
      setPhone(customer.phone || '');
    } else {
      setPhone('');
    }
  };

  // ------------------------------------------------------------
  // ADD PRODUCT
  // ------------------------------------------------------------

  const addProduct = () => {
    setItems([
      ...items,
      {
        key: Date.now(),
        product: null,
        productName: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  // ------------------------------------------------------------
  // REMOVE PRODUCT
  // ------------------------------------------------------------

  const removeProduct = (key) => {
    setItems(
      items.filter((item) => item.key !== key)
    );
  };

  // ------------------------------------------------------------
  // PRODUCT SELECT
  // ------------------------------------------------------------

  const handleProductChange = (key, productId) => {
    const selectedProduct = products.find(
      (product) => product._id === productId
    );

    setItems((previousItems) =>
      previousItems.map((item) => {
        if (item.key !== key) {
          return item;
        }

        return {
          ...item,
          product: productId,
          productName: selectedProduct?.name || '',
          unitPrice: Number(selectedProduct?.price || 0),
        };
      })
    );
  };

  // ------------------------------------------------------------
  // QUANTITY
  // ------------------------------------------------------------

  const updateQuantity = (key, quantity) => {
    setItems((previousItems) =>
      previousItems.map((item) =>
        item.key === key
          ? {
              ...item,
              quantity: Math.max(1, Number(quantity) || 1),
            }
          : item
      )
    );
  };

  const decreaseQuantity = (key) => {
    setItems((previousItems) =>
      previousItems.map((item) =>
        item.key === key
          ? {
              ...item,
              quantity: Math.max(1, item.quantity - 1),
            }
          : item
      )
    );
  };

  const increaseQuantity = (key) => {
    setItems((previousItems) =>
      previousItems.map((item) =>
        item.key === key
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // ------------------------------------------------------------
  // CALCULATIONS
  // ------------------------------------------------------------

  const totalItems = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0),
      0
    );
  }, [items]);

  const discountAmount = Number(discount || 0);

  const grandTotal = Math.max(
    0,
    subtotal - discountAmount
  );

  // ------------------------------------------------------------
  // VALIDATE BILL
  // ------------------------------------------------------------

  const validateBill = () => {
    if (!customerId) {
      message.warning('Please select a customer');
      return false;
    }

    if (items.length === 0) {
      message.warning('Please add at least one product');
      return false;
    }

    const invalidProduct = items.some(
      (item) => !item.product
    );

    if (invalidProduct) {
      message.warning('Please select a product for every row');
      return false;
    }

    return true;
  };

  // ------------------------------------------------------------
  // CREATE BILL
  // ------------------------------------------------------------

  const saveBill = async (printAfterSave = false) => {
    if (!validateBill()) {
      return;
    }

    setSaving(true);

    try {
      const formattedProducts = items.map((item) => ({
        product: item.product,
        productName: item.productName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total:
          Number(item.quantity) *
          Number(item.unitPrice),
      }));

      const payload = {
        orderNumber: invoiceNumber,

        customer: customerId,

        products: formattedProducts,

        totalAmount: grandTotal,

        discount: discountAmount,

        status: 'confirmed',

        deliveryDate: null,

        notes,
      };

      const response = await API.post(
        '/orders',
        payload
      );

      const savedOrder = response.data.data;

      const customer = customers.find(
        (item) => item._id === customerId
      );

      const invoiceData = {
        ...savedOrder,

        invoiceNumber:
          savedOrder.orderNumber || invoiceNumber,

        invoiceDate: invoiceDate.format('DD-MM-YYYY'),

        customer: customer || savedOrder.customer,

        phone:
          phone ||
          customer?.phone ||
          savedOrder.customer?.phone ||
          '',

        subtotal,

        discount: discountAmount,

        grandTotal,

        totalItems,

        products: formattedProducts,
      };

      setInvoice(invoiceData);

      message.success('Bill saved successfully');

      if (printAfterSave) {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    } catch (error) {
      console.error(error);

      message.error(
        error.response?.data?.message ||
          'Failed to save bill'
      );
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // CLEAR BILL
  // ------------------------------------------------------------

  const clearBill = () => {
    setCustomerId(null);
    setPhone('');
    setNotes('');
    setItems([]);
    setDiscount(0);
    setInvoice(null);
    setInvoiceDate(dayjs());

    generateInvoiceNumber();
  };

  // ------------------------------------------------------------
  // PRINT
  // ------------------------------------------------------------

  const handlePrint = () => {
    window.print();
  };

  // ------------------------------------------------------------
  // DOWNLOAD PDF
  // ------------------------------------------------------------

  const handleDownloadPDF = () => {
    /*
      Browser print dialog supports:
      "Save as PDF"

      This avoids requiring another PDF library.
    */

    window.print();
  };

  // ------------------------------------------------------------
  // SHARE
  // ------------------------------------------------------------

  const handleShare = async () => {
    if (!invoice) return;

    const shareText = `
Invoice: ${invoice.invoiceNumber}
Customer: ${invoice.customer?.name || '-'}
Total: ₹${Number(invoice.grandTotal || 0).toLocaleString('en-IN')}
`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: invoice.invoiceNumber,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(
          shareText
        );

        message.success(
          'Invoice details copied to clipboard'
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ------------------------------------------------------------
  // INVOICE PREVIEW
  // ------------------------------------------------------------

  if (invoice) {
    return (
      <div className="invoice-page">

        <div className="invoice-header">
          <Title level={2}>
            Billing / Invoice Preview
          </Title>
        </div>

        <div className="invoice-layout">

          {/* MAIN INVOICE */}
          <div className="invoice-main">

            <div className="invoice-company">

              <div className="company-logo">
                MYO
              </div>

              <div>
                <Title
                  level={3}
                  style={{ margin: 0 }}
                >
                  MYO FITNESS STUDIO
                </Title>

                <Text>
                  Malappuram - Kavungal
                </Text>

                <br />

                <Text>
                  9495103460
                </Text>
              </div>

            </div>

            <div className="invoice-details">

              <div>
                <Text strong>
                  Invoice No.
                </Text>

                <Text>
                  {invoice.invoiceNumber}
                </Text>
              </div>

              <div>
                <Text strong>
                  Date
                </Text>

                <Text>
                  {invoice.invoiceDate}
                </Text>
              </div>

              <div>
                <Text strong>
                  Cashier
                </Text>

                <Text>
                  Admin
                </Text>
              </div>

            </div>

            <Divider />

            {/* CUSTOMER */}

            <div className="customer-box">

              <div>
                <Text strong>
                  Customer Name :
                </Text>

                <Text>
                  {invoice.customer?.name ||
                    'Walk-in Customer'}
                </Text>
              </div>

              <div>
                <Text strong>
                  Phone :
                </Text>

                <Text>
                  {invoice.phone || '-'}
                </Text>
              </div>

            </div>

            {/* PRODUCTS */}

            <Table
              className="invoice-table"
              pagination={false}
              dataSource={
                invoice.products || []
              }
              rowKey={(record, index) =>
                `${record.product}-${index}`
              }
              columns={[
                {
                  title: '#',
                  width: 60,
                  render: (_, __, index) =>
                    index + 1,
                },
                {
                  title: 'Product',
                  dataIndex: 'productName',
                },
                {
                  title: 'Qty',
                  dataIndex: 'quantity',
                  align: 'center',
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'unitPrice',
                  align: 'right',
                  render: (value) =>
                    `₹${Number(
                      value || 0
                    ).toLocaleString('en-IN')}`,
                },
                {
                  title: 'Total',
                  align: 'right',
                  render: (_, record) =>
                    `₹${(
                      Number(record.quantity || 0) *
                      Number(record.unitPrice || 0)
                    ).toLocaleString('en-IN')}`,
                },
              ]}
            />

            {/* TOTALS */}

            <div className="invoice-total-area">

              <div className="invoice-summary">

                <div>
                  <Text strong>
                    Total Items :
                  </Text>

                  <Text>
                    {invoice.totalItems}
                  </Text>
                </div>

                <div>
                  <Text strong>
                    Subtotal :
                  </Text>

                  <Text>
                    ₹
                    {Number(
                      invoice.subtotal || 0
                    ).toLocaleString('en-IN')}
                  </Text>
                </div>

                <div>
                  <Text strong>
                    Discount :
                  </Text>

                  <Text>
                    ₹
                    {Number(
                      invoice.discount || 0
                    ).toLocaleString('en-IN')}
                  </Text>
                </div>

              </div>

              <div className="grand-total">

                <Text strong>
                  Grand Total
                </Text>

                <Text strong>
                  ₹
                  {Number(
                    invoice.grandTotal || 0
                  ).toLocaleString('en-IN')}
                </Text>

              </div>

            </div>

            {invoice.notes && (
              <div className="invoice-notes">
                <Text strong>Notes: </Text>
                <Text>{invoice.notes}</Text>
              </div>
            )}

            <div className="thank-you">
              Thank you! Visit Again.
            </div>

          </div>

          {/* ACTIONS */}

          <div className="invoice-actions">

            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              block
              size="large"
              className="print-button"
            >
              Print
            </Button>

            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadPDF}
              block
              size="large"
              className="download-button"
            >
              Download PDF
            </Button>

            <Button
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              block
              size="large"
            >
              Share
            </Button>

            <Button
              icon={<CloseOutlined />}
              onClick={() => setInvoice(null)}
              block
              size="large"
            >
              Close
            </Button>

          </div>

        </div>

      </div>
    );
  }

  // ------------------------------------------------------------
  // BILL CREATION PAGE
  // ------------------------------------------------------------

  return (
    <div className="billing-page">

      <Title level={2}>
        Sales / Billing (Create Bill)
      </Title>

      <div className="billing-container">

        {/* LEFT SIDE */}

        <div className="billing-left">

          <div className="form-field">

            <label>Invoice No.</label>

            <Input
              value={invoiceNumber}
              onChange={(e) =>
                setInvoiceNumber(e.target.value)
              }
            />

          </div>

          <div className="form-field">

            <label>Date</label>

            <DatePicker
              value={invoiceDate}
              onChange={(value) =>
                setInvoiceDate(value || dayjs())
              }
              format="DD-MM-YYYY"
              style={{ width: '100%' }}
              suffixIcon={<CalendarOutlined />}
            />

          </div>

          <div className="form-field">

            <label>Customer Name</label>

            <Select
              showSearch
              value={customerId}
              placeholder="Walk-in Customer"
              style={{ width: '100%' }}
              optionFilterProp="label"
              onChange={handleCustomerChange}
              options={customers.map(
                (customer) => ({
                  value: customer._id,
                  label: customer.name,
                })
              )}
            />

          </div>

          <div className="form-field">

            <label>Phone</label>

            <Input
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="Phone number"
            />

          </div>

          <div className="form-field">

            <label>Notes (Optional)</label>

            <Input.TextArea
              rows={7}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Enter notes..."
            />

          </div>

          <div className="billing-buttons">

            <Button
              type="primary"
              size="large"
              icon={<PrinterOutlined />}
              loading={saving}
              onClick={() => saveBill(true)}
              className="save-print"
            >
              Save & Print Bill
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              loading={saving}
              onClick={() => saveBill(false)}
              className="save-bill"
            >
              Save Bill
            </Button>

            <Button
              size="large"
              onClick={clearBill}
            >
              Clear
            </Button>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="billing-right">

          <div className="product-table-wrapper">

            <Table
              loading={loading}
              pagination={false}
              dataSource={items}
              rowKey="key"
              locale={{
                emptyText:
                  'No products added',
              }}
              columns={[
                {
                  title: 'Product',
                  dataIndex: 'product',
                  width: '42%',
                  render: (_, record) => (
                    <Select
                      showSearch
                      value={record.product}
                      placeholder="Select Product"
                      style={{
                        width: '100%',
                      }}
                      optionFilterProp="label"
                      onChange={(value) =>
                        handleProductChange(
                          record.key,
                          value
                        )
                      }
                      options={products.map(
                        (product) => ({
                          value: product._id,
                          label: `${product.name} ${
                            product.stock !==
                            undefined
                              ? `(Stock: ${product.stock})`
                              : ''
                          }`,
                        })
                      )}
                    />
                  ),
                },

                {
                  title: 'Price (₹)',
                  dataIndex: 'unitPrice',
                  align: 'right',
                  width: 130,
                  render: (value) =>
                    Number(value || 0).toLocaleString(
                      'en-IN'
                    ),
                },

                {
                  title: 'Qty',
                  dataIndex: 'quantity',
                  align: 'center',
                  width: 170,
                  render: (_, record) => (
                    <div className="quantity-control">

                      <Button
                        icon={<MinusOutlined />}
                        onClick={() =>
                          decreaseQuantity(
                            record.key
                          )
                        }
                      />

                      <InputNumber
                        min={1}
                        value={record.quantity}
                        controls={false}
                        onChange={(value) =>
                          updateQuantity(
                            record.key,
                            value
                          )
                        }
                      />

                      <Button
                        icon={<PlusOutlined />}
                        onClick={() =>
                          increaseQuantity(
                            record.key
                          )
                        }
                      />

                    </div>
                  ),
                },

                {
                  title: 'Total (₹)',
                  align: 'right',
                  width: 140,
                  render: (_, record) =>
                    (
                      Number(record.quantity || 0) *
                      Number(record.unitPrice || 0)
                    ).toLocaleString('en-IN'),
                },

                {
                  title: 'Action',
                  align: 'center',
                  width: 80,
                  render: (_, record) => (
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        removeProduct(record.key)
                      }
                    />
                  ),
                },
              ]}
            />

          </div>

          <Button
            size="large"
            icon={<PlusOutlined />}
            onClick={addProduct}
            className="add-product-button"
          >
            Add Product
          </Button>

          {/* BILL TOTALS */}

          <div className="billing-summary">

            <div className="summary-row">

              <Text strong>
                Total Items :
              </Text>

              <Text>
                {totalItems}
              </Text>

            </div>

            <div className="summary-row">

              <Text strong>
                Subtotal :
              </Text>

              <Text>
                ₹
                {subtotal.toLocaleString(
                  'en-IN'
                )}
              </Text>

            </div>

            <div className="summary-row">

              <Text strong>
                Discount :
              </Text>

              <InputNumber
                min={0}
                max={subtotal}
                value={discount}
                onChange={(value) =>
                  setDiscount(value || 0)
                }
                prefix="₹"
                style={{
                  width: 180,
                }}
              />

            </div>

            <Divider />

            <div className="grand-total-row">

              <Text strong>
                Grand Total
              </Text>

              <Text strong>
                ₹
                {grandTotal.toLocaleString(
                  'en-IN'
                )}
              </Text>

            </div>

          </div>

        </div>

      </div>

      {/* PAGE CSS */}

      <style>{`

        .billing-page,
        .invoice-page {
          padding: 0;
        }

        .billing-page h2,
        .invoice-page h2 {
          margin-top: 0;
          margin-bottom: 20px;
        }

        .billing-container {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 28px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          min-height: 750px;
        }

        .billing-left {
          padding-right: 10px;
        }

        .form-field {
          margin-bottom: 22px;
        }

        .form-field label {
          display: block;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #171717;
        }

        .form-field .ant-input,
        .form-field .ant-select-selector,
        .form-field .ant-picker {
          height: 48px !important;
          border-radius: 6px !important;
        }

        .form-field .ant-select-selection-item {
          line-height: 46px !important;
        }

        .form-field textarea.ant-input {
          height: auto !important;
        }

        .billing-right {
          position: relative;
        }

        .product-table-wrapper {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .product-table-wrapper .ant-table-thead > tr > th {
          background: #fff;
          font-size: 16px;
          font-weight: 700;
          padding: 20px 16px;
        }

        .product-table-wrapper .ant-table-tbody > tr > td {
          padding: 20px 16px;
          font-size: 15px;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quantity-control .ant-btn {
          width: 42px;
          height: 42px;
          border-radius: 0;
        }

        .quantity-control .ant-input-number {
          height: 42px;
          width: 60px;
          border-radius: 0;
        }

        .quantity-control .ant-input-number-input {
          height: 40px;
          text-align: center;
        }

        .add-product-button {
          margin-top: 28px;
          min-width: 260px;
          height: 52px;
          font-weight: 600;
          font-size: 16px;
        }

        .billing-summary {
          width: 430px;
          max-width: 100%;
          margin-left: auto;
          margin-top: 100px;
        }

        .summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
          font-size: 16px;
        }

        .grand-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 22px;
        }

        .grand-total-row .ant-typography:last-child {
          color: #16a34a;
          font-size: 28px;
        }

        .billing-buttons {
          display: flex;
          gap: 14px;
          margin-top: 35px;
          flex-wrap: wrap;
        }

        .billing-buttons .ant-btn {
          min-height: 52px;
          padding: 0 22px;
          font-weight: 600;
        }

        .save-print {
          background: #16a34a !important;
          border-color: #16a34a !important;
        }

        .save-bill {
          background: #ff8a00 !important;
          border-color: #ff8a00 !important;
        }

        /* ---------------------------------
           INVOICE PREVIEW
        --------------------------------- */

        .invoice-layout {
          display: grid;
          grid-template-columns: 1fr 250px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .invoice-main {
          padding: 32px;
          min-height: 780px;
        }

        .invoice-actions {
          border-left: 1px solid #e5e7eb;
          padding: 34px 28px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .invoice-actions .ant-btn {
          height: 62px;
          font-size: 18px;
          font-weight: 600;
        }

        .print-button {
          background: #16a34a !important;
          border-color: #16a34a !important;
        }

        .download-button {
          background: #ff8a00 !important;
          border-color: #ff8a00 !important;
          color: white !important;
        }

        .invoice-company {
          display: flex;
          align-items: center;
          gap: 22px;
          min-height: 140px;
        }

        .company-logo {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #15191d;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          font-weight: 800;
          border: 6px solid #f97316;
        }

        .invoice-company .ant-typography {
          font-size: 18px;
        }

        .invoice-company h3.ant-typography {
          font-size: 28px;
          margin-bottom: 8px !important;
        }

        .invoice-details {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-top: -125px;
          margin-left: 58%;
          margin-bottom: 30px;
        }

        .invoice-details > div {
          display: grid;
          grid-template-columns: 130px 1fr;
          font-size: 17px;
        }

        .customer-box {
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 28px;
          font-size: 17px;
        }

        .customer-box > div {
          display: flex;
          gap: 20px;
        }

        .invoice-table {
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          overflow: hidden;
        }

        .invoice-table .ant-table-thead > tr > th {
          background: #fff;
          font-size: 16px;
          font-weight: 700;
          padding: 18px;
        }

        .invoice-table .ant-table-tbody > tr > td {
          padding: 20px 18px;
          font-size: 16px;
        }

        .invoice-total-area {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 30px;
          margin-top: 45px;
          align-items: start;
        }

        .invoice-summary {
          display: flex;
          flex-direction: column;
          gap: 22px;
          padding-left: 25px;
        }

        .invoice-summary > div {
          display: grid;
          grid-template-columns: 160px 1fr;
          font-size: 17px;
        }

        .grand-total {
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          padding: 25px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 20px;
        }

        .grand-total .ant-typography:last-child {
          font-size: 32px;
        }

        .invoice-notes {
          margin-top: 30px;
          padding: 15px;
          background: #fafafa;
          border-radius: 6px;
        }

        .thank-you {
          text-align: center;
          font-size: 20px;
          font-weight: 600;
          margin-top: 55px;
        }

        /* ---------------------------------
           RESPONSIVE
        --------------------------------- */

        @media (max-width: 1100px) {

          .billing-container {
            grid-template-columns: 1fr;
          }

          .invoice-layout {
            grid-template-columns: 1fr;
          }

          .invoice-actions {
            border-left: 0;
            border-top: 1px solid #e5e7eb;
            flex-direction: row;
            flex-wrap: wrap;
          }

          .invoice-actions .ant-btn {
            flex: 1;
            min-width: 180px;
          }

          .invoice-details {
            margin-left: 0;
            margin-top: 25px;
          }

        }

        @media (max-width: 700px) {

          .billing-container {
            padding: 15px;
          }

          .invoice-main {
            padding: 15px;
          }

          .customer-box {
            grid-template-columns: 1fr;
          }

          .invoice-total-area {
            grid-template-columns: 1fr;
          }

          .invoice-company {
            flex-direction: column;
            align-items: flex-start;
          }

          .invoice-details {
            margin-left: 0;
          }

          .billing-buttons {
            flex-direction: column;
          }

          .billing-buttons .ant-btn {
            width: 100%;
          }

        }

        /* ---------------------------------
           PRINT
        --------------------------------- */

        @media print {

          body * {
            visibility: hidden !important;
          }

          .invoice-page,
          .invoice-page * {
            visibility: visible !important;
          }

          .invoice-page {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }

          .invoice-header,
          .invoice-actions {
            display: none !important;
          }

          .invoice-layout {
            border: none !important;
            display: block !important;
          }

          .invoice-main {
            padding: 20px !important;
          }

          .invoice-table {
            width: 100% !important;
          }

          .thank-you {
            margin-top: 35px;
          }

        }

      `}</style>

    </div>
  );
};

export default Orders;