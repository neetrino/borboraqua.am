'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { apiClient } from '../../../../lib/api-client';
import { useTranslation } from '../../../../lib/i18n-client';
import { ProductPageButton } from '../../../../components/icons/global/globalMobile';
import { formatPrice, getStoredCurrency, type CurrencyCode } from '../../../../lib/currency';
import { EhdmReceiptBlock, type EhdmReceiptData } from '../../../../components/EhdmReceiptBlock';

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
  billingAddress?: unknown;
  shippingAddress?: Record<string, unknown>;
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
      colors?: string[] | unknown;
    }>;
  }>;
  createdAt: string;
  updatedAt?: string;
  ehdmReceipt?: EhdmReceiptData | null;
}

function getColorValue(colorName: string): string {
  const colorMap: Record<string, string> = {
    beige: '#F5F5DC', black: '#000000', blue: '#0000FF', brown: '#A52A2A',
    gray: '#808080', grey: '#808080', green: '#008000', red: '#FF0000',
    white: '#FFFFFF', yellow: '#FFFF00', orange: '#FFA500', pink: '#FFC0CB',
    purple: '#800080', navy: '#000080', maroon: '#800000', olive: '#808000',
    teal: '#008080', cyan: '#00FFFF', magenta: '#FF00FF', lime: '#00FF00',
    silver: '#C0C0C0', gold: '#FFD700',
  };
  const normalizedName = colorName.toLowerCase().trim();
  return colorMap[normalizedName] ?? '#CCCCCC';
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPaymentStatusColor(paymentStatus: string): string {
  switch (paymentStatus.toLowerCase()) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-orange-100 text-orange-800';
    case 'refunded': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = typeof params?.id === 'string' ? params.id : null;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>(getStoredCurrency());
  const [deliveryPrice, setDeliveryPrice] = useState<number | null>(null);
  const [loadingDeliveryPrice, setLoadingDeliveryPrice] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrder = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<OrderDetails>(`/api/v1/admin/orders/${id}`);
      setOrder(response);

      if (response.shippingMethod === 'delivery' && response.shippingAddress?.city) {
        const currentShipping = response.totals?.shipping ?? response.shippingAmount ?? 0;
        if (currentShipping === 0) {
          setLoadingDeliveryPrice(true);
          try {
            const deliveryResponse = await apiClient.get<{ price: number }>('/api/v1/delivery/price', {
              params: { city: response.shippingAddress.city as string, country: 'Armenia' },
            });
            setDeliveryPrice(deliveryResponse.price);
          } catch {
            setDeliveryPrice(null);
          } finally {
            setLoadingDeliveryPrice(false);
          }
        }
      }
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : t('admin.orders.orderDetails.failedToLoad');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/admin');
      return;
    }
    if (orderId && isLoggedIn && isAdmin) {
      fetchOrder(orderId);
    }
  }, [isLoggedIn, isAdmin, isLoading, orderId, router, fetchOrder]);

  useEffect(() => {
    const handleCurrencyUpdate = () => setCurrency(getStoredCurrency());
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    return () => window.removeEventListener('currency-updated', handleCurrencyUpdate);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId || !order) return;
    try {
      setUpdatingStatus(true);
      setUpdateMessage(null);
      await apiClient.put(`/api/v1/admin/orders/${orderId}`, { status: newStatus });
      setOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      setUpdateMessage({ type: 'success', text: t('admin.orders.statusUpdated') });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch {
      setUpdateMessage({ type: 'error', text: t('admin.orders.failedToUpdateStatus') });
      setTimeout(() => setUpdateMessage(null), 5000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (newPaymentStatus: string) => {
    if (!orderId || !order) return;
    try {
      setUpdatingPaymentStatus(true);
      setUpdateMessage(null);
      await apiClient.put(`/api/v1/admin/orders/${orderId}`, { paymentStatus: newPaymentStatus });
      setOrder((prev) => prev ? { ...prev, paymentStatus: newPaymentStatus } : null);
      setUpdateMessage({ type: 'success', text: t('admin.orders.paymentStatusUpdated') });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch {
      setUpdateMessage({ type: 'error', text: t('admin.orders.failedToUpdatePaymentStatus') });
      setTimeout(() => setUpdateMessage(null), 5000);
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.orders.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) return null;

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-red-600">{t('admin.orders.orderDetails.orderIdMissing')}</p>
          <ProductPageButton variant="outline" className="mt-4" onClick={() => router.push('/admin/orders')}>
            {t('admin.orders.orderDetails.backToOrders')}
          </ProductPageButton>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.orders.orderDetails.loadingOrderDetails')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-red-600 mb-4">{error ?? t('admin.orders.orderDetails.orderNotFound')}</p>
          <ProductPageButton variant="outline" onClick={() => router.push('/admin/orders')}>
            {t('admin.orders.orderDetails.backToOrders')}
          </ProductPageButton>
        </div>
      </div>
    );
  }

  const shippingAddr = order.shippingAddress as Record<string, unknown> | undefined;
  const deliveryDay = shippingAddr?.deliveryDay as string | undefined;
  const deliveryTimeSlot = shippingAddr?.deliveryTimeSlot as string | undefined;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push('/admin/orders')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 transition-transform hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">{t('admin.orders.orderDetails.backToOrders')}</span>
          </button>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('admin.orders.orderDetails.title')} — {order.number}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">{t('admin.orders.orderDetails.createdAt')}</span>
              <span className="text-sm font-medium text-gray-700">
                {new Date(order.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>
          {updateMessage && (
            <div
              className={`mt-3 px-4 py-2 rounded-md text-sm max-w-md ${
                updateMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {updateMessage.text}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Summary & Status */}
          <Card className="p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.orders.orderDetails.summary')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.orderDetails.orderNumber')}</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{order.number}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.orderDetails.total')}</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {formatPrice(order.totals?.total ?? order.total, currency)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.orderDetails.status')}</p>
                <div className="mt-1">
                  {updatingStatus ? (
                    <span className="text-sm text-gray-500">{t('admin.orders.updating')}</span>
                  ) : (
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">{t('admin.orders.pending')}</option>
                      <option value="processing">{t('admin.orders.processing')}</option>
                      <option value="completed">{t('admin.orders.completed')}</option>
                      <option value="cancelled">{t('admin.orders.cancelled')}</option>
                    </select>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.orderDetails.payment')}</p>
                <div className="mt-1">
                  {updatingPaymentStatus ? (
                    <span className="text-sm text-gray-500">{t('admin.orders.updating')}</span>
                  ) : (
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => handlePaymentStatusChange(e.target.value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getPaymentStatusColor(order.paymentStatus)}`}
                    >
                      <option value="paid">{t('admin.orders.paid')}</option>
                      <option value="pending">{t('admin.orders.pendingPayment')}</option>
                      <option value="failed">{t('admin.orders.failed')}</option>
                      <option value="cancelled">{t('admin.orders.cancelled')}</option>
                      <option value="refunded">{t('admin.orders.refunded')}</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Customer */}
          <Card className="p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('admin.orders.orderDetails.customer')}</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium text-gray-900">
                {(order.customer?.firstName ?? '') + (order.customer?.lastName ? ` ${order.customer.lastName}` : '') ||
                  t('admin.orders.unknownCustomer')}
              </p>
              {order.customerPhone && <p>{order.customerPhone}</p>}
              {order.customerEmail && <p>{order.customerEmail}</p>}
            </div>
          </Card>

          {/* Shipping & Payment — 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 md:p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('admin.orders.orderDetails.shippingAddress')}</h2>
              {order.shippingMethod === 'pickup' ? (
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">{t('admin.orders.orderDetails.shippingMethod')}</span> {t('checkout.shipping.storePickup')}</p>
                  <p className="text-gray-500 mt-2">{t('checkout.shipping.storePickupDescription')}</p>
                </div>
              ) : order.shippingMethod === 'delivery' && order.shippingAddress ? (
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">{t('admin.orders.orderDetails.shippingMethod')}</span> {t('checkout.shipping.delivery')}</p>
                  {(order.shippingAddress.address || order.shippingAddress.addressLine1) && (
                    <p><span className="font-medium">{t('checkout.form.address')}:</span>{' '}
                      {String(order.shippingAddress.address || order.shippingAddress.addressLine1)}
                      {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                    </p>
                  )}
                  {order.shippingAddress.city && (
                    <p><span className="font-medium">{t('checkout.form.city')}:</span> {String(order.shippingAddress.city)}</p>
                  )}
                  {order.shippingAddress.postalCode && (
                    <p><span className="font-medium">{t('checkout.form.postalCode')}:</span> {String(order.shippingAddress.postalCode)}</p>
                  )}
                  {(order.shippingAddress.phone || order.shippingAddress.shippingPhone) && (
                    <p><span className="font-medium">{t('checkout.form.phoneNumber')}:</span>{' '}
                      {String(order.shippingAddress.phone || order.shippingAddress.shippingPhone)}
                    </p>
                  )}
                  {deliveryDay && (
                    <p className="mt-2">
                      <span className="font-medium">{t('admin.orders.orderDetails.deliveryDay')}</span>{' '}
                      {(() => {
                        const parts = deliveryDay.split('-').map((p) => Number(p));
                        const [y, m, d] = parts;
                        if (!y || !m || !d) return deliveryDay;
                        const date = new Date(y, m - 1, d);
                        return isNaN(date.getTime()) ? deliveryDay : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'long' });
                      })()}
                    </p>
                  )}
                  {deliveryTimeSlot && (
                    <p>
                      <span className="font-medium">{t('admin.orders.orderDetails.deliveryTimeSlot')}</span>{' '}
                      {deliveryTimeSlot === 'first_half' ? t('checkout.delivery.timeSlots.firstHalf') : deliveryTimeSlot === 'second_half' ? t('checkout.delivery.timeSlots.secondHalf') : deliveryTimeSlot}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t('admin.orders.orderDetails.noShippingAddress')}</p>
              )}
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('admin.orders.orderDetails.paymentInfo')}</h2>
              {order.payment ? (
                <div className="text-sm text-gray-700 space-y-1">
                  {order.payment.method && <p>{t('admin.orders.orderDetails.method')} {order.payment.method}</p>}
                  <p>{t('admin.orders.orderDetails.amount')} {formatPrice(order.payment.amount, currency)}</p>
                  <p>{t('admin.orders.orderDetails.status')} {order.payment.status}</p>
                  {order.payment.cardBrand && order.payment.cardLast4 && (
                    <p>{t('admin.orders.orderDetails.card')} {order.payment.cardBrand} ••••{order.payment.cardLast4}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t('admin.orders.orderDetails.noPaymentInfo')}</p>
              )}
            </Card>
          </div>

          {/* Items */}
          <Card className="p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.orders.orderDetails.items')}</h2>
            {Array.isArray(order.items) && order.items.length > 0 ? (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.orders.orderDetails.product')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.orders.orderDetails.sku')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.orders.orderDetails.colorSize')}</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">{t('admin.orders.orderDetails.qty')}</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">{t('admin.orders.orderDetails.price')}</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">{t('admin.orders.orderDetails.totalCol')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {order.items.map((item) => {
                      const allOptions = item.variantOptions ?? [];
                      const getColorsArray = (colors: unknown): string[] => {
                        if (!colors) return [];
                        if (Array.isArray(colors)) return colors as string[];
                        if (typeof colors === 'string') {
                          try {
                            const parsed = JSON.parse(colors) as unknown;
                            return Array.isArray(parsed) ? (parsed as string[]) : [];
                          } catch {
                            return [];
                          }
                        }
                        return [];
                      };
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.productTitle}</td>
                          <td className="px-4 py-3 text-gray-500">{item.sku}</td>
                          <td className="px-4 py-3">
                            {allOptions.length > 0 ? (
                              <div className="flex flex-wrap gap-2 items-center">
                                {allOptions.map((opt, optIndex) => {
                                  if (!opt.attributeKey || !opt.value) return null;
                                  const key = opt.attributeKey.toLowerCase().trim();
                                  const isColor = key === 'color' || key === 'colour';
                                  const displayLabel = opt.label ?? opt.value;
                                  const hasImage = Boolean(opt.imageUrl?.trim());
                                  const colors = getColorsArray(opt.colors);
                                  const colorHex = colors.length > 0 ? colors[0] : (isColor ? getColorValue(opt.value) : null);
                                  return (
                                    <div key={optIndex} className="flex items-center gap-1.5">
                                      {hasImage ? (
                                        <img
                                          src={opt.imageUrl}
                                          alt={displayLabel}
                                          className="w-5 h-5 rounded border border-gray-300 object-cover flex-shrink-0"
                                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                      ) : isColor && colorHex ? (
                                        <div className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: colorHex }} title={displayLabel} />
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
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatPrice(item.unitPrice, currency)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatPrice(item.total, currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('admin.orders.orderDetails.noItemsFound')}</p>
            )}
          </Card>

          {/* Order Summary */}
          <Card className="p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('checkout.orderSummary')}</h2>
            {(() => {
              const originalSubtotal = order.totals?.subtotal ?? order.subtotal ?? 0;
              const discount = order.totals?.discount ?? order.discountAmount ?? 0;
              const subtotal = discount > 0 ? originalSubtotal - discount : order.items.reduce((sum, item) => sum + (item.total || 0), 0);
              const baseShipping = order.shippingMethod === 'pickup' ? 0 : (order.totals?.shipping ?? order.shippingAmount ?? 0);
              const shipping = baseShipping === 0 && deliveryPrice !== null ? deliveryPrice : baseShipping;
              const tax = order.totals?.tax ?? order.taxAmount ?? 0;
              const total = subtotal + shipping;
              return (
                <div className="space-y-3 max-w-sm">
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
                      {order.shippingMethod === 'pickup'
                        ? t('common.cart.free')
                        : loadingDeliveryPrice
                          ? t('checkout.shipping.loading')
                          : order.shippingAddress?.city
                            ? `${formatPrice(shipping, currency)} (${order.shippingAddress.city})`
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
                </div>
              );
            })()}
          </Card>

          {/* EHDM fiscal receipt */}
          {order.paymentStatus === 'paid' && (
            <Card className="p-4 md:p-6">
              {order.ehdmReceipt != null ? (
                <EhdmReceiptBlock receipt={order.ehdmReceipt} orderNumber={order.number} variant="compact" />
              ) : (
                <div className="text-sm">
                  <h3 className="font-semibold text-gray-900 mb-1">{t('admin.orders.orderDetails.fiscalReceipt')}</h3>
                  <p className="text-gray-500">{t('admin.orders.orderDetails.fiscalReceiptNotCreated')}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
