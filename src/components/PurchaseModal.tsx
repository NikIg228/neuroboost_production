import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '../lib/supabase';
import { Service } from '@/types/index';
import { X, Building, Hash, User, Mail, Phone, Globe, MessageSquare, CreditCard } from 'lucide-react';

interface PurchaseModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  company_name: string;
  bin: string;
  contact_person: string;
  email: string;
  phone: string;
  website: string;
  comment: string;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ service, isOpen, onClose }) => {
  const { t } = useTranslation('components');
  const { user } = useAuth();
  const { formatPrice, convertPrice } = useCurrency();
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    bin: '',
    contact_person: '',
    email: user?.email || '',
    phone: '',
    website: '',
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !service) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const orderId = self.crypto?.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).slice(2);
      // Always charge in base KZT extracted from catalog price string
      const amount = parseInt(service.price.replace(/\D/g, ''));

      // Create payment request (test backend)
      const paymentPayload = {
        amount,
        order_id: orderId,
        description: service.title,
      };

      const paymentResponse = await fetch(
        'https://neuroboost-pay-backend-production.up.railway.app/api/payment/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentPayload),
        }
      );

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment');
      }

      const paymentData = await paymentResponse.json();

      // Save order to Supabase
      const { error: dbError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          product_name: service.title,
          amount: amount,
          status: 'pending',
          payment_url: paymentData.pa_url,
          company_name: formData.company_name,
          bin: formData.bin,
          contact_person: formData.contact_person,
          email: formData.email,
          phone: formData.phone,
          website: formData.website || null,
          comment: formData.comment || null
        });

      if (dbError) {
        throw dbError;
      }

      // Redirect to payment
      window.location.href = paymentData.pay_url;

    } catch (error) {
      console.error('Payment error:', error);
      setError(t('purchase.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('purchase.title')}</h2>
              <p className="text-gray-600">{service.title}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatPrice(convertPrice(parseInt(service.price.replace(/\D/g, ''))))}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchase.fields.companyName')} *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="company_name"
                    required
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('purchase.placeholders.companyName')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchase.fields.bin')} *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="bin"
                    required
                    value={formData.bin}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('purchase.placeholders.bin')}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchase.fields.contactPerson')} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="contact_person"
                    required
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('purchase.placeholders.contactPerson')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchase.fields.email')} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('purchase.placeholders.email')}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchase.fields.phone')} *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('purchase.placeholders.phone')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchase.fields.website')}
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('purchase.placeholders.website')}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('purchase.fields.comment')}
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <textarea
                  name="comment"
                  rows={3}
                  value={formData.comment}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={t('purchase.placeholders.comment')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              {loading ? t('purchase.processing') : t('purchase.payButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
