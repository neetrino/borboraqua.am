'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Input } from '@shop/ui';
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

type CheckoutFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingMethod: 'pickup' | 'delivery';
  paymentMethod: 'idram' | 'arca' | 'cash_on_delivery';
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingPhone?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardHolderName?: string;
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
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [deliveryPrice, setDeliveryPrice] = useState<number | null>(null);
  const [loadingDeliveryPrice, setLoadingDeliveryPrice] = useState(false);
  const [enabledWeekdays, setEnabledWeekdays] = useState<number[] | null>(null);
  const [deliveryTimeSlots, setDeliveryTimeSlots] = useState<DeliveryTimeSlotConfig[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Payment methods configuration
  const paymentMethods = [
    {
      id: 'cash_on_delivery' as const,
      name: t('checkout.payment.cashOnDelivery'),
      description: t('checkout.payment.cashOnDeliveryDescription'),
      logo: null,
    },
    {
      id: 'idram' as const,
      name: t('checkout.payment.idram'),
      description: t('checkout.payment.idramDescription'),
      logo: '/assets/payments/idram.svg',
    },
    {
      id: 'arca' as const,
      name: t('checkout.payment.arca'),
      description: t('checkout.payment.arcaDescription'),
      logo: '/assets/payments/arca.svg',
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
    paymentMethod: z.enum(['idram', 'arca', 'cash_on_delivery'], {
      message: t('checkout.errors.selectPaymentMethod'),
    }),
    // Shipping address fields - required only for delivery
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingPostalCode: z.string().optional(),
    shippingPhone: z.string().optional(),
    // Payment details - optional, can be filled in modal
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvv: z.string().optional(),
    cardHolderName: z.string().optional(),
    // Delivery date & time - required only for home delivery
    deliveryDay: z.string().optional(),
    deliveryTimeSlot: z.string().optional(),
  }).refine((data) => {
    return data.shippingAddress && data.shippingAddress.trim().length > 0;
  }, {
    message: t('checkout.errors.addressRequired'),
    path: ['shippingAddress'],
  }).refine((data) => {
    return data.shippingCity && data.shippingCity.trim().length > 0;
  }, {
    message: t('checkout.errors.cityRequired'),
    path: ['shippingCity'],
  }).refine((data) => {
    return data.shippingPhone && data.shippingPhone.trim().length > 0;
  }, {
    message: t('checkout.errors.phoneRequiredDelivery'),
    path: ['shippingPhone'],
  }).refine((data) => {
    if (data.shippingPhone && data.shippingPhone.trim().length > 0) {
      return /^\+?[0-9]{8,15}$/.test(data.shippingPhone);
    }
    return true;
  }, {
    message: t('checkout.errors.invalidPhoneFormat'),
    path: ['shippingPhone'],
  }).refine((data) => {
    if (data.paymentMethod === 'arca' || data.paymentMethod === 'idram') {
      return data.cardNumber && data.cardNumber.replace(/\s/g, '').length >= 13;
    }
    return true;
  }, {
    message: t('checkout.errors.cardNumberRequired'),
    path: ['cardNumber'],
  }).refine((data) => {
    if (data.paymentMethod === 'arca' || data.paymentMethod === 'idram') {
      return data.cardExpiry && /^\d{2}\/\d{2}$/.test(data.cardExpiry);
    }
    return true;
  }, {
    message: t('checkout.errors.cardExpiryRequired'),
    path: ['cardExpiry'],
  }).refine((data) => {
    if (data.paymentMethod === 'arca' || data.paymentMethod === 'idram') {
      return data.cardCvv && data.cardCvv.length >= 3;
    }
    return true;
  }, {
    message: t('checkout.errors.cvvRequired'),
    path: ['cardCvv'],
  }).refine((data) => {
    if (data.paymentMethod === 'arca' || data.paymentMethod === 'idram') {
      return data.cardHolderName && data.cardHolderName.trim().length > 0;
    }
    return true;
  }, {
    message: t('checkout.errors.cardHolderNameRequired'),
    path: ['cardHolderName'],
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

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('[Checkout] showShippingModal changed:', showShippingModal);
  }, [showShippingModal]);

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
      shippingCity: '',
      shippingPostalCode: '',
      shippingPhone: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      cardHolderName: '',
      deliveryDay: '',
      deliveryTimeSlot: undefined,
    },
  });

  const paymentMethod = watch('paymentMethod');
  const shippingMethod = watch('shippingMethod');
  const shippingCity = watch('shippingCity');
  const deliveryDay = watch('deliveryDay');
  const deliveryTimeSlot = watch('deliveryTimeSlot');

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

  // Fetch delivery price when city changes
  useEffect(() => {
    const fetchDeliveryPrice = async () => {
      if (shippingCity && shippingCity.trim().length > 0) {
        setLoadingDeliveryPrice(true);
        try {
          console.log('🚚 [CHECKOUT] Fetching delivery price for city:', shippingCity);
          const response = await apiClient.get<{ price: number }>('/api/v1/delivery/price', {
            params: {
              city: shippingCity.trim(),
              country: 'Armenia',
            },
          });
          console.log('✅ [CHECKOUT] Delivery price fetched:', response.price);
          setDeliveryPrice(response.price);
        } catch (err: any) {
          console.error('❌ [CHECKOUT] Error fetching delivery price:', err);
          // Don't set default price - keep it null so it doesn't add to total
          setDeliveryPrice(null);
        } finally {
          setLoadingDeliveryPrice(false);
        }
      } else {
        setDeliveryPrice(null);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchDeliveryPrice();
    }, 500);

        return () => clearTimeout(timeoutId);
  }, [shippingCity]);

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
              
              if (defaultAddress.city) {
                setValue('shippingCity', defaultAddress.city);
                console.log('📝 [CHECKOUT] Set shippingCity:', defaultAddress.city);
              }
              
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

            const translation = productData.translations?.[0];
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
      showShippingModal,
      paymentMethod,
      shippingMethod,
      cart: cart ? 'exists' : 'null'
    });
    
    // Validate shipping address (always required since delivery is always selected)
    const formData = watch();
    const hasShippingAddress = formData.shippingAddress && formData.shippingAddress.trim().length > 0;
    const hasShippingCity = formData.shippingCity && formData.shippingCity.trim().length > 0;
    const hasShippingPhone = formData.shippingPhone && formData.shippingPhone.trim().length > 0;
    
    if (!hasShippingAddress || !hasShippingCity || !hasShippingPhone) {
      console.log('[Checkout] Shipping address validation failed:', {
        hasShippingAddress,
        hasShippingCity,
        hasShippingPhone
      });
      setError(t('checkout.errors.fillShippingAddress'));
      // Scroll to shipping address section
      const shippingSection = document.querySelector('[data-shipping-section]');
      if (shippingSection) {
        shippingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // If ArCa or Idram is selected, show card details modal first
    if (paymentMethod === 'arca' || paymentMethod === 'idram') {
      console.log('[Checkout] Opening card modal for payment:', paymentMethod);
      setShowCardModal(true);
      return;
    }
    
    // If guest checkout and cash on delivery, show modal to confirm/add shipping details
    if (!isLoggedIn) {
      console.log('[Checkout] Opening modal for guest checkout');
      setShowShippingModal(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('app:modal-open'));
      }
      return;
    }
    
    // Otherwise submit directly (logged in user, cash on delivery)
    console.log('[Checkout] Submitting directly (logged in user, cash on delivery)');
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

      // Prepare shipping address (always delivery)
      const shippingAddress = data.shippingAddress && 
        data.shippingCity && 
        data.shippingPhone
        ? {
            address: data.shippingAddress,
            city: data.shippingCity,
            phone: data.shippingPhone,
            // Store delivery scheduling info together with the address
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

      // Clear guest cart after successful checkout
      if (!isLoggedIn) {
        localStorage.removeItem('shop_cart_guest');
        window.dispatchEvent(new Event('cart-updated'));
      }

      // If payment URL is provided, redirect to payment gateway
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
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">{t('checkout.errors.cartEmpty')}</p>
          <ProductPageButton variant="primary" onClick={() => router.push('/products')} className="py-3">
            {t('checkout.buttons.continueShopping')}
          </ProductPageButton>
        </Card>
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
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.contactInformation')}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('checkout.form.firstName')}
                    type="text"
                    {...register('firstName')}
                    error={errors.firstName?.message}
                    disabled={isSubmitting}
                  />
                  <Input
                    label={t('checkout.form.lastName')}
                    type="text"
                    {...register('lastName')}
                    error={errors.lastName?.message}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('checkout.form.email')}
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                    disabled={isSubmitting}
                  />
                  <Input
                    label={t('checkout.form.phone')}
                    type="tel"
                    placeholder={t('checkout.placeholders.phone')}
                    {...register('phone')}
                    error={errors.phone?.message}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </Card>

            {/* Shipping Address - Always show (delivery is always selected) */}
            <Card className="p-6" data-shipping-section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.shippingAddress')}</h2>
                {(error && error.includes('shipping address')) || (errors.shippingAddress || errors.shippingCity || errors.shippingPhone) ? (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">
                      {error && error.includes('shipping address') 
                        ? error 
                        : (errors.shippingAddress?.message || 
                           errors.shippingCity?.message || 
                           errors.shippingPhone?.message)}
                    </p>
                  </div>
                ) : null}
                <div className="space-y-4">
                  <div>
                    <Input
                      label={t('checkout.form.address')}
                      type="text"
                      placeholder={t('checkout.placeholders.address')}
                      {...register('shippingAddress', {
                        onChange: () => {
                          if (error && error.includes('shipping address')) {
                            setError(null);
                          }
                        }
                      })}
                      error={errors.shippingAddress?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Input
                      label={t('checkout.form.city')}
                      type="text"
                      placeholder={t('checkout.placeholders.city')}
                      {...register('shippingCity', {
                        onChange: () => {
                          if (error && error.includes('shipping address')) {
                            setError(null);
                          }
                        }
                      })}
                      error={errors.shippingCity?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Input
                      label={t('checkout.form.phoneNumber')}
                      type="tel"
                      placeholder={t('checkout.placeholders.phone')}
                      {...register('shippingPhone', {
                        onChange: () => {
                          if (error && error.includes('shipping address')) {
                            setError(null);
                          }
                        }
                      })}
                      error={errors.shippingPhone?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Delivery day & time selection */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {t('checkout.delivery.day')}
                    </h3>

                    {/* Calendar-style month selector */}
                    <div className="border border-gray-200 rounded-lg p-4 inline-block">
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
                      <div className="grid grid-cols-7 gap-1 text-sm">
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
                                className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm
                                  ${!isEnabled ? 'text-gray-300 cursor-default' : 'cursor-pointer hover:bg-purple-50'}
                                  ${
                                    isSelected
                                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                                      : isEnabled
                                        ? 'text-gray-900'
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
                              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                deliveryTimeSlot === slot.id
                                  ? 'border-purple-600 bg-purple-50'
                                  : 'border-gray-300 hover:bg-gray-50'
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
                                className="mr-3"
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
              </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.paymentMethod')}</h2>
              {errors.paymentMethod && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
                </div>
              )}
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('paymentMethod')}
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setValue('paymentMethod', e.target.value as 'idram' | 'arca' | 'cash_on_delivery')}
                      className="mr-4"
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative w-20 h-12 flex-shrink-0 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                        {!method.logo || logoErrors[method.id] ? (
                          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        ) : (
                          <img
                            src={method.logo}
                            alt={method.name}
                            className="w-full h-full object-contain p-1.5"
                            loading="lazy"
                            onError={() => {
                              setLogoErrors((prev) => ({ ...prev, [method.id]: true }));
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{method.name}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-4">
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
                        ? formatPrice(deliveryPrice, currency) + (shippingCity ? ` (${shippingCity})` : ` (${t('checkout.shipping.delivery')})`)
                        : t('checkout.shipping.enterCity')}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
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
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <ProductPageButton
                type="submit"
                variant="primary"
                className="w-full py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('checkout.buttons.processing') : t('checkout.buttons.placeOrder')}
              </ProductPageButton>
            </Card>
          </div>
        </div>
      </form>

      {/* Shipping Address Modal for Guest Checkout */}
      {showShippingModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => {
            console.log('[Checkout] Modal backdrop clicked, closing modal');
            setShowShippingModal(false);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('app:modal-close'));
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[Checkout] Modal content clicked');
            }}
            style={{ zIndex: 10000 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('checkout.modals.completeOrder')}
              </h2>
              <button
                onClick={() => {
                  setShowShippingModal(false);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('app:modal-close'));
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={t('checkout.modals.closeModal')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t('checkout.contactInformation')}</h3>
              <div>
                <Input
                  label={t('checkout.form.email')}
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Input
                  label={t('checkout.form.phone')}
                  type="tel"
                  placeholder={t('checkout.placeholders.phone')}
                  {...register('phone')}
                  error={errors.phone?.message}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Error messages for contact info */}
            {(errors.email || errors.phone) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {errors.email?.message || errors.phone?.message}
                </p>
              </div>
            )}

            <>
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('checkout.shippingAddress')}</h3>
                  <div>
                    <Input
                      label={t('checkout.form.address')}
                      type="text"
                      placeholder={t('checkout.placeholders.address')}
                      {...register('shippingAddress')}
                      error={errors.shippingAddress?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Input
                      label={t('checkout.form.city')}
                      type="text"
                      placeholder={t('checkout.placeholders.city')}
                      {...register('shippingCity')}
                      error={errors.shippingCity?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Input
                      label={t('checkout.form.phoneNumber')}
                      type="tel"
                      placeholder={t('checkout.placeholders.phone')}
                      {...register('shippingPhone')}
                      error={errors.shippingPhone?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {(errors.shippingAddress || errors.shippingCity || errors.shippingPhone) && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">
                      {errors.shippingAddress?.message || 
                       errors.shippingCity?.message || 
                       errors.shippingPhone?.message}
                    </p>
                  </div>
                )}

                {/* Payment Details - Only show for card payments */}
                {(paymentMethod === 'arca' || paymentMethod === 'idram') && (
                  <div className="space-y-4 mb-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('checkout.payment.paymentDetails')} ({paymentMethod === 'idram' ? t('checkout.payment.idram') : t('checkout.payment.arca')})
                    </h3>
                    <div>
                    <Input
                      label={t('checkout.form.cardNumber')}
                      type="text"
                      placeholder={t('checkout.placeholders.cardNumber')}
                      maxLength={19}
                      {...register('cardNumber')}
                      error={errors.cardNumber?.message}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\s/g, '');
                        value = value.replace(/(.{4})/g, '$1 ').trim();
                        setValue('cardNumber', value);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label={t('checkout.form.expiryDate')}
                        type="text"
                        placeholder={t('checkout.placeholders.expiryDate')}
                        maxLength={5}
                        {...register('cardExpiry')}
                        error={errors.cardExpiry?.message}
                        disabled={isSubmitting}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2, 4);
                          }
                          setValue('cardExpiry', value);
                        }}
                      />
                    </div>
                    <div>
                      <Input
                        label={t('checkout.form.cvv')}
                        type="text"
                        placeholder={t('checkout.placeholders.cvv')}
                        maxLength={4}
                        {...register('cardCvv')}
                        error={errors.cardCvv?.message}
                        disabled={isSubmitting}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setValue('cardCvv', value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Input
                      label={t('checkout.form.cardHolderName')}
                      type="text"
                      placeholder={t('checkout.placeholders.cardHolderName')}
                      {...register('cardHolderName')}
                      error={errors.cardHolderName?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                  </div>
                )}

                {/* Cash on Delivery Info */}
                {paymentMethod === 'cash_on_delivery' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 mt-6">
                    <p className="text-sm text-green-800">
                      <strong>{t('checkout.payment.cashOnDelivery')}:</strong> {t('checkout.messages.cashOnDeliveryInfo')}
                    </p>
                  </div>
                )}

                {cart && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('checkout.summary.items')}:</span>
                      <span className="font-medium">{cart.itemsCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('checkout.summary.subtotal')}:</span>
                      <span className="font-medium">{formatPrice(cart.totals.subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('checkout.summary.shipping')}:</span>
                      <span className="font-medium">
                        {loadingDeliveryPrice
                          ? t('checkout.shipping.loading')
                          : deliveryPrice !== null
                            ? formatPrice(deliveryPrice, currency) + (shippingCity ? ` (${shippingCity})` : ` (${t('checkout.shipping.delivery')})`)
                            : t('checkout.shipping.enterCity')}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">{t('checkout.summary.total')}:</span>
                        <span className="font-bold text-gray-900">
                          {formatPrice(
                            cart.totals.subtotal + 
                            (deliveryPrice !== null ? deliveryPrice : 0),
                            currency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>

            <div className="flex gap-3">
              <ProductPageButton
                type="button"
                variant="outline"
                className="flex-1 py-3"
                onClick={() => setShowShippingModal(false)}
                disabled={isSubmitting}
              >
                {t('checkout.buttons.cancel')}
              </ProductPageButton>
              <ProductPageButton
                type="button"
                variant="primary"
                className="flex-1 py-3"
                onClick={handleSubmit(
                  (data) => {
                    setShowShippingModal(false);
                    onSubmit(data);
                  },
                  (errors) => {
                    console.log('[Checkout Modal] Validation errors:', errors);
                    // Keep modal open if there are errors - scroll to first error
                    const firstErrorField = Object.keys(errors)[0];
                    if (firstErrorField) {
                      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
                      if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }
                  }
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('checkout.buttons.processing') : t('checkout.buttons.placeOrder')}
              </ProductPageButton>
            </div>
          </div>
        </div>
      )}

      {/* ArCa Card Details Modal */}
      {showCardModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => {
            console.log('[Checkout] Card modal backdrop clicked, closing modal');
            setShowCardModal(false);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('app:modal-close'));
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[Checkout] Card modal content clicked');
            }}
            style={{ zIndex: 10000 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('checkout.modals.cardDetails').replace('{method}', paymentMethod === 'arca' ? t('checkout.payment.arca') : t('checkout.payment.idram'))}
              </h2>
              <button
                onClick={() => {
                  setShowCardModal(false);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('app:modal-close'));
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={t('checkout.modals.closeModal')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Payment Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-16 h-10 flex-shrink-0 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                  {logoErrors[paymentMethod] ? (
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  ) : (
                    <img
                      src={paymentMethod === 'arca' ? '/assets/payments/arca.svg' : '/assets/payments/idram.svg'}
                      alt={paymentMethod === 'arca' ? 'ArCa' : 'Idram'}
                      className="w-full h-full object-contain p-1"
                      loading="lazy"
                      onError={() => {
                        setLogoErrors((prev) => ({ ...prev, [paymentMethod]: true }));
                      }}
                    />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {paymentMethod === 'arca' ? t('checkout.payment.arca') : t('checkout.payment.idram')} {t('checkout.payment.paymentDetails')}
                  </div>
                  <div className="text-sm text-gray-600">{t('checkout.payment.enterCardDetails')}</div>
                </div>
              </div>

              <div>
                <Input
                  label={t('checkout.form.cardNumber')}
                  type="text"
                  placeholder={t('checkout.placeholders.cardNumber')}
                  maxLength={19}
                  {...register('cardNumber')}
                  error={errors.cardNumber?.message}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\s/g, '');
                    value = value.replace(/(.{4})/g, '$1 ').trim();
                    setValue('cardNumber', value);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label={t('checkout.form.expiryDate')}
                    type="text"
                    placeholder={t('checkout.placeholders.expiryDate')}
                    maxLength={5}
                    {...register('cardExpiry')}
                    error={errors.cardExpiry?.message}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                      }
                      setValue('cardExpiry', value);
                    }}
                  />
                </div>
                <div>
                  <Input
                    label={t('checkout.form.cvv')}
                    type="text"
                    placeholder={t('checkout.placeholders.cvv')}
                    maxLength={4}
                    {...register('cardCvv')}
                    error={errors.cardCvv?.message}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setValue('cardCvv', value);
                    }}
                  />
                </div>
              </div>
              <div>
                <Input
                  label={t('checkout.form.cardHolderName')}
                  type="text"
                  placeholder={t('checkout.placeholders.cardHolderName')}
                  {...register('cardHolderName')}
                  error={errors.cardHolderName?.message}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Error messages for card details */}
            {(errors.cardNumber || errors.cardExpiry || errors.cardCvv || errors.cardHolderName) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {errors.cardNumber?.message || 
                   errors.cardExpiry?.message || 
                   errors.cardCvv?.message || 
                   errors.cardHolderName?.message}
                </p>
              </div>
            )}

            {/* Order Summary */}
            {cart && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">{t('checkout.orderSummary')}</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('checkout.summary.items')}:</span>
                  <span className="font-medium">{cart.itemsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('checkout.summary.subtotal')}:</span>
                  <span className="font-medium">{formatPrice(cart.totals.subtotal, currency)}</span>
                </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('checkout.summary.shipping')}:</span>
                      <span className="font-medium">
                        {loadingDeliveryPrice
                          ? t('checkout.shipping.loading')
                          : deliveryPrice !== null
                            ? formatPrice(deliveryPrice, currency) + (shippingCity ? ` (${shippingCity})` : ` (${t('checkout.shipping.delivery')})`)
                            : t('checkout.shipping.enterCity')}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">{t('checkout.summary.total')}:</span>
                        <span className="font-bold text-gray-900">
                          {formatPrice(
                            cart.totals.subtotal + 
                            (deliveryPrice !== null ? deliveryPrice : 0),
                            currency
                          )}
                        </span>
                      </div>
                    </div>
              </div>
            )}

            <div className="flex gap-3">
              <ProductPageButton
                type="button"
                variant="outline"
                className="flex-1 py-3"
                onClick={() => setShowCardModal(false)}
                disabled={isSubmitting}
              >
                {t('checkout.buttons.cancel')}
              </ProductPageButton>
              <ProductPageButton
                type="button"
                variant="primary"
                className="flex-1 py-3"
                onClick={handleSubmit(
                  (data) => {
                    setShowCardModal(false);
                    // If guest checkout, show shipping modal first, otherwise submit
                    if (!isLoggedIn) {
                      setShowShippingModal(true);
                    } else {
                      onSubmit(data);
                    }
                  },
                  (errors) => {
                    console.log('[Checkout Card Modal] Validation errors:', errors);
                    // Keep modal open if there are errors - scroll to first error
                    const firstErrorField = Object.keys(errors)[0];
                    if (firstErrorField) {
                      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
                      if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }
                  }
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('checkout.buttons.processing') : t('checkout.buttons.continueToPayment')}
              </ProductPageButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
