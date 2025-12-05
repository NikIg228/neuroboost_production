import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '../lib/supabase';
import { Service } from '@/types/index';
import {
  X,
  Building,
  Hash,
  User,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  CreditCard
} from 'lucide-react';

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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Генерация orderId
      const orderId =
        self.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

      // Получаем amount из строки "15 000 ₸"
      const amount = parseInt(service.price.replace(/\D/g, ''));

      const API_BASE =
        import.meta.env.VITE_API_BASE_URL ||
        'https://neuroboost-pay-backend-production.up.railway.app';

      // 🔥 Создание платежа
      const paymentPayload = {
        amount,
        order_id: orderId,
        description: service.title
      };

      const paymentResponse = await fetch(`${API_BASE}/api/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(paymentPayload)
      });

      if (!paymentResponse.ok) {
        const text = await paymentResponse.text();
        console.log("Backend error:", text);
        throw new Error('Failed to create payment');
      }

      const paymentData = await paymentResponse.json();

      if (!paymentData.pay_url) {
        console.log("Ответ backend без pay_url:", paymentData);
        throw new Error("No pay_url returned from backend");
      }

      // 🔥 Сохраняем заказ в Supabase
      const { error: dbError } = await supabase.from('orders').insert({
        user_id: user.id,
        product_name: service.title,
        amount,
        status: 'pending',
        payment_url: paymentData.pay_url, // FIX
        company_name: formData.company_name,
        bin: formData.bin,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        website: formData.website || null,
        comment: formData.comment || null
      });

      if (dbError) throw dbError;

      // 🔥 Перенаправляем на оплату
      window.location.href = paymentData.pay_url;

    } catch (err) {
      console.error('Payment error:', err);
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('purchase.title')}
              </h2>
              <p className="text-gray-600">{service.title}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatPrice(
                  convertPrice(parseInt(service.price.replace(/\D/g, '')))
                )}
              </p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company + BIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('purchase.fields.companyName') + ' *'}
                name="company_name"
                icon={Building}
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder={t('purchase.placeholders.companyName')}
                required
              />

              <Input
                label={t('purchase.fields.bin') + ' *'}
                name="bin"
                icon={Hash}
                value={formData.bin}
                onChange={handleInputChange}
                placeholder={t('purchase.placeholders.bin')}
                required
              />
            </div>

            {/* Contact person + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('purchase.fields.contactPerson') + ' *'}
                name="contact_person"
                icon={User}
                value={formData.contact_person}
                onChange={handleInputChange}
                placeholder={t('purchase.placeholders.contactPerson')}
                required
              />

              <Input
                type="email"
                label={t('purchase.fields.email') + ' *'}
                name="email"
                icon={Mail}
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('purchase.placeholders.email')}
                required
              />
            </div>

            {/* Phone + Website */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('purchase.fields.phone') + ' *'}
                name="phone"
                icon={Phone}
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t('purchase.placeholders.phone')}
                required
              />

              <Input
                label={t('purchase.fields.website')}
                name="website"
                icon={Globe}
                value={formData.website}
                onChange={handleInputChange}
                placeholder={t('purchase.placeholders.website')}
              />
            </div>

            {/* Comment */}
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
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             resize-none"
                  placeholder={t('purchase.placeholders.comment')}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4
              bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold
              rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all
              duration-200 transform hover:scale-105 disabled:opacity-50
              disabled:cursor-not-allowed"
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

/* Small reusable input component */
const Input = ({
  label,
  name,
  type = 'text',
  icon: Icon,
  value,
  onChange,
  placeholder,
  required = false
}: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>
);

export default PurchaseModal;
