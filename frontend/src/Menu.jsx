import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

const API_URL = 'http://192.168.1.2:3001/api'
const FILES_URL = 'http://192.168.1.2:3001'

// ==================== TRANSLATIONS ====================
const translations = {
  tr: {
    search: 'Ara...',
    searchPlaceholder: 'Ürün veya kategori ara...',
    campaigns: 'Kampanyalar',
    listAll: 'Tümünü Gör',
    categories: 'Kategoriler',
    allProducts: 'Tüm Ürünler',
    featured: 'Öne Çıkanlar',
    reviews: 'Görüş ve Yorumlarınız',
    reviewTitle: 'Bizi Değerlendirin',
    reviewSubtitle: 'Görüşleriniz bizim için değerli',
    contactOptional: 'İletişim (Opsiyonel)',
    noteOptional: 'Notunuz (Opsiyonel)',
    submit: 'Gönder',
    writeGoogleReview: 'Google\'a Yorum Yaz',
    thankYou: 'Teşekkürler!',
    reviewSent: 'Değerlendirmeniz alındı',
    close: 'Kapat',
    viewInAR: 'AR\'da Görüntüle',
    only: 'Sadece',
    currency: '₺',
    loading: 'Yükleniyor...',
    noProducts: 'Ürün bulunamadı',
    poweredBy: 'Powered by',
    scrollTop: 'Yukarı',
    share: 'Paylaş',
    favorites: 'Favoriler',
    callUs: 'Bizi Arayın',
    findUs: 'Konum',
    workingHours: 'Çalışma Saatleri',
    followUs: 'Bizi Takip Edin',
    products: 'ürün',
    selectLanguage: 'Dil Seçin'
  },
  en: {
    search: 'Search...',
    searchPlaceholder: 'Search products or categories...',
    campaigns: 'Campaigns',
    listAll: 'View All',
    categories: 'Categories',
    allProducts: 'All Products',
    featured: 'Featured',
    reviews: 'Your Feedback',
    reviewTitle: 'Rate Us',
    reviewSubtitle: 'Your feedback is valuable to us',
    contactOptional: 'Contact (Optional)',
    noteOptional: 'Your Note (Optional)',
    submit: 'Submit',
    writeGoogleReview: 'Write a Google Review',
    thankYou: 'Thank You!',
    reviewSent: 'Your review has been received',
    close: 'Close',
    viewInAR: 'View in AR',
    only: 'Only',
    currency: '₺',
    loading: 'Loading...',
    noProducts: 'No products found',
    poweredBy: 'Powered by',
    scrollTop: 'Top',
    share: 'Share',
    favorites: 'Favorites',
    callUs: 'Call Us',
    findUs: 'Location',
    workingHours: 'Working Hours',
    followUs: 'Follow Us',
    products: 'products',
    selectLanguage: 'Select Language'
  },
  de: {
    search: 'Suchen...',
    searchPlaceholder: 'Produkte oder Kategorien suchen...',
    campaigns: 'Angebote',
    listAll: 'Alle Anzeigen',
    categories: 'Kategorien',
    allProducts: 'Alle Produkte',
    featured: 'Empfohlen',
    reviews: 'Ihr Feedback',
    reviewTitle: 'Bewerten Sie uns',
    reviewSubtitle: 'Ihre Meinung ist uns wichtig',
    contactOptional: 'Kontakt (Optional)',
    noteOptional: 'Ihre Notiz (Optional)',
    submit: 'Senden',
    writeGoogleReview: 'Google Bewertung',
    thankYou: 'Danke!',
    reviewSent: 'Ihre Bewertung wurde erhalten',
    close: 'Schließen',
    viewInAR: 'In AR ansehen',
    only: 'Nur',
    currency: '₺',
    loading: 'Laden...',
    noProducts: 'Keine Produkte gefunden',
    poweredBy: 'Powered by',
    scrollTop: 'Nach oben',
    share: 'Teilen',
    favorites: 'Favoriten',
    callUs: 'Anrufen',
    findUs: 'Standort',
    workingHours: 'Öffnungszeiten',
    followUs: 'Folgen Sie uns',
    products: 'Produkte',
    selectLanguage: 'Sprache wählen'
  },
  ar: {
    search: 'بحث...',
    searchPlaceholder: 'ابحث عن منتجات أو فئات...',
    campaigns: 'العروض',
    listAll: 'عرض الكل',
    categories: 'الفئات',
    allProducts: 'جميع المنتجات',
    featured: 'مميز',
    reviews: 'آراؤكم',
    reviewTitle: 'قيمنا',
    reviewSubtitle: 'رأيك مهم لنا',
    contactOptional: 'التواصل (اختياري)',
    noteOptional: 'ملاحظتك (اختياري)',
    submit: 'إرسال',
    writeGoogleReview: 'اكتب مراجعة جوجل',
    thankYou: 'شكراً!',
    reviewSent: 'تم استلام تقييمك',
    close: 'إغلاق',
    viewInAR: 'عرض AR',
    only: 'فقط',
    currency: '₺',
    loading: 'جار التحميل...',
    noProducts: 'لا توجد منتجات',
    poweredBy: 'مدعوم من',
    scrollTop: 'أعلى',
    share: 'مشاركة',
    favorites: 'المفضلة',
    callUs: 'اتصل بنا',
    findUs: 'الموقع',
    workingHours: 'ساعات العمل',
    followUs: 'تابعنا',
    products: 'منتجات',
    selectLanguage: 'اختر اللغة'
  },
  ru: {
    search: 'Поиск...',
    searchPlaceholder: 'Искать продукты или категории...',
    campaigns: 'Акции',
    listAll: 'Показать все',
    categories: 'Категории',
    allProducts: 'Все продукты',
    featured: 'Рекомендуемое',
    reviews: 'Ваш отзыв',
    reviewTitle: 'Оцените нас',
    reviewSubtitle: 'Ваше мнение важно для нас',
    contactOptional: 'Контакт (необязательно)',
    noteOptional: 'Ваша заметка (необязательно)',
    submit: 'Отправить',
    writeGoogleReview: 'Написать отзыв в Google',
    thankYou: 'Спасибо!',
    reviewSent: 'Ваш отзыв получен',
    close: 'Закрыть',
    viewInAR: 'Посмотреть в AR',
    only: 'Только',
    currency: '₺',
    loading: 'Загрузка...',
    noProducts: 'Продукты не найдены',
    poweredBy: 'Работает на',
    scrollTop: 'Наверх',
    share: 'Поделиться',
    favorites: 'Избранное',
    callUs: 'Позвоните нам',
    findUs: 'Местоположение',
    workingHours: 'Часы работы',
    followUs: 'Подписывайтесь',
    products: 'продуктов',
    selectLanguage: 'Выберите язык'
  }
}

// ==================== MAIN COMPONENT ====================
export default function Menu() {
  // States
  const [menu, setMenu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [language, setLanguage] = useState('tr')
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [allProducts, setAllProducts] = useState([])
  
  const announcementRef = useRef(null)
  const t = translations[language] || translations.tr

  // Load model-viewer script
  useEffect(() => {
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js'
      document.head.appendChild(script)
    }
  }, [])

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('ar-menu-favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
    
    const savedLanguage = localStorage.getItem('ar-menu-language')
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      setShowScrollTop(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load menu data
  useEffect(() => {
    axios.get(API_URL + '/menu')
      .then(res => {
        setMenu(res.data)
        
        // Tüm ürünleri topla
        const products = []
        res.data.categories?.forEach(cat => {
          cat.products?.forEach(p => {
            if (p.isActive !== false) {
              products.push({ 
                ...p, 
                categoryName: cat.name, 
                categoryIcon: cat.icon,
                categoryId: cat.id
              })
            }
          })
        })
        setAllProducts(products)
        
        setTimeout(() => {
          setLoading(false)
          setTimeout(() => setShowSplash(false), 800)
        }, 2000)
      })
      .catch(err => {
        console.error('Menu yuklenemedi:', err)
        setLoading(false)
        setShowSplash(false)
      })
  }, [])

  // Announcement rotation
  useEffect(() => {
    if (!menu?.announcements?.length) return
    
    const interval = setInterval(() => {
      setCurrentAnnouncementIndex(prev => 
        (prev + 1) % menu.announcements.length
      )
    }, 3000)
    
    return () => clearInterval(interval)
  }, [menu?.announcements])

  // Toggle favorite
  const toggleFavorite = useCallback((productId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      localStorage.setItem('ar-menu-favorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }, [])

  // Change language
  const changeLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem('ar-menu-language', lang)
    setShowLanguageModal(false)
  }

  // Submit review
  const submitReview = async (reviewData) => {
    try {
      await axios.post(API_URL + '/reviews', reviewData)
      setReviewSubmitted(true)
      setTimeout(() => {
        setShowReviewModal(false)
        setReviewSubmitted(false)
      }, 2000)
    } catch (err) {
      console.error('Review gonderilemedi:', err)
    }
  }

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Search products
  const searchResults = searchQuery.trim() 
    ? allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  // Theme
  const theme = {
    primary: menu?.settings?.primaryColor || '#dc2626',
    primaryLight: '#fee2e2',
    primaryDark: '#b91c1c',
    secondary: '#1f2937',
    bg: '#ffffff',
    surface: '#f9fafb',
    surfaceHover: '#f3f4f6',
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    shadow: '0 4px 20px rgba(0,0,0,0.08)',
    shadowMd: '0 8px 30px rgba(0,0,0,0.12)',
    shadowLg: '0 12px 40px rgba(0,0,0,0.15)',
    success: '#10b981',
    warning: '#f59e0b',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
  }

  // ==================== SPLASH SCREEN ====================
  if (showSplash) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: theme.gradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: loading ? 1 : 0,
        transition: 'opacity 0.8s ease'
      }}>
        <div style={{ animation: 'logoAnim 1s ease', marginBottom: '32px' }}>
          {menu?.settings?.logo ? (
            <img 
              src={FILES_URL + '/images/' + menu.settings.logo} 
              alt="" 
              style={{ 
                width: '140px', 
                height: '140px', 
                borderRadius: '28px', 
                objectFit: 'cover',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '4px solid rgba(255,255,255,0.2)'
              }} 
            />
          ) : (
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '28px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>🍽️</div>
          )}
        </div>
        
        <h1 style={{
          color: 'white',
          fontSize: '36px',
          fontWeight: '800',
          margin: '0 0 12px',
          textAlign: 'center',
          animation: 'fadeUp 0.8s ease 0.3s both'
        }}>
          {menu?.settings?.restaurantName || 'Menu'}
        </h1>
        
        {menu?.settings?.slogan && (
          <p style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '18px',
            margin: 0,
            textAlign: 'center',
            animation: 'fadeUp 0.8s ease 0.5s both'
          }}>
            {menu.settings.slogan}
          </p>
        )}
        
        <div style={{ marginTop: '48px', animation: 'fadeUp 0.8s ease 0.7s both' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.2)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>

        <style>{`
          @keyframes logoAnim {
            0% { transform: scale(0) rotate(-10deg); opacity: 0; }
            50% { transform: scale(1.1) rotate(5deg); }
            100% { transform: scale(1) rotate(0); opacity: 1; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // ==================== ERROR STATE ====================
  if (!menu) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
        padding: '20px'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '24px' }}>😕</div>
        <h2 style={{ color: theme.text, fontSize: '24px', margin: '0 0 8px' }}>Menu Yüklenemedi</h2>
        <p style={{ color: theme.textSecondary }}>Lütfen daha sonra tekrar deneyin</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '24px',
            padding: '14px 32px',
            borderRadius: '12px',
            border: 'none',
            background: theme.gradient,
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Yenile
        </button>
      </div>
    )
  }

  const { settings, categories, announcements, campaignProducts, categoryLayouts } = menu

  // ==================== MAIN RENDER ====================
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.surface,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      paddingBottom: '80px'
    }}>
      
      {/* ========== HEADER / HERO ========== */}
      <div style={{ position: 'relative' }}>
        {/* Banner Image */}
        <div style={{ 
          position: 'relative', 
          height: '280px',
          overflow: 'hidden'
        }}>
          {settings.bannerImage || settings.homepageImage ? (
            <img 
              src={FILES_URL + '/images/' + (settings.homepageImage || settings.bannerImage)} 
              alt="" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transform: `scale(${1 + scrollY * 0.0005})`,
                transition: 'transform 0.1s ease-out'
              }} 
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: theme.gradient
            }} />
          )}
          
          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.6) 100%)'
          }} />
        </div>

        {/* Top Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }}>
          {/* Language Button */}
          <button
            onClick={() => setShowLanguageModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <span style={{ fontSize: '18px' }}>🌐</span>
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Search Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontSize: '22px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🔍
          </button>
        </div>

        {/* Restaurant Info */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
            {settings.logo && (
              <img 
                src={FILES_URL + '/images/' + settings.logo} 
                alt="" 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  borderRadius: '16px', 
                  objectFit: 'cover',
                  border: '3px solid white',
                  boxShadow: theme.shadowMd
                }} 
              />
            )}
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '26px',
                fontWeight: '800',
                color: 'white',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}>
                {settings.restaurantName || 'Restoran'}
              </h1>
              {settings.slogan && (
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.9)'
                }}>
                  {settings.slogan}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== REVIEW BUTTON ========== */}
      <div 
        onClick={() => setShowReviewModal(true)}
        style={{
          margin: '16px',
          padding: '16px 20px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: theme.shadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: theme.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>⭐</div>
          <div>
            <p style={{ margin: 0, fontWeight: '600', color: theme.text, fontSize: '15px' }}>
              {t.reviews}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: theme.textSecondary }}>
              {t.reviewSubtitle}
            </p>
          </div>
        </div>
        <span style={{ fontSize: '20px', color: theme.textMuted }}>→</span>
      </div>

      {/* ========== ANNOUNCEMENTS SLIDER ========== */}
      {announcements && announcements.length > 0 && (
        <div style={{
          margin: '0 16px 16px',
          padding: '16px 20px',
          backgroundColor: theme.primary,
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div 
            ref={announcementRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideIn 0.5s ease'
            }}
            key={currentAnnouncementIndex}
          >
            <span style={{ fontSize: '24px' }}>
              {announcements[currentAnnouncementIndex]?.icon || '📢'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ 
                margin: 0, 
                fontWeight: '700', 
                color: 'white',
                fontSize: '15px'
              }}>
                {announcements[currentAnnouncementIndex]?.title}
              </p>
              <p style={{ 
                margin: '4px 0 0', 
                color: 'rgba(255,255,255,0.9)',
                fontSize: '13px'
              }}>
                {announcements[currentAnnouncementIndex]?.message}
              </p>
            </div>
          </div>
          
          {/* Dots */}
          {announcements.length > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '12px'
            }}>
              {announcements.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: idx === currentAnnouncementIndex ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: idx === currentAnnouncementIndex 
                      ? 'white' 
                      : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== CAMPAIGNS SECTION ========== */}
      {campaignProducts && campaignProducts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px',
            marginBottom: '12px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🔥</span>
              {t.campaigns}
            </h2>
            <button
              onClick={() => setSelectedCategory('campaigns')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: theme.primaryLight,
                color: theme.primary,
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {t.listAll}
            </button>
          </div>

          {/* Horizontal Scroll */}
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '14px',
            padding: '0 16px 8px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {campaignProducts.slice(0, 10).map((product, index) => (
              <CampaignCard
                key={product.id}
                product={product}
                settings={settings}
                theme={theme}
                t={t}
                index={index}
                onClick={() => {
                  setSelectedProduct(product)
                  setShowProductModal(true)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========== CATEGORIES SECTION ========== */}
      <div style={{ padding: '0 16px' }}>
        <h2 style={{
          margin: '0 0 16px',
          fontSize: '20px',
          fontWeight: '700',
          color: theme.text,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📋</span>
          {t.categories}
        </h2>

        {/* Category Grid */}
        <CategoryGrid
          categories={categories}
          categoryLayouts={categoryLayouts}
          theme={theme}
          t={t}
          onCategoryClick={(cat) => setSelectedCategory(cat.id)}
        />
      </div>

      {/* ========== FOOTER ========== */}
      <Footer settings={settings} theme={theme} t={t} />

      {/* ========== MODALS ========== */}
      
      {/* Language Modal */}
      {showLanguageModal && (
        <LanguageModal
          currentLanguage={language}
          onSelect={changeLanguage}
          onClose={() => setShowLanguageModal(false)}
          theme={theme}
          t={t}
        />
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <SearchModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          allProducts={allProducts}
          settings={settings}
          theme={theme}
          t={t}
          onClose={() => {
            setShowSearchModal(false)
            setSearchQuery('')
          }}
          onProductClick={(product) => {
            setSelectedProduct(product)
            setShowProductModal(true)
            setShowSearchModal(false)
            setSearchQuery('')
          }}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          theme={theme}
          t={t}
          settings={settings}
          reviewSubmitted={reviewSubmitted}
          onSubmit={submitReview}
          onClose={() => {
            setShowReviewModal(false)
            setReviewSubmitted(false)
          }}
        />
      )}

      {/* Product Modal */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          settings={settings}
          theme={theme}
          t={t}
          isFavorite={favorites.includes(selectedProduct.id)}
          onToggleFavorite={() => toggleFavorite(selectedProduct.id)}
          onClose={() => {
            setShowProductModal(false)
            setSelectedProduct(null)
          }}
        />
      )}

      {/* Category Page Modal */}
      {selectedCategory && (
        <CategoryPageModal
          categoryId={selectedCategory}
          categories={categories}
          allProducts={allProducts}
          campaignProducts={campaignProducts}
          settings={settings}
          theme={theme}
          t={t}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onProductClick={(product) => {
            setSelectedProduct(product)
            setShowProductModal(true)
          }}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            border: 'none',
            background: theme.gradient,
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: theme.shadowMd,
            zIndex: 50,
            animation: 'fadeUp 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ↑
        </button>
      )}

      {/* Global Styles */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeIn { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        @keyframes fadeOut { 
          to { opacity: 0; } 
        }
        @keyframes slideUp { 
          from { transform: translateY(100%); } 
          to { transform: translateY(0); } 
        }
        @keyframes slideDown { 
          from { transform: translateY(0); }
          to { transform: translateY(100%); } 
        }
        @keyframes slideLeft { 
          from { transform: translateX(100%); } 
          to { transform: translateX(0); } 
        }
        @keyframes slideRight { 
          from { transform: translateX(0); }
          to { transform: translateX(100%); } 
        }
        @keyframes slideDownFromTop {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        *::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>
    </div>
  )
}

// ==================== CAMPAIGN CARD ====================
function CampaignCard({ product, settings, theme, t, index, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: '280px',
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: theme.shadow,
        cursor: 'pointer',
        scrollSnapAlign: 'start',
        animation: `fadeUp 0.5s ease ${index * 0.1}s both`
      }}
    >
      {/* Image 16:9 */}
      <div style={{ position: 'relative', paddingTop: '56.25%' }}>
        {product.thumbnail ? (
          <img
            src={FILES_URL + '/images/' + product.thumbnail}
            alt={product.name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: theme.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px'
          }}>🍽️</div>
        )}
        
        {/* Product Name Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)'
        }}>
          <p style={{
            margin: 0,
            color: 'white',
            fontWeight: '700',
            fontSize: '16px',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}>
            {product.name}
          </p>
        </div>
        
        {/* Price Badge */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          backgroundColor: theme.primary,
          color: 'white',
          padding: '8px 14px',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {product.isCampaign && <span style={{ fontSize: '12px', marginRight: '4px' }}>{t.only}</span>}
          {product.price} {settings.currency || '₺'}
        </div>

        {/* AR Badge */}
        {product.glbFile && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            📱 AR
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== CATEGORY GRID ====================
function CategoryGrid({ categories, categoryLayouts, theme, t, onCategoryClick }) {
  // Layout'a göre kategorileri düzenle
  const getGridTemplate = (layout) => {
    switch (layout) {
      case 'full': return '1fr'
      case 'half': return '1fr 1fr'
      case 'third': return '1fr 1fr 1fr'
      default: return '1fr 1fr'
    }
  }

  // Layout varsa kullan, yoksa default 2'li grid
  if (categoryLayouts && categoryLayouts.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categoryLayouts.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'grid',
              gridTemplateColumns: getGridTemplate(row.layout),
              gap: '12px'
            }}
          >
            {row.categoryIds?.map(catId => {
              const category = categories.find(c => c.id === catId)
              if (!category) return null
              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  theme={theme}
                  t={t}
                  onClick={() => onCategoryClick(category)}
                  height={row.layout === 'full' ? '160px' : '140px'}
                />
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // Default grid
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px'
    }}>
      {categories.map((category, index) => (
        <CategoryCard
          key={category.id}
          category={category}
          theme={theme}
          t={t}
          onClick={() => onCategoryClick(category)}
          height="140px"
          animationDelay={index * 0.05}
        />
      ))}
    </div>
  )
}

// ==================== CATEGORY CARD ====================
function CategoryCard({ category, theme, t, onClick, height = '140px', animationDelay = 0 }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        height,
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: theme.shadow,
        animation: `fadeUp 0.4s ease ${animationDelay}s both`
      }}
    >
      {category.image ? (
        <img
          src={FILES_URL + '/images/' + category.image}
          alt={category.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: theme.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px'
        }}>
          {category.icon}
        </div>
      )}
      
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
      }} />
      
      {/* Category Name */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        left: '14px',
        right: '14px'
      }}>
        <p style={{
          margin: 0,
          color: 'white',
          fontWeight: '700',
          fontSize: '18px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          {category.icon} {category.name}
        </p>
        <p style={{
          margin: '4px 0 0',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '13px'
        }}>
          {category.products?.length || 0} {t.products}
        </p>
      </div>
    </div>
  )
}

// ==================== FOOTER ====================
function Footer({ settings, theme, t }) {
  return (
    <div style={{
      marginTop: '32px',
      padding: '32px 20px',
      backgroundColor: 'white',
      borderTop: '1px solid ' + theme.border
    }}>
      {/* Contact Info */}
      <div style={{ marginBottom: '24px' }}>
        {settings.phone && (
          <a
            href={'tel:' + settings.phone}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: theme.surface,
              borderRadius: '14px',
              textDecoration: 'none',
              marginBottom: '10px'
            }}
          >
            <span style={{ fontSize: '24px' }}>📞</span>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary }}>{t.callUs}</p>
              <p style={{ margin: '2px 0 0', fontWeight: '600', color: theme.text }}>{settings.phone}</p>
            </div>
          </a>
        )}
        
        {settings.address && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            backgroundColor: theme.surface,
            borderRadius: '14px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>📍</span>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary }}>{t.findUs}</p>
              <p style={{ margin: '2px 0 0', fontWeight: '600', color: theme.text, fontSize: '14px' }}>{settings.address}</p>
            </div>
          </div>
        )}
        
        {settings.openingHours && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            backgroundColor: theme.surface,
            borderRadius: '14px'
          }}>
            <span style={{ fontSize: '24px' }}>🕐</span>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary }}>{t.workingHours}</p>
              <p style={{ margin: '2px 0 0', fontWeight: '600', color: theme.text }}>{settings.openingHours}</p>
            </div>
          </div>
        )}
      </div>

      {/* Social Links */}
      {(settings.instagram || settings.facebook) && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ 
            margin: '0 0 12px', 
            fontSize: '14px', 
            fontWeight: '600',
            color: theme.textSecondary,
            textAlign: 'center'
          }}>
            {t.followUs}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            {settings.instagram && (
              <a
                href={'https://instagram.com/' + settings.instagram.replace('@', '')}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  textDecoration: 'none',
                  boxShadow: theme.shadow
                }}
              >
                📷
              </a>
            )}
            {settings.facebook && (
              <a
                href={'https://facebook.com/' + settings.facebook}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: '#1877f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  textDecoration: 'none',
                  boxShadow: theme.shadow
                }}
              >
                📘
              </a>
            )}
          </div>
        </div>
      )}

      {/* Powered By */}
      <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid ' + theme.borderLight }}>
        <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted }}>
          {t.poweredBy} <span style={{ color: theme.primary, fontWeight: '700' }}>AR Menu</span>
        </p>
      </div>
    </div>
  )
}

// ==================== LANGUAGE MODAL ====================
function LanguageModal({ currentLanguage, onSelect, onClose, theme, t }) {
  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ]

  return (
    <ModalWrapper onClose={onClose} theme={theme}>
      <div style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700', color: theme.text, textAlign: 'center' }}>
          🌐 {t.selectLanguage}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                borderRadius: '14px',
                border: currentLanguage === lang.code ? '2px solid ' + theme.primary : '2px solid transparent',
                backgroundColor: currentLanguage === lang.code ? theme.primaryLight : theme.surface,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '32px' }}>{lang.flag}</span>
              <span style={{ 
                fontWeight: '600', 
                color: currentLanguage === lang.code ? theme.primary : theme.text,
                fontSize: '16px'
              }}>
                {lang.name}
              </span>
              {currentLanguage === lang.code && (
                <span style={{ marginLeft: 'auto', color: theme.primary, fontSize: '20px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </ModalWrapper>
  )
}

// ==================== SEARCH MODAL ====================
function SearchModal({ searchQuery, setSearchQuery, searchResults, allProducts, settings, theme, t, onClose, onProductClick }) {
  const inputRef = useRef(null)
  
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '0 0 24px 24px',
          maxHeight: '80vh',
          overflow: 'hidden',
          animation: 'slideDownFromTop 0.3s ease'
        }}
      >
        {/* Search Input */}
        <div style={{ padding: '16px', borderBottom: '1px solid ' + theme.border }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: theme.surface,
            borderRadius: '14px'
          }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '16px',
                color: theme.text
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: theme.textMuted
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px' }}>
          {searchQuery.trim() ? (
            searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {searchResults.map(product => (
                  <div
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px',
                      backgroundColor: theme.surface,
                      borderRadius: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {product.thumbnail ? (
                      <img
                        src={FILES_URL + '/images/' + product.thumbnail}
                        alt=""
                        style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '10px',
                        backgroundColor: theme.border,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}>🍽️</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '600', color: theme.text }}>{product.name}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: theme.textSecondary }}>
                        {product.categoryIcon} {product.categoryName}
                      </p>
                    </div>
                    <span style={{ fontWeight: '700', color: theme.primary }}>
                      {product.price} {settings.currency || '₺'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</p>
                <p style={{ color: theme.textSecondary }}>{t.noProducts}</p>
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>💡</p>
              <p>{t.searchPlaceholder}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== REVIEW MODAL ====================
function ReviewModal({ theme, t, settings, reviewSubmitted, onSubmit, onClose }) {
  const [rating, setRating] = useState(5)
  const [contact, setContact] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    onSubmit({ rating, contact, note })
  }

  return (
    <ModalWrapper onClose={onClose} theme={theme}>
      <div style={{ padding: '24px' }}>
        {reviewSubmitted ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'pulse 0.5s ease' }}>🎉</div>
            <h3 style={{ margin: '0 0 8px', color: theme.text, fontSize: '22px' }}>{t.thankYou}</h3>
            <p style={{ color: theme.textSecondary }}>{t.reviewSent}</p>
          </div>
        ) : (
          <>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: theme.text, textAlign: 'center' }}>
              {t.reviewTitle}
            </h3>
            <p style={{ margin: '0 0 24px', color: theme.textSecondary, textAlign: 'center' }}>
              {t.reviewSubtitle}
            </p>

            {/* Star Rating */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '40px',
                    cursor: 'pointer',
                    transform: rating >= star ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                    filter: rating >= star ? 'none' : 'grayscale(1)'
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>

            {/* Contact Input */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder={t.contactOptional}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid ' + theme.border,
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Note Input */}
            <div style={{ marginBottom: '24px' }}>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t.noteOptional}
                rows={3}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid ' + theme.border,
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '14px',
                border: 'none',
                background: theme.gradient,
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              {t.submit}
            </button>

            {/* Google Review Button */}
            {settings.googleReviewUrl && (
              <a
                href={settings.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '2px solid ' + theme.border,
                  backgroundColor: 'white',
                  color: theme.text,
                  fontWeight: '600',
                  fontSize: '15px',
                  textDecoration: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ fontSize: '20px' }}>📝</span>
                {t.writeGoogleReview}
              </a>
            )}
          </>
        )}
      </div>
    </ModalWrapper>
  )
}

// ==================== PRODUCT MODAL ====================
function ProductModal({ product, settings, theme, t, isFavorite, onToggleFavorite, onClose }) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: isClosing ? 'fadeOut 0.3s ease forwards' : 'fadeIn 0.3s ease'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '28px 28px 0 0',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '92vh',
          overflow: 'auto',
          animation: isClosing ? 'slideDown 0.3s ease forwards' : 'slideUp 0.4s ease'
        }}
      >
        {/* Handle */}
        <div style={{ padding: '14px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '44px', height: '5px', backgroundColor: theme.border, borderRadius: '3px' }} />
        </div>

        {/* Image / 3D Model */}
        <div style={{ position: 'relative', backgroundColor: theme.surface }}>
          {product.glbFile ? (
            <div style={{ height: '320px' }}>
              <model-viewer
                src={FILES_URL + '/outputs/' + product.glbFile}
                alt={product.name}
                auto-rotate
                camera-controls
                ar
                ar-modes="webxr scene-viewer quick-look"
                style={{ width: '100%', height: '100%' }}
              >
                <button
                  slot="ar-button"
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '16px 28px',
                    borderRadius: '50px',
                    border: 'none',
                    background: theme.gradient,
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: theme.shadowMd,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  📱 {t.viewInAR}
                </button>
              </model-viewer>
            </div>
          ) : product.thumbnail ? (
            <img
              src={FILES_URL + '/images/' + product.thumbnail}
              alt={product.name}
              style={{ width: '100%', height: '300px', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
              color: theme.border
            }}>🍽️</div>
          )}

          {/* Favorite Button */}
          <button
            onClick={onToggleFavorite}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'white',
              boxShadow: theme.shadow,
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: theme.text }}>
                {product.name}
              </h2>
              {product.categoryName && (
                <p style={{ margin: '6px 0 0', fontSize: '14px', color: theme.textSecondary }}>
                  {product.categoryIcon} {product.categoryName}
                </p>
              )}
            </div>
            <div style={{
              backgroundColor: theme.primaryLight,
              padding: '10px 16px',
              borderRadius: '14px'
            }}>
              {product.isCampaign && (
                <span style={{ fontSize: '12px', color: theme.primary, display: 'block', textAlign: 'center' }}>
                  {t.only}
                </span>
              )}
              <span style={{ fontSize: '24px', fontWeight: '800', color: theme.primary }}>
                {product.price} {settings.currency || '₺'}
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p style={{
              margin: '0 0 20px',
              fontSize: '15px',
              color: theme.textSecondary,
              lineHeight: 1.7,
              padding: '16px',
              backgroundColor: theme.surface,
              borderRadius: '14px'
            }}>
              {product.description}
            </p>
          )}

          {/* AR Badge */}
          {product.glbFile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              backgroundColor: '#ecfdf5',
              borderRadius: '14px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '32px' }}>📱</span>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: '#065f46' }}>AR Destekli</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#047857' }}>
                  3D modeli kameranızla görüntüleyin
                </p>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: theme.surface,
              color: theme.text,
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== CATEGORY PAGE MODAL ====================
function CategoryPageModal({ categoryId, categories, allProducts, campaignProducts, settings, theme, t, favorites, onToggleFavorite, onProductClick, onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  // Ürünleri getir
  let products = []
  let title = ''
  
  if (categoryId === 'campaigns') {
    products = campaignProducts || []
    title = t.campaigns
  } else {
    const category = categories.find(c => c.id === categoryId)
    products = category?.products?.filter(p => p.isActive !== false) || []
    title = category ? `${category.icon} ${category.name}` : ''
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'white',
        zIndex: 1000,
        overflow: 'auto',
        animation: isClosing ? 'slideRight 0.3s ease forwards' : 'slideLeft 0.3s ease'
      }}
    >
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid ' + theme.border,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 10
      }}>
        <button
          onClick={handleClose}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: theme.surface,
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: theme.text }}>
          {title}
        </h2>
        <span style={{
          marginLeft: 'auto',
          padding: '6px 12px',
          backgroundColor: theme.surface,
          borderRadius: '20px',
          fontSize: '14px',
          color: theme.textSecondary
        }}>
          {products.length} {t.products}
        </span>
      </div>

      {/* Products Grid */}
      <div style={{ padding: '16px' }}>
        {products.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px'
          }}>
            {products.map((product, index) => (
              <div
                key={product.id}
                onClick={() => onProductClick(product)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: theme.shadow,
                  cursor: 'pointer',
                  animation: `fadeUp 0.4s ease ${index * 0.05}s both`
                }}
              >
                <div style={{ position: 'relative' }}>
                  {product.thumbnail ? (
                    <img
                      src={FILES_URL + '/images/' + product.thumbnail}
                      alt={product.name}
                      style={{ width: '100%', height: '130px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '130px',
                      backgroundColor: theme.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px'
                    }}>🍽️</div>
                  )}
                  
                  {product.glbFile && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: theme.primary,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>AR</div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(product.id)
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'white',
                      fontSize: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    {favorites.includes(product.id) ? '❤️' : '🤍'}
                  </button>
                </div>

                <div style={{ padding: '12px' }}>
                  <h4 style={{
                    margin: '0 0 6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {product.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: theme.primary }}>
                      {product.isCampaign && <span style={{ fontSize: '11px' }}>{t.only} </span>}
                      {product.price} {settings.currency || '₺'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</p>
            <p style={{ color: theme.textSecondary }}>{t.noProducts}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== MODAL WRAPPER ====================
function ModalWrapper({ children, onClose, theme }) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: isClosing ? 'fadeOut 0.3s ease forwards' : 'fadeIn 0.3s ease'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          overflow: 'auto',
          animation: isClosing ? 'slideDown 0.3s ease forwards' : 'slideUp 0.3s ease'
        }}
      >
        {/* Handle */}
        <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '4px', backgroundColor: theme.border, borderRadius: '2px' }} />
        </div>
        {children}
      </div>
    </div>
  )
}