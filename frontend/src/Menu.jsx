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
    reviews: 'Görüş & Yorumlarınız',
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
    noProducts: 'Ürün bulunamadı',
    poweredBy: 'Powered by',
    products: 'ürün',
    selectLanguage: 'Dil Seçin',
    arSupported: 'AR Destekli',
    arDescription: '3D modeli kameranızla görüntüleyin',
    loading3D: '3D Model Yükleniyor...',
    callUs: 'Bizi Arayın',
    findUs: 'Konum',
    workingHours: 'Çalışma Saatleri',
    followUs: 'Bizi Takip Edin'
  },
  en: {
    search: 'Search...',
    searchPlaceholder: 'Search products or categories...',
    campaigns: 'Campaigns',
    listAll: 'View All',
    categories: 'Categories',
    reviews: 'Feedback & Reviews',
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
    noProducts: 'No products found',
    poweredBy: 'Powered by',
    products: 'products',
    selectLanguage: 'Select Language',
    arSupported: 'AR Supported',
    arDescription: 'View 3D model with your camera',
    loading3D: 'Loading 3D Model...',
    callUs: 'Call Us',
    findUs: 'Location',
    workingHours: 'Working Hours',
    followUs: 'Follow Us'
  },
  de: {
    search: 'Suchen...',
    searchPlaceholder: 'Produkte oder Kategorien suchen...',
    campaigns: 'Angebote',
    listAll: 'Alle Anzeigen',
    categories: 'Kategorien',
    reviews: 'Feedback & Bewertungen',
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
    noProducts: 'Keine Produkte gefunden',
    poweredBy: 'Powered by',
    products: 'Produkte',
    selectLanguage: 'Sprache wählen',
    arSupported: 'AR Unterstützt',
    arDescription: '3D-Modell mit Kamera ansehen',
    loading3D: '3D-Modell wird geladen...',
    callUs: 'Anrufen',
    findUs: 'Standort',
    workingHours: 'Öffnungszeiten',
    followUs: 'Folgen Sie uns'
  },
  ar: {
    search: 'بحث...',
    searchPlaceholder: 'ابحث عن منتجات أو فئات...',
    campaigns: 'العروض',
    listAll: 'عرض الكل',
    categories: 'الفئات',
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
    noProducts: 'لا توجد منتجات',
    poweredBy: 'مدعوم من',
    products: 'منتجات',
    selectLanguage: 'اختر اللغة',
    arSupported: 'يدعم AR',
    arDescription: 'عرض النموذج ثلاثي الأبعاد بالكاميرا',
    loading3D: 'جار تحميل النموذج...',
    callUs: 'اتصل بنا',
    findUs: 'الموقع',
    workingHours: 'ساعات العمل',
    followUs: 'تابعنا'
  },
  ru: {
    search: 'Поиск...',
    searchPlaceholder: 'Искать продукты или категории...',
    campaigns: 'Акции',
    listAll: 'Показать все',
    categories: 'Категории',
    reviews: 'Отзывы',
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
    noProducts: 'Продукты не найдены',
    poweredBy: 'Работает на',
    products: 'продуктов',
    selectLanguage: 'Выберите язык',
    arSupported: 'Поддержка AR',
    arDescription: 'Просмотр 3D модели камерой',
    loading3D: 'Загрузка 3D модели...',
    callUs: 'Позвоните нам',
    findUs: 'Местоположение',
    workingHours: 'Часы работы',
    followUs: 'Подписывайтесь'
  }
}

// ==================== MINIMALIST DARK THEME ====================
const theme = {
  bg: '#000000',
  bgCard: '#0a0a0a',
  bgElevated: '#111111',
  
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  
  red: '#e53935',
  redDark: '#c62828',
  
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  
  shadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
}

// ==================== MODEL VIEWER LOADER ====================
let modelViewerLoaded = false
let modelViewerLoading = false
const modelViewerCallbacks = []

function loadModelViewer() {
  return new Promise((resolve) => {
    if (modelViewerLoaded) { resolve(); return }
    if (modelViewerLoading) { modelViewerCallbacks.push(resolve); return }
    modelViewerLoading = true
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js'
    script.onload = () => {
      modelViewerLoaded = true
      modelViewerLoading = false
      resolve()
      modelViewerCallbacks.forEach(cb => cb())
      modelViewerCallbacks.length = 0
    }
    script.onerror = () => { modelViewerLoading = false; resolve() }
    document.head.appendChild(script)
  })
}

// ==================== MAIN COMPONENT ====================
export default function Menu() {
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
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [allProducts, setAllProducts] = useState([])
  const [modelViewerReady, setModelViewerReady] = useState(false)
  
  const t = translations[language] || translations.tr

  useEffect(() => { loadModelViewer().then(() => setModelViewerReady(true)) }, [])

  useEffect(() => {
    const saved = localStorage.getItem('ar-menu-favorites')
    if (saved) try { setFavorites(JSON.parse(saved)) } catch {}
    const lang = localStorage.getItem('ar-menu-language')
    if (lang) setLanguage(lang)
  }, [])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    axios.get(API_URL + '/menu').then(res => {
      setMenu(res.data)
      const prods = []
      res.data.categories?.forEach(cat => {
        cat.products?.forEach(p => {
          if (p.isActive !== false) prods.push({ ...p, categoryName: cat.name, categoryIcon: cat.icon, categoryId: cat.id })
        })
      })
      setAllProducts(prods)
      setTimeout(() => { setLoading(false); setTimeout(() => setShowSplash(false), 500) }, 1500)
    }).catch(() => { setLoading(false); setShowSplash(false) })
  }, [])

  useEffect(() => {
    if (!menu?.announcements?.length) return
    const interval = setInterval(() => setCurrentAnnouncementIndex(i => (i + 1) % menu.announcements.length), 4000)
    return () => clearInterval(interval)
  }, [menu?.announcements])

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('ar-menu-favorites', JSON.stringify(next))
      return next
    })
  }, [])

  const changeLanguage = (lang) => { setLanguage(lang); localStorage.setItem('ar-menu-language', lang); setShowLanguageModal(false) }

  const submitReview = async (data) => {
    try { await axios.post(API_URL + '/reviews', data); setReviewSubmitted(true); setTimeout(() => { setShowReviewModal(false); setReviewSubmitted(false) }, 2000) } catch {}
  }

  const openProductModal = useCallback((product) => {
    if (showProductModal) return
    setSelectedProduct(product)
    setShowProductModal(true)
  }, [showProductModal])

  const closeProductModal = useCallback(() => { setShowProductModal(false); setTimeout(() => setSelectedProduct(null), 300) }, [])

  const searchResults = searchQuery.trim() ? allProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  // ==================== SPLASH SCREEN ====================
  if (showSplash) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: theme.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, opacity: loading ? 1 : 0, transition: 'opacity 0.5s ease'
      }}>
        <div style={{ animation: 'fadeIn 0.6s ease', marginBottom: '32px' }}>
          {menu?.settings?.logo ? (
            <img src={FILES_URL + '/images/' + menu.settings.logo} alt=""
              style={{ width: '100px', height: '100px', borderRadius: '20px', objectFit: 'cover', border: `1px solid ${theme.border}` }} />
          ) : (
            <div style={{ width: '100px', height: '100px', borderRadius: '20px', background: theme.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🍽️</div>
          )}
        </div>
        
        <h1 style={{ color: theme.text, fontSize: '24px', fontWeight: '600', margin: '0 0 8px', animation: 'fadeIn 0.6s ease 0.2s both' }}>
          {menu?.settings?.restaurantName || 'Menu'}
        </h1>
        
        {menu?.settings?.slogan && (
          <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0, animation: 'fadeIn 0.6s ease 0.3s both' }}>{menu.settings.slogan}</p>
        )}
        
        <div style={{ marginTop: '40px', animation: 'fadeIn 0.6s ease 0.4s both' }}>
          <div style={{ width: '40px', height: '40px', border: `2px solid ${theme.border}`, borderTopColor: theme.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // ==================== ERROR STATE ====================
  if (!menu) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.bg, padding: '20px' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>😕</div>
        <h2 style={{ color: theme.text, fontSize: '18px', margin: '0 0 8px', fontWeight: '600' }}>Menu Yüklenemedi</h2>
        <p style={{ color: theme.textSecondary, fontSize: '14px' }}>Lütfen daha sonra tekrar deneyin</p>
        <button onClick={() => window.location.reload()} style={{
          marginTop: '24px', padding: '12px 28px', borderRadius: '8px', border: 'none',
          background: theme.red, color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
        }}>Yenile</button>
      </div>
    )
  }

  const { settings, categories, announcements, campaignProducts, categoryLayouts } = menu

  // ==================== MAIN RENDER ====================
  return (
    <div style={{
      minHeight: '100vh', background: theme.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      WebkitFontSmoothing: 'antialiased', paddingBottom: '80px'
    }}>

      {/* ========== HERO ========== */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
          {settings.bannerImage || settings.homepageImage ? (
            <img src={FILES_URL + '/images/' + (settings.homepageImage || settings.bannerImage)} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: theme.bgElevated }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to bottom, transparent 0%, ${theme.bg} 100%)`
          }} />
        </div>

        {/* Top Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <button onClick={() => setShowLanguageModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '8px',
            border: `1px solid ${theme.border}`, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
            color: theme.text, fontWeight: '500', fontSize: '13px', cursor: 'pointer'
          }}>
            🌐 {language.toUpperCase()}
          </button>

          <button onClick={() => setShowSearchModal(true)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '8px',
            border: `1px solid ${theme.border}`, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
            color: theme.text, fontSize: '18px', cursor: 'pointer'
          }}>🔍</button>
        </div>

        {/* Restaurant Info */}
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px' }}>
            {settings.logo && (
              <img src={FILES_URL + '/images/' + settings.logo} alt=""
                style={{ width: '70px', height: '70px', borderRadius: '14px', objectFit: 'cover', border: `2px solid ${theme.border}` }} />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: theme.text }}>
                {settings.restaurantName || 'Restoran'}
              </h1>
              {settings.slogan && <p style={{ margin: '4px 0 0', fontSize: '13px', color: theme.textSecondary }}>{settings.slogan}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px' }}>

        {/* ========== REVIEWS TEXT ========== */}
        <div 
          onClick={() => setShowReviewModal(true)}
          style={{
            padding: '20px 0',
            borderBottom: `1px solid ${theme.border}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ color: theme.red, fontSize: '15px', fontWeight: '600' }}>
            ⭐ {t.reviews}
          </span>
          <span style={{ color: theme.textMuted, fontSize: '20px' }}>→</span>
        </div>

        {/* ========== ANNOUNCEMENTS - KAYAN NOTLAR ========== */}
        {announcements?.length > 0 && (
          <div style={{
            padding: '20px 0',
            borderBottom: `1px solid ${theme.border}`
          }}>
            <div key={currentAnnouncementIndex} style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{announcements[currentAnnouncementIndex]?.icon || '📢'}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: theme.text, fontSize: '14px' }}>
                    {announcements[currentAnnouncementIndex]?.title}
                  </p>
                  <p style={{ margin: '6px 0 0', color: theme.textSecondary, fontSize: '13px', lineHeight: 1.5 }}>
                    {announcements[currentAnnouncementIndex]?.message}
                  </p>
                </div>
              </div>
            </div>
            
            {announcements.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
                {announcements.map((_, i) => (
                  <div key={i} style={{
                    width: i === currentAnnouncementIndex ? '20px' : '6px', height: '6px', borderRadius: '3px',
                    background: i === currentAnnouncementIndex ? theme.red : theme.border, transition: 'all 0.3s ease'
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== CAMPAIGNS ========== */}
        {campaignProducts?.length > 0 && (
          <div style={{ paddingTop: '24px', paddingBottom: '24px', borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: theme.text }}>
                🔥 {t.campaigns}
              </h2>
              <button onClick={() => setSelectedCategory('campaigns')} style={{
                padding: '8px 14px', borderRadius: '6px', border: `1px solid ${theme.border}`,
                background: 'transparent', color: theme.textSecondary, fontWeight: '500', fontSize: '12px', cursor: 'pointer'
              }}>{t.listAll}</button>
            </div>

            <div style={{
              display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '8px',
              scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch'
            }}>
              {campaignProducts.slice(0, 10).map((product, index) => (
                <CampaignCard key={product.id} product={product} settings={settings} t={t} index={index} onClick={() => openProductModal(product)} />
              ))}
            </div>
          </div>
        )}

        {/* ========== CATEGORIES ========== */}
        <div style={{ paddingTop: '24px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: theme.text }}>
            📋 {t.categories}
          </h2>
          <CategoryGrid categories={categories} categoryLayouts={categoryLayouts} t={t} onCategoryClick={(cat) => setSelectedCategory(cat.id)} />
        </div>

        {/* ========== FOOTER ========== */}
        <Footer settings={settings} t={t} />
      </div>

      {/* ========== MODALS ========== */}
      {showLanguageModal && <LanguageModal currentLanguage={language} onSelect={changeLanguage} onClose={() => setShowLanguageModal(false)} t={t} />}
      {showSearchModal && <SearchModal searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} settings={settings} t={t} onClose={() => { setShowSearchModal(false); setSearchQuery('') }} onProductClick={(p) => { setShowSearchModal(false); setSearchQuery(''); setTimeout(() => openProductModal(p), 100) }} />}
      {showReviewModal && <ReviewModal t={t} settings={settings} reviewSubmitted={reviewSubmitted} onSubmit={submitReview} onClose={() => { setShowReviewModal(false); setReviewSubmitted(false) }} />}
      {selectedCategory && <CategoryPageModal categoryId={selectedCategory} categories={categories} allProducts={allProducts} campaignProducts={campaignProducts} settings={settings} t={t} favorites={favorites} onToggleFavorite={toggleFavorite} onProductClick={openProductModal} onClose={() => setSelectedCategory(null)} />}
      {showProductModal && selectedProduct && <ProductModal product={selectedProduct} settings={settings} t={t} isFavorite={favorites.includes(selectedProduct.id)} onToggleFavorite={() => toggleFavorite(selectedProduct.id)} onClose={closeProductModal} modelViewerReady={modelViewerReady} />}

      {/* Scroll Top */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
          position: 'fixed', bottom: '24px', right: '16px', width: '48px', height: '48px', borderRadius: '12px',
          border: `1px solid ${theme.border}`, background: theme.bgCard, color: theme.text, fontSize: '18px', cursor: 'pointer',
          zIndex: 50, animation: 'fadeIn 0.3s ease'
        }}>↑</button>
      )}

      {/* Global Styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes slideFromTop { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        *::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; box-sizing: border-box; }
        input, textarea, button { font-family: inherit; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  )
}

// ==================== CAMPAIGN CARD ====================
function CampaignCard({ product, settings, t, index, onClick }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onClick() }} style={{
      flexShrink: 0, width: '260px', height: '160px', borderRadius: '12px', overflow: 'hidden',
      position: 'relative', cursor: 'pointer', scrollSnapAlign: 'start', animation: `fadeUp 0.4s ease ${index * 0.05}s both`
    }}>
      {product.thumbnail ? (
        <img src={FILES_URL + '/images/' + product.thumbnail} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: theme.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🍽️</div>
      )}
      
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
      
      {product.glbFile && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)',
          color: theme.text, padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600'
        }}>AR</div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px' }}>
        <p style={{ margin: 0, color: theme.text, fontWeight: '600', fontSize: '15px' }}>{product.name}</p>
        <p style={{ margin: '8px 0 0', color: theme.red, fontWeight: '700', fontSize: '16px' }}>
          {product.isCampaign && <span style={{ fontSize: '11px', color: theme.textSecondary, marginRight: '4px' }}>{t.only}</span>}
          {product.price} {settings.currency || '₺'}
        </p>
      </div>
    </div>
  )
}

// ==================== CATEGORY GRID ====================
function CategoryGrid({ categories, categoryLayouts, t, onCategoryClick }) {
  const getGrid = (layout) => {
    if (layout === 'full') return '1fr'
    if (layout === 'third') return '1fr 1fr 1fr'
    return '1fr 1fr'
  }

  if (categoryLayouts?.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categoryLayouts.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: getGrid(row.layout), gap: '12px' }}>
            {row.categoryIds?.map(catId => {
              const cat = categories.find(c => c.id === catId)
              if (!cat) return null
              return <CategoryCard key={cat.id} category={cat} t={t} onClick={() => onCategoryClick(cat)} height={row.layout === 'full' ? '140px' : '120px'} />
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
      {categories.map((cat, i) => <CategoryCard key={cat.id} category={cat} t={t} onClick={() => onCategoryClick(cat)} height="120px" delay={i * 0.03} />)}
    </div>
  )
}

// ==================== CATEGORY CARD ====================
function CategoryCard({ category, t, onClick, height = '120px', delay = 0 }) {
  return (
    <div onClick={onClick} style={{
      position: 'relative', height, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', animation: `fadeUp 0.4s ease ${delay}s both`
    }}>
      {category.image ? (
        <img src={FILES_URL + '/images/' + category.image} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: theme.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>{category.icon}</div>
      )}
      
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
      
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px' }}>
        <p style={{ margin: 0, color: theme.text, fontWeight: '600', fontSize: '14px' }}>{category.icon} {category.name}</p>
        <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '12px' }}>{category.products?.length || 0} {t.products}</p>
      </div>
    </div>
  )
}

// ==================== FOOTER ====================
function Footer({ settings, t }) {
  return (
    <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: `1px solid ${theme.border}` }}>
      {settings.phone && (
        <a href={'tel:' + settings.phone} style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0',
          borderBottom: `1px solid ${theme.borderLight}`, textDecoration: 'none'
        }}>
          <span style={{ fontSize: '18px' }}>📞</span>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.callUs}</p>
            <p style={{ margin: '2px 0 0', fontWeight: '600', color: theme.text, fontSize: '14px' }}>{settings.phone}</p>
          </div>
        </a>
      )}
      
      {settings.address && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: `1px solid ${theme.borderLight}` }}>
          <span style={{ fontSize: '18px' }}>📍</span>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.findUs}</p>
            <p style={{ margin: '2px 0 0', fontWeight: '500', color: theme.text, fontSize: '13px' }}>{settings.address}</p>
          </div>
        </div>
      )}
      
      {settings.openingHours && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: `1px solid ${theme.borderLight}` }}>
          <span style={{ fontSize: '18px' }}>🕐</span>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.workingHours}</p>
            <p style={{ margin: '2px 0 0', fontWeight: '500', color: theme.text, fontSize: '14px' }}>{settings.openingHours}</p>
          </div>
        </div>
      )}

      {(settings.instagram || settings.facebook) && (
        <div style={{ padding: '20px 0' }}>
          <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.followUs}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {settings.instagram && (
              <a href={'https://instagram.com/' + settings.instagram.replace('@', '')} target="_blank" rel="noopener noreferrer" style={{
                width: '44px', height: '44px', borderRadius: '10px', background: theme.bgElevated, border: `1px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', textDecoration: 'none'
              }}>📷</a>
            )}
            {settings.facebook && (
              <a href={'https://facebook.com/' + settings.facebook} target="_blank" rel="noopener noreferrer" style={{
                width: '44px', height: '44px', borderRadius: '10px', background: theme.bgElevated, border: `1px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', textDecoration: 'none'
              }}>📘</a>
            )}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>
          {t.poweredBy} <span style={{ color: theme.red, fontWeight: '600' }}>AR Menu</span>
        </p>
      </div>
    </div>
  )
}

// ==================== LANGUAGE MODAL ====================
function LanguageModal({ currentLanguage, onSelect, onClose, t }) {
  const langs = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ]

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{ padding: '24px 20px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: theme.text, textAlign: 'center' }}>🌐 {t.selectLanguage}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {langs.map(l => (
            <button key={l.code} onClick={() => onSelect(l.code)} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '10px',
              border: currentLanguage === l.code ? `1px solid ${theme.red}` : `1px solid ${theme.border}`,
              background: currentLanguage === l.code ? 'rgba(229,57,53,0.1)' : 'transparent', cursor: 'pointer'
            }}>
              <span style={{ fontSize: '28px' }}>{l.flag}</span>
              <span style={{ fontWeight: '500', color: currentLanguage === l.code ? theme.red : theme.text, fontSize: '15px' }}>{l.name}</span>
              {currentLanguage === l.code && <span style={{ marginLeft: 'auto', color: theme.red, fontSize: '18px' }}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </ModalWrapper>
  )
}

// ==================== SEARCH MODAL ====================
function SearchModal({ searchQuery, setSearchQuery, searchResults, settings, t, onClose, onProductClick }) {
  const inputRef = useRef(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, animation: 'fadeIn 0.2s ease'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.bgCard, borderRadius: '0 0 16px 16px', maxHeight: '80vh', overflow: 'hidden',
        animation: 'slideFromTop 0.3s ease', borderBottom: `1px solid ${theme.border}`
      }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
            background: theme.bg, borderRadius: '10px', border: `1px solid ${theme.border}`
          }}>
            <span style={{ fontSize: '18px', opacity: 0.5 }}>🔍</span>
            <input ref={inputRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: theme.text }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                background: theme.bgElevated, border: 'none', width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer', color: theme.textMuted, fontSize: '12px'
              }}>✕</button>
            )}
          </div>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '12px' }}>
          {searchQuery.trim() ? (
            searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.map(p => (
                  <div key={p.id} onClick={() => onProductClick(p)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: theme.bg,
                    borderRadius: '10px', border: `1px solid ${theme.border}`, cursor: 'pointer'
                  }}>
                    {p.thumbnail ? (
                      <img src={FILES_URL + '/images/' + p.thumbnail} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: theme.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🍽️</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '600', color: theme.text, fontSize: '14px' }}>{p.name}</p>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: theme.textSecondary }}>{p.categoryIcon} {p.categoryName}</p>
                    </div>
                    <span style={{ fontWeight: '700', color: theme.red, fontSize: '14px' }}>{p.price} {settings.currency || '₺'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '40px', marginBottom: '8px' }}>🔍</p>
                <p style={{ color: theme.textSecondary, fontSize: '14px' }}>{t.noProducts}</p>
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textMuted }}>
              <p style={{ fontSize: '40px', marginBottom: '8px' }}>💡</p>
              <p style={{ fontSize: '14px' }}>{t.searchPlaceholder}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== REVIEW MODAL ====================
function ReviewModal({ t, settings, reviewSubmitted, onSubmit, onClose }) {
  const [rating, setRating] = useState(5)
  const [contact, setContact] = useState('')
  const [note, setNote] = useState('')

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{ padding: '24px 20px' }}>
        {reviewSubmitted ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ margin: '0 0 6px', color: theme.text, fontSize: '20px', fontWeight: '600' }}>{t.thankYou}</h3>
            <p style={{ color: theme.textSecondary, fontSize: '14px' }}>{t.reviewSent}</p>
          </div>
        ) : (
          <>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '600', color: theme.text, textAlign: 'center' }}>{t.reviewTitle}</h3>
            <p style={{ margin: '0 0 24px', color: theme.textSecondary, textAlign: 'center', fontSize: '13px' }}>{t.reviewSubtitle}</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{
                  background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer',
                  opacity: rating >= s ? 1 : 0.3, transition: 'opacity 0.2s ease'
                }}>⭐</button>
              ))}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder={t.contactOptional}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.bg, fontSize: '14px', outline: 'none', color: theme.text, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t.noteOptional} rows={3}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.bg, fontSize: '14px', outline: 'none', resize: 'none', color: theme.text, boxSizing: 'border-box' }} />
            </div>

            <button onClick={() => onSubmit({ rating, contact, note })} style={{
              width: '100%', padding: '16px', borderRadius: '8px', border: 'none', background: theme.red,
              color: 'white', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginBottom: '10px'
            }}>{t.submit}</button>

            {settings.googleReviewUrl && (
              <a href={settings.googleReviewUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px',
                borderRadius: '8px', border: `1px solid ${theme.border}`, background: 'transparent',
                color: theme.text, fontWeight: '500', fontSize: '14px', textDecoration: 'none', boxSizing: 'border-box'
              }}>
                📝 {t.writeGoogleReview}
              </a>
            )}
          </>
        )}
      </div>
    </ModalWrapper>
  )
}

// ==================== PRODUCT MODAL ====================
function ProductModal({ product, settings, t, isFavorite, onToggleFavorite, onClose, modelViewerReady }) {
  const [isClosing, setIsClosing] = useState(false)
  const [modelLoading, setModelLoading] = useState(true)
  const modelViewerRef = useRef(null)

  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 300) }

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset' } }, [])

  useEffect(() => {
    if (!product.glbFile || !modelViewerReady) return
    const check = () => {
      const mv = modelViewerRef.current
      if (mv) { mv.addEventListener('load', () => setModelLoading(false)); mv.addEventListener('error', () => setModelLoading(false)) }
    }
    if (customElements.get('model-viewer')) setTimeout(check, 100)
    else customElements.whenDefined('model-viewer').then(() => setTimeout(check, 100))
  }, [product.glbFile, modelViewerReady])

  const glbUrl = product.glbFile ? FILES_URL + '/outputs/' + product.glbFile : null
  const usdzUrl = product.usdzFile ? FILES_URL + '/outputs/' + product.usdzFile : null

  return (
    <div onClick={handleClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: isClosing ? 'fadeOut 0.3s ease forwards' : 'fadeIn 0.3s ease'
    }}>
      <style>{`@keyframes fadeOut { to { opacity: 0; } }`}</style>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.bgCard, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '500px', maxHeight: '92vh', overflow: 'auto',
        animation: isClosing ? 'slideDown 0.3s ease forwards' : 'slideUp 0.4s ease', border: `1px solid ${theme.border}`, borderBottom: 'none'
      }}>
        <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '4px', background: theme.border, borderRadius: '2px' }} />
        </div>

        <div style={{ position: 'relative', background: theme.bg }}>
          {glbUrl && modelViewerReady ? (
            <div style={{ height: '320px', position: 'relative' }}>
              {modelLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.bg, zIndex: 5 }}>
                  <div style={{ width: '40px', height: '40px', border: `2px solid ${theme.border}`, borderTopColor: theme.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ color: theme.textSecondary, marginTop: '12px', fontSize: '13px' }}>{t.loading3D}</p>
                </div>
              )}
              
              <model-viewer ref={modelViewerRef} src={glbUrl} ios-src={usdzUrl} alt={product.name}
                auto-rotate camera-controls ar ar-modes="webxr scene-viewer quick-look"
                shadow-intensity="1" environment-image="neutral"
                style={{ width: '100%', height: '100%', background: theme.bg, opacity: modelLoading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
                <button slot="ar-button" style={{
                  position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                  padding: '14px 28px', borderRadius: '8px', border: 'none', background: theme.red,
                  color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                }}>📱 {t.viewInAR}</button>
              </model-viewer>

              <div style={{
                position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.7)',
                color: theme.text, padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', zIndex: 10
              }}>3D</div>
            </div>
          ) : product.thumbnail ? (
            <img src={FILES_URL + '/images/' + product.thumbnail} alt={product.name} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', background: theme.bgElevated }}>🍽️</div>
          )}

          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite() }} style={{
            position: 'absolute', top: '12px', right: '12px', width: '44px', height: '44px', borderRadius: '50%',
            border: 'none', background: 'rgba(0,0,0,0.7)', fontSize: '22px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
          }}>{isFavorite ? '❤️' : '🤍'}</button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: theme.text }}>{product.name}</h2>
              {product.categoryName && <p style={{ margin: '6px 0 0', fontSize: '13px', color: theme.textSecondary }}>{product.categoryIcon} {product.categoryName}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              {product.isCampaign && <span style={{ fontSize: '11px', color: theme.textSecondary, display: 'block' }}>{t.only}</span>}
              <span style={{ fontSize: '24px', fontWeight: '700', color: theme.red }}>{product.price} {settings.currency || '₺'}</span>
            </div>
          </div>

          {product.description && (
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6, padding: '14px', background: theme.bg, borderRadius: '10px', border: `1px solid ${theme.border}` }}>{product.description}</p>
          )}

          {product.glbFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(229,57,53,0.1)', borderRadius: '10px', marginBottom: '16px', border: `1px solid rgba(229,57,53,0.2)` }}>
              <span style={{ fontSize: '28px' }}>📱</span>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: theme.red, fontSize: '14px' }}>{t.arSupported}</p>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: theme.textSecondary }}>{t.arDescription}</p>
              </div>
            </div>
          )}

          <button onClick={handleClose} style={{
            width: '100%', padding: '16px', borderRadius: '10px', border: `1px solid ${theme.border}`,
            background: 'transparent', color: theme.text, fontWeight: '600', fontSize: '15px', cursor: 'pointer'
          }}>{t.close}</button>
        </div>
      </div>
    </div>
  )
}

// ==================== CATEGORY PAGE MODAL ====================
function CategoryPageModal({ categoryId, categories, allProducts, campaignProducts, settings, t, favorites, onToggleFavorite, onProductClick, onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 300) }

  let products = [], title = ''
  if (categoryId === 'campaigns') { products = campaignProducts || []; title = '🔥 ' + t.campaigns }
  else { const cat = categories.find(c => c.id === categoryId); products = cat?.products?.filter(p => p.isActive !== false) || []; title = cat ? `${cat.icon} ${cat.name}` : '' }

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset' } }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: theme.bg, zIndex: 1000, overflow: 'auto',
      animation: isClosing ? 'slideRight 0.3s ease forwards' : 'slideLeft 0.3s ease'
    }}>
      <div style={{
        position: 'sticky', top: 0, background: theme.bgCard, borderBottom: `1px solid ${theme.border}`,
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', zIndex: 10
      }}>
        <button onClick={handleClose} style={{
          width: '42px', height: '42px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: 'transparent',
          fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text
        }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text, flex: 1 }}>{title}</h2>
        <span style={{ padding: '6px 12px', background: theme.bg, borderRadius: '6px', fontSize: '13px', color: theme.textSecondary, border: `1px solid ${theme.border}` }}>{products.length}</span>
      </div>

      <div style={{ padding: '16px' }}>
        {products.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {products.map((p, i) => (
              <ProductGridCard key={p.id} product={p} settings={settings} t={t} index={i}
                isFavorite={favorites.includes(p.id)} onToggleFavorite={() => onToggleFavorite(p.id)} onClick={() => onProductClick(p)} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</p>
            <p style={{ color: theme.textSecondary, fontSize: '14px' }}>{t.noProducts}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== PRODUCT GRID CARD ====================
function ProductGridCard({ product, settings, t, index, isFavorite, onToggleFavorite, onClick }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onClick() }} style={{
      position: 'relative', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
      animation: `fadeUp 0.4s ease ${index * 0.03}s both`, aspectRatio: '1 / 1'
    }}>
      {product.thumbnail ? (
        <img src={FILES_URL + '/images/' + product.thumbnail} alt={product.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: theme.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🍽️</div>
      )}
      
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />

      {product.glbFile && (
        <div style={{
          position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)',
          color: theme.text, padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', zIndex: 2
        }}>AR</div>
      )}

      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite() }} style={{
        position: 'absolute', top: '8px', left: '8px', width: '32px', height: '32px', borderRadius: '50%',
        border: 'none', background: 'rgba(0,0,0,0.7)', fontSize: '14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
      }}>{isFavorite ? '❤️' : '🤍'}</button>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', zIndex: 2 }}>
        <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '600', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</h4>
        <p style={{ margin: 0, color: theme.red, fontWeight: '700', fontSize: '15px' }}>
          {product.isCampaign && <span style={{ fontSize: '10px', color: theme.textSecondary, marginRight: '3px' }}>{t.only}</span>}
          {product.price} {settings.currency || '₺'}
        </p>
      </div>
    </div>
  )
}

// ==================== MODAL WRAPPER ====================
function ModalWrapper({ children, onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 300) }

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset' } }, [])

  return (
    <div onClick={handleClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: isClosing ? 'fadeOut 0.3s ease forwards' : 'fadeIn 0.3s ease'
    }}>
      <style>{`@keyframes fadeOut { to { opacity: 0; } }`}</style>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.bgCard, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflow: 'auto',
        animation: isClosing ? 'slideDown 0.3s ease forwards' : 'slideUp 0.3s ease', border: `1px solid ${theme.border}`, borderBottom: 'none'
      }}>
        <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '4px', background: theme.border, borderRadius: '2px' }} />
        </div>
        {children}
      </div>
    </div>
  )
}