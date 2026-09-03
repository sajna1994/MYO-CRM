import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Spin,
  message,
} from 'antd';

import {
  PrinterOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import gymImage from '../images/gym.png';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import API from '../api/axios';

const InvoicePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [invoice, setInvoice] = useState(
    location.state?.invoice || null
  );

  const [loading, setLoading] = useState(
    !location.state?.invoice
  );

  useEffect(() => {
    if (!invoice && id) {
      fetchInvoice();
    }
  }, [id]);

  useEffect(() => {
    if (
      location.state?.autoPrint &&
      invoice
    ) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [invoice, location.state]);

  const fetchInvoice = async () => {
    try {
      const response = await API.get(
        `/invoices/${id}`
      );

      setInvoice(
        response.data?.data || response.data
      );
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          'Failed to load invoice'
      );
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const downloadPDF = () => {
    window.print();
  };

  const shareInvoice = async () => {
    const shareData = {
      title: `Invoice ${
        invoice?.invoiceNumber || ''
      }`,
      text: `Invoice ${
        invoice?.invoiceNumber || ''
      } - ₹${Number(
        invoice?.totalAmount || 0
      ).toLocaleString('en-IN')}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        message.success(
          'Invoice link copied'
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="invoice-loader">
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="invoice-not-found">
        Invoice not found.
      </div>
    );
  }

  const items = invoice.items || [];

  const customerName =
    invoice.customerName ||
    invoice.customer?.name ||
    'Walk-in Customer';

  const phone =
    invoice.phone ||
    invoice.customer?.phone ||
    '';

  const subtotal =
    Number(invoice.subtotal || 0);

  const discount =
    Number(invoice.discount || 0);

  const grandTotal =
    Number(
      invoice.totalAmount ||
        subtotal - discount
    );

  const totalItems = items.reduce(
    (sum, item) =>
      sum +
      Number(
        item.quantity ||
          item.qty ||
          0
      ),
    0
  );

  return (
    <div className="invoice-page">

      {/* PRINT AREA */}

      <div className="invoice-container">

        <div className="invoice-header">

          <div className="invoice-company">

          <div className="invoice-logo">
  <img
    src={gymImage}
    alt="MYO Fitness Studio"
  />
</div>

            <div>
              <h1>
                MYO FITNESS STUDIO
              </h1>

              <p>
                Malappuram - Kavungal
              </p>

              <p>
                9495103460
              </p>
            </div>

          </div>

          <div className="invoice-meta">

            <div>
              <strong>
                Invoice No.
              </strong>

              <span>
                {invoice.invoiceNumber ||
                  invoice.number ||
                  '-'}
              </span>
            </div>

            <div>
              <strong>Date</strong>

              <span>
                {dayjs(
                  invoice.invoiceDate ||
                    invoice.createdAt
                ).format(
                  'DD-MM-YYYY'
                )}
              </span>
            </div>

            <div>
              <strong>Cashier</strong>

              <span>
                {invoice.createdBy?.name ||
                  'Admin'}
              </span>
            </div>

          </div>

        </div>

        {/* CUSTOMER */}

        <div className="invoice-customer">

          <div>
            <strong>
              Customer Name :
            </strong>

            <span>
              {customerName}
            </span>
          </div>

          <div>
            <strong>
              Phone :
            </strong>

            <span>
              {phone || '-'}
            </span>
          </div>

        </div>

        {/* ITEMS */}

        <table className="invoice-items-table">

          <thead>
            <tr>
              <th>#</th>

              <th>Product</th>

              <th>Qty</th>

              <th>Unit Price</th>

              <th>Total</th>
            </tr>
          </thead>

          <tbody>

            {items.map((item, index) => {

              const quantity =
                Number(
                  item.quantity ||
                    item.qty ||
                    0
                );

              const unitPrice =
                Number(
                  item.unitPrice ||
                    item.price ||
                    0
                );

              const total =
                Number(
                  item.total ||
                    quantity * unitPrice
                );

              return (
                <tr
                  key={
                    item._id ||
                    item.product ||
                    index
                  }
                >

                  <td>
                    {index + 1}
                  </td>

                  <td>
                    {item.productName ||
                      item.product?.name ||
                      item.name ||
                      '-'}
                  </td>

                  <td>
                    {quantity}
                  </td>

                  <td>
                    ₹
                    {unitPrice.toLocaleString(
                      'en-IN'
                    )}
                  </td>

                  <td>
                    ₹
                    {total.toLocaleString(
                      'en-IN'
                    )}
                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

        {/* TOTALS */}

        <div className="invoice-bottom">

          <div className="invoice-totals">

            <div>
              <strong>
                Total Items :
              </strong>

              <span>
                {totalItems}
              </span>
            </div>

            <div>
              <strong>
                Subtotal :
              </strong>

              <span>
                ₹
                {subtotal.toLocaleString(
                  'en-IN'
                )}
              </span>
            </div>

            <div>
              <strong>
                Discount :
              </strong>

              <span>
                ₹
                {discount.toLocaleString(
                  'en-IN'
                )}
              </span>
            </div>

          </div>

          <div className="invoice-grand-total">

            <strong>
              Grand Total
            </strong>

            <span>
              ₹
              {grandTotal.toLocaleString(
                'en-IN'
              )}
            </span>

          </div>

        </div>

        <div className="invoice-thankyou">
          Thank you! Visit Again.
        </div>

      </div>

      {/* RIGHT ACTION PANEL */}

      <div className="invoice-actions">

        <Button
          type="primary"
          className="invoice-print-btn"
          icon={<PrinterOutlined />}
          onClick={printInvoice}
        >
          Print
        </Button>

        <Button
          className="invoice-download-btn"
          icon={<DownloadOutlined />}
          onClick={downloadPDF}
        >
          Download PDF
        </Button>

        <Button
          className="invoice-share-btn"
          icon={<ShareAltOutlined />}
          onClick={shareInvoice}
        >
          Share
        </Button>

        <Button
          className="invoice-close-btn"
          icon={<CloseOutlined />}
          onClick={() =>
            navigate('/billing')
          }
        >
          Close
        </Button>

      </div>

    </div>
  );
};

export default InvoicePreview;