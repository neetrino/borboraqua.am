'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { ProductPageButton } from '../../../components/icons/global/globalMobile';
import { formatPrice, getStoredCurrency, type CurrencyCode } from '../../../lib/currency';

interface Order {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  customerEmail: string;
  customerPhone: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerId?: string | null;
  itemsCount: number;
  createdAt: string;
}

interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface OrderExportRow {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  customerId: string;
  itemsCount: number;
  createdAt: string;
}

interface OrderDetails {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  totals?: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  customerEmail?: string;
  customerPhone?: string;
  customer?: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  billingAddress?: any | null;
  shippingAddress?: any | null;
  shippingMethod?: string | null;
  notes?: string | null;
  adminNotes?: string | null;
  payment?: {
    id: string;
    provider: string;
    method?: string | null;
    amount: number;
    currency: string;
    status: string;
    cardLast4?: string | null;
    cardBrand?: string | null;
  } | null;
  items: Array<{
    id: string;
    productTitle: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
    variantOptions?: Array<{
      attributeKey?: string;
      value?: string;
      label?: string;
      imageUrl?: string;
      colors?: string[] | any;
    }>;
  }>;
  createdAt: string;
  updatedAt?: string;
}

const ORDER_EXPORT_COLUMNS: { key: keyof OrderExportRow; header: string }[] = [
  { key: 'id', header: 'ID' },
  { key: 'number', header: 'Order Number' },
  { key: 'status', header: 'Status' },
  { key: 'paymentStatus', header: 'Payment Status' },
  { key: 'fulfillmentStatus', header: 'Fulfillment Status' },
  { key: 'total', header: 'Total' },
  { key: 'currency', header: 'Currency' },
  { key: 'customerEmail', header: 'Customer Email' },
  { key: 'customerPhone', header: 'Customer Phone' },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerId', header: 'Customer ID' },
  { key: 'itemsCount', header: 'Items Count' },
  { key: 'createdAt', header: 'Created At' },
];

const mapOrderToExportRow = (order: Order): OrderExportRow => ({
  id: order.id,
  number: order.number,
  status: order.status,
  paymentStatus: order.paymentStatus,
  fulfillmentStatus: order.fulfillmentStatus,
  total: order.total,
  currency: order.currency,
  customerEmail: order.customerEmail,
  customerPhone: order.customerPhone,
  customerName: [order.customerFirstName, order.customerLastName].filter(Boolean).join(' '),
  customerId: order.customerId || '',
  itemsCount: order.itemsCount,
  createdAt: order.createdAt,
});

const escapeCsvValue = (value: string | number): string => {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const escapeHtml = (value: string | number): string => {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const createOrdersCsvBlob = (orders: Order[]): Blob => {
  const rows = orders.map(mapOrderToExportRow);

  const columnWidths = ORDER_EXPORT_COLUMNS.map((column) => {
    const headerLength = column.header.length;
    const maxDataLength = rows.reduce((max, row) => {
      const value = String(row[column.key] ?? '');
      return Math.max(max, value.length);
    }, 0);
    return Math.max(headerLength, maxDataLength) + 2;
  });

  const formatRow = (row: OrderExportRow | null): string =>
    ORDER_EXPORT_COLUMNS
      .map((column, index) => {
        const raw =
          row === null ? column.header : String(row[column.key] ?? '');
        const value = escapeCsvValue(raw);
        return value.padEnd(columnWidths[index], ' ');
      })
      .join('');

  const headerLine = formatRow(null);
  const bodyLines = rows.map((row) => formatRow(row)).join('\r\n');
  const csv = `${headerLine}\r\n${bodyLines}`;

  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
};

const createOrdersExcelBlob = (orders: Order[]): Blob => {
  const rows = orders.map(mapOrderToExportRow);
  const headerRow = `<tr>${ORDER_EXPORT_COLUMNS.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr>`;
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${ORDER_EXPORT_COLUMNS.map((c) => `<td>${escapeHtml(row[c.key] ?? '')}</td>`).join('')}</tr>`,
    )
    .join('');

  const tableHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      table { border-collapse: collapse; }
      th, td { padding: 4px 8px; }
    </style>
  </head>
  <body>
    <table>
      <thead>${headerRow}</thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`;

  return new Blob([tableHtml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<OrdersResponse['meta'] | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(new Set());
  const [updatingPaymentStatuses, setUpdatingPaymentStatuses] = useState<Set<string>>(new Set());
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'excel' | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>(getStoredCurrency());
  const [deliveryPrice, setDeliveryPrice] = useState<number | null>(null);
  const [loadingDeliveryPrice, setLoadingDeliveryPrice] = useState(false);

  // Initialize filters from URL params on mount and when URL changes
  useEffect(() => {
    if (searchParams) {
      const status = searchParams.get('status') || '';
      const paymentStatus = searchParams.get('paymentStatus') || '';
      const search = searchParams.get('search') || '';
      setStatusFilter(status);
      setPaymentStatusFilter(paymentStatus);
      setSearchKeyword(search);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const buildOrdersParams = (pageValue: number, limitValue: number): Record<string, string> => {
    return {
      page: pageValue.toString(),
      limit: limitValue.toString(),
      status: statusFilter || '',
      paymentStatus: paymentStatusFilter || '',
      search: searchKeyword || '',
      sortBy: sortBy || '',
      sortOrder: sortOrder || '',
    };
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📦 [ADMIN] Fetching orders...', { page, statusFilter, paymentStatusFilter, searchKeyword, sortBy, sortOrder });
      
      const response = await apiClient.get<OrdersResponse>('/api/v1/admin/orders', {
        params: buildOrdersParams(page, 20),
      });

      console.log('✅ [ADMIN] Orders fetched:', response);
      setOrders(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentStatusFilter, searchKeyword, sortBy, sortOrder]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin, page, statusFilter, paymentStatusFilter, searchKeyword, sortBy, sortOrder]);

  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, []);

  // Hide header and prevent body scroll when order details modal is open
  useEffect(() => {
    if (selectedOrderId) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Prevent scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      // Dispatch event to hide header
      window.dispatchEvent(new Event('app:modal-open'));
      
      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
        // Dispatch event to show header
        window.dispatchEvent(new Event('app:modal-close'));
      };
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.dispatchEvent(new Event('app:modal-close'));
    }
  }, [selectedOrderId]);

  const fetchAllOrdersForExport = useCallback(async (): Promise<Order[]> => {
    try {
      console.log('📦 [ADMIN] Fetching all orders for export...', {
        statusFilter,
        paymentStatusFilter,
        searchKeyword,
        sortBy,
        sortOrder,
      });

      const limit = 100;
      const firstResponse = await apiClient.get<OrdersResponse>('/api/v1/admin/orders', {
        params: buildOrdersParams(1, limit),
      });

      let allOrders: Order[] = firstResponse.data || [];
      const metaInfo = firstResponse.meta;

      if (metaInfo && metaInfo.totalPages > 1) {
        const pagePromises: Promise<OrdersResponse>[] = [];
        for (let p = 2; p <= metaInfo.totalPages; p++) {
          pagePromises.push(
            apiClient.get<OrdersResponse>('/api/v1/admin/orders', {
              params: buildOrdersParams(p, limit),
            }),
          );
        }

        const otherPages = await Promise.all(pagePromises);
        otherPages.forEach((resp) => {
          if (resp.data && Array.isArray(resp.data)) {
            allOrders = allOrders.concat(resp.data);
          }
        });
      }

      // Apply same filters on frontend for extra safety
      const filtered = allOrders.filter((order) => {
        if (statusFilter && order.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
        if (
          paymentStatusFilter &&
          order.paymentStatus.toLowerCase() !== paymentStatusFilter.toLowerCase()
        ) {
          return false;
        }
        if (searchKeyword.trim()) {
          const keyword = searchKeyword.toLowerCase().trim();
          const searchableText = [
            order.number,
            order.customerEmail,
            order.customerPhone,
            order.customerFirstName,
            order.customerLastName,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!searchableText.includes(keyword)) {
            return false;
          }
        }
        return true;
      });

      console.log('✅ [ADMIN] All orders loaded for export (after filters):', filtered.length);
      return filtered;
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching orders for export:', err);
      alert(t('admin.orders.failedToDelete')); // generic error message reuse
      return [];
    }
  }, [statusFilter, paymentStatusFilter, searchKeyword, sortBy, sortOrder, t]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (orders.length === 0) return;
    setSelectedIds(prev => {
      const allIds = orders.map(o => o.id);
      const hasAll = allIds.every(id => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if same column
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1); // Reset to first page when sorting changes
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('admin.orders.deleteConfirm').replace('{count}', selectedIds.size.toString()))) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      console.log('🗑️ [ADMIN] Starting bulk delete for orders:', ids);
      
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          try {
            const response = await apiClient.delete(`/api/v1/admin/orders/${id}`);
            console.log('✅ [ADMIN] Order deleted successfully:', id, response);
            return { id, success: true };
          } catch (error: any) {
            console.error('❌ [ADMIN] Failed to delete order:', id, error);
            return { id, success: false, error: error.message || t('admin.common.unknownErrorFallback') };
          }
        })
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
      
      console.log('📊 [ADMIN] Bulk delete results:', {
        total: ids.length,
        successful: successful.length,
        failed: failed.length,
      });
      
      setSelectedIds(new Set());
      await fetchOrders();
      
      if (failed.length > 0) {
        const failedIds = failed.map(r => 
          r.status === 'fulfilled' ? r.value.id : 'unknown'
        );
        alert(t('admin.orders.bulkDeleteFailed').replace('{success}', successful.length.toString()).replace('{total}', ids.length.toString()).replace('{failed}', failedIds.join(', ')));
      } else {
        alert(t('admin.orders.bulkDeleteFinished').replace('{success}', successful.length.toString()).replace('{total}', ids.length.toString()));
      }
    } catch (err) {
      console.error('❌ [ADMIN] Bulk delete orders error:', err);
      alert(t('admin.orders.failedToDelete'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      console.log('📝 [ADMIN] Changing order status:', { orderId, newStatus });
      
      // Add to updating set
      setUpdatingStatuses((prev) => new Set(prev).add(orderId));
      setUpdateMessage(null);

      // Update order status via API
      await apiClient.put(`/api/v1/admin/orders/${orderId}`, {
        status: newStatus,
      });

      console.log('✅ [ADMIN] Order status updated successfully');

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Show success message
      setUpdateMessage({ type: 'success', text: t('admin.orders.statusUpdated') });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('❌ [ADMIN] Error updating order status:', err);
      setUpdateMessage({ 
        type: 'error', 
        text: t('admin.orders.failedToUpdateStatus')
      });
      setTimeout(() => setUpdateMessage(null), 5000);
    } finally {
      // Remove from updating set
      setUpdatingStatuses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const loadOrderDetails = useCallback(async (orderId: string) => {
    try {
      setOrderDetailsLoading(true);
      setOrderDetailsError(null);
      console.log('📂 [ADMIN][Orders] Loading order details...', { orderId });
      const response = await apiClient.get<OrderDetails>(`/api/v1/admin/orders/${orderId}`);
      console.log('✅ [ADMIN][Orders] Order details loaded:', response);
      setOrderDetails(response);
      
      // Fetch delivery price if needed
      if (response.shippingMethod === 'delivery' && response.shippingAddress?.city) {
        const currentShipping = response.totals?.shipping ?? response.shippingAmount ?? 0;
        if (currentShipping === 0) {
          setLoadingDeliveryPrice(true);
          try {
            const deliveryResponse = await apiClient.get<{ price: number }>('/api/v1/delivery/price', {
              params: {
                city: response.shippingAddress.city,
                country: 'Armenia',
              },
            });
            setDeliveryPrice(deliveryResponse.price);
          } catch (err) {
            console.error('❌ [ADMIN][Orders] Error fetching delivery price:', err);
            setDeliveryPrice(null);
          } finally {
            setLoadingDeliveryPrice(false);
          }
        }
      }
    } catch (err: any) {
      console.error('❌ [ADMIN][Orders] Failed to load order details:', err);
      setOrderDetailsError(err?.message || t('admin.orders.orderDetails.failedToLoad'));
    } finally {
      setOrderDetailsLoading(false);
    }
  }, [t]);

  const getColorValue = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'beige': '#F5F5DC', 'black': '#000000', 'blue': '#0000FF', 'brown': '#A52A2A',
      'gray': '#808080', 'grey': '#808080', 'green': '#008000', 'red': '#FF0000',
      'white': '#FFFFFF', 'yellow': '#FFFF00', 'orange': '#FFA500', 'pink': '#FFC0CB',
      'purple': '#800080', 'navy': '#000080', 'maroon': '#800000', 'olive': '#808000',
      'teal': '#008080', 'cyan': '#00FFFF', 'magenta': '#FF00FF', 'lime': '#00FF00',
      'silver': '#C0C0C0', 'gold': '#FFD700',
    };
    const normalizedName = colorName.toLowerCase().trim();
    return colorMap[normalizedName] || '#CCCCCC';
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: string) => {
    try {
      console.log('📝 [ADMIN] Changing order payment status:', { orderId, newPaymentStatus });
      
      // Add to updating set
      setUpdatingPaymentStatuses((prev) => new Set(prev).add(orderId));
      setUpdateMessage(null);

      // Update order payment status via API
      await apiClient.put(`/api/v1/admin/orders/${orderId}`, {
        paymentStatus: newPaymentStatus,
      });

      console.log('✅ [ADMIN] Order payment status updated successfully');

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
        )
      );

      // Show success message
      setUpdateMessage({ type: 'success', text: t('admin.orders.paymentStatusUpdated') });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('❌ [ADMIN] Error updating order payment status:', err);
      setUpdateMessage({ 
        type: 'error', 
        text: t('admin.orders.failedToUpdatePaymentStatus')
      });
      setTimeout(() => setUpdateMessage(null), 5000);
    } finally {
      // Remove from updating set
      setUpdatingPaymentStatuses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    if (exporting) return;
    setExporting(format);
    try {
      const allOrders = await fetchAllOrdersForExport();
      if (!allOrders.length) {
        alert(t('admin.orders.noOrders'));
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (format === 'csv') {
        const blob = createOrdersCsvBlob(allOrders);
        downloadBlob(blob, `orders-${timestamp}.csv`);
      } else {
        const blob = createOrdersExcelBlob(allOrders);
        downloadBlob(blob, `orders-${timestamp}.xls`);
      }
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.orders.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg 
              className="w-5 h-5 transition-transform hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">{t('admin.common.back')}</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.orders.title')}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Filters */}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatusFilter(newStatus);
                setPage(1);
                // Update URL without causing navigation
                const params = new URLSearchParams(searchParams?.toString() || '');
                if (newStatus) {
                  params.set('status', newStatus);
                } else {
                  params.delete('status');
                }
                const newUrl = params.toString() ? `/admin/orders?${params.toString()}` : '/admin/orders';
                router.push(newUrl, { scroll: false });
              }}
            >
              <option value="">{t('admin.orders.allStatuses')}</option>
              <option value="pending">{t('admin.orders.pending')}</option>
              <option value="processing">{t('admin.orders.processing')}</option>
              <option value="completed">{t('admin.orders.completed')}</option>
              <option value="cancelled">{t('admin.orders.cancelled')}</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentStatusFilter}
              onChange={(e) => {
                const newPaymentStatus = e.target.value;
                setPaymentStatusFilter(newPaymentStatus);
                setPage(1);
                // Update URL without causing navigation
                const params = new URLSearchParams(searchParams?.toString() || '');
                if (newPaymentStatus) {
                  params.set('paymentStatus', newPaymentStatus);
                } else {
                  params.delete('paymentStatus');
                }
                const newUrl = params.toString() ? `/admin/orders?${params.toString()}` : '/admin/orders';
                router.push(newUrl, { scroll: false });
              }}
            >
              <option value="">{t('admin.orders.allPaymentStatuses')}</option>
              <option value="paid">{t('admin.orders.paid')}</option>
              <option value="pending">{t('admin.orders.pendingPayment')}</option>
              <option value="failed">{t('admin.orders.failed')}</option>
            </select>
            <input
              type="text"
              placeholder={t('admin.orders.searchPlaceholder') || 'Search orders...'}
              value={searchKeyword}
              onChange={(e) => {
                const newSearch = e.target.value;
                setSearchKeyword(newSearch);
                setPage(1);
                // Update URL without causing navigation
                const params = new URLSearchParams(searchParams?.toString() || '');
                if (newSearch.trim()) {
                  params.set('search', newSearch.trim());
                } else {
                  params.delete('search');
                }
                const newUrl = params.toString() ? `/admin/orders?${params.toString()}` : '/admin/orders';
                router.push(newUrl, { scroll: false });
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
            />
            {updateMessage && (
              <div
                className={`px-4 py-2 rounded-md text-sm ${
                  updateMessage.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {updateMessage.text}
              </div>
            )}
          </div>
        </Card>

        {/* Selection Controls */}
        {selectedIds.size > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {t('admin.orders.selectedOrders').replace('{count}', selectedIds.size.toString())}
              </div>
              <ProductPageButton
                variant="outline"
                className="px-4 py-2 text-sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? t('admin.orders.deleting') : t('admin.orders.deleteSelected')}
              </ProductPageButton>
            </div>
          </Card>
        )}

        {/* Orders Table */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('admin.orders.loadingOrders')}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">{t('admin.orders.noOrders')}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                {meta && (
                  <div className="text-sm text-gray-600">
                    {t('admin.orders.totalOrders') || 'Total orders'}:{' '}
                    <span className="font-medium">{meta.total}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <ProductPageButton
                    variant="outline"
                    className="px-3 py-1 text-xs"
                    onClick={() => handleExport('csv')}
                    disabled={exporting !== null}
                  >
                    {exporting === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
                  </ProductPageButton>
                  <ProductPageButton
                    variant="outline"
                    className="px-3 py-1 text-xs"
                    onClick={() => handleExport('excel')}
                    disabled={exporting !== null}
                  >
                    {exporting === 'excel' ? 'Exporting Excel...' : 'Export Excel'}
                  </ProductPageButton>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={t('admin.orders.selectAllOrders')}
                          checked={orders.length > 0 && orders.every(o => selectedIds.has(o.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.orderNumber')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.customer')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('total')}
                      >
                        <div className="flex items-center gap-1">
                          {t('admin.orders.total')}
                          <div className="flex flex-col">
                            <svg 
                              className={`w-3 h-3 ${sortBy === 'total' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <svg 
                              className={`w-3 h-3 -mt-1 ${sortBy === 'total' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.items')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.payment')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          {t('admin.orders.date')}
                          <div className="flex flex-col">
                            <svg 
                              className={`w-3 h-3 ${sortBy === 'createdAt' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <svg 
                              className={`w-3 h-3 -mt-1 ${sortBy === 'createdAt' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            aria-label={t('admin.orders.selectOrder').replace('{number}', order.number)}
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.number}</div>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            console.log('📂 [ADMIN][Orders] Opening order details modal', {
                              orderId: order.id,
                            });
                            setSelectedOrderId(order.id);
                            loadOrderDetails(order.id);
                          }}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {[order.customerFirstName, order.customerLastName].filter(Boolean).join(' ') || t('admin.orders.unknownCustomer')}
                          </div>
                          {order.customerPhone && (
                            <div className="text-sm text-gray-500">{order.customerPhone}</div>
                          )}
                          <div className="mt-1 text-xs text-blue-600">{t('admin.orders.viewOrderDetails')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(order.total, order.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.itemsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {updatingStatuses.has(order.id) ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                <span className="text-xs text-gray-500">{t('admin.orders.updating')}</span>
                              </div>
                            ) : (
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className={`px-2 py-1 text-xs font-medium rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getStatusColor(order.status)}`}
                              >
                                <option value="pending">{t('admin.orders.pending')}</option>
                                <option value="processing">{t('admin.orders.processing')}</option>
                                <option value="completed">{t('admin.orders.completed')}</option>
                                <option value="cancelled">{t('admin.orders.cancelled')}</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {updatingPaymentStatuses.has(order.id) ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                <span className="text-xs text-gray-500">{t('admin.orders.updating')}</span>
                              </div>
                            ) : (
                              <select
                                value={order.paymentStatus}
                                onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                                className={`px-2 py-1 text-xs font-medium rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getPaymentStatusColor(order.paymentStatus)}`}
                              >
                                <option value="paid">{t('admin.orders.paid')}</option>
                                <option value="pending">{t('admin.orders.pendingPayment')}</option>
                                <option value="failed">{t('admin.orders.failed')}</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {t('admin.orders.showingPage').replace('{page}', meta.page.toString()).replace('{totalPages}', meta.totalPages.toString()).replace('{total}', meta.total.toString())}
                  </div>
                  <div className="flex gap-2">
                    <ProductPageButton
                      variant="outline"
                      className="px-4 py-1 text-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {t('admin.orders.previous')}
                    </ProductPageButton>
                    <ProductPageButton
                      variant="outline"
                      className="px-4 py-1 text-sm"
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                    >
                      {t('admin.orders.next')}
                    </ProductPageButton>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-[9999] overflow-hidden" onClick={() => setSelectedOrderId(null)}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0 overflow-y-auto h-full">
            <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-90" onClick={() => setSelectedOrderId(null)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full" onClick={(e) => e.stopPropagation()}>
              {/* Modal Content */}
              <div className="bg-white px-6 py-6 max-h-[80vh] overflow-y-auto relative">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setSelectedOrderId(null);
                    setOrderDetails(null);
                    setOrderDetailsError(null);
                  }}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-600 focus:outline-none z-10 bg-white rounded-full p-1 shadow-sm"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {orderDetailsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('admin.orders.orderDetails.loadingOrderDetails')}</p>
                  </div>
                ) : orderDetailsError ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 mb-4">{orderDetailsError}</p>
                  </div>
                ) : orderDetails ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <Card className="p-4 md:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h2 className="text-sm font-semibold text-gray-900 mb-2">{t('admin.orders.orderDetails.summary')}</h2>
                          <div className="text-sm text-gray-700 space-y-1">
                            <div>
                              <span className="font-medium">{t('admin.orders.orderDetails.orderNumber')}</span> {orderDetails.number}
                            </div>
                            <div>
                              <span className="font-medium">{t('admin.orders.orderDetails.total')}</span>{' '}
                              {formatPrice(orderDetails.totals?.total ?? orderDetails.total, currency)}
                            </div>
                            <div>
                              <span className="font-medium">{t('admin.orders.orderDetails.status')}</span> {orderDetails.status}
                            </div>
                            <div>
                              <span className="font-medium">{t('admin.orders.orderDetails.payment')}</span> {orderDetails.paymentStatus}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-gray-900 mb-2">{t('admin.orders.orderDetails.customer')}</h2>
                          <div className="text-sm text-gray-700 space-y-1">
                            <div>
                              {(orderDetails.customer?.firstName || '') +
                                (orderDetails.customer?.lastName ? ' ' + orderDetails.customer.lastName : '') ||
                                t('admin.orders.unknownCustomer')}
                            </div>
                            {orderDetails.customerPhone && <div>{orderDetails.customerPhone}</div>}
                            {orderDetails.customerEmail && <div>{orderDetails.customerEmail}</div>}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Addresses & Payment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-4 md:p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-2">{t('admin.orders.orderDetails.shippingAddress')}</h2>
                        {orderDetails.shippingMethod === 'pickup' ? (
                          <div className="text-sm text-gray-700 space-y-1">
                            <div>
                              <span className="font-medium">{t('admin.orders.orderDetails.shippingMethod')}</span>{' '}
                              {t('checkout.shipping.storePickup')}
                            </div>
                            <p className="text-gray-500 mt-2">{t('checkout.shipping.storePickupDescription')}</p>
                          </div>
                        ) : orderDetails.shippingMethod === 'delivery' && orderDetails.shippingAddress ? (
                          <div className="text-sm text-gray-700 space-y-1">
                            <div className="mb-2">
                              <span className="font-medium">{t('admin.orders.orderDetails.shippingMethod')}</span>{' '}
                              {t('checkout.shipping.delivery')}
                            </div>
                            {(orderDetails.shippingAddress.address || orderDetails.shippingAddress.addressLine1) && (
                              <div>
                                <span className="font-medium">{t('checkout.form.address')}:</span>{' '}
                                {orderDetails.shippingAddress.address || orderDetails.shippingAddress.addressLine1}
                                {orderDetails.shippingAddress.addressLine2 && `, ${orderDetails.shippingAddress.addressLine2}`}
                              </div>
                            )}
                            {orderDetails.shippingAddress.city && (
                              <div>
                                <span className="font-medium">{t('checkout.form.city')}:</span> {orderDetails.shippingAddress.city}
                              </div>
                            )}
                            {orderDetails.shippingAddress.postalCode && (
                              <div>
                                <span className="font-medium">{t('checkout.form.postalCode')}:</span> {orderDetails.shippingAddress.postalCode}
                              </div>
                            )}
                            {(orderDetails.shippingAddress.phone || orderDetails.shippingAddress.shippingPhone) && (
                              <div className="mt-2">
                                <span className="font-medium">{t('checkout.form.phoneNumber')}:</span>{' '}
                                {orderDetails.shippingAddress.phone || orderDetails.shippingAddress.shippingPhone}
                              </div>
                            )}
                            {(orderDetails.shippingAddress as any)?.deliveryDay && (
                              <div className="mt-2">
                                <span className="font-medium">{t('admin.orders.orderDetails.deliveryDay')}</span>{' '}
                                {(() => {
                                  const raw = (orderDetails.shippingAddress as any).deliveryDay as string;
                                  const parts = raw?.split('-').map((p) => Number(p)) || [];
                                  const [year, month, day] = parts;
                                  if (!year || !month || !day) return raw;
                                  const date = new Date(year, month - 1, day);
                                  if (isNaN(date.getTime())) return raw;
                                  return date.toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    weekday: 'long',
                                  });
                                })()}
                              </div>
                            )}
                            {(orderDetails.shippingAddress as any)?.deliveryTimeSlot && (
                              <div>
                                <span className="font-medium">{t('admin.orders.orderDetails.deliveryTimeSlot')}</span>{' '}
                                {(() => {
                                  const slot = (orderDetails.shippingAddress as any).deliveryTimeSlot as string;
                                  if (slot === 'first_half') return t('checkout.delivery.timeSlots.firstHalf');
                                  if (slot === 'second_half') return t('checkout.delivery.timeSlots.secondHalf');
                                  return slot;
                                })()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            <p>{t('admin.orders.orderDetails.noShippingAddress')}</p>
                          </div>
                        )}
                      </Card>

                      <Card className="p-4 md:p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-2">{t('admin.orders.orderDetails.paymentInfo')}</h2>
                        {orderDetails.payment ? (
                          <div className="text-sm text-gray-700 space-y-1">
                            {orderDetails.payment.method && <div>{t('admin.orders.orderDetails.method')} {orderDetails.payment.method}</div>}
                            <div>
                              {t('admin.orders.orderDetails.amount')} {formatPrice(orderDetails.payment.amount, currency)}
                            </div>
                            <div>{t('admin.orders.orderDetails.status')} {orderDetails.payment.status}</div>
                            {orderDetails.payment.cardBrand && orderDetails.payment.cardLast4 && (
                              <div>
                                {t('admin.orders.orderDetails.card')} {orderDetails.payment.cardBrand} ••••{orderDetails.payment.cardLast4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">{t('admin.orders.orderDetails.noPaymentInfo')}</div>
                        )}
                      </Card>
                    </div>

                    {/* Items */}
                    <Card className="p-4 md:p-6">
                      <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('admin.orders.orderDetails.items')}</h2>
                      {Array.isArray(orderDetails.items) && orderDetails.items.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-200 rounded-md">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">{t('admin.orders.orderDetails.product')}</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">{t('admin.orders.orderDetails.sku')}</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">{t('admin.orders.orderDetails.colorSize')}</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500">{t('admin.orders.orderDetails.qty')}</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500">{t('admin.orders.orderDetails.price')}</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500">{t('admin.orders.orderDetails.totalCol')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {orderDetails.items.map((item) => {
                                const allOptions = item.variantOptions || [];
                                const getColorsArray = (colors: any): string[] => {
                                  if (!colors) return [];
                                  if (Array.isArray(colors)) return colors;
                                  if (typeof colors === 'string') {
                                    try {
                                      const parsed = JSON.parse(colors);
                                      return Array.isArray(parsed) ? parsed : [];
                                    } catch {
                                      return [];
                                    }
                                  }
                                  return [];
                                };
                                return (
                                  <tr key={item.id}>
                                    <td className="px-3 py-2">{item.productTitle}</td>
                                    <td className="px-3 py-2 text-gray-500">{item.sku}</td>
                                    <td className="px-3 py-2">
                                      {allOptions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 items-center">
                                          {allOptions.map((opt, optIndex) => {
                                            if (!opt.attributeKey || !opt.value) return null;
                                            const attributeKey = opt.attributeKey.toLowerCase().trim();
                                            const isColor = attributeKey === 'color' || attributeKey === 'colour';
                                            const displayLabel = opt.label || opt.value;
                                            const hasImage = opt.imageUrl && opt.imageUrl.trim() !== '';
                                            const colors = getColorsArray(opt.colors);
                                            const colorHex = colors.length > 0 ? colors[0] : (isColor ? getColorValue(opt.value) : null);
                                            return (
                                              <div key={optIndex} className="flex items-center gap-1.5">
                                                {hasImage ? (
                                                  <img 
                                                    src={opt.imageUrl!} 
                                                    alt={displayLabel}
                                                    className="w-4 h-4 rounded border border-gray-300 object-cover flex-shrink-0"
                                                    onError={(e) => {
                                                      (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                  />
                                                ) : isColor && colorHex ? (
                                                  <div 
                                                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                                    style={{ backgroundColor: colorHex }}
                                                    title={displayLabel}
                                                  />
                                                ) : null}
                                                <span className="text-xs text-gray-700 capitalize">{displayLabel}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                                    <td className="px-3 py-2 text-right">{formatPrice(item.unitPrice, currency)}</td>
                                    <td className="px-3 py-2 text-right">{formatPrice(item.total, currency)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">{t('admin.orders.orderDetails.noItemsFound')}</div>
                      )}
                    </Card>

                    {/* Order Summary */}
                    <Card className="p-4 md:p-6">
                      <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('checkout.orderSummary')}</h2>
                      <div className="space-y-3">
                        {(() => {
                          const originalSubtotal = orderDetails.totals?.subtotal ?? orderDetails.subtotal ?? 0;
                          const discount = orderDetails.totals?.discount ?? orderDetails.discountAmount ?? 0;
                          const subtotal = discount > 0 
                            ? originalSubtotal - discount
                            : orderDetails.items.reduce((sum, item) => sum + (item.total || 0), 0);
                          const baseShipping = orderDetails.shippingMethod === 'pickup' 
                            ? 0 
                            : (orderDetails.totals?.shipping ?? orderDetails.shippingAmount ?? 0);
                          const shipping = baseShipping === 0 && deliveryPrice !== null
                            ? deliveryPrice
                            : baseShipping;
                          const tax = orderDetails.totals?.tax ?? orderDetails.taxAmount ?? 0;
                          const total = subtotal + shipping;
                          return (
                            <>
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>{t('checkout.summary.subtotal')}</span>
                                <span>{formatPrice(subtotal, currency)}</span>
                              </div>
                              {discount > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>{t('checkout.summary.discount')}</span>
                                  <span>-{formatPrice(discount, currency)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>{t('checkout.summary.shipping')}</span>
                                <span>
                                  {orderDetails.shippingMethod === 'pickup'
                                    ? t('common.cart.free')
                                    : loadingDeliveryPrice
                                      ? t('checkout.shipping.loading')
                                      : orderDetails.shippingAddress?.city
                                        ? formatPrice(shipping, currency) + (orderDetails.shippingAddress.city ? ` (${orderDetails.shippingAddress.city})` : '')
                                        : t('checkout.shipping.enterCity')}
                                </span>
                              </div>
                              {tax > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>{t('checkout.summary.tax')}</span>
                                  <span>{formatPrice(tax, currency)}</span>
                                </div>
                              )}
                              <div className="border-t border-gray-200 pt-3 mt-3">
                                <div className="flex justify-between text-base font-bold text-gray-900">
                                  <span>{t('checkout.summary.total')}</span>
                                  <span>{formatPrice(total, currency)}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </Card>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

