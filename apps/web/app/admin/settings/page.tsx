'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { clearCurrencyRatesCache } from '../../../lib/currency';
import { AdminMenuDrawer, getAdminMenuTABS } from '../../../components/icons/global/global';
import { ProductPageButton } from '../../../components/icons/global/globalMobile';

interface Settings {
  defaultCurrency?: string;
  globalDiscount?: number;
  categoryDiscounts?: Record<string, number>;
  brandDiscounts?: Record<string, number>;
  currencyRates?: Record<string, number>;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const adminTabs = getAdminMenuTABS(t);
  const currentPath = pathname || '/admin/settings';
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    defaultCurrency: 'AMD',
    currencyRates: {
      AMD: 1,
      USD: 0.0025, // 1 AMD = 0.0025 USD (1 USD = 400 AMD)
      EUR: 0.0023, // 1 AMD = 0.0023 EUR (1 EUR = 434.78 AMD)
      RUB: 0.225, // 1 AMD = 0.225 RUB (1 RUB = 4.44 AMD)
      GEL: 0.00675, // 1 AMD = 0.00675 GEL (1 GEL = 148.15 AMD)
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchSettings();
    }
  }, [isLoggedIn, isAdmin]);

  // Convert USD-based rates to AMD-based rates for display
  // USD-based: 1 USD = X currency (e.g., 1 USD = 400 AMD means AMD = 400)
  // AMD-based: 1 AMD = X currency (e.g., 1 AMD = 0.0025 USD means USD = 0.0025)
  const convertUSDToAMDBased = (usdBasedRates: Record<string, number>): Record<string, number> => {
    const amdRate = usdBasedRates.AMD || 400; // 1 USD = X AMD (e.g., 400 means 1 USD = 400 AMD)
    const usdValue = 1 / amdRate; // 1 AMD = 1/amdRate USD (e.g., 1/400 = 0.0025 means 1 AMD = 0.0025 USD)
    
    const amdBased: Record<string, number> = {
      AMD: 1, // Base currency
    };
    
    // For each currency, calculate: 1 currency = X AMD
    // If 1 USD = amdRate AMD, then 1 AMD = 1/amdRate USD
    if (usdBasedRates.USD !== undefined) {
      amdBased.USD = usdValue; // 1 AMD = usdValue USD
    }
    if (usdBasedRates.EUR !== undefined) {
      // 1 USD = amdRate AMD, 1 USD = eurRate EUR
      // So 1 EUR = amdRate / eurRate AMD
      // And 1 AMD = eurRate / amdRate EUR
      const eurRate = usdBasedRates.EUR; // 1 USD = eurRate EUR
      amdBased.EUR = eurRate / amdRate; // 1 AMD = eurRate / amdRate EUR
    }
    if (usdBasedRates.RUB !== undefined) {
      const rubRate = usdBasedRates.RUB; // 1 USD = rubRate RUB
      amdBased.RUB = rubRate / amdRate; // 1 AMD = rubRate / amdRate RUB
    }
    if (usdBasedRates.GEL !== undefined) {
      const gelRate = usdBasedRates.GEL; // 1 USD = gelRate GEL
      amdBased.GEL = gelRate / amdRate; // 1 AMD = gelRate / amdRate GEL
    }
    
    return amdBased;
  };

  // Convert AMD-based rates to USD-based rates for storage
  // AMD-based: 1 AMD = X currency (e.g., 1 AMD = 0.0027 USD means USD = 0.0027)
  // USD-based: 1 USD = X currency (e.g., 1 USD = 370.37 AMD means AMD = 370.37)
  const convertAMDBasedToUSD = (amdBasedRates: Record<string, number>): Record<string, number> => {
    const usdValue = amdBasedRates.USD; // 1 AMD = X USD (e.g., 0.0027 means 1 AMD = 0.0027 USD)
    if (!usdValue || usdValue <= 0) {
      throw new Error('USD rate is required and must be greater than 0');
    }
    const amdRate = 1 / usdValue; // 1 USD = 1/usdValue AMD (e.g., if 1 AMD = 0.0027 USD, then 1 USD = 370.37 AMD)
    
    const usdBased: Record<string, number> = {
      USD: 1, // Base currency
      AMD: amdRate, // 1 USD = amdRate AMD
    };
    
    // For each currency, calculate back to USD-based
    // If amdBasedRates.EUR = 0.0023, that means "1 AMD = 0.0023 EUR"
    // So: 1 EUR = 1 / 0.0023 = 434.78 AMD
    // And: 1 USD = amdRate AMD, so 1 USD = amdRate / (1/eurValue) = amdRate * eurValue EUR
    if (amdBasedRates.EUR !== undefined && amdBasedRates.EUR > 0) {
      const eurValue = amdBasedRates.EUR; // 1 AMD = eurValue EUR
      // 1 EUR = 1/eurValue AMD
      // 1 USD = amdRate AMD
      // So: 1 USD = amdRate / (1/eurValue) = amdRate * eurValue EUR
      usdBased.EUR = amdRate * eurValue; // 1 USD = amdRate * eurValue EUR
    }
    if (amdBasedRates.RUB !== undefined && amdBasedRates.RUB > 0) {
      const rubValue = amdBasedRates.RUB; // 1 AMD = rubValue RUB
      usdBased.RUB = amdRate * rubValue; // 1 USD = amdRate * rubValue RUB
    }
    if (amdBasedRates.GEL !== undefined && amdBasedRates.GEL > 0) {
      const gelValue = amdBasedRates.GEL; // 1 AMD = gelValue GEL
      usdBased.GEL = amdRate * gelValue; // 1 USD = amdRate * gelValue GEL
    }
    
    return usdBased;
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('⚙️ [ADMIN] Fetching settings...');
      const data = await apiClient.get<Settings>('/api/v1/admin/settings');
      const usdBasedRates = data.currencyRates || {
        USD: 1,
        AMD: 400,
        EUR: 0.92,
        RUB: 90,
        GEL: 2.7,
      };
      
      // Convert to AMD-based for display
      const amdBasedRates = convertUSDToAMDBased(usdBasedRates);
      
      setSettings({
        defaultCurrency: data.defaultCurrency || 'AMD',
        globalDiscount: data.globalDiscount,
        categoryDiscounts: data.categoryDiscounts,
        brandDiscounts: data.brandDiscounts,
        currencyRates: amdBasedRates,
      });
      console.log('✅ [ADMIN] Settings loaded:', data);
    } catch (err: any) {
      console.error('❌ [ADMIN] Error fetching settings:', err);
      // Use defaults if error (1 USD = 400 AMD)
      const defaultUSDRates = {
        USD: 1,
        AMD: 400,
        EUR: 0.92,
        RUB: 90,
        GEL: 2.7,
      };
      const amdBasedRates = convertUSDToAMDBased(defaultUSDRates);
      setSettings({
        defaultCurrency: 'AMD',
        currencyRates: amdBasedRates,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('⚙️ [ADMIN] Saving settings...', settings);

      // Convert AMD-based rates back to USD-based for storage
      // Ensure all required rates are present
      if (!settings.currencyRates?.USD || settings.currencyRates.USD <= 0) {
        alert(t('admin.settings.errorSaving').replace('{message}', 'USD rate is required and must be greater than 0'));
        setSaving(false);
        return;
      }
      
      const amdBasedRates: Record<string, number> = {
        AMD: 1,
        USD: settings.currencyRates.USD,
      };
      
      // Add optional rates if they exist and are valid
      if (settings.currencyRates.EUR !== undefined && settings.currencyRates.EUR > 0) {
        amdBasedRates.EUR = settings.currencyRates.EUR;
      }
      if (settings.currencyRates.RUB !== undefined && settings.currencyRates.RUB > 0) {
        amdBasedRates.RUB = settings.currencyRates.RUB;
      }
      if (settings.currencyRates.GEL !== undefined && settings.currencyRates.GEL > 0) {
        amdBasedRates.GEL = settings.currencyRates.GEL;
      }
      
      const currencyRatesToSave = convertAMDBasedToUSD(amdBasedRates);
      
      console.log('🔍 [ADMIN] Conversion debug:', {
        amdBasedRates,
        currencyRatesToSave,
      });

      await apiClient.put('/api/v1/admin/settings', {
        defaultCurrency: settings.defaultCurrency,
        currencyRates: currencyRatesToSave,
      });
      
      // Clear currency rates cache to force reload
      console.log('🔄 [ADMIN] Clearing currency rates cache...');
      clearCurrencyRatesCache();
      
      // Wait a bit to ensure cache is cleared, then dispatch event again
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          console.log('🔄 [ADMIN] Dispatching currency-rates-updated event...');
          window.dispatchEvent(new Event('currency-rates-updated'));
        }
      }, 100);
      
      alert(t('admin.settings.savedSuccess'));
      console.log('✅ [ADMIN] Settings saved, currency rates:', currencyRatesToSave);
    } catch (err: any) {
      console.error('❌ [ADMIN] Error saving settings:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save settings';
      alert(t('admin.settings.errorSaving').replace('{message}', errorMessage));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.common.loading')}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.settings.title')}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden mb-6">
            <AdminMenuDrawer tabs={adminTabs} currentPath={currentPath} />
          </div>
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="bg-white border border-gray-200 rounded-lg p-2 space-y-1">
              {adminTabs.map((tab) => {
                const isActive = currentPath === tab.path || 
                  (tab.path === '/admin' && currentPath === '/admin') ||
                  (tab.path !== '/admin' && currentPath.startsWith(tab.path));
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      router.push(tab.path);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                      tab.isSubCategory ? 'pl-12' : ''
                    } ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {tab.icon}
                    </span>
                    <span className="text-left">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">

        {/* General Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.settings.generalSettings')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.settings.siteName')}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={t('admin.settings.siteNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.settings.siteDescription')}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                defaultValue={t('admin.settings.siteDescriptionPlaceholder')}
              />
            </div>
          </div>
        </Card>

        {/* Payment Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.settings.paymentSettings')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.settings.defaultCurrency')}
              </label>
              <select 
                value={settings.defaultCurrency || 'AMD'}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AMD">{t('admin.settings.amd')}</option>
                <option value="USD">{t('admin.settings.usd')}</option>
                <option value="EUR">{t('admin.settings.eur')}</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">{t('admin.settings.enableOnlinePayments')}</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Currency Exchange Rates */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.settings.currencyRates')}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('admin.settings.currencyRatesDescription')}</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AMD (Armenian Dram)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.currencyRates?.AMD || 1}
                  onChange={(e) => setSettings({
                    ...settings,
                    currencyRates: {
                      ...settings.currencyRates,
                      AMD: parseFloat(e.target.value) || 1,
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.settings.baseCurrency')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  USD (US Dollar)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.currencyRates?.USD ?? ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setSettings({
                        ...settings,
                        currencyRates: {
                          ...settings.currencyRates,
                          USD: undefined as any,
                        },
                      });
                    } else {
                      // Allow typing "0", "0.", "0.1" etc.
                      // Only validate when we have a complete number
                      if (inputValue === '0' || inputValue.startsWith('0.')) {
                        // Allow intermediate states like "0", "0.", "0.1"
                        const numValue = parseFloat(inputValue);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setSettings({
                            ...settings,
                            currencyRates: {
                              ...settings.currencyRates,
                              USD: numValue,
                            },
                          });
                        }
                      } else {
                        const numValue = parseFloat(inputValue);
                        if (!isNaN(numValue) && numValue > 0) {
                          setSettings({
                            ...settings,
                            currencyRates: {
                              ...settings.currencyRates,
                              USD: numValue,
                            },
                          });
                        }
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' && settings.currencyRates?.USD === undefined) {
                      setSettings({
                        ...settings,
                        currencyRates: {
                          ...settings.currencyRates,
                          USD: 0.0025,
                        },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0025"
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.settings.rateToAMD')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EUR (Euro)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.currencyRates?.EUR ?? ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setSettings({
                        ...settings,
                        currencyRates: {
                          ...settings.currencyRates,
                          EUR: undefined as any,
                        },
                      });
                    } else {
                      // Allow typing "0", "0.", "0.1" etc.
                      if (inputValue === '0' || inputValue.startsWith('0.')) {
                        const numValue = parseFloat(inputValue);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setSettings({
                            ...settings,
                            currencyRates: {
                              ...settings.currencyRates,
                              EUR: numValue,
                            },
                          });
                        }
                      } else {
                        const numValue = parseFloat(inputValue);
                        if (!isNaN(numValue) && numValue > 0) {
                          setSettings({
                            ...settings,
                            currencyRates: {
                              ...settings.currencyRates,
                              EUR: numValue,
                            },
                          });
                        }
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' && settings.currencyRates?.EUR === undefined) {
                      setSettings({
                        ...settings,
                        currencyRates: {
                          ...settings.currencyRates,
                          EUR: 0.0023,
                        },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0023"
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.settings.rateToAMD')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUB (Russian Ruble)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.currencyRates?.RUB ?? ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setSettings({
                        ...settings,
                        currencyRates: {
                          ...settings.currencyRates,
                          RUB: undefined as any,
                        },
                      });
                    } else {
                      // Allow typing "0", "0.", "0.1" etc.
                      if (inputValue === '0' || inputValue.startsWith('0.')) {
                        const numValue = parseFloat(inputValue);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setSettings({
                            ...settings,
                            currencyRates: {
                              ...settings.currencyRates,
                              RUB: numValue,
                            },
                          });
                        }
                      } else {
                        const numValue = parseFloat(inputValue);
                        if (!isNaN(numValue) && numValue > 0) {
                          setSettings({
                            ...settings,
                            currencyRates: {
                              ...settings.currencyRates,
                              RUB: numValue,
                            },
                          });
                        }
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' && settings.currencyRates?.RUB === undefined) {
                      setSettings({
                        ...settings,
                        currencyRates: {
                          ...settings.currencyRates,
                          RUB: 0.225,
                        },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.225"
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.settings.rateToAMD')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GEL (Georgian Lari)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.currencyRates?.GEL ?? ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setSettings({
                        ...settings,
                        currencyRates: {
                          ...settings.currencyRates,
                          GEL: undefined as any,
                        },
                      });
                    } else {
                      // Allow typing "0", "0.", "0.1" etc.
                      if (inputValue === '0' || inputValue.startsWith('0.')) {
                        const numValue = parseFloat(inputValue);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setSettings({
                            ...settings,
                            currencyRates: {
                              ...settings.currencyRates,
                              GEL: numValue,
                            },
                          });
                        }
                      } else {
                        const numValue = parseFloat(inputValue);
                        if (!isNaN(numValue) && numValue > 0) {
                          setSettings({
                            ...settings,
                            currencyRates: {
                              ...settings.currencyRates,
                              GEL: numValue,
                            },
                          });
                        }
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' && settings.currencyRates?.GEL === undefined) {
                      setSettings({
                        ...settings,
                        currencyRates: {
                          ...settings.currencyRates,
                          GEL: 0.00675,
                        },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00675"
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.settings.rateToAMD')}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <ProductPageButton
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm"
          >
            {saving ? t('admin.settings.saving') : t('admin.settings.saveSettings')}
          </ProductPageButton>
          <ProductPageButton
            variant="outline"
            onClick={() => router.push('/admin')}
            disabled={saving}
            className="px-4 py-2 text-sm"
          >
            {t('admin.settings.cancel')}
          </ProductPageButton>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}

