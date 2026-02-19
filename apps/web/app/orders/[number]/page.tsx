'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../../lib/api-client';
import { formatPrice, getStoredCurrency, convertPrice } from '../../../lib/currency';
import { getStoredLanguage } from '../../../lib/language';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useTranslation } from '../../../lib/i18n-client';
import { EhdmReceiptBlock, type EhdmReceiptData } from '../../../components/EhdmReceiptBlock';

// Helper function to get color hex/rgb from color name
const getColorValue = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'beige': '#F5F5DC',
    'black': '#000000',
    'blue': '#0000FF',
    'brown': '#A52A2A',
    'gray': '#808080',
    'grey': '#808080',
    'green': '#008000',
    'red': '#FF0000',
    'white': '#FFFFFF',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'pink': '#FFC0CB',
    'purple': '#800080',
    'navy': '#000080',
    'maroon': '#800000',
    'olive': '#808000',
    'teal': '#008080',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'lime': '#00FF00',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
  };
  
  const normalizedName = colorName.toLowerCase().trim();
  return colorMap[normalizedName] || '#CCCCCC'; // Default gray if color not found
};

interface OrderItem {
  variantId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl?: string;
  variantOptions?: Array<{
    attributeKey?: string;
    value?: string;
    label?: string;
    imageUrl?: string;
    colors?: string[] | any;
  }>;
}

interface Order {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  items: OrderItem[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  customer?: {
    email?: string;
    phone?: string;
  };
  shippingAddress?: any;
  shippingMethod: string;
  trackingNumber?: string;
  timeline?: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  ehdmReceipt?: EhdmReceiptData | null;
}

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [shippingPrice, setShippingPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    fetchOrder();

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    const handleLanguageUpdate = () => {
      // Refetch order to get products with new language translations
      fetchOrder();
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('language-updated', handleLanguageUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [isLoggedIn, params.number, router]);

  async function fetchOrder() {
    try {
      setLoading(true);
      const currentLang = getStoredLanguage();
      const response = await apiClient.get<Order>(`/api/v1/orders/${params.number}`, {
        params: { lang: currentLang }
      });
      setOrder(response);

      // Fetch shipping price if delivery method and shipping is 0
      if (response.shippingMethod === 'delivery' && response.shippingAddress?.city && response.totals?.shipping === 0) {
        try {
          const deliveryPriceResponse = await apiClient.get<{ price: number }>('/api/v1/delivery/price', {
            params: {
              city: response.shippingAddress.city,
              country: 'Armenia',
            },
          });
          setShippingPrice(deliveryPriceResponse.price);
        } catch (err) {
          console.error('Error fetching delivery price:', err);
          setShippingPrice(null);
        }
      }
    } catch (error: any) {
      console.error('Error fetching order:', error);
      setError(error.message || t('orders.notFound.description'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
          <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-6 border border-[rgba(255,255,255,0)] overflow-clip text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('orders.notFound.title')}</h1>
            <p className="text-gray-600 mb-6">{error || t('orders.notFound.description')}</p>
            <Link href="/products">
              <button className="py-2.5 px-6 bg-gradient-to-r from-[#00D1FF] to-[#1AC0FD] rounded-[12px] text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-[#00B8E6] hover:to-[#00A8D6] transition-all duration-300">
                {t('orders.buttons.continueShopping')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('orders.title').replace('{number}', order.number)}</h1>
        <p className="text-gray-600">
          {t('orders.placedOn').replace('{date}', new Date(order.createdAt).toLocaleDateString())}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
            <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orders.orderStatus.title')}</h2>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>
                  {t('orders.orderStatus.payment').replace('{status}', order.paymentStatus)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.fulfillmentStatus)}`}>
                  {t('orders.orderStatus.fulfillment').replace('{status}', order.fulfillmentStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
            <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('orders.orderItems.title')}</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => {
                // Get all variant options (not just color and size)
                const allOptions = item.variantOptions || [];
                
                // Helper to get attribute label (capitalize first letter)
                const getAttributeLabel = (key: string): string => {
                  if (key === 'color' || key === 'colour') return t('orders.itemDetails.color');
                  if (key === 'size') return t('orders.itemDetails.size');
                  // Capitalize first letter for other attributes
                  return key.charAt(0).toUpperCase() + key.slice(1);
                };

                // Helper to check if colors array is valid
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
                  <div key={index} className="flex gap-4 pb-4 border-b border-white/20 last:border-0">
                    {item.imageUrl && (
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-transparent">
                        <img 
                          src={item.imageUrl} 
                          alt={item.productTitle}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.productTitle}</h3>
                      
                      {/* Display all variation options */}
                      {allOptions.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-2 mb-2">
                          {allOptions.map((opt, optIndex) => {
                            if (!opt.attributeKey || !opt.value) return null;
                            
                            const attributeKey = opt.attributeKey.toLowerCase().trim();
                            const isColor = attributeKey === 'color' || attributeKey === 'colour';
                            const displayLabel = opt.label || opt.value;
                            const hasImage = opt.imageUrl && opt.imageUrl.trim() !== '';
                            const colors = getColorsArray(opt.colors);
                            const colorHex = colors.length > 0 ? colors[0] : (isColor ? getColorValue(opt.value) : null);
                            
                            return (
                              <div key={optIndex} className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {getAttributeLabel(opt.attributeKey)}:
                                </span>
                                <div className="flex items-center gap-2">
                                  {/* Show image if available */}
                                  {hasImage ? (
                                    <img 
                                      src={opt.imageUrl!} 
                                      alt={displayLabel}
                                      className="w-6 h-6 rounded border border-gray-300 object-cover"
                                      onError={(e) => {
                                        // Fallback to color circle if image fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : isColor && colorHex ? (
                                    <div 
                                      className="w-5 h-5 rounded-full border border-gray-300"
                                      style={{ backgroundColor: colorHex }}
                                      title={displayLabel}
                                    />
                                  ) : null}
                                  <span className="text-sm text-gray-900 capitalize">
                                    {displayLabel}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600">{t('orders.itemDetails.sku').replace('{sku}', item.sku)}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        {t('orders.itemDetails.quantity')
                          .replace('{qty}', item.quantity.toString())
                          .replace('{price}', formatPrice(item.price, currency))
                          .replace('{total}', formatPrice(item.total, currency))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
              <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orders.shippingAddress.title')}</h2>
                <div className="text-gray-600">
                  {order.shippingAddress.firstName && order.shippingAddress.lastName && (
                    <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  )}
                  {order.shippingAddress.addressLine1 && <p>{order.shippingAddress.addressLine1}</p>}
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  {order.shippingAddress.city && (
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
                    </p>
                  )}
                  {order.shippingAddress.countryCode && <p>{order.shippingAddress.countryCode}</p>}
                  {order.shippingAddress.phone && <p className="mt-2">{t('orders.shippingAddress.phone').replace('{phone}', order.shippingAddress.phone)}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <div className="relative sticky top-4">
            <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
            <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('orders.orderSummary.title')}</h2>
              <div className="space-y-4 mb-6">
                {(() => {
                  // Use order.totals.subtotal and subtract discount to get discounted subtotal
                  // (like checkout uses cart.totals.subtotal which is already discounted)
                  // Order totals.subtotal is non-discounted, discount is stored separately
                  const originalSubtotal = order.totals?.subtotal || 0;
                  const discount = order.totals?.discount || 0;
                  // Calculate discounted subtotal: original - discount
                  // If discount is 0, items might already be discounted, so use items total
                  const subtotal = discount > 0 
                    ? originalSubtotal - discount
                    : order.items.reduce((sum, item) => sum + item.total, 0);
                  // Use shipping price from API if available, convert from AMD to USD like checkout does
                  // Otherwise use order.totals.shipping (already converted)
                  const shipping = shippingPrice !== null 
                    ? shippingPrice
                    : (order.totals?.shipping || 0);
                  // Calculate total the same way checkout does: subtotal + shipping
                  const total = subtotal + shipping;

                  return (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>{t('orders.orderSummary.subtotal')}</span>
                        <span>{formatPrice(subtotal, currency)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>{t('orders.orderSummary.discount')}</span>
                          <span>-{formatPrice(discount, currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>{t('orders.orderSummary.shipping')}</span>
                        <span>
                          {order.shippingMethod === 'pickup'
                            ? t('common.cart.free')
                            : shipping > 0
                              ? formatPrice(shipping, currency)
                              : t('checkout.shipping.enterCity')}
                        </span>
                      </div>
                      <div className="border-t border-white/20 pt-4">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>{t('orders.orderSummary.total')}</span>
                          <span>{formatPrice(total, currency)}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* EHDM fiscal receipt (only when paid and receipt exists) */}
              {order.paymentStatus === 'paid' && order.ehdmReceipt != null && (
                <div className="mt-6">
                  <EhdmReceiptBlock
                    receipt={order.ehdmReceipt}
                    orderNumber={order.number}
                    variant="full"
                  />
                </div>
              )}

              <div>
                <Link href="/products">
                  <button className="w-full py-2.5 px-6 bg-gradient-to-r from-[#00D1FF] to-[#1AC0FD] rounded-[12px] text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-[#00B8E6] hover:to-[#00A8D6] transition-all duration-300">
                    {t('orders.buttons.continueShopping')}
                  </button>
                </Link>
                <Link href="/cart">
                  <button className="w-full mt-3 py-2.5 px-6 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 text-gray-900 font-semibold text-base shadow-inner hover:bg-white/60 transition-all duration-300">
                    {t('orders.buttons.viewCart')}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

