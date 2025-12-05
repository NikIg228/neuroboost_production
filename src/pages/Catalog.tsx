import React, { useEffect, useState } from 'react';
import TariffTabs from '@/components/catalog/TariffTabs';
import TariffCard, { TariffItem } from '@/components/catalog/TariffCard';
// import TariffComparison from '@/components/catalog/TariffComparison';
import CurrencyToggle from '@/components/common/CurrencyToggle';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Favorite } from '../lib/supabase';
import { services } from '@/data/services';
import ServiceCard from '@/components/ServiceCard';
import ServiceModal from '@/components/ServiceModal';
import PurchaseModal from '@/components/PurchaseModal';
import ConsultationModal from '@/components/ConsultationModal';
import AnimatedSection from '@/components/AnimatedSection';
import { Service } from '@/types/index';
import localTariffs from '@/data/tariffs.json';
import { Search, Filter } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from 'react-i18next';

const Catalog: React.FC = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const { t } = useTranslation('catalog');
  const { t: tServices } = useTranslation('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseService, setPurchaseService] = useState<Service | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const [audience, setAudience] = useState<'business' | 'individual'>('business');
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [showTariffs] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  // Загрузка тарифов из Supabase или JSON
  useEffect(() => {
    const load = async () => {
      try {
        // Попытаться получить из Supabase, затем фолбэк на JSON
        const resp = await fetch('/data/tariffs.json');
        const json = (await resp.json()) as TariffItem[];
        const active = json.filter(t => t.is_active);
        setTariffs(active.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      } catch (e) {
        console.error('Не удалось загрузить тарифы из public, используем локальные:', e);
        const active = (localTariffs as unknown as TariffItem[]).filter(t => t.is_active);
        setTariffs(active.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      }
    };
    load();
  }, []);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handlePurchase = (service: Service) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setPurchaseService(service);
    setIsPurchaseModalOpen(true);
  };

  const handleConsultation = () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsConsultationModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleClosePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setPurchaseService(null);
  };

  const handleCloseConsultationModal = () => {
    setIsConsultationModalOpen(false);
  };

  const isFavorite = (serviceId: string) => {
    return favorites.some(fav => fav.product_id === serviceId);
  };

  const filteredServices = services
    .filter(service => {
      if (!searchQuery) return true; // Если поиск пустой, показываем все
      const title = tServices(service.title).toLowerCase();
      const description = tServices(service.description).toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || description.includes(query);
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        const titleA = tServices(a.title);
        const titleB = tServices(b.title);
        return titleA.localeCompare(titleB);
      } else {
        const priceAKzt = parseInt(a.price.replace(/\D/g, '')) || 0;
        const priceBKzt = parseInt(b.price.replace(/\D/g, '')) || 0;
        const convertedA = convertPrice(priceAKzt);
        const convertedB = convertPrice(priceBKzt);
        return convertedA - convertedB;
      }
    });

  const getBadgeForService = (serviceId: string): string | undefined => {
    const badges: Record<string, string> = {
      'chatgpt-consultant': t('services.badges.most_popular'),
      'marketing-generator': t('services.badges.fastest_payback'),
      'ai-audit': t('services.badges.small_business_choice'),
      'ai-transformation': t('services.badges.comprehensive')
    };
    return badges[serviceId];
  };

  const getBadgeColorForService = (serviceId: string): string => {
    const colors: Record<string, string> = {
      'chatgpt-consultant': 'bg-red-500',
      'marketing-generator': 'bg-green-500',
      'ai-audit': 'bg-blue-500',
      'ai-transformation': 'bg-purple-500'
    };
    return colors[serviceId] || 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-8">
      {/* Декоративные элементы как в блоке "О нас" */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-pink-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('title')} <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('subtitle')}</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('description')}
            </p>
          </div>
        </AnimatedSection>

        {/* Search and Filter */}
        <AnimatedSection delay={200}>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm p-6 mb-8 border border-white/20">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <TariffTabs value={audience} onChange={setAudience} />
              <CurrencyToggle />
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 h-5 w-5" />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300"
                />
              </div>
              <div className="flex items-center gap-4">
                <Filter className="text-gray-300 h-5 w-5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price')}
                  className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white"
                >
                  <option value="name">{t('filters.by_name')}</option>
                  <option value="price">{t('filters.by_price')}</option>
                </select>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm hover:bg-white/30 transition-colors">
                    {t('filters.all')}
                  </button>
                  <button className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm hover:bg-white/30 transition-colors">
                    {t('filters.local_only')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Tariffs Grid */}
        {showTariffs && (
          <div className="mt-4 mb-16">
            <AnimatedSection>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">{t('tariffs.title')}</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tariffs
                .filter(t => t.audience === audience)
                .map((t, idx) => (
                  <AnimatedSection key={`${t.title}-${idx}`} delay={idx * 80}>
                    <TariffCard item={t} onApply={() => setIsConsultationModalOpen(true)} />
                  </AnimatedSection>
                ))}
            </div>

            {/* Сравнение тарифов отключено */}
          </div>
        )}

        {/* Разделитель между тарифами и услугами */}
        <AnimatedSection>
          <div className="my-12 flex items-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="px-6 text-white/60 text-sm font-medium">{t('services.title')}</div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
        </AnimatedSection>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service, index) => (
            <AnimatedSection key={service.id} delay={index * 100}>
              <ServiceCard
                service={service}
                onClick={() => handleServiceClick(service)}
                onPurchase={() => handlePurchase(service)}
                onConsultation={handleConsultation}
                badge={getBadgeForService(service.id)}
                badgeColor={getBadgeColorForService(service.id)}
                isFavorite={isFavorite(service.id)}
                onFavoriteToggle={fetchFavorites}
              />
            </AnimatedSection>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <AnimatedSection>
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">
                {t('search.no_results')}
              </p>
            </div>
          </AnimatedSection>
        )}

        {/* CTA Section */}
        <AnimatedSection delay={300}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mt-16 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
            <button 
              onClick={handleConsultation}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              {t('cta.button')}
            </button>
          </div>
        </AnimatedSection>
      </div>

      <ServiceModal
        service={selectedService}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <PurchaseModal
        service={purchaseService}
        isOpen={isPurchaseModalOpen}
        onClose={handleClosePurchaseModal}
      />

      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={handleCloseConsultationModal}
      />
    </div>
  );
};

export default Catalog;