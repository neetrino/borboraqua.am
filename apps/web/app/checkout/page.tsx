'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient, ApiError } from '../../lib/api-client';
import { formatPrice, formatPriceInCurrency, getStoredCurrency, convertPrice, type CurrencyCode } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { ProductPageButton } from '../../components/icons/global/globalMobile';

interface CartItem {
  id: string;
  variant: {
    id: string;
    sku: string;
    product: {
      id: string;
      title: string;
      slug: string;
      image?: string | null;
    };
  };
  quantity: number;
  price: number;
  total: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  itemsCount: number;
}

type DeliveryTimeSlot = string;

type DeliveryDayOption = {
  date: string;
  label: string;
};

interface DeliveryTimeSlotConfig {
  id: string;
  label: {
    en: string;
    hy: string;
    ru: string;
  };
  enabled: boolean;
}

interface DeliveryRegionOption {
  id: string;
  name: string;
  price: number;
}

type CheckoutFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingMethod: 'pickup' | 'delivery';
  paymentMethod: 'idram' | 'ameriabank' | 'telcell' | 'fastshift' | 'cash_on_delivery';
  shippingAddress?: string;
  shippingRegionId?: string;
  shippingPostalCode?: string;
  shippingPhone?: string;
  deliveryDay?: string;
  deliveryTimeSlot?: DeliveryTimeSlot;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, user } = useAuth();
  const { t } = useTranslation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(getStoredCurrency());
  // Language state - used in handleLanguageUpdate function (setLanguage)
  // eslint-disable-next-line no-unused-vars
  const [language, setLanguage] = useState(getStoredLanguage());
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const [deliveryPrice, setDeliveryPrice] = useState<number | null>(null);
  const [loadingDeliveryPrice, setLoadingDeliveryPrice] = useState(false);
  const [deliveryRegions, setDeliveryRegions] = useState<DeliveryRegionOption[]>([]);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  const [enabledWeekdays, setEnabledWeekdays] = useState<number[] | null>(null);
  const [deliveryTimeSlots, setDeliveryTimeSlots] = useState<DeliveryTimeSlotConfig[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Payment methods configuration (logo or logos: single image or multiple for card payment)
  const paymentMethods: Array<{
    id: 'cash_on_delivery' | 'idram' | 'ameriabank' | 'telcell' | 'fastshift';
    name: string;
    description: string;
    logo?: string | null;
    logos?: string[];
  }> = [
    {
      id: 'cash_on_delivery',
      name: t('checkout.payment.cashOnDelivery'),
      description: t('checkout.payment.cashOnDeliveryDescription'),
      logo: '/assets/payments/dollar.svg',
    },
    {
      id: 'ameriabank',
      name: t('checkout.payment.cardPayment'),
      description: t('checkout.payment.cardPaymentDescription'),
      logos: [
        '/assets/payments/Arca_logo_wiki.svg',
        '/assets/payments/Mastercard-logo.svg',
        '/assets/payments/Visa_logo_wiki.svg',
      ],
    },
    {
      id: 'idram',
      name: t('checkout.payment.idram'),
      description: t('checkout.payment.idramDescription'),
      logo: '/assets/payments/Idram_logo_wiki.svg',
    },
    {
      id: 'telcell',
      name: t('checkout.payment.telcell'),
      description: t('checkout.payment.telcellDescription'),
      logo: '/assets/payments/Telcell_logo_wiki.svg',
    },
    {
      id: 'fastshift',
      name: t('checkout.payment.fastshift'),
      description: t('checkout.payment.fastshiftDescription'),
      logo: '/assets/payments/Fastshift_logo_wiki.svg',
    },
  ];

  // Create validation schema with translations
  const checkoutSchema = useMemo(() => z.object({
    firstName: z.string().min(1, t('checkout.errors.firstNameRequired')),
    lastName: z.string().min(1, t('checkout.errors.lastNameRequired')),
    email: z.string().email(t('checkout.errors.invalidEmail')).min(1, t('checkout.errors.emailRequired')),
    phone: z.string().min(1, t('checkout.errors.phoneRequired')).regex(/^\+?[0-9]{8,15}$/, t('checkout.errors.invalidPhone')),
    shippingMethod: z.enum(['pickup', 'delivery'], {
      message: t('checkout.errors.selectShippingMethod'),
    }),
    paymentMethod: z.enum(['idram', 'ameriabank', 'telcell', 'fastshift', 'cash_on_delivery'], {
      message: t('checkout.errors.selectPaymentMethod'),
    }),
    // Shipping address fields - required only for delivery
    shippingAddress: z.string().optional(),
    shippingRegionId: z.string().optional(),
    shippingPostalCode: z.string().optional(),
    shippingPhone: z.string().optional(),
    // Delivery date & time - required only for home delivery
    deliveryDay: z.string().optional(),
    deliveryTimeSlot: z.string().optional(),
  }).refine((data) => {
    return data.shippingAddress && data.shippingAddress.trim().length > 0;
  }, {
    message: t('checkout.errors.addressRequired'),
    path: ['shippingAddress'],
  }).refine((data) => {
    return data.shippingRegionId && data.shippingRegionId.trim().length > 0;
  }, {
    message: t('checkout.errors.regionRequired'),
    path: ['shippingRegionId'],
  }).refine((data) => {
    // User must pick a delivery day
    return !!data.deliveryDay;
  }, {
    message: t('checkout.errors.deliveryDayRequired'),
    path: ['deliveryDay'],
  }).refine((data) => {
    // User must pick a delivery time slot
    return !!data.deliveryTimeSlot;
  }, {
    message: t('checkout.errors.deliveryTimeRequired'),
    path: ['deliveryTimeSlot'],
  }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      shippingMethod: 'delivery',
      paymentMethod: 'cash_on_delivery',
      shippingAddress: '',
      shippingRegionId: '',
      shippingPostalCode: '',
      shippingPhone: '',
      deliveryDay: '',
      deliveryTimeSlot: undefined,
    },
  });

  const paymentMethod = watch('paymentMethod');
  const shippingMethod = watch('shippingMethod');
  const shippingRegionId = watch('shippingRegionId');
  const deliveryDay = watch('deliveryDay');
  const deliveryTimeSlot = watch('deliveryTimeSlot');
  const selectedRegion = deliveryRegions.find((r) => r.id === shippingRegionId);

  const availableDeliveryDays: DeliveryDayOption[] = useMemo(() => {
    // Calculate enabled delivery days for the currently visible calendar month.
    // Only days that match the admin-configured weekdays and are at least 24 hours in advance are enabled.
    if (!enabledWeekdays || enabledWeekdays.length === 0) {
      return [];
    }

    const now = new Date();
    const minAllowedDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours

    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);

    const storedLang = getStoredLanguage();
    const locale =
      storedLang === 'hy'
        ? 'hy-AM'
        : storedLang === 'ru'
          ? 'ru-RU'
          : 'en-US';

    const results: DeliveryDayOption[] = [];
    const cursor = new Date(monthStart);

    while (cursor <= monthEnd) {
      const dateCopy = new Date(cursor);
      dateCopy.setHours(0, 0, 0, 0);

      const dayOfWeek = dateCopy.getDay(); // 0=Sun..6=Sat
      const isEnabledWeekday = enabledWeekdays.includes(dayOfWeek);
      const isAfterMinDateTime = dateCopy.getTime() >= minAllowedDateTime.getTime();

      if (isEnabledWeekday && isAfterMinDateTime) {
        const year = dateCopy.getFullYear();
        const month = String(dateCopy.getMonth() + 1).padStart(2, '0');
        const day = String(dateCopy.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;

        results.push({
          date: localDateStr,
          label: dateCopy.toLocaleDateString(locale, {
            day: 'numeric',
          }),
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return results;
  }, [calendarMonth, enabledWeekdays, language]);

  // Fetch delivery schedule (enabled weekdays) and time slots once
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const response = await apiClient.get<{ schedule: { enabledWeekdays: number[] }; timeSlots: DeliveryTimeSlotConfig[] }>('/api/v1/delivery/settings');
        const days =
          Array.isArray(response.schedule?.enabledWeekdays) && response.schedule.enabledWeekdays.length > 0
            ? response.schedule.enabledWeekdays
            : [2, 4];
        setEnabledWeekdays(days);
        
        if (Array.isArray(response.timeSlots) && response.timeSlots.length > 0) {
          setDeliveryTimeSlots(response.timeSlots);
        } else {
          // Fallback to default slots
          setDeliveryTimeSlots([
            { id: 'first_half', label: { en: 'Morning (9:00 - 13:00)', hy: 'Առավոտյան (9:00 - 13:00)', ru: 'Утро (9:00 - 13:00)' }, enabled: true },
            { id: 'second_half', label: { en: 'Afternoon (13:00 - 18:00)', hy: 'Երեկոյան (13:00 - 18:00)', ru: 'День (13:00 - 18:00)' }, enabled: true },
          ]);
        }
      } catch (err) {
        console.error('❌ [CHECKOUT] Error fetching delivery settings:', err);
        setEnabledWeekdays([2, 4]); // Default fallback
        setDeliveryTimeSlots([
          { id: 'first_half', label: { en: 'Morning (9:00 - 13:00)', hy: 'Առավոտյան (9:00 - 13:00)', ru: 'Утро (9:00 - 13:00)' }, enabled: true },
          { id: 'second_half', label: { en: 'Afternoon (13:00 - 18:00)', hy: 'Երեկոյան (13:00 - 18:00)', ru: 'День (13:00 - 18:00)' }, enabled: true },
        ]);
      }
    };

    fetchDeliverySettings();
  }, []);

  // Fetch delivery regions for checkout dropdown
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await apiClient.get<{ regions: DeliveryRegionOption[] }>('/api/v1/delivery/regions');
        setDeliveryRegions(res.regions || []);
      } catch (err) {
        console.error('❌ [CHECKOUT] Error fetching delivery regions:', err);
        setDeliveryRegions([]);
      }
    };
    fetchRegions();
  }, []);

  // Fetch delivery price when region changes
  useEffect(() => {
    const fetchDeliveryPrice = async () => {
      if (shippingRegionId && shippingRegionId.trim().length > 0) {
        setLoadingDeliveryPrice(true);
        try {
          const response = await apiClient.get<{ price: number }>('/api/v1/delivery/price', {
            params: { regionId: shippingRegionId.trim() },
          });
          setDeliveryPrice(response.price);
        } catch {
          setDeliveryPrice(null);
        } finally {
          setLoadingDeliveryPrice(false);
        }
      } else {
        setDeliveryPrice(null);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchDeliveryPrice();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [shippingRegionId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target as Node)) {
        setRegionDropdownOpen(false);
      }
    };
    if (regionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [regionDropdownOpen]);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (isLoading) {
      return;
    }

    // Allow guest checkout - no redirect to login
    fetchCart();

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    const handleLanguageUpdate = () => {
      setLanguage(getStoredLanguage());
      // Refetch cart to get products with new language translations
      fetchCart();
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('language-updated', handleLanguageUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    async function loadUserProfile() {
      // Wait for auth to finish loading
      if (isLoading) {
        console.log('⏳ [CHECKOUT] Waiting for auth to load...');
        return;
      }

      if (isLoggedIn) {
        console.log('👤 [CHECKOUT] User is logged in, loading profile data...');
        
        // First, try to use user data from auth context (faster, from localStorage)
        if (user) {
          console.log('📦 [CHECKOUT] Using user data from auth context:', {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone
          });
          
          // Auto-fill form fields with user data from context
          if (user.firstName) {
            setValue('firstName', user.firstName);
          }
          if (user.lastName) {
            setValue('lastName', user.lastName);
          }
          if (user.email) {
            setValue('email', user.email);
          }
          if (user.phone) {
            setValue('phone', user.phone);
            setValue('shippingPhone', user.phone);
          }
        }
        
        // Then, try to load fresh data from API (more complete, may have updated data)
        try {
          const profile = await apiClient.get<{
            id: string;
            email?: string;
            phone?: string;
            firstName?: string;
            lastName?: string;
            addresses?: Array<{
              id: string;
              firstName?: string;
              lastName?: string;
              addressLine1?: string;
              addressLine2?: string;
              city?: string;
              state?: string;
              postalCode?: string;
              countryCode?: string;
              phone?: string;
              isDefault?: boolean;
            }>;
          }>('/api/v1/users/profile');
          
          console.log('✅ [CHECKOUT] Profile loaded from API:', {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
            addressesCount: profile.addresses?.length || 0
          });
          
          // Update form fields with fresh API data (overwrites context data if different)
          if (profile.firstName) {
            setValue('firstName', profile.firstName);
            console.log('📝 [CHECKOUT] Set firstName:', profile.firstName);
          }
          if (profile.lastName) {
            setValue('lastName', profile.lastName);
            console.log('📝 [CHECKOUT] Set lastName:', profile.lastName);
          }
          if (profile.email) {
            setValue('email', profile.email);
            console.log('📝 [CHECKOUT] Set email:', profile.email);
          }
          if (profile.phone) {
            setValue('phone', profile.phone);
            // Also set shipping phone if available
            setValue('shippingPhone', profile.phone);
            console.log('📝 [CHECKOUT] Set phone:', profile.phone);
          }
          
          // Auto-fill shipping address from saved addresses
          if (profile.addresses && profile.addresses.length > 0) {
            // Find default address, or use first address if no default
            const defaultAddress = profile.addresses.find(addr => addr.isDefault) || profile.addresses[0];
            
            if (defaultAddress) {
              console.log('🏠 [CHECKOUT] Auto-filling shipping address from saved address:', {
                city: defaultAddress.city,
                postalCode: defaultAddress.postalCode,
                hasAddress: !!defaultAddress.addressLine1
              });
              
              // Fill shipping address fields
              if (defaultAddress.addressLine1) {
                const fullAddress = defaultAddress.addressLine2 
                  ? `${defaultAddress.addressLine1}, ${defaultAddress.addressLine2}`
                  : defaultAddress.addressLine1;
                setValue('shippingAddress', fullAddress);
                console.log('📝 [CHECKOUT] Set shippingAddress:', fullAddress);
              }
              
              // Region (marz) is not auto-filled from saved address; user selects from dropdown

              // Use address phone if available, otherwise use user phone
              if (defaultAddress.phone) {
                setValue('shippingPhone', defaultAddress.phone);
                console.log('📝 [CHECKOUT] Set shippingPhone from address:', defaultAddress.phone);
              }
            }
          }
        } catch (error) {
          console.error('❌ [CHECKOUT] Error loading user profile from API:', error);
          console.log('ℹ️ [CHECKOUT] Using data from auth context instead');
          // Error loading profile, but we already have data from context, so it's OK
        }
      } else {
        console.log('ℹ️ [CHECKOUT] User is not logged in, form will remain empty');
      }
    }
    
    loadUserProfile();
  }, [isLoggedIn, isLoading, user, setValue]);

  async function fetchCart() {
    try {
      setLoading(true);
      
      // If user is logged in, fetch from API
      if (isLoggedIn) {
        const response = await apiClient.get<{ cart: Cart }>('/api/v1/cart');
        setCart(response.cart);
        return;
      }

      // If guest, load from localStorage
      if (typeof window === 'undefined') {
        setCart(null);
        setLoading(false);
        return;
      }

      const CART_KEY = 'shop_cart_guest';
      const stored = localStorage.getItem(CART_KEY);
      const guestCart: Array<{ productId: string; productSlug?: string; variantId: string; quantity: number }> = stored ? JSON.parse(stored) : [];

      if (guestCart.length === 0) {
        setCart(null);
        setLoading(false);
        return;
      }

      // Fetch product details for guest cart
      const itemsWithDetails: Array<{ item: CartItem | null; shouldRemove: boolean }> = await Promise.all(
        guestCart.map(async (item, index) => {
          try {
            if (!item.productSlug) {
              return { item: null, shouldRemove: true };
            }

            const productData = await apiClient.get<{
              id: string;
              slug: string;
              translations?: Array<{ title: string; locale: string }>;
              media?: Array<{ url?: string; src?: string } | string>;
              variants?: Array<{
                _id: string;
                id: string;
                sku: string;
                price: number;
              }>;
            }>(`/api/v1/products/${item.productSlug}`);

            const variant = productData.variants?.find(v => 
              (v._id?.toString() || v.id) === item.variantId
            ) || productData.variants?.[0];

            if (!variant) {
              return { item: null, shouldRemove: true };
            }

            // Get translation for current language, fallback to first available
            const translation = productData.translations?.find((t: { locale: string }) => t.locale === language) 
              || productData.translations?.[0];
            const imageUrl = productData.media?.[0] 
              ? (typeof productData.media[0] === 'string' 
                  ? productData.media[0] 
                  : productData.media[0].url || productData.media[0].src)
              : null;

            return {
              item: {
                id: `${item.productId}-${item.variantId}-${index}`,
                variant: {
                  id: variant._id?.toString() || variant.id,
                  sku: variant.sku || '',
                  product: {
                    id: productData.id,
                    title: translation?.title || 'Product',
                    slug: productData.slug,
                    image: imageUrl,
                  },
                },
                quantity: item.quantity,
                price: variant.price,
                total: variant.price * item.quantity,
              },
              shouldRemove: false,
            };
          } catch (error: any) {
            if (error?.status === 404 || error?.statusCode === 404) {
              return { item: null, shouldRemove: true };
            }
            console.error(`Error fetching product ${item.productId}:`, error);
            return { item: null, shouldRemove: false };
          }
        })
      );

      // Remove items that were not found
      const itemsToRemove = itemsWithDetails
        .map((result, index) => result.shouldRemove ? index : -1)
        .filter(index => index !== -1);
      
      if (itemsToRemove.length > 0) {
        const updatedCart = guestCart.filter((_, index) => !itemsToRemove.includes(index));
        localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
      }

      const validItems = itemsWithDetails
        .map(result => result.item)
        .filter((item): item is CartItem => item !== null);
      
      if (validItems.length === 0) {
        setCart(null);
        setLoading(false);
        return;
      }

      const subtotal = validItems.reduce((sum, item) => sum + item.total, 0);
      const itemsCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

      setCart({
        id: 'guest-cart',
        items: validItems,
        totals: {
          subtotal,
          discount: 0,
          shipping: 0,
          tax: 0,
          total: subtotal,
          currency: 'AMD',
        },
        itemsCount,
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError(t('checkout.errors.failedToLoadCart'));
    } finally {
      setLoading(false);
    }
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Checkout] handlePlaceOrder called', { 
      isLoggedIn, 
      isLoading, 
      paymentMethod,
      shippingMethod,
      cart: cart ? 'exists' : 'null'
    });
    
    // Validate shipping address (always required since delivery is always selected)
    const formData = watch();
    const hasShippingAddress = formData.shippingAddress && formData.shippingAddress.trim().length > 0;
    const hasShippingRegion = formData.shippingRegionId && formData.shippingRegionId.trim().length > 0;

    if (!hasShippingAddress || !hasShippingRegion) {
      console.log('[Checkout] Shipping address validation failed:', {
        hasShippingAddress,
        hasShippingRegion,
      });
      setError(t('checkout.errors.fillShippingAddress'));
      // Scroll to shipping address section
      const shippingSection = document.querySelector('[data-shipping-section]');
      if (shippingSection) {
        shippingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Submit directly (Ameriabank/Idram/Telcell/FastShift redirect via init API after order creation)
    console.log('[Checkout] Submitting directly');
    handleSubmit(onSubmit)(e);
  };

  async function onSubmit(data: CheckoutFormData) {
    setError(null);

    try {
      if (!cart) {
        throw new Error(t('checkout.errors.cartEmpty'));
      }

      let cartId = cart.id;
      let items = undefined;

      // If guest checkout, send items directly
      if (!isLoggedIn && cart.id === 'guest-cart') {
        console.log('[Checkout] Guest checkout - sending items directly...');
        items = cart.items.map(item => ({
          productId: item.variant.product.id,
          variantId: item.variant.id,
          quantity: item.quantity,
        }));
        cartId = 'guest-cart'; // Keep as guest-cart for API to recognize
      }

      // Prepare shipping address (always delivery): address, region (marz), regionId, phone
      const selectedRegionName = deliveryRegions.find((r) => r.id === data.shippingRegionId)?.name;
      const shippingAddress = data.shippingAddress &&
        data.shippingRegionId &&
        data.phone
        ? {
            address: data.shippingAddress,
            regionId: data.shippingRegionId,
            region: selectedRegionName ?? '',
            phone: data.phone,
            ...(data.deliveryDay ? { deliveryDay: data.deliveryDay } : {}),
            ...(data.deliveryTimeSlot ? { deliveryTimeSlot: data.deliveryTimeSlot } : {}),
          }
        : undefined;

      console.log('[Checkout] Submitting order:', {
        cartId: cartId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        shippingMethod: data.shippingMethod,
        paymentMethod: data.paymentMethod,
        hasShippingAddress: !!shippingAddress,
        isGuest: !isLoggedIn,
      });

      const response = await apiClient.post<{
        order: {
          id: string;
          number: string;
          status: string;
          paymentStatus: string;
          total: number;
          currency: string;
        };
        payment: {
          provider: string;
          paymentUrl: string | null;
          expiresAt: string | null;
        };
        nextAction: string;
      }>('/api/v1/orders/checkout', {
        cartId: cartId,
        ...(items ? { items } : {}),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        shippingMethod: data.shippingMethod,
        ...(shippingAddress ? { shippingAddress } : {}),
        paymentMethod: data.paymentMethod,
        locale: getStoredLanguage(), // Pass current language for product translations
      });

      console.log('[Checkout] Order created:', response.order.number);
      
      // Verify stock was updated by checking variant stock after order
      // Note: This is for debugging - in production, stock is updated server-side
      if (cart?.items && cart.items.length > 0) {
        console.log('[Checkout] Verifying stock update for variants:', cart.items.map((item: any) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })));
        
        // Try to fetch updated variant stock (optional - for debugging)
        // This will be done server-side, but we can verify here
        try {
          // Note: Stock update happens server-side in the transaction
          // We can't verify it here without making another API call
          console.log('[Checkout] Stock update verification: Stock is updated server-side in transaction');
        } catch (verifyError) {
          console.warn('[Checkout] Could not verify stock update:', verifyError);
        }
      }

      // Clear guest cart only when not redirecting to payment (e.g. cash). For card/ameriabank, cart is cleared after payment success.
      if (!isLoggedIn && response.nextAction === 'view_order') {
        localStorage.removeItem('shop_cart_guest');
        window.dispatchEvent(new Event('cart-updated'));
      }

      // Ameriabank: call init then redirect to bank
      if (data.paymentMethod === 'ameriabank' && response.nextAction === 'redirect_to_payment') {
        try {
          const initRes = await apiClient.post<{ redirectUrl: string }>('/api/v1/payments/ameriabank/init', {
            orderNumber: response.order.number,
            lang: getStoredLanguage(),
          });
          if (initRes.redirectUrl) {
            window.location.href = initRes.redirectUrl;
            return;
          }
        } catch (initErr: any) {
          console.error('[Checkout] Ameriabank init failed:', initErr);
          setError(initErr?.message || t('checkout.errors.paymentInitFailed'));
          return;
        }
      }

      // Idram: call init then submit form to Idram
      if (data.paymentMethod === 'idram' && response.nextAction === 'redirect_to_payment') {
        try {
          const initRes = await apiClient.post<{ formAction: string; formData: Record<string, string> }>('/api/v1/payments/idram/init', {
            orderNumber: response.order.number,
            lang: getStoredLanguage(),
          });
          if (initRes.formAction && initRes.formData) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = initRes.formAction;
            form.style.display = 'none';
            Object.entries(initRes.formData).forEach(([key, value]) => {
              if (value == null) return;
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = value;
              form.appendChild(input);
            });
            document.body.appendChild(form);
            form.submit();
            return;
          }
        } catch (initErr: any) {
          console.error('[Checkout] Idram init failed:', initErr);
          setError(initErr?.message || t('checkout.errors.paymentInitFailed'));
          return;
        }
      }

      // Telcell: call init then redirect to Telcell
      if (data.paymentMethod === 'telcell' && response.nextAction === 'redirect_to_payment') {
        try {
          const initRes = await apiClient.post<{ redirectUrl: string }>('/api/v1/payments/telcell/init', {
            orderNumber: response.order.number,
            lang: getStoredLanguage(),
          });
          if (initRes.redirectUrl) {
            window.location.href = initRes.redirectUrl;
            return;
          }
        } catch (initErr: any) {
          console.error('[Checkout] Telcell init failed:', initErr);
          setError(initErr?.message || t('checkout.errors.paymentInitFailed'));
          return;
        }
      }
      if (data.paymentMethod === 'fastshift' && response.nextAction === 'redirect_to_payment') {
        try {
          const initRes = await apiClient.post<{ redirectUrl: string }>('/api/v1/payments/fastshift/init', {
            orderNumber: response.order.number,
          });
          if (initRes.redirectUrl) {
            window.location.href = initRes.redirectUrl;
            return;
          }
        } catch (initErr: any) {
          console.error('[Checkout] FastShift init failed:', initErr);
          setError(initErr?.message || t('checkout.errors.paymentInitFailed'));
          return;
        }
      }

      if (response.payment?.paymentUrl) {
        console.log('[Checkout] Redirecting to payment gateway:', response.payment.paymentUrl);
        window.location.href = response.payment.paymentUrl;
        return;
      }

      // Otherwise redirect to order success page
      router.push(`/checkout/success?order=${encodeURIComponent(response.order.number)}`);
    } catch (err: any) {
      console.error('[Checkout] Error creating order:', err);
      const message =
        err instanceof ApiError
          ? err.message
          : t('checkout.errors.failedToCreateOrder');
      router.push(`/checkout/error?message=${encodeURIComponent(message)}`);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('checkout.title')}</h1>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
          <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-6 border border-[rgba(255,255,255,0)] overflow-clip text-center">
            <p className="text-gray-600 mb-4">{t('checkout.errors.cartEmpty')}</p>
            <button
              onClick={() => router.push('/products')}
              className="py-2.5 px-6 bg-gradient-to-r from-[#00D1FF] to-[#1AC0FD] rounded-[12px] text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-[#00B8E6] hover:to-[#00A8D6] transition-all duration-300"
            >
              {t('checkout.buttons.continueShopping')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('checkout.title')}</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
              <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.contactInformation')}</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('checkout.form.firstName')}
                      </label>
                      <input
                        type="text"
                        {...register('firstName')}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                      />
                      {errors.firstName?.message && (
                        <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('checkout.form.lastName')}
                      </label>
                      <input
                        type="text"
                        {...register('lastName')}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                      />
                      {errors.lastName?.message && (
                        <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('checkout.form.email')}
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                      />
                      {errors.email?.message && (
                        <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('checkout.form.phone')}
                      </label>
                      <input
                        type="tel"
                        placeholder={t('checkout.placeholders.phone')}
                        {...register('phone')}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                      />
                      {errors.phone?.message && (
                        <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address - Always show (delivery is always selected) */}
            <div className="relative" data-shipping-section>
              <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
              <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.shippingAddress')}</h2>
                {(error && error.includes('shipping address')) || (errors.shippingAddress || errors.shippingRegionId) ? (
                  <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-[12px]">
                    <p className="text-sm text-red-600">
                      {error && error.includes('shipping address')
                        ? error
                        : (errors.shippingAddress?.message ||
                           errors.shippingRegionId?.message)}
                    </p>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('checkout.form.address')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('checkout.placeholders.address')}
                      {...register('shippingAddress', {
                        onChange: () => {
                          if (error && error.includes('shipping address')) {
                            setError(null);
                          }
                        },
                      })}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                    />
                    {errors.shippingAddress?.message && (
                      <p className="mt-1 text-xs text-red-600">{errors.shippingAddress.message}</p>
                    )}
                  </div>
                  <div ref={regionDropdownRef} className="relative">
                    <input type="hidden" {...register('shippingRegionId')} />
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('checkout.form.region')}
                    </label>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setRegionDropdownOpen((v) => !v)}
                      className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-left text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50 flex items-center justify-between"
                    >
                      <span className={selectedRegion ? '' : 'text-gray-500'}>
                        {selectedRegion ? `${selectedRegion.name} — ${formatPrice(selectedRegion.price, currency)}` : t('checkout.placeholders.selectRegion')}
                      </span>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {regionDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-[12px] border border-white/50 bg-white/100 backdrop-blur-md shadow-lg py-1 max-h-56 overflow-auto">
                        {deliveryRegions.map((region) => (
                          <button
                            key={region.id}
                            type="button"
                            onClick={() => {
                              setValue('shippingRegionId', region.id);
                              if (error && error.includes('shipping address')) setError(null);
                              setRegionDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-gray-900 hover:bg-white/60 focus:bg-white/60 focus:outline-none transition-colors"
                          >
                            {region.name} — {formatPrice(region.price, currency)}
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.shippingRegionId?.message && (
                      <p className="mt-1 text-xs text-red-600">{errors.shippingRegionId.message}</p>
                    )}
                  </div>
                </div>

                {/* Delivery day & time selection */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {t('checkout.delivery.day')}
                    </h3>

                    {/* Calendar-style month selector */}
                    <div className="border-2 border-white/30 rounded-[20px] p-4 inline-block backdrop-blur-md bg-white/50">
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
                          onClick={() => {
                            const prev = new Date(calendarMonth);
                            prev.setMonth(prev.getMonth() - 1);
                            setCalendarMonth(prev);
                          }}
                          disabled={isSubmitting}
                          aria-label="Previous month"
                        >
                          ‹
                        </button>
                        <div className="text-sm font-medium text-gray-900">
                          {calendarMonth.toLocaleDateString(getStoredLanguage() === 'hy' ? 'hy-AM' : getStoredLanguage() === 'ru' ? 'ru-RU' : 'en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
                          onClick={() => {
                            const next = new Date(calendarMonth);
                            next.setMonth(next.getMonth() + 1);
                            setCalendarMonth(next);
                          }}
                          disabled={isSubmitting}
                          aria-label="Next month"
                        >
                          ›
                        </button>
                      </div>

                      {/* Weekday header (Mon-Sun) */}
                      <div className="grid grid-cols-7 text-xs text-gray-500 mb-1">
                        <div className="text-center">M</div>
                        <div className="text-center">T</div>
                        <div className="text-center">W</div>
                        <div className="text-center">T</div>
                        <div className="text-center">F</div>
                        <div className="text-center">S</div>
                        <div className="text-center">S</div>
                      </div>

                      {/* Days grid */}
                      <div className="grid grid-cols-7 gap-1 text-sm ">
                        {(() => {
                          const days: JSX.Element[] = [];
                          const year = calendarMonth.getFullYear();
                          const month = calendarMonth.getMonth();
                          const firstOfMonth = new Date(year, month, 1);
                          const firstDayJS = firstOfMonth.getDay(); // 0=Sun..6=Sat
                          // Convert to Monday-based index (0=Mon..6=Sun)
                          const leadingEmpty = (firstDayJS + 6) % 7;
                          const daysInMonth = new Date(year, month + 1, 0).getDate();

                          // Empty cells before first day
                          for (let i = 0; i < leadingEmpty; i++) {
                            days.push(<div key={`empty-${i}`} />);
                          }

                          const enabledSet = new Set(availableDeliveryDays.map((d) => d.date));

                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(year, month, day);
                            date.setHours(0, 0, 0, 0);
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            const localDateStr = `${y}-${m}-${d}`;
                            const isEnabled = enabledSet.has(localDateStr);
                            const isSelected = deliveryDay === localDateStr;

                            days.push(
                              <button
                                key={localDateStr}
                                type="button"
                                disabled={!isEnabled || isSubmitting}
                                onClick={() => {
                                  setValue('deliveryDay', localDateStr);
                                  // Reset time slot when changing the day
                                  setValue('deliveryTimeSlot', undefined);
                                }}
                                className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm border backdrop-blur-md
                                  ${!isEnabled 
                                    ? 'border-white/30 bg-white/50 text-gray-300 cursor-default' 
                                    : 'cursor-pointer hover:bg-purple-50'}
                                  ${
                                    isSelected
                                      ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                                      : isEnabled
                                        ? 'text-gray-900 border-white/30 bg-white/50'
                                        : ''
                                  }`}
                              >
                                {day}
                              </button>,
                            );
                          }

                          return days;
                        })()}
                      </div>
                    </div>

                    {errors.deliveryDay && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.deliveryDay.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 ">
                      {t('checkout.delivery.time')}
                    </h3>
                    <div className="space-y-3">
                      {deliveryTimeSlots.length > 0 ? (
                        deliveryTimeSlots.map((slot) => {
                          const storedLang = getStoredLanguage();
                          const label = slot.label[storedLang as 'en' | 'hy' | 'ru'] || slot.label.en;
                          return (
                            <label
                              key={slot.id}
                              className={`flex items-center p-3 border-2 rounded-[20px] cursor-pointer backdrop-blur-md ${
                                deliveryTimeSlot === slot.id
                                  ? 'border-purple-600 bg-purple-50'
                                  : 'border-white/30 bg-white/50 hover:bg-white/60'
                              }`}
                            >
                              <input
                                type="radio"
                                {...register('deliveryTimeSlot')}
                                value={slot.id}
                                checked={deliveryTimeSlot === slot.id}
                                onChange={(e) =>
                                  setValue(
                                    'deliveryTimeSlot',
                                    e.target.value as DeliveryTimeSlot
                                  )
                                }
                                className="mr-3 w-4 h-4 rounded-full bg-white/50 backdrop-blur-md border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 accent-purple-600 disabled:opacity-50"
                                disabled={isSubmitting || !deliveryDay}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {label}
                                </div>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500">{t('checkout.delivery.noTimeSlots') || 'No time slots available'}</p>
                      )}
                    </div>
                    {errors.deliveryTimeSlot && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.deliveryTimeSlot.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
              <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.paymentMethod')}</h2>
                {errors.paymentMethod && (
                  <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-[12px]">
                    <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
                  </div>
                )}
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      paymentMethod === method.id
                        ? 'border-[#1AC0FD] bg-[#E8F9FE] shadow-sm'
                        : 'border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white/80'
                    }`}
                  >
                    {/* Mobile: text on top; Desktop: same row as logos */}
                    <div className="flex-1 min-w-0 order-1 md:order-2">
                      <div className="font-semibold text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-600 mt-0.5">{method.description}</div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 order-2 md:order-1">
                      <input
                        type="radio"
                        {...register('paymentMethod')}
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setValue('paymentMethod', e.target.value as 'idram' | 'ameriabank' | 'telcell' | 'fastshift' | 'cash_on_delivery')}
                        className="w-5 h-5 text-[#1AC0FD] focus:ring-[#1AC0FD] shrink-0"
                        disabled={isSubmitting}
                      />
                      {method.logos ? (
                        <div className="flex items-center gap-1">
                          {method.logos.map((src, i) => (
                            <div
                              key={`${method.id}-${src}`}
                              className="w-11 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0"
                            >
                              {logoErrors[`${method.id}-${i}`] ? (
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              ) : (
                                <img
                                  src={src}
                                  alt=""
                                  className="w-full h-full object-contain p-1"
                                  loading="lazy"
                                  onError={() => setLogoErrors((prev) => ({ ...prev, [`${method.id}-${i}`]: true }))}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-14 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                          {!method.logo || logoErrors[method.id] ? (
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          ) : (
                            <img
                              src={method.logo}
                              alt={method.name}
                              className="w-full h-full object-contain p-1.5"
                              loading="lazy"
                              onError={() => setLogoErrors((prev) => ({ ...prev, [method.id]: true }))}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>

            <div className="relative sticky top-4">
              <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
              <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.orderSummary')}</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('checkout.summary.subtotal')}</span>
                    <span>{formatPrice(cart.totals.subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{t('checkout.summary.shipping')}</span>
                    <span>
                      {loadingDeliveryPrice
                        ? t('checkout.shipping.loading')
                        : deliveryPrice !== null
                          ? formatPrice(deliveryPrice, currency) + (selectedRegion ? ` (${selectedRegion.name})` : ` (${t('checkout.shipping.delivery')})`)
                          : t('checkout.shipping.selectRegion')}
                    </span>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>{t('checkout.summary.total')}</span>
                      <span>
                        {formatPrice(
                          cart.totals.subtotal + 
                          (deliveryPrice !== null ? deliveryPrice : 0),
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-[12px]">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-6 bg-gradient-to-r from-[#00D1FF] to-[#1AC0FD] rounded-[12px] text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-[#00B8E6] hover:to-[#00A8D6] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('checkout.buttons.processing') : t('checkout.buttons.placeOrder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
