import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import heic2any from 'heic2any'
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

// ==================== DARK THEME COLORS ====================
const colors = {
  bg: '#0a0a0a',
  bgCard: '#141414',
  bgElevated: '#1a1a1a',
  bgInput: '#1f1f1f',
  bgHover: '#252525',
  
  text: '#ffffff',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  
  border: '#2a2a2a',
  borderLight: '#333333',
  
  red: '#dc2626',
  redHover: '#b91c1c',
  redBg: 'rgba(220, 38, 38, 0.15)',
  
  green: '#16a34a',
  greenBg: 'rgba(22, 163, 74, 0.15)',
  
  yellow: '#f59e0b',
  yellowBg: 'rgba(245, 158, 11, 0.15)',
  
  blue: '#2563eb'
}

// ==================== FILE HELPERS ====================
const isHeicFile = (file) => {
  if (!file) return false
  const name = (file.name || '').toLowerCase()
  const type = (file.type || '').toLowerCase()
  return name.endsWith('.heic') || name.endsWith('.heif') || type.includes('heic') || type.includes('heif')
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// HEIC to JPG converter
const convertHeicToJpg = async (file) => {
  try {
    console.log('Converting HEIC to JPG:', file.name)
    const blob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    })
    
    // heic2any can return array or single blob
    const resultBlob = Array.isArray(blob) ? blob[0] : blob
    
    // Create new file with .jpg extension
    const newFileName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg')
    const convertedFile = new File([resultBlob], newFileName, { type: 'image/jpeg' })
    
    console.log('Converted:', newFileName, formatFileSize(convertedFile.size))
    return convertedFile
  } catch (error) {
    console.error('HEIC conversion error:', error)
    throw error
  }
}

// Process file - convert if HEIC
const processImageFile = async (file, onProgress) => {
  if (isHeicFile(file)) {
    if (onProgress) onProgress('converting')
    const converted = await convertHeicToJpg(file)
    return converted
  }
  return file
}

// ==================== STYLES ====================
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  border: `1px solid ${colors.border}`,
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: colors.bgInput,
  color: colors.text,
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

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: '500',
  color: colors.text
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bg }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '260px' : '0px',
        backgroundColor: colors.bgCard,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: isMobile ? 'fixed' : 'relative',
        height: '100vh',
        zIndex: 100,
        borderRight: `1px solid ${colors.border}`
      }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
          <h1 style={{ margin: 0, color: colors.text, fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🍽️</span> AR Menu
          </h1>
          <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: '13px' }}>Yönetim Paneli</p>
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
                color: location.pathname === item.path ? 'white' : colors.textSecondary,
                backgroundColor: location.pathname === item.path ? colors.red : 'transparent',
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
              backgroundColor: colors.bgElevated,
              color: colors.text,
              textDecoration: 'none',
              fontWeight: '500',
              border: `1px solid ${colors.border}`
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
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 99
          }}
        />
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <div style={{
          backgroundColor: colors.bgCard,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderBottom: `1px solid ${colors.border}`
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              color: colors.text
            }}
          >
            ☰
          </button>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: colors.text }}>
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
    { icon: '🍽️', label: 'Toplam Ürün', value: stats.products, color: colors.red },
    { icon: '📁', label: 'Kategori', value: stats.categories, color: colors.blue },
    { icon: '⭐', label: 'Yorum', value: stats.reviews, color: colors.yellow },
    { icon: '📢', label: 'Duyuru', value: stats.announcements, color: colors.green },
  ]

  return (
    <div>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((stat, i) => (
          <div key={i} style={{
            backgroundColor: colors.bgCard,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${colors.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '32px' }}>{stat.icon}</span>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: stat.color + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: stat.color, fontSize: '24px', fontWeight: '700' }}>{stat.value}</span>
              </div>
            </div>
            <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Reviews */}
      <div style={{ backgroundColor: colors.bgCard, borderRadius: '16px', padding: '24px', border: `1px solid ${colors.border}` }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: colors.text }}>
          ⭐ Son Yorumlar
        </h3>
        {recentReviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentReviews.map(review => (
              <div key={review.id} style={{
                padding: '16px',
                backgroundColor: colors.bgElevated,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: '18px', filter: s <= review.rating ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  {review.note && <p style={{ margin: 0, color: colors.text, fontSize: '14px' }}>{review.note}</p>}
                  {review.contact && <p style={{ margin: '4px 0 0', color: colors.textMuted, fontSize: '12px' }}>{review.contact}</p>}
                </div>
                <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                  {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: colors.textMuted, textAlign: 'center', padding: '40px' }}>Henüz yorum yok</p>
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
    let processedFile = file
    if (isHeicFile(file)) {
      processedFile = await convertHeicToJpg(file)
    }
    const formData = new FormData()
    formData.append('image', processedFile)
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
        <p style={{ margin: 0, color: colors.textSecondary }}>{products.length} ürün</p>
        <button
          onClick={() => { setEditingProduct({}); setShowModal(true) }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: colors.red,
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
function ProductCard({ product, categories, onEdit, onDelete, onThumbnailUpload, onOpenPhotos }) {
  const thumbnailRef = useRef(null)
  const category = categories.find(c => c.id === product.categoryId)
  const [show3D, setShow3D] = useState(false)

  const modelFile = product.glbFile || product.usdzFile
  const modelUrl = modelFile ? FILES_URL + '/outputs/' + modelFile : null
  const iosUrl = product.usdzFile ? FILES_URL + '/outputs/' + product.usdzFile : modelUrl

  return (
    <div style={{
      backgroundColor: colors.bgCard,
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${colors.border}`
    }}>
      {/* Thumbnail / 3D Viewer Toggle */}
      <div style={{ position: 'relative', height: '200px', backgroundColor: colors.bgElevated }}>
        {show3D && modelUrl ? (
          <model-viewer
            src={modelUrl}
            ios-src={iosUrl}
            alt={product.name}
            auto-rotate
            camera-controls
            shadow-intensity="1"
            exposure="0.8"
            environment-image="neutral"
            style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}
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
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: colors.textMuted }}>
            🍽️
          </div>
        )}
        
        {/* Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {product.isCampaign && (
            <span style={{ padding: '4px 10px', backgroundColor: colors.red, color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
              Kampanya
            </span>
          )}
          {product.isFeatured && (
            <span style={{ padding: '4px 10px', backgroundColor: colors.yellow, color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
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
              backgroundColor: show3D ? colors.green : 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {show3D ? '📷 Resim' : '🎯 3D'}
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
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            📷
          </button>
        )}
        <input
          ref={thumbnailRef}
          type="file"
          accept="image/*,.heic,.heif"
          hidden
          onChange={(e) => e.target.files[0] && onThumbnailUpload(e.target.files[0])}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: colors.text }}>{product.name}</h3>
            {category && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textSecondary }}>
                {category.icon} {category.name}
              </p>
            )}
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: colors.red }}>{product.price}₺</span>
        </div>

        {/* 3D AR Section */}
        <div style={{
          padding: '14px',
          backgroundColor: modelFile ? colors.greenBg : 'rgba(22, 163, 74, 0.08)',
          borderRadius: '12px',
          marginBottom: '12px',
          border: `1px solid ${modelFile ? 'rgba(22, 163, 74, 0.3)' : 'rgba(22, 163, 74, 0.2)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{modelFile ? '✅' : '📸'}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: colors.green }}>
                {modelFile ? '3D Model Hazır' : '3D Model'}
              </span>
            </div>
            <span style={{
              padding: '4px 10px',
              backgroundColor: modelFile ? colors.green : colors.yellow,
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {modelFile ? 'AR ✓' : `${product.photoCount || 0}/20`}
            </span>
          </div>
          
          <button
            onClick={onOpenPhotos}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: modelFile ? 'rgba(22, 163, 74, 0.3)' : colors.green,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {modelFile ? '🔄 Güncelle' : '📷 Fotoğraf Yükle'}
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: colors.bgElevated,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              color: colors.text
            }}
          >
            ✏️ Düzenle
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '10px 16px',
              backgroundColor: colors.redBg,
              color: colors.red,
              border: `1px solid rgba(220, 38, 38, 0.3)`,
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
  const [converting, setConverting] = useState(false)
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
    
    setConverting(true)
    
    try {
      // Convert all HEIC files to JPG
      const processedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          if (isHeicFile(file)) {
            return await convertHeicToJpg(file)
          }
          return file
        })
      )
      
      setConverting(false)
      setUploading(true)
      
      const formData = new FormData()
      processedFiles.forEach(f => formData.append('photos', f))
      
      await axios.post(API_URL + '/products/' + product.id + '/photos', formData)
      loadPhotos()
      onRefresh()
    } catch (err) {
      alert('Yükleme hatası: ' + err.message)
    } finally {
      setUploading(false)
      setConverting(false)
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
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: colors.bgCard,
        borderRadius: '20px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${colors.border}`
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: colors.text }}>
              📸 3D Model Fotoğrafları
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: colors.textSecondary }}>
              {product.name} • {photos.length} fotoğraf
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.textSecondary }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Upload Area */}
          <div
            onClick={() => !uploading && !converting && fileRef.current?.click()}
            style={{
              padding: '32px',
              border: `2px dashed ${colors.border}`,
              borderRadius: '16px',
              textAlign: 'center',
              cursor: (uploading || converting) ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              backgroundColor: colors.bgElevated
            }}
          >
            {converting ? (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
                <p style={{ margin: 0, color: colors.textSecondary, fontWeight: '500' }}>HEIC → JPG Dönüştürülüyor...</p>
              </div>
            ) : uploading ? (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                <p style={{ margin: 0, color: colors.textSecondary }}>Yükleniyor...</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <p style={{ margin: '0 0 4px', fontWeight: '600', color: colors.text }}>Fotoğraf Yükle</p>
                <p style={{ margin: 0, fontSize: '13px', color: colors.textMuted }}>Çoklu seçim yapabilirsiniz (HEIC desteklenir)</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
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
                <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: colors.bgElevated }}>
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
                      backgroundColor: colors.red,
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
            <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>📷</p>
              <p>Henüz fotoğraf yüklenmemiş</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated }}>
          {generating && progress ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: colors.text }}>{progress.message}</span>
                <span style={{ fontSize: '14px', color: colors.textSecondary }}>{progress.progress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: colors.border, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: progress.progress + '%', height: '100%', backgroundColor: colors.green, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '14px', backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: colors.text }}>
                Kapat
              </button>
              <button
                onClick={handleGenerate}
                disabled={photos.length < 20}
                style={{
                  flex: 2,
                  padding: '14px',
                  backgroundColor: photos.length >= 20 ? colors.green : colors.textMuted,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: photos.length >= 20 ? 'pointer' : 'not-allowed'
                }}
              >
                🎯 3D Model Oluştur {photos.length < 20 && `(${20 - photos.length} daha)`}
              </button>
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
  
  // Thumbnail states
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [thumbnailConverting, setThumbnailConverting] = useState(false)
  
  // Photo states
  const [photos, setPhotos] = useState([])
  const [localPhotos, setLocalPhotos] = useState([]) // {file, previewUrl}
  const [photosLoading, setPhotosLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(null)
  
  const thumbnailRef = useRef(null)
  const photosRef = useRef(null)

  const isEditing = !!product?.id

  // Set existing thumbnail
  useEffect(() => {
    if (product?.thumbnail) {
      setThumbnailPreview(FILES_URL + '/images/' + product.thumbnail)
    }
  }, [product?.thumbnail])

  // Load photos if editing
  useEffect(() => {
    if (isEditing) {
      loadPhotos()
    }
  }, [product?.id])

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      localPhotos.forEach(p => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
      })
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview)
      }
    }
  }, [])

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

  // Handle thumbnail selection with HEIC conversion
  const handleThumbnailSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      let processedFile = file
      
      if (isHeicFile(file)) {
        setThumbnailConverting(true)
        console.log('Converting HEIC thumbnail:', file.name)
        processedFile = await convertHeicToJpg(file)
        setThumbnailConverting(false)
      }
      
      setThumbnailFile(processedFile)
      const previewUrl = URL.createObjectURL(processedFile)
      setThumbnailPreview(previewUrl)
      
      console.log('Thumbnail ready:', processedFile.name)
    } catch (error) {
      console.error('Thumbnail processing error:', error)
      alert('Görsel işlenirken hata oluştu: ' + error.message)
      setThumbnailConverting(false)
    }
  }

  // Handle AR photos selection with HEIC conversion
  const handlePhotosSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    setConverting(true)
    
    try {
      // Process all files (convert HEIC to JPG)
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          if (isHeicFile(file)) {
            return await convertHeicToJpg(file)
          }
          return file
        })
      )
      
      // Create previews
      const newLocalPhotos = processedFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name
      }))
      
      setLocalPhotos(prev => [...prev, ...newLocalPhotos])
      setConverting(false)
      
      // If product exists, upload immediately
      if (isEditing) {
        await uploadPhotos(processedFiles)
      }
    } catch (error) {
      console.error('Photo processing error:', error)
      alert('Fotoğraflar işlenirken hata oluştu: ' + error.message)
      setConverting(false)
    }
  }

  const uploadPhotos = async (files) => {
    if (!files || files.length === 0 || !isEditing) return
    setUploading(true)
    
    const formData = new FormData()
    files.forEach(f => formData.append('photos', f))
    
    try {
      await axios.post(API_URL + '/products/' + product.id + '/photos', formData)
      await loadPhotos()
      setLocalPhotos([])
    } catch (err) {
      alert('Yükleme hatası: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const removeLocalPhoto = (index) => {
    setLocalPhotos(prev => {
      const newPhotos = [...prev]
      if (newPhotos[index].previewUrl) {
        URL.revokeObjectURL(newPhotos[index].previewUrl)
      }
      newPhotos.splice(index, 1)
      return newPhotos
    })
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

      // Upload local photos for new products
      if (!isEditing && localPhotos.length > 0 && savedProduct.id) {
        const formData = new FormData()
        localPhotos.forEach(p => formData.append('photos', p.file))
        await axios.post(API_URL + '/products/' + savedProduct.id + '/photos', formData)
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
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: colors.bgCard,
        borderRadius: '20px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${colors.border}`
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: colors.text }}>
            {isEditing ? 'Ürün Düzenle' : 'Yeni Ürün'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.textSecondary }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}` }}>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              backgroundColor: activeTab === 'info' ? colors.bgCard : colors.bgElevated,
              borderBottom: activeTab === 'info' ? `2px solid ${colors.red}` : '2px solid transparent',
              fontWeight: activeTab === 'info' ? '600' : '400',
              color: activeTab === 'info' ? colors.red : colors.textSecondary,
              cursor: 'pointer'
            }}
          >
            📝 Bilgiler
          </button>
          <button
            onClick={() => setActiveTab('ar')}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              backgroundColor: activeTab === 'ar' ? colors.bgCard : colors.bgElevated,
              borderBottom: activeTab === 'ar' ? `2px solid ${colors.red}` : '2px solid transparent',
              fontWeight: activeTab === 'ar' ? '600' : '400',
              color: activeTab === 'ar' ? colors.red : colors.textSecondary,
              cursor: 'pointer'
            }}
          >
            📸 3D Fotoğraflar
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 'info' ? (
            <form onSubmit={handleSubmit}>
              {/* Thumbnail Upload */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>
                  📷 Ürün Görseli
                </label>
                <div
                  onClick={() => !thumbnailConverting && thumbnailRef.current?.click()}
                  style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: colors.bgElevated,
                    borderRadius: '12px',
                    border: `2px dashed ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: thumbnailConverting ? 'not-allowed' : 'pointer',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {thumbnailConverting ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
                      <p style={{ margin: 0, color: colors.textSecondary, fontWeight: '500' }}>HEIC → JPG Dönüştürülüyor...</p>
                    </div>
                  ) : thumbnailPreview ? (
                    <>
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        padding: '8px 16px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}>
                        📷 Değiştir
                      </div>
                      {thumbnailFile && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          padding: '6px 12px',
                          backgroundColor: 'rgba(22, 163, 74, 0.9)',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          ✅ Yeni görsel
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: colors.textMuted }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
                      <p style={{ margin: 0, fontWeight: '500', color: colors.text }}>Görsel Yükle</p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px' }}>HEIC desteklenir, otomatik JPG'ye çevrilir</p>
                    </div>
                  )}
                </div>
                <input
                  ref={thumbnailRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  hidden
                  onChange={handleThumbnailSelect}
                />
                
                {thumbnailFile && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px 14px',
                    backgroundColor: colors.greenBg,
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: colors.green,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>✅</span>
                    <span>{thumbnailFile.name}</span>
                    <span style={{ marginLeft: 'auto', color: colors.textMuted }}>
                      {formatFileSize(thumbnailFile.size)}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    style={inputStyle}
                    placeholder="Ürün adı girin"
                  />
                </div>
                <div>
                  <label style={labelStyle}>
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
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
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
                <label style={labelStyle}>
                  Açıklama
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  style={textareaStyle}
                  placeholder="Ürün açıklaması..."
                />
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: colors.text }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  <span>Aktif</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: colors.text }}>
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                  <span>Öne Çıkan</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: colors.text }}>
                  <input type="checkbox" checked={form.isCampaign} onChange={e => setForm({ ...form, isCampaign: e.target.checked })} />
                  <span>Kampanyalı</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: colors.text }}>
                  İptal
                </button>
                <button type="submit" style={{ flex: 1, padding: '14px', backgroundColor: colors.red, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                  💾 Kaydet
                </button>
              </div>
            </form>
          ) : (
            /* AR Tab */
            <div>
              {!isEditing ? (
                <div>
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: colors.yellowBg,
                    borderRadius: '12px',
                    marginBottom: '20px',
                    border: `1px solid rgba(245, 158, 11, 0.3)`
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
                    <h3 style={{ margin: '0 0 8px', color: colors.yellow }}>Önce Ürünü Kaydedin</h3>
                    <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>
                      3D fotoğrafları yüklemek için önce ürünü kaydedin.
                    </p>
                  </div>
                  
                  {/* Local preview for new products */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: colors.text }}>
                      📸 Şimdilik Fotoğraf Seçebilirsiniz
                    </label>
                    
                    <div
                      onClick={() => !converting && photosRef.current?.click()}
                      style={{
                        padding: '28px',
                        border: `2px dashed ${colors.border}`,
                        borderRadius: '12px',
                        textAlign: 'center',
                        cursor: converting ? 'not-allowed' : 'pointer',
                        backgroundColor: colors.bgElevated,
                        marginBottom: '16px'
                      }}
                    >
                      {converting ? (
                        <div>
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
                          <p style={{ margin: 0, color: colors.textSecondary, fontWeight: '500' }}>HEIC → JPG Dönüştürülüyor...</p>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                          <p style={{ margin: '0 0 4px', fontWeight: '600', color: colors.text }}>Fotoğraf Seç</p>
                          <p style={{ margin: 0, fontSize: '13px', color: colors.textMuted }}>HEIC desteklenir</p>
                        </div>
                      )}
                    </div>
                    
                    <input
                      ref={photosRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      multiple
                      hidden
                      onChange={handlePhotosSelect}
                    />
                    
                    {/* Local Previews */}
                    {localPhotos.length > 0 && (
                      <div>
                        <p style={{ margin: '0 0 12px', fontSize: '14px', color: colors.green, fontWeight: '500' }}>
                          ✅ {localPhotos.length} fotoğraf seçildi
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                          {localPhotos.map((photo, i) => (
                            <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: '10px', overflow: 'hidden', backgroundColor: colors.bgElevated }}>
                              <img
                                src={photo.previewUrl}
                                alt=""
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                onClick={() => removeLocalPhoto(i)}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  border: 'none',
                                  backgroundColor: colors.red,
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
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Photo Count */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontWeight: '600', color: colors.text }}>📸 Yüklenen Fotoğraflar</span>
                    <span style={{
                      padding: '6px 14px',
                      backgroundColor: photos.length >= 20 ? colors.greenBg : colors.yellowBg,
                      color: photos.length >= 20 ? colors.green : colors.yellow,
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {photos.length} / 20
                    </span>
                  </div>

                  {/* Upload Area */}
                  <div
                    onClick={() => !uploading && !converting && photosRef.current?.click()}
                    style={{
                      padding: '28px',
                      border: `2px dashed ${colors.border}`,
                      borderRadius: '12px',
                      textAlign: 'center',
                      cursor: (uploading || converting) ? 'not-allowed' : 'pointer',
                      marginBottom: '20px',
                      backgroundColor: colors.bgElevated
                    }}
                  >
                    {converting ? (
                      <div>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
                        <p style={{ margin: 0, color: colors.textSecondary, fontWeight: '500' }}>HEIC → JPG Dönüştürülüyor...</p>
                      </div>
                    ) : uploading ? (
                      <div>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                        <p style={{ margin: 0, color: colors.textSecondary }}>Yükleniyor...</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                        <p style={{ margin: '0 0 4px', fontWeight: '600', color: colors.text }}>Fotoğraf Yükle</p>
                        <p style={{ margin: 0, fontSize: '13px', color: colors.textMuted }}>HEIC desteklenir, otomatik JPG'ye çevrilir</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={photosRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    multiple
                    hidden
                    onChange={handlePhotosSelect}
                  />

                  {/* Photos Grid */}
                  {photosLoading ? (
                    <LoadingSpinner />
                  ) : photos.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                      {photos.map((photo, i) => (
                        <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: '10px', overflow: 'hidden', backgroundColor: colors.bgElevated }}>
                          <img
                            src={FILES_URL + photo.url}
                            alt=""
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={() => handlePhotoDelete(photo.filename)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: colors.red,
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
                    <div style={{ textAlign: 'center', padding: '30px', color: colors.textMuted, backgroundColor: colors.bgElevated, borderRadius: '12px', marginBottom: '20px' }}>
                      <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📷</p>
                      <p style={{ margin: 0 }}>Henüz fotoğraf yok</p>
                    </div>
                  )}

                  {/* Generate Button */}
                  {generating && progress ? (
                    <div style={{ padding: '16px', backgroundColor: colors.greenBg, borderRadius: '12px', border: `1px solid rgba(22, 163, 74, 0.3)` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: colors.green }}>{progress.message}</span>
                        <span style={{ fontSize: '14px', color: colors.green }}>{progress.progress}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: colors.border, borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: progress.progress + '%', height: '100%', backgroundColor: colors.green, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerate3D}
                      disabled={photos.length < 20}
                      style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: photos.length >= 20 ? colors.green : colors.textMuted,
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: photos.length >= 20 ? 'pointer' : 'not-allowed',
                        fontSize: '15px'
                      }}
                    >
                      🎯 3D Model Oluştur {photos.length < 20 && `(${20 - photos.length} daha)`}
                    </button>
                  )}

                  {(product.glbFile || product.usdzFile) && (
                    <div style={{ marginTop: '16px', padding: '14px', backgroundColor: colors.greenBg, borderRadius: '12px', border: `1px solid rgba(22, 163, 74, 0.3)` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>✅</span>
                        <span style={{ fontWeight: '600', color: colors.green }}>3D Model Hazır!</span>
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

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    try {
      const res = await axios.get(API_URL + '/categories')
      setCategories(res.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
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
    } catch (err) { alert('Hata: ' + err.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await axios.delete(API_URL + '/categories/' + id); loadCategories() } catch (err) { alert('Hata: ' + err.message) }
  }

  const handleImageUpload = async (categoryId, file) => {
    let processedFile = file
    if (isHeicFile(file)) {
      processedFile = await convertHeicToJpg(file)
    }
    const formData = new FormData()
    formData.append('image', processedFile)
    try {
      await axios.post(API_URL + '/categories/' + categoryId + '/image', formData)
      loadCategories()
    } catch (err) { alert('Hata: ' + err.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: colors.textSecondary }}>{categories.length} kategori</p>
        <button onClick={() => { setEditingCategory({}); setShowModal(true) }} style={{ padding: '12px 20px', backgroundColor: colors.red, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
          + Yeni Kategori
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {categories.map(category => (
          <div key={category.id} style={{ backgroundColor: colors.bgCard, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <div style={{ position: 'relative', height: '140px', backgroundColor: colors.bgElevated }}>
              {category.image ? (
                <img src={FILES_URL + '/images/' + category.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', background: `linear-gradient(135deg, ${colors.red}, ${colors.redHover})` }}>
                  {category.icon}
                </div>
              )}
              <input type="file" accept="image/*,.heic,.heif" hidden id={'cat-img-' + category.id} onChange={(e) => e.target.files[0] && handleImageUpload(category.id, e.target.files[0])} />
              <button onClick={() => document.getElementById('cat-img-' + category.id)?.click()} style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>📷</button>
            </div>
            <div style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600', color: colors.text }}>{category.icon} {category.name}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditingCategory(category); setShowModal(true) }} style={{ flex: 1, padding: '10px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', color: colors.text }}>✏️ Düzenle</button>
                <button onClick={() => handleDelete(category.id)} style={{ padding: '10px 16px', backgroundColor: colors.redBg, color: colors.red, border: `1px solid rgba(220, 38, 38, 0.3)`, borderRadius: '8px', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '600', color: colors.text }}>{editingCategory?.id ? 'Düzenle' : 'Yeni Kategori'}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Kategori Adı</label>
              <input type="text" defaultValue={editingCategory?.name || ''} id="cat-name" style={inputStyle} placeholder="Kategori adı girin" />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>İkon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['🍕', '🍔', '🌮', '🍜', '🍣', '🥗', '🍰', '☕', '🍺', '🥤', '🍳', '🥪'].map(icon => (
                  <button key={icon} type="button" onClick={() => document.getElementById('cat-icon').value = icon} style={{ width: '44px', height: '44px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, fontSize: '24px', cursor: 'pointer' }}>{icon}</button>
                ))}
              </div>
              <input type="hidden" id="cat-icon" defaultValue={editingCategory?.icon || '📁'} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowModal(false); setEditingCategory(null) }} style={{ flex: 1, padding: '14px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: colors.text }}>İptal</button>
              <button onClick={() => handleSave({ name: document.getElementById('cat-name').value, icon: document.getElementById('cat-icon').value })} style={{ flex: 1, padding: '14px', backgroundColor: colors.red, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Kaydet</button>
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
    try { const res = await axios.get(API_URL + '/announcements'); setAnnouncements(res.data) } catch (err) { console.error(err) } finally { setLoading(false) }
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

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: colors.textSecondary }}>{announcements.length} duyuru</p>
        <button onClick={() => { setEditing({}); setShowModal(true) }} style={{ padding: '12px 20px', backgroundColor: colors.red, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>+ Yeni Duyuru</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {announcements.map(item => (
          <div key={item.id} style={{ backgroundColor: colors.bgCard, borderRadius: '16px', padding: '20px', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontSize: '32px' }}>{item.icon || '📢'}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: colors.text }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary }}>{item.message}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditing(item); setShowModal(true) }} style={{ padding: '8px 12px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', color: colors.text }}>✏️</button>
                <button onClick={() => handleDelete(item.id)} style={{ padding: '8px 12px', backgroundColor: colors.redBg, color: colors.red, border: `1px solid rgba(220, 38, 38, 0.3)`, borderRadius: '8px', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '20px', width: '100%', maxWidth: '450px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '600', color: colors.text }}>{editing?.id ? 'Düzenle' : 'Yeni Duyuru'}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Başlık</label>
              <input type="text" id="ann-title" defaultValue={editing?.title || ''} style={inputStyle} placeholder="Duyuru başlığı" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Mesaj</label>
              <textarea id="ann-message" defaultValue={editing?.message || ''} rows={3} style={textareaStyle} placeholder="Duyuru mesajı" />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowModal(false); setEditing(null) }} style={{ flex: 1, padding: '14px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: colors.text }}>İptal</button>
              <button onClick={() => handleSave({ title: document.getElementById('ann-title').value, message: document.getElementById('ann-message').value, icon: '📢' })} style={{ flex: 1, padding: '14px', backgroundColor: colors.red, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Kaydet</button>
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
        <div style={{ backgroundColor: colors.bgCard, borderRadius: '16px', padding: '24px', border: `1px solid ${colors.border}` }}>
          <p style={{ margin: '0 0 8px', color: colors.textSecondary, fontSize: '14px' }}>Toplam Yorum</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: colors.text }}>{reviews.length}</p>
        </div>
        <div style={{ backgroundColor: colors.bgCard, borderRadius: '16px', padding: '24px', border: `1px solid ${colors.border}` }}>
          <p style={{ margin: '0 0 8px', color: colors.textSecondary, fontSize: '14px' }}>Ortalama</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: colors.yellow }}>⭐ {avgRating}</p>
        </div>
      </div>

      <div style={{ backgroundColor: colors.bgCard, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
        {reviews.length > 0 ? reviews.map((review, i) => (
          <div key={review.id} style={{ padding: '20px', borderBottom: i < reviews.length - 1 ? `1px solid ${colors.border}` : 'none', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '20px', filter: s <= review.rating ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>)}</div>
            <div style={{ flex: 1 }}>
              {review.note && <p style={{ margin: '0 0 8px', color: colors.text }}>{review.note}</p>}
              <span style={{ fontSize: '13px', color: colors.textMuted }}>{new Date(review.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
            <button onClick={() => handleDelete(review.id)} style={{ padding: '8px 12px', backgroundColor: colors.redBg, color: colors.red, border: `1px solid rgba(220, 38, 38, 0.3)`, borderRadius: '8px', cursor: 'pointer' }}>🗑️</button>
          </div>
        )) : <p style={{ padding: '60px', textAlign: 'center', color: colors.textMuted }}>Henüz yorum yok</p>}
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
  const saveLayouts = async () => {
    try { await axios.put(API_URL + '/category-layouts', layouts); alert('Kaydedildi!') } catch (err) { alert('Hata: ' + err.message) }
  }

  const usedIds = layouts.flatMap(l => l.categoryIds)
  const available = categories.filter(c => !usedIds.includes(c.id))

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: colors.textSecondary }}>Düzen ayarları</p>
        <button onClick={saveLayouts} style={{ padding: '12px 24px', backgroundColor: colors.red, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>💾 Kaydet</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ backgroundColor: colors.bgCard, borderRadius: '16px', padding: '24px', border: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600', color: colors.text }}>📐 Düzen</h3>
          {layouts.map((row, ri) => (
            <div key={ri} style={{ marginBottom: '16px', padding: '16px', backgroundColor: colors.bgElevated, borderRadius: '12px', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: colors.text }}>Satır {ri + 1} ({row.layout})</span>
                <button onClick={() => removeRow(ri)} style={{ padding: '4px 8px', backgroundColor: colors.redBg, color: colors.red, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {row.categoryIds.map(cid => {
                  const cat = categories.find(c => c.id === cid)
                  return cat ? (
                    <span key={cid} style={{ padding: '6px 12px', backgroundColor: colors.bgCard, borderRadius: '6px', fontSize: '13px', color: colors.text, border: `1px solid ${colors.border}` }}>
                      {cat.icon} {cat.name}
                      <button onClick={() => removeCategoryFromRow(ri, cid)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: colors.red, cursor: 'pointer' }}>✕</button>
                    </span>
                  ) : null
                })}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => addRow('full')} style={{ padding: '10px 16px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', color: colors.text }}>+ Tam</button>
            <button onClick={() => addRow('half')} style={{ padding: '10px 16px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', color: colors.text }}>+ Yarı</button>
            <button onClick={() => addRow('third')} style={{ padding: '10px 16px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', color: colors.text }}>+ Üçlü</button>
          </div>
        </div>

        <div style={{ backgroundColor: colors.bgCard, borderRadius: '16px', padding: '24px', border: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600', color: colors.text }}>📁 Kategoriler</h3>
          {available.map(cat => (
            <div key={cat.id} style={{ padding: '12px', backgroundColor: colors.bgElevated, borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', border: `1px solid ${colors.border}` }}>
              <span style={{ color: colors.text }}>{cat.icon} {cat.name}</span>
              <select onChange={(e) => { if (e.target.value) { addCategoryToRow(parseInt(e.target.value), cat.id); e.target.value = '' } }} style={{ padding: '4px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.bgInput, color: colors.text }}>
                <option value="">Ekle</option>
                {layouts.map((row, i) => <option key={i} value={i}>Satır {i + 1}</option>)}
              </select>
            </div>
          ))}
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
    let processedFile = file
    if (isHeicFile(file)) {
      processedFile = await convertHeicToJpg(file)
    }
    const formData = new FormData()
    formData.append('image', processedFile)
    try {
      const endpoint = type === 'logo' ? '/settings/logo' : type === 'banner' ? '/settings/banner' : '/settings/homepage-image'
      await axios.post(API_URL + endpoint, formData)
      loadData()
    } catch (err) { alert('Hata: ' + err.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Menü Görselleri */}
      <div style={{ backgroundColor: colors.bgCard, borderRadius: '16px', padding: '24px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: colors.text }}>🖼️ Menü Görselleri</h3>
        <p style={{ margin: '0 0 16px', fontSize: '14px', color: colors.textSecondary }}>
          Bu görseller müşteri menüsünde görünür. HEIC formatı desteklenir.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { key: 'logo', label: 'Logo', desc: 'Restoran logosu (sol üst)' },
            { key: 'homepageImage', label: 'Anasayfa Görseli', desc: 'Hero bölümü arka planı' },
            { key: 'bannerImage', label: 'Banner', desc: 'Üst banner görseli' }
          ].map(img => (
            <div key={img.key}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>{img.label}</label>
              <div 
                onClick={() => document.getElementById('img-' + img.key)?.click()} 
                style={{ 
                  width: '100%', 
                  height: '120px', 
                  backgroundColor: colors.bgElevated, 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  overflow: 'hidden', 
                  border: `2px dashed ${colors.border}`,
                  position: 'relative'
                }}
              >
                {settings[img.key] ? (
                  <>
                    <img src={FILES_URL + '/images/' + settings[img.key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      padding: '6px 10px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}>
                      📷 Değiştir
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: colors.textMuted }}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '4px' }}>📷</span>
                    <span style={{ fontSize: '12px' }}>Yükle</span>
                  </div>
                )}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: colors.textMuted }}>{img.desc}</p>
              <input id={'img-' + img.key} type="file" accept="image/*,.heic,.heif" hidden onChange={(e) => e.target.files[0] && handleImageUpload(img.key === 'homepageImage' ? 'homepage' : img.key, e.target.files[0])} />
            </div>
          ))}
        </div>
      </div>

      {/* Restoran Bilgileri */}
      <div style={{ backgroundColor: colors.bgCard, borderRadius: '16px', padding: '24px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: colors.text }}>🏪 Restoran Bilgileri</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Restoran Adı</label>
            <input type="text" value={settings.restaurantName || ''} onChange={e => setSettings({ ...settings, restaurantName: e.target.value })} style={inputStyle} placeholder="Restoran adı" />
          </div>
          <div>
            <label style={labelStyle}>Telefon</label>
            <input type="text" value={settings.phone || ''} onChange={e => setSettings({ ...settings, phone: e.target.value })} style={inputStyle} placeholder="0212 123 45 67" />
          </div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Slogan</label>
          <input type="text" value={settings.slogan || ''} onChange={e => setSettings({ ...settings, slogan: e.target.value })} style={inputStyle} placeholder="Restoran sloganı" />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Adres</label>
          <textarea value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} rows={2} style={textareaStyle} placeholder="Restoran adresi" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Çalışma Saatleri</label>
            <input type="text" value={settings.openingHours || ''} onChange={e => setSettings({ ...settings, openingHours: e.target.value })} style={inputStyle} placeholder="09:00 - 22:00" />
          </div>
          <div>
            <label style={labelStyle}>Para Birimi</label>
            <input type="text" value={settings.currency || ''} onChange={e => setSettings({ ...settings, currency: e.target.value })} style={inputStyle} placeholder="₺" />
          </div>
        </div>
      </div>

      {/* Sosyal Medya */}
      <div style={{ backgroundColor: colors.bgCard, borderRadius: '16px', padding: '24px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: colors.text }}>📱 Sosyal Medya</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Instagram</label>
            <input type="text" value={settings.instagram || ''} onChange={e => setSettings({ ...settings, instagram: e.target.value })} style={inputStyle} placeholder="@kullaniciadi" />
          </div>
          <div>
            <label style={labelStyle}>Facebook</label>
            <input type="text" value={settings.facebook || ''} onChange={e => setSettings({ ...settings, facebook: e.target.value })} style={inputStyle} placeholder="sayfaadi" />
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Google Yorum URL</label>
          <input type="text" value={settings.googleReviewUrl || ''} onChange={e => setSettings({ ...settings, googleReviewUrl: e.target.value })} style={inputStyle} placeholder="https://g.page/r/..." />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '16px', backgroundColor: colors.red, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
      </button>
    </div>
  )
}

// ==================== LOADING SPINNER ====================
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
      <div style={{ width: '40px', height: '40px', border: `4px solid ${colors.border}`, borderTopColor: colors.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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