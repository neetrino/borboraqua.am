'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { AdminMenuDrawer, getAdminMenuTABS } from '../../../components/icons/global/global';
import { useTranslation } from '../../../lib/i18n-client';
import { ProductPageButton } from '../../../components/icons/global/globalMobile';

interface DeliveryLocation {
  id?: string;
  country: string;
  city: string;
  price: number;
}

interface DeliverySchedule {
  enabledWeekdays: number[];
}

interface DeliveryTimeSlot {
  id: string;
  label: {
    en: string;
    hy: string;
    ru: string;
  };
  enabled: boolean;
}

interface DeliverySettings {
  locations: DeliveryLocation[];
  schedule?: DeliverySchedule;
  timeSlots?: DeliveryTimeSlot[];
}

export default function DeliveryPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [enabledWeekdays, setEnabledWeekdays] = useState<number[]>([2, 4]); // Default Tue & Thu
  const [timeSlots, setTimeSlots] = useState<DeliveryTimeSlot[]>([
    { id: 'first_half', label: { en: 'Morning (9:00 - 13:00)', hy: 'Առավոտյան (9:00 - 13:00)', ru: 'Утро (9:00 - 13:00)' }, enabled: true },
    { id: 'second_half', label: { en: 'Afternoon (13:00 - 18:00)', hy: 'Երեկոյան (13:00 - 18:00)', ru: 'День (13:00 - 18:00)' }, enabled: true },
  ]);

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
      fetchDeliverySettings();
    }
  }, [isLoggedIn, isAdmin]);

  const fetchDeliverySettings = async () => {
    try {
      setLoading(true);
      console.log('🚚 [ADMIN] Fetching delivery settings...');
      const data = await apiClient.get<DeliverySettings>('/api/v1/admin/delivery');
      setLocations(data.locations || []);
      const weekdays =
        data.schedule?.enabledWeekdays && data.schedule.enabledWeekdays.length > 0
          ? data.schedule.enabledWeekdays
          : [2, 4];
      setEnabledWeekdays(weekdays);
      if (data.timeSlots && data.timeSlots.length > 0) {
        setTimeSlots(data.timeSlots);
      }
      console.log('✅ [ADMIN] Delivery settings loaded:', data);
    } catch (err: any) {
      console.error('❌ [ADMIN] Error fetching delivery settings:', err);
      // Use defaults if error
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('🚚 [ADMIN] Saving delivery settings...', { locations });
      await apiClient.put('/api/v1/admin/delivery', {
        locations,
        schedule: {
          enabledWeekdays,
        },
        timeSlots,
      });
      alert(t('admin.delivery.savedSuccess'));
      console.log('✅ [ADMIN] Delivery settings saved');
      setEditingId(null);
      await fetchDeliverySettings();
    } catch (err: any) {
      console.error('❌ [ADMIN] Error saving delivery settings:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save delivery settings';
      alert(t('admin.delivery.errorSaving').replace('{message}', errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const WEEKDAY_OPTIONS: Array<{ value: number; label: string }> = [
    { value: 1, label: t('admin.delivery.weekdays.mon') },
    { value: 2, label: t('admin.delivery.weekdays.tue') },
    { value: 3, label: t('admin.delivery.weekdays.wed') },
    { value: 4, label: t('admin.delivery.weekdays.thu') },
    { value: 5, label: t('admin.delivery.weekdays.fri') },
    { value: 6, label: t('admin.delivery.weekdays.sat') },
    { value: 0, label: t('admin.delivery.weekdays.sun') },
  ];

  const toggleWeekday = (day: number) => {
    setEnabledWeekdays((prev) => {
      if (prev.includes(day)) {
        const next = prev.filter((d) => d !== day);
        // Avoid empty schedule – keep at least one day selected
        return next.length > 0 ? next : prev;
      }
      return [...prev, day];
    });
  };

  const handleAddLocation = () => {
    setLocations([...locations, { country: '', city: '', price: 1000 }]);
    setEditingId(`new-${Date.now()}`);
  };

  const handleUpdateLocation = (index: number, field: keyof DeliveryLocation, value: string | number) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const handleDeleteLocation = (index: number) => {
    if (confirm(t('admin.delivery.deleteLocation'))) {
      const updated = locations.filter((_, i) => i !== index);
      setLocations(updated);
    }
  };

  const handleAddTimeSlot = () => {
    const newSlot: DeliveryTimeSlot = {
      id: `slot-${Date.now()}`,
      label: { en: '', hy: '', ru: '' },
      enabled: true,
    };
    setTimeSlots([...timeSlots, newSlot]);
    setEditingId(`timeSlot-${newSlot.id}`);
  };

  const handleUpdateTimeSlot = (index: number, field: keyof DeliveryTimeSlot, value: any) => {
    const updated = [...timeSlots];
    if (field === 'label') {
      updated[index] = { ...updated[index], label: { ...updated[index].label, ...value } };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setTimeSlots(updated);
  };

  const handleDeleteTimeSlot = (index: number) => {
    if (timeSlots.length <= 1) {
      alert(t('admin.delivery.atLeastOneTimeSlot') || 'At least one time slot must exist');
      return;
    }
    if (confirm(t('admin.delivery.deleteTimeSlot') || 'Delete this time slot?')) {
      const updated = timeSlots.filter((_, i) => i !== index);
      setTimeSlots(updated);
    }
  };

  const handleToggleTimeSlot = (index: number) => {
    const updated = [...timeSlots];
    updated[index].enabled = !updated[index].enabled;
    // Ensure at least one slot is enabled
    if (!updated.some(slot => slot.enabled)) {
      alert(t('admin.delivery.atLeastOneTimeSlotEnabled') || 'At least one time slot must be enabled');
      return;
    }
    setTimeSlots(updated);
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

  const adminTabs = getAdminMenuTABS(t);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden mb-6">
            <AdminMenuDrawer tabs={adminTabs} currentPath="/admin/delivery" />
          </div>
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="bg-white border border-gray-200 rounded-lg p-2 space-y-1">
              {adminTabs.map((tab) => {
                const isActive = pathname === tab.path || 
                  (tab.path === '/admin' && pathname === '/admin') ||
                  (tab.path !== '/admin' && pathname?.startsWith(tab.path));
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
            <div className="mb-8">
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('admin.delivery.backToAdmin')}
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.delivery.title')}</h1>
            </div>

            {/* Delivery Locations */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{t('admin.delivery.deliveryPricesByLocation')}</h2>
                <ProductPageButton
                  onClick={handleAddLocation}
                  disabled={saving}
                  className="px-4 py-2 text-sm"
                >
                  {t('admin.delivery.addLocation')}
                </ProductPageButton>
              </div>
              
              {locations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('admin.delivery.noLocations')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {locations.map((location, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('admin.delivery.country')}
                          </label>
                          <input
                            type="text"
                            value={location.country}
                            onChange={(e) => handleUpdateLocation(index, 'country', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('admin.delivery.countryPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('admin.delivery.city')}
                          </label>
                          <input
                            type="text"
                            value={location.city}
                            onChange={(e) => handleUpdateLocation(index, 'city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('admin.delivery.cityPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('admin.delivery.price')}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={location.price}
                              onChange={(e) => handleUpdateLocation(index, 'price', parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('admin.delivery.pricePlaceholder')}
                            min="0"
                            step="100"
                          />
                            <ProductPageButton
                              variant="outline"
                              onClick={() => handleDeleteLocation(index)}
                              disabled={saving}
                              className="px-0.5 py-5 text-xs border-none  text-red-600 hover:bg-red-50  border-none"
                              title={t('admin.delivery.deleteLocation')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </ProductPageButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Delivery Schedule (Days) */}
            <Card className="p-6 mb-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('admin.delivery.deliveryDaysTitle')}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {t('admin.delivery.deliveryDaysDescription')}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {WEEKDAY_OPTIONS.map((day) => {
                  const isActive = enabledWeekdays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value)}
                      className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        isActive
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      disabled={saving}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Delivery Time Slots */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('admin.delivery.timeSlotsTitle') || 'Delivery Time Slots'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('admin.delivery.timeSlotsDescription') || 'Manage available delivery time slots'}
                  </p>
                </div>
                <ProductPageButton
                  onClick={handleAddTimeSlot}
                  disabled={saving}
                  className="px-4 py-2 text-sm"
                >
                  {t('admin.delivery.addTimeSlot') || 'Add Time Slot'}
                </ProductPageButton>
              </div>
              
              {timeSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('admin.delivery.noTimeSlots') || 'No time slots added'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeSlots.map((slot, index) => (
                    <div key={slot.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slot.enabled}
                              onChange={() => handleToggleTimeSlot(index)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              disabled={saving}
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {t('admin.delivery.enabled') || 'Enabled'}
                            </span>
                          </label>
                        </div>
                        <ProductPageButton
                          variant="outline"
                          onClick={() => handleDeleteTimeSlot(index)}
                          disabled={saving || timeSlots.length <= 1}
                          className="px-2 py-1 text-xs text-red-600 border-red-300 hover:bg-red-50"
                          title={t('admin.delivery.deleteTimeSlot') || 'Delete time slot'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </ProductPageButton>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('admin.delivery.timeSlotLabelEn') || 'Label (English)'}
                          </label>
                          <input
                            type="text"
                            value={slot.label.en}
                            onChange={(e) => handleUpdateTimeSlot(index, 'label', { en: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('admin.delivery.timeSlotLabelPlaceholder') || 'e.g., Morning (9:00 - 13:00)'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('admin.delivery.timeSlotLabelHy') || 'Label (Armenian)'}
                          </label>
                          <input
                            type="text"
                            value={slot.label.hy}
                            onChange={(e) => handleUpdateTimeSlot(index, 'label', { hy: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('admin.delivery.timeSlotLabelPlaceholder') || 'e.g., Առավոտյան (9:00 - 13:00)'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('admin.delivery.timeSlotLabelRu') || 'Label (Russian)'}
                          </label>
                          <input
                            type="text"
                            value={slot.label.ru}
                            onChange={(e) => handleUpdateTimeSlot(index, 'label', { ru: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('admin.delivery.timeSlotLabelPlaceholder') || 'e.g., Утро (9:00 - 13:00)'}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <ProductPageButton
                onClick={handleSave}
                disabled={saving || locations.length === 0}
                className="px-6 py-2 text-sm"
              >
                {saving ? t('admin.delivery.saving') : t('admin.delivery.saveSettings')}
              </ProductPageButton>
              <ProductPageButton
                variant="outline"
                onClick={() => router.push('/admin')}
                disabled={saving}
                className="px-4 py-2 text-sm"
              >
                {t('admin.delivery.cancel')}
              </ProductPageButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

