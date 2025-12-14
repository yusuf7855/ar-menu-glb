import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Menu from './Menu'
import './App.css'

const API_URL = 'http://192.168.1.2:3001/api'
const FILES_URL = 'http://192.168.1.2:3001'

// Load model-viewer script
if (typeof window !== 'undefined' && !document.querySelector('script[src*="model-viewer"]')) {
  const script = document.createElement('script')
  script.type = 'module'
  script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js'
  document.head.appendChild(script)
}

// ==================== STYLES ====================
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  color: '#1f2937',
  outline: 'none'
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical'
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer'
}

// ==================== ADMIN LAYOUT ====================
function AdminLayout({ children }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard' },
    { path: '/admin/products', icon: '🍽️', label: 'Ürünler' },
    { path: '/admin/categories', icon: '📁', label: 'Kategoriler' },
    { path: '/admin/announcements', icon: '📢', label: 'Duyurular' },
    { path: '/admin/reviews', icon: '⭐', label: 'Yorumlar' },
    { path: '/admin/layout', icon: '🎨', label: 'Kategori Düzeni' },
    { path: '/admin/settings', icon: '⚙️', label: 'Ayarlar' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '260px' : '0px',
        backgroundColor: '#1f2937',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: isMobile ? 'fixed' : 'relative',
        height: '100vh',
        zIndex: 100
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <h1 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🍽️</span> AR Menu
          </h1>
          <p style={{ margin: '8px 0 0', color: '#9ca3af', fontSize: '13px' }}>Yönetim Paneli</p>
        </div>
        <nav style={{ padding: '16px' }}>
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: location.pathname === item.path ? 'white' : '#9ca3af',
                backgroundColor: location.pathname === item.path ? '#dc2626' : 'transparent',
                marginBottom: '6px',
                transition: 'all 0.2s ease',
                fontWeight: location.pathname === item.path ? '600' : '400'
              }}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: '20px', left: '16px', right: '16px' }}>
          <Link
            to="/"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: '#374151',
              color: 'white',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            <span>👁️</span> Menüyü Görüntüle
          </Link>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
        />
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <div style={{
          backgroundColor: 'white',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ☰
          </button>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            {menuItems.find(m => m.path === location.pathname)?.label || 'Admin'}
          </h2>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ==================== DASHBOARD ====================
function Dashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0, reviews: 0, announcements: 0 })
  const [recentReviews, setRecentReviews] = useState([])

  useEffect(() => {
    Promise.all([
      axios.get(API_URL + '/products'),
      axios.get(API_URL + '/categories'),
      axios.get(API_URL + '/reviews'),
      axios.get(API_URL + '/announcements')
    ]).then(([products, categories, reviews, announcements]) => {
      setStats({
        products: products.data.length,
        categories: categories.data.length,
        reviews: reviews.data.length,
        announcements: announcements.data.length
      })
      setRecentReviews(reviews.data.slice(-5).reverse())
    }).catch(console.error)
  }, [])

  const statCards = [
    { icon: '🍽️', label: 'Toplam Ürün', value: stats.products, color: '#dc2626' },
    { icon: '📁', label: 'Kategori', value: stats.categories, color: '#2563eb' },
    { icon: '⭐', label: 'Yorum', value: stats.reviews, color: '#f59e0b' },
    { icon: '📢', label: 'Duyuru', value: stats.announcements, color: '#10b981' },
  ]

  return (
    <div>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((stat, i) => (
          <div key={i} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '32px' }}>{stat.icon}</span>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: stat.color + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: stat.color, fontSize: '24px', fontWeight: '700' }}>{stat.value}</span>
              </div>
            </div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Reviews */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          ⭐ Son Yorumlar
        </h3>
        {recentReviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentReviews.map(review => (
              <div key={review.id} style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: '18px', filter: s <= review.rating ? 'none' : 'grayscale(1)' }}>⭐</span>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  {review.note && <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>{review.note}</p>}
                  {review.contact && <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '12px' }}>{review.contact}</p>}
                </div>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                  {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>Henüz yorum yok</p>
        )}
      </div>
    </div>
  )
}

// ==================== PRODUCTS PAGE ====================
function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(API_URL + '/products'),
        axios.get(API_URL + '/categories')
      ])
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
    } catch (err) {
      console.error('Veri yuklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // ProductModal zaten API'ye kaydediyor, burada sadece listeyi yenile ve modal'ı kapat
    loadData()
    setShowModal(false)
    setEditingProduct(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    try {
      await axios.delete(API_URL + '/products/' + id)
      loadData()
    } catch (err) {
      alert('Silme hatası: ' + err.message)
    }
  }

  const handleThumbnailUpload = async (productId, file) => {
    const formData = new FormData()
    formData.append('image', file)
    try {
      await axios.post(API_URL + '/products/' + productId + '/thumbnail', formData)
      loadData()
    } catch (err) {
      alert('Resim yükleme hatası: ' + err.message)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: '#6b7280' }}>{products.length} ürün</p>
        <button
          onClick={() => { setEditingProduct({}); setShowModal(true) }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <span>+</span> Yeni Ürün
        </button>
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            categories={categories}
            onEdit={() => { setEditingProduct(product); setShowModal(true) }}
            onDelete={() => handleDelete(product.id)}
            onThumbnailUpload={(f) => handleThumbnailUpload(product.id, f)}
            onOpenPhotos={() => setShowPhotoModal(product)}
            onRefresh={loadData}
          />
        ))}
      </div>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingProduct(null) }}
        />
      )}

      {/* Photo Modal for 3D */}
      {showPhotoModal && (
        <PhotoModal
          product={showPhotoModal}
          onClose={() => setShowPhotoModal(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  )
}

// ==================== PRODUCT CARD ====================
function ProductCard({ product, categories, onEdit, onDelete, onThumbnailUpload, onOpenPhotos, onRefresh }) {
  const thumbnailRef = useRef(null)
  const category = categories.find(c => c.id === product.categoryId)
  const [show3D, setShow3D] = useState(false)

  // Determine which 3D file to use (GLB preferred, USDZ as fallback)
  const modelFile = product.glbFile || product.usdzFile
  const modelUrl = modelFile ? FILES_URL + '/outputs/' + modelFile : null
  const iosUrl = product.usdzFile ? FILES_URL + '/outputs/' + product.usdzFile : modelUrl

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      {/* Thumbnail / 3D Viewer Toggle */}
      <div style={{ position: 'relative', height: '200px', backgroundColor: '#f3f4f6' }}>
        {show3D && modelUrl ? (
          /* 3D Model Viewer */
          <model-viewer
            src={modelUrl}
            ios-src={iosUrl}
            alt={product.name}
            auto-rotate
            camera-controls
            shadow-intensity="1"
            exposure="0.8"
            environment-image="neutral"
            style={{ width: '100%', height: '100%', backgroundColor: '#1f2937' }}
          >
            <div slot="progress-bar" style={{ display: 'none' }}></div>
          </model-viewer>
        ) : product.thumbnail ? (
          <img
            src={FILES_URL + '/images/' + product.thumbnail}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: '#d1d5db' }}>
            🍽️
          </div>
        )}
        
        {/* Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {product.isCampaign && (
            <span style={{ padding: '4px 10px', backgroundColor: '#dc2626', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
              Kampanya
            </span>
          )}
          {product.isFeatured && (
            <span style={{ padding: '4px 10px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
              Öne Çıkan
            </span>
          )}
        </div>

        {/* 3D Toggle Button */}
        {modelFile && (
          <button
            onClick={() => setShow3D(!show3D)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              padding: '8px 14px',
              backgroundColor: show3D ? '#16a34a' : 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {show3D ? '📷 Resim' : '🎯 3D Görüntüle'}
          </button>
        )}

        {/* Upload Thumbnail Button */}
        {!show3D && (
          <button
            onClick={() => thumbnailRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              padding: '8px 12px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            📷 Kapak Resmi
          </button>
        )}
        <input
          ref={thumbnailRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files[0] && onThumbnailUpload(e.target.files[0])}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{product.name}</h3>
            {category && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                {category.icon} {category.name}
              </p>
            )}
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>{product.price}₺</span>
        </div>

        {/* 3D AR Section */}
        <div style={{
          padding: '14px',
          backgroundColor: modelFile ? '#dcfce7' : '#f0fdf4',
          borderRadius: '12px',
          marginBottom: '12px',
          border: modelFile ? '1px solid #86efac' : '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{modelFile ? '✅' : '📸'}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                {modelFile ? '3D Model Hazır' : '3D Model için Fotoğraflar'}
              </span>
            </div>
            <span style={{
              padding: '4px 10px',
              backgroundColor: modelFile ? '#16a34a' : (product.photoCount || 0) >= 20 ? '#16a34a' : '#f59e0b',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {modelFile ? 'AR ✓' : `${product.photoCount || 0} / 20+`}
            </span>
          </div>
          
          <button
            onClick={onOpenPhotos}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: modelFile ? '#15803d' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {modelFile ? '🔄 Model Güncelle' : '📷 Fotoğrafları Yönet & 3D Oluştur'}
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            ✏️ Düzenle
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '10px 16px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== PHOTO MODAL (3D AR) ====================
function PhotoModal({ product, onClose, onRefresh }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    loadPhotos()
  }, [product.id])

  const loadPhotos = async () => {
    try {
      const res = await axios.get(API_URL + '/products/' + product.id + '/photos')
      setPhotos(res.data)
    } catch (err) {
      console.error('Fotoğraflar yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('photos', f))
    try {
      await axios.post(API_URL + '/products/' + product.id + '/photos', formData)
      loadPhotos()
      onRefresh()
    } catch (err) {
      alert('Yükleme hatası: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (filename) => {
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return
    try {
      await axios.delete(API_URL + '/products/' + product.id + '/photos/' + filename)
      loadPhotos()
      onRefresh()
    } catch (err) {
      alert('Silme hatası: ' + err.message)
    }
  }

  const handleGenerate = async () => {
    if (photos.length < 20) {
      alert('3D model oluşturmak için en az 20 fotoğraf gerekli!')
      return
    }

    setGenerating(true)
    setProgress({ stage: 'starting', progress: 0, message: 'Başlatılıyor...' })

    try {
      await axios.post(API_URL + '/products/' + product.id + '/generate')
      
      // Progress takibi
      const eventSource = new EventSource(API_URL + '/products/' + product.id + '/progress')
      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data)
        setProgress(data)
        if (data.stage === 'completed') {
          eventSource.close()
          setGenerating(false)
          onRefresh()
          alert('🎉 3D model başarıyla oluşturuldu!')
        } else if (data.stage === 'error') {
          eventSource.close()
          setGenerating(false)
          alert('❌ Hata: ' + data.message)
        }
      }
      eventSource.onerror = () => {
        eventSource.close()
        setGenerating(false)
        setProgress(null)
      }
    } catch (err) {
      alert('3D oluşturma hatası: ' + err.message)
      setGenerating(false)
      setProgress(null)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              📸 3D Model Fotoğrafları
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              {product.name} • {photos.length} fotoğraf
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Info Box */}
          <div style={{
            padding: '16px',
            backgroundColor: '#eff6ff',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #bfdbfe'
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#1e40af', fontSize: '14px' }}>💡 3D Model Nasıl Oluşturulur?</h4>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#1e40af', fontSize: '13px', lineHeight: 1.6 }}>
              <li>Ürünün <strong>en az 20 farklı açıdan</strong> fotoğrafını çekin</li>
              <li>Fotoğrafları buraya yükleyin</li>
              <li>"3D Model Oluştur" butonuna tıklayın</li>
              <li>Mac bilgisayarınızda otomatik olarak 3D model oluşturulacak</li>
            </ol>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            style={{
              padding: '32px',
              border: '2px dashed #d1d5db',
              borderRadius: '16px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s'
            }}
          >
            {uploading ? (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                <p style={{ margin: 0, color: '#6b7280' }}>Yükleniyor...</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#374151' }}>Fotoğraf Yükle</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Tıklayın veya sürükleyin (çoklu seçim yapabilirsiniz)</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleUpload(e.target.files)}
          />

          {/* Photos Grid */}
          {loading ? (
            <LoadingSpinner />
          ) : photos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {photos.map((photo, i) => (
                <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                  <img
                    src={FILES_URL + photo.url}
                    alt=""
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => handleDelete(photo.filename)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'rgba(220,38,38,0.9)',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>📷</p>
              <p>Henüz fotoğraf yüklenmemiş</p>
            </div>
          )}
        </div>

        {/* Footer - Generate Button */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          {generating && progress ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{progress.message}</span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>{progress.progress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: progress.progress + '%',
                  height: '100%',
                  backgroundColor: '#16a34a',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#e5e7eb',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                Kapat
              </button>
              <button
                onClick={handleGenerate}
                disabled={photos.length < 20}
                style={{
                  flex: 2,
                  padding: '14px',
                  backgroundColor: photos.length >= 20 ? '#16a34a' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: photos.length >= 20 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                🎯 3D Model Oluştur
                {photos.length < 20 && <span style={{ fontSize: '12px' }}>({20 - photos.length} fotoğraf daha)</span>}
              </button>
            </div>
          )}

          {product.glbFile && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#dcfce7',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <span style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
                Bu ürünün 3D modeli mevcut: {product.glbFile}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== PRODUCT MODAL ====================
function ProductModal({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price || '',
    description: product?.description || '',
    categoryId: product?.categoryId || '',
    isActive: product?.isActive !== false,
    isFeatured: product?.isFeatured || false,
    isCampaign: product?.isCampaign || false
  })
  const [activeTab, setActiveTab] = useState('info')
  const [thumbnail, setThumbnail] = useState(product?.thumbnail || null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(null)
  const thumbnailRef = useRef(null)
  const photosRef = useRef(null)

  const isEditing = !!product?.id

  // Load photos if editing
  useEffect(() => {
    if (isEditing) {
      loadPhotos()
    }
  }, [product?.id])

  const loadPhotos = async () => {
    setPhotosLoading(true)
    try {
      const res = await axios.get(API_URL + '/products/' + product.id + '/photos')
      setPhotos(res.data)
    } catch (err) {
      console.error('Fotoğraflar yüklenemedi:', err)
    } finally {
      setPhotosLoading(false)
    }
  }

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnail(URL.createObjectURL(file))
    }
  }

  const handlePhotosUpload = async (files) => {
    if (!files || files.length === 0 || !isEditing) return
    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('photos', f))
    try {
      await axios.post(API_URL + '/products/' + product.id + '/photos', formData)
      loadPhotos()
    } catch (err) {
      alert('Yükleme hatası: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoDelete = async (filename) => {
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return
    try {
      await axios.delete(API_URL + '/products/' + product.id + '/photos/' + filename)
      loadPhotos()
    } catch (err) {
      alert('Silme hatası: ' + err.message)
    }
  }

  const handleGenerate3D = async () => {
    if (photos.length < 20) {
      alert('3D model oluşturmak için en az 20 fotoğraf gerekli!')
      return
    }

    setGenerating(true)
    setProgress({ stage: 'starting', progress: 0, message: 'Başlatılıyor...' })

    try {
      await axios.post(API_URL + '/products/' + product.id + '/generate')
      
      const eventSource = new EventSource(API_URL + '/products/' + product.id + '/progress')
      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data)
        setProgress(data)
        if (data.stage === 'completed') {
          eventSource.close()
          setGenerating(false)
          alert('🎉 3D model başarıyla oluşturuldu!')
        } else if (data.stage === 'error') {
          eventSource.close()
          setGenerating(false)
          alert('❌ Hata: ' + data.message)
        }
      }
      eventSource.onerror = () => {
        eventSource.close()
        setGenerating(false)
        setProgress(null)
      }
    } catch (err) {
      alert('3D oluşturma hatası: ' + err.message)
      setGenerating(false)
      setProgress(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // First save product info
    const productData = { ...form, price: parseFloat(form.price) || 0 }
    
    try {
      let savedProduct
      if (isEditing) {
        const res = await axios.put(API_URL + '/products/' + product.id, productData)
        savedProduct = res.data
      } else {
        const res = await axios.post(API_URL + '/products', productData)
        savedProduct = res.data
      }

      // Upload thumbnail if selected
      if (thumbnailFile && savedProduct.id) {
        const formData = new FormData()
        formData.append('image', thumbnailFile)
        await axios.post(API_URL + '/products/' + savedProduct.id + '/thumbnail', formData)
      }

      onSave(savedProduct)
    } catch (err) {
      alert('Kaydetme hatası: ' + err.message)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            {isEditing ? 'Ürün Düzenle' : 'Yeni Ürün'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              backgroundColor: activeTab === 'info' ? 'white' : '#f9fafb',
              borderBottom: activeTab === 'info' ? '2px solid #dc2626' : '2px solid transparent',
              fontWeight: activeTab === 'info' ? '600' : '400',
              color: activeTab === 'info' ? '#dc2626' : '#6b7280',
              cursor: 'pointer'
            }}
          >
            📝 Bilgiler & Görsel
          </button>
          <button
            onClick={() => setActiveTab('ar')}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              backgroundColor: activeTab === 'ar' ? 'white' : '#f9fafb',
              borderBottom: activeTab === 'ar' ? '2px solid #dc2626' : '2px solid transparent',
              fontWeight: activeTab === 'ar' ? '600' : '400',
              color: activeTab === 'ar' ? '#dc2626' : '#6b7280',
              cursor: 'pointer'
            }}
          >
            📸 3D AR Fotoğrafları
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 'info' ? (
            <form onSubmit={handleSubmit}>
              {/* Thumbnail Upload */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  📷 Ürün Görseli (Kapak)
                </label>
                <div
                  onClick={() => thumbnailRef.current?.click()}
                  style={{
                    width: '100%',
                    height: '180px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '2px dashed #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {thumbnail ? (
                    <>
                      <img
                        src={thumbnailFile ? thumbnail : FILES_URL + '/images/' + thumbnail}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        padding: '8px 16px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}>
                        📷 Değiştir
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                      <p style={{ margin: 0, fontWeight: '500' }}>Görsel Yükle</p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Tıklayın veya sürükleyin</p>
                    </div>
                  )}
                </div>
                <input
                  ref={thumbnailRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleThumbnailSelect}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                    Fiyat *
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Kategori
                </label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Açıklama
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  style={textareaStyle}
                />
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span style={{ color: '#374151' }}>Aktif</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  <span style={{ color: '#374151' }}>Öne Çıkan</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isCampaign}
                    onChange={e => setForm({ ...form, isCampaign: e.target.checked })}
                  />
                  <span style={{ color: '#374151' }}>Kampanyalı</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💾 Kaydet
                </button>
              </div>
            </form>
          ) : (
            /* AR Tab */
            <div>
              {!isEditing ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#fef3c7',
                  borderRadius: '12px',
                  border: '1px solid #fcd34d'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                  <h3 style={{ margin: '0 0 8px', color: '#92400e' }}>Önce Ürünü Kaydedin</h3>
                  <p style={{ margin: 0, color: '#a16207', fontSize: '14px' }}>
                    3D model fotoğrafları yüklemek için önce "Bilgiler & Görsel" sekmesinden ürünü kaydetmeniz gerekiyor.
                  </p>
                </div>
              ) : (
                <>
                  {/* Info Box */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <h4 style={{ margin: '0 0 8px', color: '#1e40af', fontSize: '14px' }}>💡 3D Model Nasıl Oluşturulur?</h4>
                    <ol style={{ margin: 0, paddingLeft: '20px', color: '#1e40af', fontSize: '13px', lineHeight: 1.6 }}>
                      <li>Ürünün <strong>en az 20 farklı açıdan</strong> fotoğrafını çekin</li>
                      <li>Fotoğrafları buraya yükleyin</li>
                      <li>"3D Model Oluştur" butonuna tıklayın</li>
                    </ol>
                  </div>

                  {/* Photo Count */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>
                      📸 Yüklenen Fotoğraflar
                    </span>
                    <span style={{
                      padding: '6px 14px',
                      backgroundColor: photos.length >= 20 ? '#dcfce7' : '#fef3c7',
                      color: photos.length >= 20 ? '#166534' : '#92400e',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {photos.length} / 20 minimum
                    </span>
                  </div>

                  {/* Upload Area */}
                  <div
                    onClick={() => !uploading && photosRef.current?.click()}
                    style={{
                      padding: '28px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '12px',
                      textAlign: 'center',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      marginBottom: '20px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    {uploading ? (
                      <div>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                        <p style={{ margin: 0, color: '#6b7280' }}>Yükleniyor...</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                        <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#374151' }}>Fotoğraf Yükle</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Tıklayın (çoklu seçim yapabilirsiniz)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={photosRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => handlePhotosUpload(e.target.files)}
                  />

                  {/* Photos Grid */}
                  {photosLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <LoadingSpinner />
                    </div>
                  ) : photos.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                      {photos.map((photo, i) => (
                        <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                          <img
                            src={FILES_URL + photo.url}
                            alt=""
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            onClick={() => handlePhotoDelete(photo.filename)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: 'rgba(220,38,38,0.9)',
                              color: 'white',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', backgroundColor: '#f9fafb', borderRadius: '12px', marginBottom: '20px' }}>
                      <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📷</p>
                      <p style={{ margin: 0 }}>Henüz fotoğraf yüklenmemiş</p>
                    </div>
                  )}

                  {/* Generate Button */}
                  {generating && progress ? (
                    <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#166534' }}>{progress.message}</span>
                        <span style={{ fontSize: '14px', color: '#166534' }}>{progress.progress}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: progress.progress + '%',
                          height: '100%',
                          backgroundColor: '#16a34a',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerate3D}
                      disabled={photos.length < 20}
                      style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: photos.length >= 20 ? '#16a34a' : '#d1d5db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: photos.length >= 20 ? 'pointer' : 'not-allowed',
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      🎯 3D Model Oluştur
                      {photos.length < 20 && <span style={{ fontWeight: '400' }}>({20 - photos.length} fotoğraf daha gerekli)</span>}
                    </button>
                  )}

                  {(product.glbFile || product.usdzFile) && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{
                        padding: '14px',
                        backgroundColor: '#dcfce7',
                        borderRadius: '12px 12px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '24px' }}>✅</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: '600', color: '#166534' }}>3D Model Hazır!</p>
                          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#15803d' }}>
                            {product.glbFile && <span>GLB ✓</span>}
                            {product.glbFile && product.usdzFile && ' | '}
                            {product.usdzFile && <span>USDZ ✓</span>}
                          </p>
                        </div>
                        {/* GLB yoksa dönüştür butonu */}
                        {product.usdzFile && !product.glbFile && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await axios.post(API_URL + '/products/' + product.id + '/convert')
                                if (res.data.glbFile) {
                                  alert('✅ GLB oluşturuldu: ' + res.data.size)
                                  loadPhotos()
                                }
                              } catch (err) {
                                alert('❌ Dönüştürme hatası: ' + (err.response?.data?.error || err.message))
                              }
                            }}
                            style={{
                              padding: '8px 14px',
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            🔄 GLB'ye Dönüştür
                          </button>
                        )}
                      </div>
                      
                      {/* Platform Uyarısı - USDZ var ama GLB yok */}
                      {product.usdzFile && !product.glbFile && (
                        <div style={{
                          padding: '12px 14px',
                          backgroundColor: '#fef3c7',
                          borderLeft: '1px solid #bbf7d0',
                          borderRight: '1px solid #bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '20px' }}>⚠️</span>
                          <div style={{ fontSize: '13px', color: '#92400e' }}>
                            <strong>USDZ</strong> sadece iOS'ta çalışır. Android ve web için <strong>GLB</strong> gerekli.
                            <br />Blender yüklüyse "GLB'ye Dönüştür" butonuna tıklayın.
                          </div>
                        </div>
                      )}

                      {/* 3D Model Viewer */}
                      <div style={{
                        height: '300px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: product.usdzFile && !product.glbFile ? '0' : '0 0 12px 12px',
                        border: '1px solid #bbf7d0',
                        borderTop: 'none',
                        overflow: 'hidden'
                      }}>
                        <model-viewer
                          src={FILES_URL + '/outputs/' + (product.glbFile || product.usdzFile)}
                          ios-src={product.usdzFile ? FILES_URL + '/outputs/' + product.usdzFile : undefined}
                          alt={product.name}
                          auto-rotate
                          camera-controls
                          shadow-intensity="1"
                          exposure="0.8"
                          environment-image="neutral"
                          style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                        >
                          <div slot="progress-bar" style={{ display: 'none' }}></div>
                        </model-viewer>
                      </div>
                      
                      {/* Alt bilgi - dosya isimleri */}
                      <div style={{
                        padding: '10px 14px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0 0 12px 12px',
                        border: '1px solid #e5e7eb',
                        borderTop: 'none',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {product.glbFile && <span>📦 {product.glbFile}</span>}
                        {product.glbFile && product.usdzFile && ' • '}
                        {product.usdzFile && <span>📱 {product.usdzFile}</span>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== CATEGORIES PAGE ====================
function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await axios.get(API_URL + '/categories')
      setCategories(res.data)
    } catch (err) {
      console.error('Kategoriler yuklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (categoryData) => {
    try {
      if (editingCategory?.id) {
        await axios.put(API_URL + '/categories/' + editingCategory.id, categoryData)
      } else {
        await axios.post(API_URL + '/categories', categoryData)
      }
      loadCategories()
      setShowModal(false)
      setEditingCategory(null)
    } catch (err) {
      alert('Kaydetme hatası: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
    try {
      await axios.delete(API_URL + '/categories/' + id)
      loadCategories()
    } catch (err) {
      alert('Silme hatası: ' + err.message)
    }
  }

  const handleImageUpload = async (categoryId, file) => {
    const formData = new FormData()
    formData.append('image', file)
    try {
      await axios.post(API_URL + '/categories/' + categoryId + '/image', formData)
      loadCategories()
    } catch (err) {
      alert('Resim yükleme hatası: ' + err.message)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: '#6b7280' }}>{categories.length} kategori</p>
        <button
          onClick={() => { setEditingCategory({}); setShowModal(true) }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <span>+</span> Yeni Kategori
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {categories.map(category => (
          <div key={category.id} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ position: 'relative', height: '140px', backgroundColor: '#f3f4f6' }}>
              {category.image ? (
                <img src={FILES_URL + '/images/' + category.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}>
                  {category.icon}
                </div>
              )}
              <input type="file" accept="image/*" hidden id={'cat-img-' + category.id} onChange={(e) => e.target.files[0] && handleImageUpload(category.id, e.target.files[0])} />
              <button onClick={() => document.getElementById('cat-img-' + category.id)?.click()} style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                📷 Resim
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{category.icon} {category.name}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditingCategory(category); setShowModal(true) }} style={{ flex: 1, padding: '10px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', color: '#374151' }}>✏️ Düzenle</button>
                <button onClick={() => handleDelete(category.id)} style={{ padding: '10px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>{editingCategory?.id ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Kategori Adı</label>
                <input type="text" defaultValue={editingCategory?.name || ''} id="cat-name" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>İkon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['🍕', '🍔', '🌮', '🍜', '🍣', '🥗', '🍰', '☕', '🍺', '🥤', '🍳', '🥪', '🍝', '🍖', '🍗', '🥘', '🍲', '🧁', '🍩', '🍦'].map(icon => (
                    <button key={icon} type="button" onClick={() => document.getElementById('cat-icon').value = icon} style={{ width: '44px', height: '44px', borderRadius: '10px', border: '2px solid #e5e7eb', backgroundColor: 'white', fontSize: '24px', cursor: 'pointer' }}>{icon}</button>
                  ))}
                </div>
                <input type="hidden" id="cat-icon" defaultValue={editingCategory?.icon || '📁'} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setShowModal(false); setEditingCategory(null) }} style={{ flex: 1, padding: '14px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: '#374151' }}>İptal</button>
                <button onClick={() => handleSave({ name: document.getElementById('cat-name').value, icon: document.getElementById('cat-icon').value })} style={{ flex: 1, padding: '14px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== ANNOUNCEMENTS PAGE ====================
function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await axios.get(API_URL + '/announcements')
      setAnnouncements(res.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSave = async (data) => {
    try {
      if (editing?.id) await axios.put(API_URL + '/announcements/' + editing.id, data)
      else await axios.post(API_URL + '/announcements', data)
      loadData(); setShowModal(false); setEditing(null)
    } catch (err) { alert('Hata: ' + err.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await axios.delete(API_URL + '/announcements/' + id); loadData() } catch (err) { alert('Hata: ' + err.message) }
  }

  const toggleActive = async (item) => {
    try { await axios.put(API_URL + '/announcements/' + item.id, { isActive: !item.isActive }); loadData() } catch (err) { alert('Hata: ' + err.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: '#6b7280' }}>{announcements.length} duyuru</p>
        <button onClick={() => { setEditing({}); setShowModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
          <span>+</span> Yeni Duyuru
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {announcements.map(item => (
          <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', opacity: item.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontSize: '32px' }}>{item.icon || '📢'}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{item.message}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => toggleActive(item)} style={{ padding: '8px 12px', backgroundColor: item.isActive ? '#dcfce7' : '#f3f4f6', color: item.isActive ? '#16a34a' : '#6b7280', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>{item.isActive ? '✓ Aktif' : 'Pasif'}</button>
                <button onClick={() => { setEditing(item); setShowModal(true) }} style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#374151' }}>✏️</button>
                <button onClick={() => handleDelete(item.id)} style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '450px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>{editing?.id ? 'Duyuru Düzenle' : 'Yeni Duyuru'}</h2>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Başlık</label>
                <input type="text" id="ann-title" defaultValue={editing?.title || ''} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Mesaj</label>
                <textarea id="ann-message" defaultValue={editing?.message || ''} rows={3} style={textareaStyle} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>İkon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['📢', '🎉', '🔥', '⭐', '💥', '🎁', '🆕', '⚡', '❤️', '🎊', '📣', '💰', '🏷️', '✨', '🌟'].map(icon => (
                    <button key={icon} type="button" onClick={() => document.getElementById('ann-icon').value = icon} style={{ width: '44px', height: '44px', borderRadius: '10px', border: '2px solid #e5e7eb', backgroundColor: 'white', fontSize: '24px', cursor: 'pointer' }}>{icon}</button>
                  ))}
                </div>
                <input type="hidden" id="ann-icon" defaultValue={editing?.icon || '📢'} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setShowModal(false); setEditing(null) }} style={{ flex: 1, padding: '14px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: '#374151' }}>İptal</button>
                <button onClick={() => handleSave({ title: document.getElementById('ann-title').value, message: document.getElementById('ann-message').value, icon: document.getElementById('ann-icon').value })} style={{ flex: 1, padding: '14px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== REVIEWS PAGE ====================
function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try { const res = await axios.get(API_URL + '/reviews'); setReviews(res.data.reverse()) } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await axios.delete(API_URL + '/reviews/' + id); loadData() } catch (err) { alert('Hata: ' + err.message) }
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '14px' }}>Toplam Yorum</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>{reviews.length}</p>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '14px' }}>Ortalama Puan</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>⭐ {avgRating}</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {reviews.length > 0 ? reviews.map((review, i) => (
          <div key={review.id} style={{ padding: '20px', borderBottom: i < reviews.length - 1 ? '1px solid #e5e7eb' : 'none', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '20px', filter: s <= review.rating ? 'none' : 'grayscale(1)' }}>⭐</span>)}</div>
            <div style={{ flex: 1 }}>
              {review.note && <p style={{ margin: '0 0 8px', color: '#374151' }}>{review.note}</p>}
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#9ca3af' }}>
                {review.contact && <span>📧 {review.contact}</span>}
                <span>📅 {new Date(review.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
            <button onClick={() => handleDelete(review.id)} style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>🗑️</button>
          </div>
        )) : <p style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Henüz yorum yok</p>}
      </div>
    </div>
  )
}

// ==================== CATEGORY LAYOUT PAGE ====================
function CategoryLayoutPage() {
  const [categories, setCategories] = useState([])
  const [layouts, setLayouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [catRes, layoutRes] = await Promise.all([axios.get(API_URL + '/categories'), axios.get(API_URL + '/category-layouts')])
      setCategories(catRes.data)
      setLayouts(layoutRes.data.length > 0 ? layoutRes.data : [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const addRow = (layout) => setLayouts([...layouts, { layout, categoryIds: [] }])
  const removeRow = (i) => setLayouts(layouts.filter((_, idx) => idx !== i))
  const addCategoryToRow = (ri, catId) => {
    const nl = [...layouts]
    const max = nl[ri].layout === 'full' ? 1 : nl[ri].layout === 'third' ? 3 : 2
    if (nl[ri].categoryIds.length < max) { nl[ri].categoryIds.push(catId); setLayouts(nl) }
  }
  const removeCategoryFromRow = (ri, catId) => {
    const nl = [...layouts]
    nl[ri].categoryIds = nl[ri].categoryIds.filter(id => id !== catId)
    setLayouts(nl)
  }
  const changeRowLayout = (ri, layout) => {
    const nl = [...layouts]
    nl[ri].layout = layout
    const max = layout === 'full' ? 1 : layout === 'third' ? 3 : 2
    nl[ri].categoryIds = nl[ri].categoryIds.slice(0, max)
    setLayouts(nl)
  }
  const saveLayouts = async () => {
    try { await axios.put(API_URL + '/category-layouts', layouts); alert('Kaydedildi!') } catch (err) { alert('Hata: ' + err.message) }
  }

  const usedIds = layouts.flatMap(l => l.categoryIds)
  const available = categories.filter(c => !usedIds.includes(c.id))

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: '#6b7280' }}>Kategorilerin menüde nasıl görüneceğini ayarlayın</p>
        <button onClick={saveLayouts} style={{ padding: '12px 24px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>💾 Kaydet</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>📐 Düzen</h3>
          {layouts.map((row, ri) => (
            <div key={ri} style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <select value={row.layout} onChange={(e) => changeRowLayout(ri, e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: 'white', color: '#374151' }}>
                  <option value="full">Tam Genişlik (1)</option>
                  <option value="half">Yarı Yarıya (2)</option>
                  <option value="third">Üçlü (3)</option>
                </select>
                <button onClick={() => removeRow(ri)} style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>🗑️ Sil</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: row.layout === 'full' ? '1fr' : row.layout === 'third' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px' }}>
                {row.categoryIds.map(cid => {
                  const cat = categories.find(c => c.id === cid)
                  return cat ? (
                    <div key={cid} style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb' }}>
                      <span style={{ color: '#374151' }}>{cat.icon} {cat.name}</span>
                      <button onClick={() => removeCategoryFromRow(ri, cid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px' }}>✕</button>
                    </div>
                  ) : null
                })}
                {row.categoryIds.length < (row.layout === 'full' ? 1 : row.layout === 'third' ? 3 : 2) && (
                  <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '2px dashed #d1d5db', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Kategori ekleyin →</div>
                )}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => addRow('full')} style={{ padding: '10px 16px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#374151' }}>+ Tam</button>
            <button onClick={() => addRow('half')} style={{ padding: '10px 16px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#374151' }}>+ Yarı</button>
            <button onClick={() => addRow('third')} style={{ padding: '10px 16px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#374151' }}>+ Üçlü</button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>📁 Kategoriler</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {available.map(cat => (
              <div key={cat.id} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#374151' }}>{cat.icon} {cat.name}</span>
                <select onChange={(e) => { if (e.target.value) { addCategoryToRow(parseInt(e.target.value), cat.id); e.target.value = '' } }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', backgroundColor: 'white', color: '#374151' }}>
                  <option value="">Ekle →</option>
                  {layouts.map((row, i) => {
                    const max = row.layout === 'full' ? 1 : row.layout === 'third' ? 3 : 2
                    return row.categoryIds.length < max ? <option key={i} value={i}>Satır {i + 1}</option> : null
                  })}
                </select>
              </div>
            ))}
            {available.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Tüm kategoriler eklendi</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== SETTINGS PAGE ====================
function SettingsPage() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try { const res = await axios.get(API_URL + '/settings'); setSettings(res.data) } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try { await axios.put(API_URL + '/settings', settings); alert('Kaydedildi!') } catch (err) { alert('Hata: ' + err.message) } finally { setSaving(false) }
  }

  const handleImageUpload = async (type, file) => {
    const formData = new FormData()
    formData.append('image', file)
    try {
      const endpoint = type === 'logo' ? '/settings/logo' : type === 'banner' ? '/settings/banner' : '/settings/homepage-image'
      await axios.post(API_URL + endpoint, formData)
      loadData()
    } catch (err) { alert('Hata: ' + err.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>🏪 Restoran Bilgileri</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Restoran Adı</label><input type="text" value={settings.restaurantName || ''} onChange={e => setSettings({ ...settings, restaurantName: e.target.value })} style={inputStyle} /></div>
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Slogan</label><input type="text" value={settings.slogan || ''} onChange={e => setSettings({ ...settings, slogan: e.target.value })} style={inputStyle} /></div>
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Telefon</label><input type="text" value={settings.phone || ''} onChange={e => setSettings({ ...settings, phone: e.target.value })} style={inputStyle} /></div>
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Para Birimi</label><input type="text" value={settings.currency || '₺'} onChange={e => setSettings({ ...settings, currency: e.target.value })} style={inputStyle} /></div>
        </div>
        <div style={{ marginTop: '20px' }}><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Adres</label><textarea value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} rows={2} style={textareaStyle} /></div>
        <div style={{ marginTop: '20px' }}><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Çalışma Saatleri</label><input type="text" value={settings.openingHours || ''} onChange={e => setSettings({ ...settings, openingHours: e.target.value })} placeholder="Örn: 09:00 - 22:00" style={inputStyle} /></div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>🖼️ Görseller</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[{ key: 'logo', label: 'Logo' }, { key: 'homepageImage', label: 'Anasayfa' }, { key: 'bannerImage', label: 'Banner' }].map(img => (
            <div key={img.key}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>{img.label}</label>
              <div onClick={() => document.getElementById('img-' + img.key)?.click()} style={{ width: '100%', height: '120px', backgroundColor: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '2px dashed #d1d5db' }}>
                {settings[img.key] ? <img src={FILES_URL + '/images/' + settings[img.key]} alt="" style={{ width: '100%', height: '100%', objectFit: img.key === 'logo' ? 'contain' : 'cover' }} /> : <span style={{ color: '#9ca3af' }}>📷 Yükle</span>}
              </div>
              <input id={'img-' + img.key} type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && handleImageUpload(img.key === 'homepageImage' ? 'homepage' : img.key, e.target.files[0])} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>📱 Sosyal Medya</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>📷 Instagram</label><input type="text" value={settings.instagram || ''} onChange={e => setSettings({ ...settings, instagram: e.target.value })} placeholder="@kullaniciadi" style={inputStyle} /></div>
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>📘 Facebook</label><input type="text" value={settings.facebook || ''} onChange={e => setSettings({ ...settings, facebook: e.target.value })} placeholder="sayfaadi" style={inputStyle} /></div>
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>📝 Google Yorum URL</label><input type="text" value={settings.googleReviewUrl || ''} onChange={e => setSettings({ ...settings, googleReviewUrl: e.target.value })} placeholder="https://g.page/..." style={inputStyle} /></div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>🎨 Tema</h3>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Ana Renk</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input type="color" value={settings.primaryColor || '#dc2626'} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} style={{ width: '60px', height: '40px', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer' }} />
            <input type="text" value={settings.primaryColor || '#dc2626'} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', width: '120px', backgroundColor: 'white', color: '#374151' }} />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Kaydediliyor...' : '💾 Ayarları Kaydet'}
      </button>
    </div>
  )
}

// ==================== LOADING SPINNER ====================
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ==================== MAIN APP ====================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/admin/products" element={<AdminLayout><ProductsPage /></AdminLayout>} />
        <Route path="/admin/categories" element={<AdminLayout><CategoriesPage /></AdminLayout>} />
        <Route path="/admin/announcements" element={<AdminLayout><AnnouncementsPage /></AdminLayout>} />
        <Route path="/admin/reviews" element={<AdminLayout><ReviewsPage /></AdminLayout>} />
        <Route path="/admin/layout" element={<AdminLayout><CategoryLayoutPage /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><SettingsPage /></AdminLayout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App