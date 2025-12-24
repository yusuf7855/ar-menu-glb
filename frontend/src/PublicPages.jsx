import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  Box, Grid, Card, CardContent, CardMedia, CardActions,
  Typography, Button, TextField, Stack, Chip, Avatar, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Rating, Alert, Divider, Fade, Grow, Slide,
  IconButton, InputAdornment, Tabs, Tab, Badge, Tooltip,
  useMediaQuery, alpha, Skeleton, Menu, MenuItem
} from '@mui/material'
import {
  Restaurant, Store, Phone, LocationOn, AccessTime, Instagram, WhatsApp,
  KeyboardArrowRight, ViewInAr, Close, ShoppingBag, Star, Search,
  Person, Lock, Visibility, VisibilityOff, Email, Login as LoginIcon,
  Send, ArrowBack, ExpandMore, LocalOffer, Info, RateReview, ChevronLeft, ChevronRight,
  Language, Place, Translate
} from '@mui/icons-material'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { useAuth, API_URL, api, formatPrice, getImageUrl, getGlbUrl } from './App'

// Dark theme for public pages
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e53935' },
    secondary: { main: '#1e88e5' },
    background: { default: '#0a0a0a', paper: '#141414' }
  },
  typography: { fontFamily: '"Inter", sans-serif' },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } }
  }
})

// ==================== DİL CONTEXT ====================
// Dil tercihini localStorage'dan al veya varsayılan olarak 'tr' kullan
const getInitialLanguage = () => {
  try {
    return localStorage.getItem('menuLanguage') || 'tr'
  } catch {
    return 'tr'
  }
}

// ==================== LOGIN PAGE ====================
export function LoginPage() {
  const { login, setup } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', password: '', email: '', fullName: '' })

  useEffect(() => {
    axios.get(API_URL + '/auth/check-setup').then(res => setNeedsSetup(res.data.needsSetup)).catch(console.error)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username || !form.password) { setError('Kullanıcı adı ve şifre gerekli'); return }

    setLoading(true)
    try {
      if (needsSetup) {
        if (!form.email) { setError('Email gerekli'); setLoading(false); return }
        await setup(form)
      } else {
        await login(form.username, form.password)
      }
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: '#0a0a0a', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(229,57,53,0.1) 0%, transparent 50%)', p: 2
      }}>
        <Fade in timeout={500}>
          <Card sx={{ maxWidth: 440, width: '100%', p: 2 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{
                  width: 80, height: 80, borderRadius: '20px', bgcolor: 'primary.main',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                  boxShadow: '0 8px 32px rgba(229,57,53,0.3)'
                }}>
                  <Restaurant sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h4" fontWeight={700} color="white">AR Menu</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {needsSetup ? 'İlk Admin Hesabını Oluşturun' : 'Yönetim Paneli'}
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField fullWidth label="Kullanıcı Adı" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }} required autoFocus />

                  {needsSetup && (
                    <>
                      <TextField fullWidth label="E-posta" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }} required />
                      <TextField fullWidth label="Ad Soyad" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }} />
                    </>
                  )}

                  <TextField fullWidth label="Şifre" type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                      endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
                    }} required />

                  <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ py: 1.5, fontSize: '1rem' }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : <><LoginIcon sx={{ mr: 1 }} />{needsSetup ? 'Hesap Oluştur' : 'Giriş Yap'}</>}
                  </Button>
                </Stack>
              </form>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button component={Link} to="/" color="inherit" sx={{ color: 'text.secondary' }}>← Ana Sayfaya Dön</Button>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    </ThemeProvider>
  )
}

// ==================== BRANCH SELECTION PAGE ====================
export function BranchSelectionPage() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadBranches() }, [])

  const loadBranches = async () => {
    try {
      const res = await axios.get(API_URL + '/public/branches')
      setBranches(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(229,57,53,0.15) 0%, transparent 50%)' }}>
        {loading ? (
          <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={60} />
              <Typography color="text.secondary">Şubeler yükleniyor...</Typography>
            </Stack>
          </Box>
        ) : branches.length === 0 ? (
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Store sx={{ fontSize: 100, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h4" color="white" gutterBottom fontWeight={700}>Hoş Geldiniz</Typography>
            <Typography color="text.secondary" mb={4} textAlign="center">Henüz şube eklenmemiş.</Typography>
            <Button variant="contained" component={Link} to="/login" size="large" startIcon={<LoginIcon />}>Admin Girişi</Button>
          </Box>
        ) : (
          <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, py: 6 }}>
            {/* Header */}
            <Fade in timeout={500}>
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Box sx={{
                  width: 100, height: 100, borderRadius: '24px', bgcolor: 'primary.main',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
                  boxShadow: '0 12px 40px rgba(229,57,53,0.4)'
                }}>
                  <Restaurant sx={{ fontSize: 50, color: 'white' }} />
                </Box>
                <Typography variant="h2" fontWeight={800} color="white" gutterBottom>AR Menu</Typography>
                <Typography variant="h6" color="text.secondary">Şubenizi Seçin</Typography>
              </Box>
            </Fade>

            {/* Branch Cards */}
            <Grid container spacing={3} justifyContent="center">
              {branches.map((branch, index) => (
                <Grid item xs={12} sm={6} md={4} key={branch.id}>
                  <Grow in timeout={300 + index * 100}>
                    <Card component={Link} to={`/menu/${branch.slug}`}
                      sx={{
                        textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column',
                        transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 60px rgba(229,57,53,0.3)' }
                      }}>
                      <Box sx={{ position: 'relative', pt: '60%', bgcolor: 'background.default', overflow: 'hidden' }}>
                        {branch.image ? (
                          <CardMedia component="img" image={getImageUrl(branch.image)} alt={branch.name}
                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }} />
                        ) : (
                          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' }}>
                            <Store sx={{ fontSize: 80, color: 'text.secondary' }} />
                          </Box>
                        )}
                        {branch.logo && (
                          <Avatar src={getImageUrl(branch.logo)} sx={{ position: 'absolute', bottom: -30, left: 20, width: 64, height: 64, border: '4px solid', borderColor: 'background.paper', boxShadow: 3 }} />
                        )}
                      </Box>

                      <CardContent sx={{ pt: branch.logo ? 5 : 2, flexGrow: 1 }}>
                        <Typography variant="h5" fontWeight={700} color="white" gutterBottom>{branch.name}</Typography>
                        {branch.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>{branch.description}</Typography>}
                        {branch.address && (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                            <LocationOn fontSize="small" /><Typography variant="body2">{branch.address}</Typography>
                          </Stack>
                        )}
                        {branch.phone && (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            <Phone fontSize="small" /><Typography variant="body2">{branch.phone}</Typography>
                          </Stack>
                        )}
                      </CardContent>

                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button variant="contained" fullWidth size="large" endIcon={<KeyboardArrowRight />} sx={{ py: 1.5 }}>Menüyü Görüntüle</Button>
                      </Box>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>

            {/* Admin Link */}
            <Box sx={{ textAlign: 'center', mt: 8, pb: 4 }}>
              <Button component={Link} to="/login" color="inherit" sx={{ color: 'text.secondary' }} startIcon={<Lock />}>Admin Girişi</Button>
            </Box>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  )
}

// ==================== MENU PAGE ====================
export function MenuPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width:600px)')
  const campaignScrollRef = useRef(null)

  // URL'den section parametresini al
  const sectionSlug = searchParams.get('section')

  // DİL STATE - localStorage'dan başlat
  const [language, setLanguage] = useState(getInitialLanguage)

  const [branch, setBranch] = useState(null)
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [layouts, setLayouts] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [tags, setTags] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTag, setSelectedTag] = useState(null)
  const [tagProducts, setTagProducts] = useState([])
  const [loadingTagProducts, setLoadingTagProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '', contact: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  
  // Duyuru slider state
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0)
  
  // Arama state
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // 3D Carousel state
  const [showCarousel, setShowCarousel] = useState(false)

  // Dil değiştirme fonksiyonu
  const toggleLanguage = () => {
    const newLang = language === 'tr' ? 'en' : 'tr'
    setLanguage(newLang)
    try {
      localStorage.setItem('menuLanguage', newLang)
    } catch (e) {
      console.error('localStorage error:', e)
    }
  }

  // Dile göre metin getiren yardımcı fonksiyon
  const t = (item, field) => {
    if (!item) return ''
    const enField = field + 'EN'
    if (language === 'en' && item[enField]) {
      return item[enField]
    }
    return item[field] || ''
  }

  // Dile göre array getiren yardımcı fonksiyon (alerjenler için)
  const tArray = (item, field) => {
    if (!item) return []
    const enField = field + 'EN'
    if (language === 'en' && item[enField] && item[enField].length > 0) {
      return item[enField]
    }
    return item[field] || []
  }

  // İlk yüklemede branch ve sections bilgisini al
  useEffect(() => { 
    if (slug) loadInitialData() 
  }, [slug])

  // Section URL'den değiştiğinde (kullanıcı bölüm seçtiğinde)
  useEffect(() => { 
    if (branch && sectionSlug && sections.length > 0 && !selectedSection) {
      const section = sections.find(s => s.slug === sectionSlug)
      if (section) {
        setSelectedSection(section)
        loadMenuData(sectionSlug)
      }
    }
  }, [sectionSlug])
  
  // Duyuru otomatik geçiş
  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAnnouncementIndex(prev => (prev + 1) % announcements.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [announcements.length])

  const loadInitialData = async () => {
    try {
      // Branch bilgisini al
      const branchRes = await axios.get(`${API_URL}/public/branches/${slug}`)
      setBranch(branchRes.data)
      
      // Sections bilgisini al
      let secs = []
      try {
        const sectionsRes = await axios.get(`${API_URL}/public/branches/${slug}/sections`)
        secs = sectionsRes.data || []
      } catch (secErr) {
        // Sections endpoint yoksa devam et
      }
      setSections(secs)

      // Section yoksa veya tek section varsa direkt menüyü yükle
      if (secs.length === 0) {
        await loadMenuData(null)
      } else if (secs.length === 1) {
        const section = secs[0]
        setSelectedSection(section)
        setSearchParams({ section: section.slug })
        await loadMenuData(section.slug)
      } else if (sectionSlug) {
        const section = secs.find(s => s.slug === sectionSlug)
        if (section) {
          setSelectedSection(section)
          await loadMenuData(sectionSlug)
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Load error:', err)
      setError(err.response?.status === 404 ? 'Şube bulunamadı' : 'Bir hata oluştu')
      setLoading(false)
    }
  }

  const loadMenuData = async (sectionSlugParam) => {
    try {
      setLoading(true)
      
      let menuData = null
      
      try {
        const menuUrl = sectionSlugParam 
          ? `${API_URL}/public/branches/${slug}/menu?section=${sectionSlugParam}`
          : `${API_URL}/public/branches/${slug}/menu`
        
        const menuRes = await axios.get(menuUrl)
        menuData = menuRes.data
      } catch (menuErr) {
        const [categoriesRes, productsRes, layoutsRes, announcementsRes] = await Promise.all([
          axios.get(`${API_URL}/public/branches/${slug}/categories`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/public/branches/${slug}/products`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/public/branches/${slug}/category-layouts`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/public/branches/${slug}/announcements`).catch(() => ({ data: [] }))
        ])
        
        menuData = {
          categories: categoriesRes.data || [],
          products: productsRes.data.products || productsRes.data || [],
          layouts: layoutsRes.data || [],
          announcements: announcementsRes.data || []
        }
      }
      
      const reviewsRes = await axios.get(`${API_URL}/public/branches/${slug}/reviews`).catch(() => ({ data: [] }))
      
      if (menuData.branch) {
        setBranch(prev => ({ ...prev, ...menuData.branch }))
      }
      
      setCategories(menuData.categories || [])
      setProducts(menuData.products || [])
      setLayouts(menuData.layouts || [])
      setAnnouncements(menuData.announcements || [])
      setTags(menuData.tags || [])
      setReviews(reviewsRes.data.reviews || reviewsRes.data || [])
      
      if (menuData.selectedSection) {
        setSelectedSection(menuData.selectedSection)
      }
    } catch (err) {
      console.error('Load menu error:', err)
      setError('Menü yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionSelect = (section) => {
    setSelectedSection(section)
    setSearchParams({ section: section.slug })
    loadMenuData(section.slug)
  }

  const handleBackToSections = () => {
    setSelectedSection(null)
    setSearchParams({})
    setCategories([])
    setProducts([])
    setLayouts([])
    setAnnouncements([])
  }

  // History API - Telefon geri butonu desteği
  useEffect(() => {
    const handlePopState = (e) => {
      const state = e.state || {}

      // Ürün detayı açıksa kapat
      if (selectedProduct && !state.product) {
        setSelectedProduct(null)
        return
      }

      // Kategori seçiliyse ve state'de kategori yoksa kategoriden çık
      if (selectedCategory && !state.category) {
        setSelectedCategory(null)
        return
      }

      // Tag seçiliyse kapat
      if (selectedTag && !state.tag) {
        setSelectedTag(null)
        setTagProducts([])
        return
      }

      // 3D Carousel açıksa kapat
      if (showCarousel && !state.carousel) {
        setShowCarousel(false)
        return
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [selectedProduct, selectedCategory, selectedTag, showCarousel])

  // Kategori seçildiğinde history'e ekle
  const handleCategorySelect = (categoryId) => {
    window.history.pushState({ category: categoryId }, '')
    setSelectedCategory(categoryId)
  }

  // Ürün seçildiğinde history'e ekle
  const handleProductSelect = (product) => {
    window.history.pushState({ product: product.id }, '')
    setSelectedProduct(product)
  }

  // Geri tuşu için kategori kapatma
  const handleCategoryBack = () => {
    window.history.back()
  }

  // Geri tuşu için ürün kapatma
  const handleProductBack = () => {
    window.history.back()
  }

  // Tag seçildiğinde history'e ekle
  const handleTagSelectWithHistory = async (tag) => {
    window.history.pushState({ tag: tag.slug }, '')
    setSelectedCategory(null)
    setSelectedTag(tag)
    setLoadingTagProducts(true)
    try {
      const res = await axios.get(`${API_URL}/public/branches/${slug}/products/by-tag/${tag.slug}`)
      setTagProducts(res.data.products || [])
    } catch (err) {
      console.error('Load tag products error:', err)
      setTagProducts([])
    } finally {
      setLoadingTagProducts(false)
    }
  }

  // 3D Carousel açıldığında history'e ekle
  const handleOpenCarousel = () => {
    window.history.pushState({ carousel: true }, '')
    setShowCarousel(true)
  }

  const handleCloseCarousel = () => {
    window.history.back()
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.customerName || !reviewForm.rating) return
    setSubmittingReview(true)
    try {
      await axios.post(`${API_URL}/public/branches/${slug}/reviews`, reviewForm)
      setShowReviewForm(false)
      setReviewForm({ customerName: '', rating: 5, comment: '', contact: '' })
      setReviewSubmitted(true)
      setTimeout(() => setReviewSubmitted(false), 5000)
    } catch (err) { console.error(err) }
    finally { setSubmittingReview(false) }
  }

  // Kampanyalı ürünler
  const campaignProducts = useMemo(() => 
    products.filter(p => p.isCampaign && p.campaignPrice), 
    [products]
  )

  // 3D modeli olan ürünler
  const products3D = useMemo(() => 
    products.filter(p => p.hasGlb && p.glbFile), 
    [products]
  )

  // Ana kategoriler (parent olmayan)
  const mainCategories = useMemo(() => {
    return categories.filter(c => !c.parent)
  }, [categories])

  // Bir kategorinin tüm alt kategorilerini bul (recursive)
  const getChildCategories = useCallback((parentId, allCats = categories) => {
    const children = allCats.filter(c => {
      const pId = c.parent?._id || c.parent
      return pId === parentId || String(pId) === String(parentId)
    })
    let result = [...children]
    children.forEach(child => {
      result = [...result, ...getChildCategories(child.id || child._id, allCats)]
    })
    return result
  }, [categories])

  // Kategori bazlı ürün sayısı hesaplama (alt kategoriler dahil)
  const getCategoryProductCount = (categoryId) => {
    if (!categoryId) return 0
    // Bu kategori + tüm alt kategorilerin ürünlerini say
    const childCats = getChildCategories(categoryId)
    const allCatIds = [categoryId, ...childCats.map(c => c.id || c._id)]

    return products.filter(p => {
      const pCatId = p.categoryId || p.category?._id || p.category?.id || p.category
      return allCatIds.some(catId => pCatId === catId || String(pCatId) === String(catId))
    }).length
  }

  // Seçili kategorinin ürünleri (alt kategoriler dahil, gruplu)
  const categoryProductsGrouped = useMemo(() => {
    if (!selectedCategory) return []

    // Alt kategorileri bul
    const childCats = getChildCategories(selectedCategory)
    const allCats = [
      categories.find(c => c.id === selectedCategory || String(c.id) === String(selectedCategory)),
      ...childCats
    ].filter(Boolean)

    // Her kategori için ürünleri grupla
    const groups = []
    allCats.forEach(cat => {
      const catId = cat.id || cat._id
      const catProducts = products.filter(p => {
        const pCatId = p.categoryId || p.category?._id || p.category?.id || p.category
        return pCatId === catId || String(pCatId) === String(catId)
      })
      if (catProducts.length > 0) {
        groups.push({
          category: cat,
          products: catProducts,
          isSubCategory: catId !== selectedCategory && String(catId) !== String(selectedCategory)
        })
      }
    })
    return groups
  }, [products, selectedCategory, categories, getChildCategories])

  // Seçili kategorinin tüm ürünleri (düz liste)
  const categoryProducts = useMemo(() => {
    return categoryProductsGrouped.flatMap(g => g.products)
  }, [categoryProductsGrouped])

  // Seçili kategori bilgisi
  const selectedCategoryInfo = useMemo(() => {
    if (!selectedCategory) return null
    return categories.find(c => c.id === selectedCategory || String(c.id) === String(selectedCategory))
  }, [categories, selectedCategory])

  // Kampanya scroll fonksiyonları
  const scrollCampaign = (direction) => {
    if (campaignScrollRef.current) {
      const scrollAmount = 220
      campaignScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }
  
  // Arama sonuçları
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase().trim()
    return products.filter(p => 
      t(p, 'name')?.toLowerCase().includes(query) || 
      t(p, 'description')?.toLowerCase().includes(query)
    )
  }, [products, searchQuery, language])

  // Dil buton komponenti
  const LanguageButton = () => (
    <IconButton 
      onClick={toggleLanguage}
      sx={{ 
        bgcolor: 'rgba(0,0,0,0.5)', 
        backdropFilter: 'blur(10px)',
        color: 'white',
        width: 40,
        height: 40,
        fontSize: '0.8rem',
        fontWeight: 700,
        border: '1px solid rgba(255,255,255,0.2)',
        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
      }}
    >
      {language === 'tr' ? 'TR' : 'EN'}
    </IconButton>
  )

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0a0a0a' }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={60} />
            <Typography color="text.secondary">
              {language === 'tr' ? 'Menü yükleniyor...' : 'Loading menu...'}
            </Typography>
          </Stack>
        </Box>
      </ThemeProvider>
    )
  }

  if (error) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#0a0a0a', p: 3 }}>
          <Restaurant sx={{ fontSize: 100, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h4" color="white" gutterBottom>{error}</Typography>
          <Button variant="contained" component={Link} to="/" sx={{ mt: 2 }}>
            {language === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}
          </Button>
        </Box>
      </ThemeProvider>
    )
  }

  // ========== BÖLÜM SEÇİM EKRANI ==========
  if (sections.length > 1 && !selectedSection) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>
          
          {/* Dil Butonu - Sağ Üst */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
            <LanguageButton />
          </Box>
          
          {/* Bölüm Seçimi */}
          <Box sx={{ px: 2, py: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h6" fontWeight={700} textAlign="center" sx={{ mb: 0.5 }}>
              {language === 'tr' ? 'Bölüm Seçin' : 'Select Section'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              {language === 'tr' ? 'Menüyü görüntülemek istediğiniz bölümü seçin' : 'Select the section to view the menu'}
            </Typography>

            <Stack spacing={2}>
              {sections.map((section, index) => (
                <Fade in timeout={300 + index * 100} key={section.id}>
                  <Box
                    onClick={() => handleSectionSelect(section)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      overflow: 'hidden',
                      position: 'relative',
                      aspectRatio: '16 / 9',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      },
                      '&:active': { transform: 'scale(0.98)' }
                    }}
                  >
                    {section.image || section.homepageImage ? (
                      <Box
                        component="img"
                        src={getImageUrl(section.homepageImage || section.image)}
                        alt={t(section, 'name')}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'
                      }} />
                    )}

                    <Box sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)'
                    }} />

                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0,
                      bottom: 0,
                      left: 0,
                      display: 'flex',
                      alignItems: 'center',
                      px: 3
                    }}>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        color="white"
                        sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      >
                        {t(section, 'name')}
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0,
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      px: 2
                    }}>
                      <KeyboardArrowRight sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                  </Box>
                </Fade>
              ))}
            </Stack>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, pt: 4, pb: 6, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ px: 2, textAlign: 'center' }}>
              {branch?.logo && (
                <Avatar
                  src={getImageUrl(branch.logo)}
                  sx={{ width: 60, height: 60, mx: 'auto', mb: 2, '& img': { objectFit: 'contain' } }}
                  variant="rounded"
                />
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                component="a"
                href="https://www.linkedin.com/in/yusuf-kerim-sar%C4%B1ta%C5%9F-94b172219/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textDecoration: 'none',
                  '&:hover': { color: 'primary.main' },
                  transition: 'color 0.2s'
                }}
              >
                Yusuf Kerim Sarıtaş © {new Date().getFullYear()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    )
  }

  // ========== KATEGORİ SAYFA GÖRÜNÜMÜ ==========
  if (selectedCategory && selectedCategoryInfo) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>
          {/* Header */}
          <Box sx={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 10,
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
              <IconButton onClick={handleCategoryBack}>
                <ArrowBack />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  {t(selectedCategoryInfo, 'name')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {categoryProducts.length} {language === 'tr' ? 'ürün' : 'products'}
                </Typography>
              </Box>
              <LanguageButton />
            </Stack>
          </Box>

          {/* Ürün Listesi - Alt kategorilere göre gruplu */}
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {categoryProductsGrouped.length > 0 ? (
              <Stack spacing={0}>
                {categoryProductsGrouped.map((group, groupIndex) => (
                  <Box key={group.category.id || groupIndex}>
                    {/* Alt kategori başlığı */}
                    {group.isSubCategory && (
                      <Box sx={{
                        py: 1.5,
                        px: 2,
                        mt: groupIndex > 0 ? 3 : 1,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        borderLeft: '3px solid',
                        borderColor: 'primary.main'
                      }}>
                        <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                          {group.category.icon} {t(group.category, 'name')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {group.products.length} {language === 'tr' ? 'ürün' : 'products'}
                        </Typography>
                      </Box>
                    )}

                    {/* Ürünler */}
                    <Stack divider={<Divider />}>
                      {group.products.map(product => (
                        <Box
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 2,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                            '&:active': { bgcolor: 'rgba(255,255,255,0.05)' },
                            ...(product.isFeatured && {
                              bgcolor: 'rgba(255,215,0,0.05)',
                              borderLeft: '3px solid #FFD700'
                            })
                          }}
                        >
                          {product.thumbnail && (
                            <Box
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 1.5,
                                overflow: 'hidden',
                                flexShrink: 0,
                                bgcolor: 'background.paper',
                                position: 'relative'
                              }}
                            >
                              <Box
                                component="img"
                                src={getImageUrl(product.thumbnail)}
                                alt={t(product, 'name')}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              {product.isFeatured && (
                                <Box sx={{
                                  position: 'absolute',
                                  top: -4,
                                  right: -4,
                                  bgcolor: '#FFD700',
                                  borderRadius: '50%',
                                  width: 20,
                                  height: 20,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <Star sx={{ fontSize: 12, color: '#000' }} />
                                </Box>
                              )}
                            </Box>
                          )}

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography fontWeight={600} noWrap>
                                {t(product, 'name')}
                              </Typography>
                              {product.isFeatured && !product.thumbnail && (
                                <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                              )}
                            </Stack>
                            {t(product, 'description') && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.4
                                }}
                              >
                                {t(product, 'description')}
                              </Typography>
                            )}
                            {product.tags?.length > 0 && (
                              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                                {product.tags.slice(0, 3).map((tag, i) => (
                                  <Chip
                                    key={tag.id || tag.slug || i}
                                    label={typeof tag === 'string' ? tag : t(tag, 'name')}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.65rem',
                                      bgcolor: 'rgba(255,255,255,0.1)'
                                    }}
                                  />
                                ))}
                              </Stack>
                            )}
                          </Box>

                          <Box sx={{
                            flex: '0 0 auto',
                            borderBottom: '1px dotted',
                            borderColor: 'divider',
                            width: 40,
                            alignSelf: 'center',
                            mx: 1
                          }} />

                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            {product.isCampaign && product.campaignPrice ? (
                              <>
                                <Typography fontWeight={700} color="error.main">
                                  {formatPrice(product.campaignPrice)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                  {formatPrice(product.price)}
                                </Typography>
                              </>
                            ) : (
                              <Typography fontWeight={700} color="primary.main">
                                {formatPrice(product.price)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Restaurant sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  {language === 'tr' ? 'Bu kategoride ürün bulunmuyor' : 'No products in this category'}
                </Typography>
              </Box>
            )}
          </Box>

          <ProductDetailModal 
            product={selectedProduct} 
            onClose={handleProductBack}
            onTagClick={handleTagSelectWithHistory}
            language={language}
            t={t}
            tArray={tArray}
          />
        </Box>
      </ThemeProvider>
    )
  }

  // ========== ETİKET SAYFA GÖRÜNÜMÜ ==========
  if (selectedTag) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>
          {/* Header */}
          <Box sx={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 10,
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
              <IconButton onClick={() => { setSelectedTag(null); setTagProducts([]); }}>
                <ArrowBack />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  {t(selectedTag, 'name')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tagProducts.length} {language === 'tr' ? 'ürün' : 'products'}
                </Typography>
              </Box>
              <LanguageButton />
            </Stack>
          </Box>

          {/* Ürün Listesi */}
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {loadingTagProducts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : tagProducts.length > 0 ? (
              <Stack divider={<Divider />}>
                {tagProducts.map(product => (
                  <Box
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                      '&:active': { bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                  >
                    {product.thumbnail && (
                      <Box 
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          flexShrink: 0,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Box 
                          component="img" 
                          src={getImageUrl(product.thumbnail)} 
                          alt={t(product, 'name')}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </Box>
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>
                        {t(product, 'name')}
                      </Typography>
                      {t(product, 'description') && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4
                          }}
                        >
                          {t(product, 'description')}
                        </Typography>
                      )}
                      {/* Kategori adını dile göre göster */}
                      {(product.categoryName || product.categoryNameEN) && (
                        <Typography variant="caption" color="grey.500" sx={{ mt: 0.5, display: 'block' }}>
                          {language === 'en' && product.categoryNameEN ? product.categoryNameEN : product.categoryName}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ 
                      flex: '0 0 auto',
                      borderBottom: '1px dotted',
                      borderColor: 'divider',
                      width: 40,
                      alignSelf: 'center',
                      mx: 1
                    }} />

                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      {product.isCampaign && product.campaignPrice ? (
                        <>
                          <Typography fontWeight={700} color="error.main">
                            {formatPrice(product.campaignPrice)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                            {formatPrice(product.price)}
                          </Typography>
                        </>
                      ) : (
                        <Typography fontWeight={700} color="primary.main">
                          {formatPrice(product.price)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <LocalOffer sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  {language === 'tr' ? 'Bu etikette ürün bulunmuyor' : 'No products with this tag'}
                </Typography>
              </Box>
            )}
          </Box>

          <ProductDetailModal 
            product={selectedProduct} 
            onClose={handleProductBack}
            onTagClick={handleTagSelectWithHistory}
            language={language}
            t={t}
            tArray={tArray}
          />
        </Box>
      </ThemeProvider>
    )
  }

  // ========== MENÜ EKRANI ==========
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>

        {/* ========== HEADER BAR - Geri, Dil & Arama ========== */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1.5
        }}>
          {/* Sol - Bölümlere Geri */}
          {sections.length > 1 ? (
            <IconButton 
              onClick={handleBackToSections}
              sx={{ 
                bgcolor: 'rgba(0,0,0,0.5)', 
                backdropFilter: 'blur(10px)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <ArrowBack />
            </IconButton>
          ) : (
            <Box sx={{ width: 40 }} /> // Placeholder
          )}
          
          {/* Sağ - Dil ve Arama */}
          <Stack direction="row" spacing={1}>
            <LanguageButton />
            <IconButton 
              onClick={() => setShowSearch(true)}
              sx={{ 
                bgcolor: 'rgba(0,0,0,0.5)', 
                backdropFilter: 'blur(10px)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <Search />
            </IconButton>
          </Stack>
        </Box>

        {/* ========== 1. HOMEPAGE IMAGE ========== */}
        <Box sx={{ position: 'relative', width: '100%', height: isMobile ? 220 : 320, overflow: 'hidden' }}>
          {selectedSection?.homepageImage ? (
            <Box component="img" src={getImageUrl(selectedSection.homepageImage)} alt={t(selectedSection, 'name')}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : branch?.homepageImage ? (
            <Box component="img" src={getImageUrl(branch.homepageImage)} alt={branch.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : branch?.banner ? (
            <Box component="img" src={getImageUrl(branch.banner)} alt={branch.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Restaurant sx={{ fontSize: 80, color: 'text.secondary' }} />
            </Box>
          )}
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, #0a0a0a 100%)' }} />
          
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {branch?.logo && (
              <Avatar src={getImageUrl(branch.logo)} sx={{ width: 64, height: 64, border: '3px solid', borderColor: 'background.paper', boxShadow: 3 }} />
            )}
            <Box>
              <Typography variant="h5" fontWeight={800} color="white" sx={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {branch?.name}
              </Typography>
              {selectedSection && (
                <Chip 
                  icon={<Place sx={{ fontSize: 14 }} />}
                  label={`${selectedSection.icon || ''} ${t(selectedSection, 'name')}`}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(selectedSection.color || '#e53935', 0.3),
                    color: 'white',
                    mt: 0.5
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* ========== 2. GÖRÜŞ & YORUMLARINIZ ========== */}
        <Box sx={{ px: 2, py: 1.5, maxWidth: 800, mx: 'auto' }}>
          <Typography
            onClick={() => setShowReviewForm(true)}
            sx={{
              color: 'grey.400',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': { color: 'white' },
              transition: 'color 0.2s'
            }}
          >
            💬 {language === 'tr' ? 'Görüş & Yorumlarınız' : 'Feedback & Reviews'}
          </Typography>
          
          {reviewSubmitted && (
            <Fade in>
              <Alert severity="success" sx={{ mt: 1 }}>
                {language === 'tr' ? 'Yorumunuz başarıyla gönderildi! Teşekkür ederiz 🎉' : 'Your review has been submitted! Thank you 🎉'}
              </Alert>
            </Fade>
          )}
        </Box>

        {/* ========== 3. DUYURULAR ========== */}
        {announcements.length > 0 && (
          <Box sx={{ px: 2, pb: 2, maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
              <Box 
                sx={{ 
                  display: 'flex',
                  transition: 'transform 0.5s ease-in-out',
                  transform: `translateX(-${currentAnnouncementIndex * 100}%)`
                }}
              >
                {announcements.map((ann, index) => (
                  <Box 
                    key={ann.id || index} 
                    sx={{ minWidth: '100%', px: 0.5 }}
                  >
                    <Box sx={{
                      bgcolor: ann.type === 'promo' ? 'rgba(229,57,53,0.15)' : 
                               ann.type === 'warning' ? 'rgba(255,152,0,0.15)' : 
                               ann.type === 'info' ? 'rgba(30,136,229,0.15)' : 'rgba(255,255,255,0.05)',
                      borderRadius: 2,
                      p: 2,
                      borderLeft: '3px solid',
                      borderColor: ann.type === 'promo' ? 'error.main' : 
                                   ann.type === 'warning' ? 'warning.main' : 
                                   ann.type === 'info' ? 'info.main' : 'grey.600'
                    }}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Typography sx={{ fontSize: '1.2rem' }}>{ann.icon || '📢'}</Typography>
                        <Box>
                          <Typography fontWeight={600} color="white" sx={{ fontSize: '0.9rem' }}>
                            {t(ann, 'title')}
                          </Typography>
                          <Typography variant="body2" color="grey.400" sx={{ mt: 0.25 }}>
                            {t(ann, 'message')}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Box>
              
              {announcements.length > 1 && (
                <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1.5 }}>
                  {announcements.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentAnnouncementIndex(index)}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: currentAnnouncementIndex === index ? 'primary.main' : 'grey.700',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': { bgcolor: currentAnnouncementIndex === index ? 'primary.main' : 'grey.500' }
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        )}

        {/* ========== 4. KAMPANYALI ÜRÜNLER ========== */}
        {campaignProducts.length > 0 && (
          <Box sx={{ py: 2, maxWidth: 800, mx: 'auto' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                {language === 'tr' ? 'Kampanyalar' : 'Campaigns'}
              </Typography>
              {!isMobile && campaignProducts.length > 3 && (
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => scrollCampaign('left')} sx={{ bgcolor: 'background.paper' }}>
                    <ChevronLeft />
                  </IconButton>
                  <IconButton size="small" onClick={() => scrollCampaign('right')} sx={{ bgcolor: 'background.paper' }}>
                    <ChevronRight />
                  </IconButton>
                </Stack>
              )}
            </Stack>
            
            <Box 
              ref={campaignScrollRef}
              sx={{ 
                display: 'flex', 
                gap: 1.5, 
                overflowX: 'auto', 
                px: 2,
                pb: 1,
                scrollSnapType: 'x mandatory',
                '&::-webkit-scrollbar': { height: 6 }, 
                '&::-webkit-scrollbar-thumb': { bgcolor: 'primary.main', borderRadius: 3 },
                '&::-webkit-scrollbar-track': { bgcolor: 'background.paper', borderRadius: 3 }
              }}
            >
              {campaignProducts.map(product => (
                <Box 
                  key={product.id} 
                  onClick={() => setSelectedProduct(product)}
                  sx={{ 
                    minWidth: 160, 
                    width: 160, 
                    cursor: 'pointer', 
                    flexShrink: 0, 
                    scrollSnapAlign: 'start',
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    transition: 'transform 0.2s, box-shadow 0.2s', 
                    '&:hover': { transform: 'scale(1.03)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' } 
                  }}
                >
                  {product.thumbnail ? (
                    <Box 
                      component="img" 
                      src={getImageUrl(product.thumbnail)} 
                      alt={t(product, 'name')}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
                      <Restaurant sx={{ fontSize: 48, color: 'text.secondary' }} />
                    </Box>
                  )}
                  
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
                  
                  <Chip 
                    label={`%${Math.round((1 - product.campaignPrice / product.price) * 100)}`} 
                    size="small" 
                    color="error" 
                    sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 700, fontSize: '0.7rem', height: 22 }} 
                  />
                  
                  {product.hasGlb && (
                    <Chip 
                      icon={<ViewInAr sx={{ fontSize: 14 }} />} 
                      label="3D" 
                      size="small" 
                      color="info" 
                      sx={{ position: 'absolute', top: 8, right: 8, height: 22 }} 
                    />
                  )}
                  
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600} 
                      color="white"
                      noWrap
                      sx={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                    >
                      {t(product, 'name')}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 0.25 }}>
                      <Typography variant="body1" color="error.main" fontWeight={700}>
                        {formatPrice(product.campaignPrice)}
                      </Typography>
                      <Typography variant="caption" color="grey.500" sx={{ textDecoration: 'line-through' }}>
                        {formatPrice(product.price)}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ========== 5. KATEGORİLER ========== */}
        <Box sx={{ px: 2, py: 2, maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            {language === 'tr' ? 'Kategoriler' : 'Categories'}
          </Typography>
          
          {layouts && layouts.length > 0 ? (
            <Stack spacing={1.5}>
              {layouts.map((row, rowIndex) => {
                const rowCategories = row.categories || []
                if (rowCategories.length === 0) return null
                
                return (
                  <Box 
                    key={row.id || row._id || `row-${rowIndex}`} 
                    sx={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(12, 1fr)',
                      gap: 1.5,
                      width: '100%'
                    }}
                  >
                    {rowCategories.map((item, catIndex) => {
                      const category = item.category || item
                      const categoryId = category.id || category._id
                      
                      if (!categoryId && !category.name) return null
                      
                      const size = item.size || category.layoutSize || 'half'
                      const productCount = getCategoryProductCount(categoryId)
                      
                      const gridSpan = size === 'full' ? 12 : size === 'half' ? 6 : 4
                      const aspectRatio = size === 'full' ? '16 / 9' : '1 / 1'
                      
                      return (
                        <Box
                          key={categoryId || `cat-${catIndex}`}
                          onClick={() => handleCategorySelect(categoryId)}
                          sx={{ 
                            gridColumn: `span ${gridSpan}`,
                            aspectRatio,
                            borderRadius: 2, 
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': { transform: 'scale(1.02)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' },
                            '&:active': { transform: 'scale(0.98)' }
                          }}
                        >
                          {category.image ? (
                            <Box 
                              component="img" 
                              src={getImageUrl(category.image)} 
                              alt={t(category, 'name')}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <Box sx={{ 
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)' 
                            }}>
                              <Typography sx={{ fontSize: gridSpan === 4 ? 32 : gridSpan === 6 ? 48 : 56 }}>
                                {category.icon}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                          
                          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                            <Typography 
                              color="white" 
                              fontWeight={700}
                              noWrap
                              sx={{ 
                                fontSize: gridSpan === 4 ? '0.75rem' : gridSpan === 6 ? '0.85rem' : '1rem',
                                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                              }}
                            >
                              {t(category, 'name')}
                            </Typography>
                            <Typography variant="caption" color="grey.400">
                              {productCount} {language === 'tr' ? 'ürün' : 'products'}
                            </Typography>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )
              })}
            </Stack>
          ) : mainCategories.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
              {mainCategories.map(cat => {
                const productCount = getCategoryProductCount(cat.id)
                
                return (
                  <Box
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    sx={{
                      aspectRatio: '1 / 1',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 2,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.02)' },
                      '&:active': { transform: 'scale(0.98)' }
                    }}
                  >
                    {cat.image ? (
                      <Box 
                        component="img" 
                        src={getImageUrl(cat.image)} 
                        alt={t(cat, 'name')}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'
                      }}>
                        <Typography sx={{ fontSize: 48 }}>{cat.icon}</Typography>
                      </Box>
                    )}
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                    <Box sx={{ position: 'absolute', bottom: 8, left: 12, right: 12 }}>
                      <Typography color="white" fontWeight={700} noWrap>{t(cat, 'name')}</Typography>
                      <Typography variant="caption" color="grey.400">
                        {productCount} {language === 'tr' ? 'ürün' : 'products'}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {language === 'tr' ? 'Henüz kategori eklenmemiş' : 'No categories added yet'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* ========== 6. FOOTER ========== */}
        <Box sx={{ mt: 4, pt: 4, pb: 6, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ px: 2, maxWidth: 600, mx: 'auto' }}>
            <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
              {branch?.logo ? (
                <Avatar 
                  src={getImageUrl(branch.logo)} 
                  sx={{ width: 100, height: 100, '& img': { objectFit: 'contain' } }} 
                  variant="rounded"
                />
              ) : (
                <Box sx={{ width: 100, height: 100, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Restaurant sx={{ fontSize: 50, color: 'white' }} />
                </Box>
              )}
            </Stack>

            <Stack spacing={2}>
              {branch?.address && (
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <LocationOn color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {language === 'tr' ? 'Adres' : 'Address'}
                    </Typography>
                    <Typography variant="body2">{branch.address}</Typography>
                  </Box>
                </Stack>
              )}

              {branch?.phone && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Phone color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {language === 'tr' ? 'Telefon' : 'Phone'}
                    </Typography>
                    <Typography variant="body2" component="a" href={`tel:${branch.phone}`} sx={{ color: 'white', textDecoration: 'none', display: 'block' }}>
                      {branch.phone}
                    </Typography>
                  </Box>
                </Stack>
              )}

              {branch?.workingHours && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <AccessTime color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {language === 'tr' ? 'Çalışma Saatleri' : 'Working Hours'}
                    </Typography>
                    <Typography variant="body2">{branch.workingHours}</Typography>
                  </Box>
                </Stack>
              )}
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
              {branch?.whatsapp && (
                <IconButton
                  component="a"
                  href={`https://wa.me/${branch.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  sx={{ bgcolor: '#25D366', color: 'white', width: 48, height: 48, '&:hover': { bgcolor: '#128C7E' } }}
                >
                  <WhatsApp />
                </IconButton>
              )}
              {branch?.instagram && (
                <IconButton
                  component="a"
                  href={`https://instagram.com/${branch.instagram.replace('@', '')}`}
                  target="_blank"
                  sx={{ bgcolor: '#E4405F', color: 'white', width: 48, height: 48, '&:hover': { bgcolor: '#C13584' } }}
                >
                  <Instagram />
                </IconButton>
              )}
            </Stack>

            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                component="a"
                href="https://www.linkedin.com/in/yusuf-kerim-sar%C4%B1ta%C5%9F-94b172219/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' }, transition: 'color 0.2s' }}
              >
                Yusuf Kerim Sarıtaş © {new Date().getFullYear()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ========== ARAMA MODAL ========== */}
        <Dialog 
          open={showSearch} 
          onClose={() => { setShowSearch(false); setSearchQuery(''); }} 
          fullScreen={isMobile}
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { bgcolor: 'background.default' } }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton onClick={() => { setShowSearch(false); setSearchQuery(''); }} edge="start">
                <Close />
              </IconButton>
              <TextField 
                fullWidth
                placeholder={language === 'tr' ? 'Ürün ara...' : 'Search products...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                variant="standard"
                InputProps={{ disableUnderline: true, sx: { fontSize: '1.1rem' } }}
              />
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            {searchQuery.trim() ? (
              searchResults.length > 0 ? (
                <Grid container spacing={2}>
                  {searchResults.map(product => (
                    <Grid item xs={6} sm={4} key={product.id}>
                      <Box
                        onClick={() => { handleProductSelect(product); setShowSearch(false); setSearchQuery(''); }}
                        sx={{ 
                          cursor: 'pointer', 
                          borderRadius: 2,
                          overflow: 'hidden',
                          position: 'relative',
                          aspectRatio: '1 / 1',
                          transition: 'transform 0.2s', 
                          '&:hover': { transform: 'scale(1.02)' } 
                        }}
                      >
                        {product.thumbnail ? (
                          <Box 
                            component="img" 
                            src={getImageUrl(product.thumbnail)} 
                            alt={t(product, 'name')}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
                            <Restaurant sx={{ fontSize: 48, color: 'text.secondary' }} />
                          </Box>
                        )}
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} />
                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                          <Typography variant="subtitle2" fontWeight={600} color="white" noWrap>{t(product, 'name')}</Typography>
                          <Typography variant="body2" color="primary.main" fontWeight={700}>{formatPrice(product.price)}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    "{searchQuery}" {language === 'tr' ? 'için sonuç bulunamadı' : 'not found'}
                  </Typography>
                </Box>
              )
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  {language === 'tr' ? 'Ürün adı yazarak arama yapın' : 'Type product name to search'}
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* ========== ÜRÜN DETAY MODAL ========== */}
        <ProductDetailModal
          product={selectedProduct}
          onClose={handleProductBack}
          onTagClick={handleTagSelectWithHistory}
          language={language}
          t={t}
          tArray={tArray}
        />

        {/* ========== YORUM FORMU MODAL ========== */}
        <Dialog open={showReviewForm} onClose={() => setShowReviewForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>
                💬 {language === 'tr' ? 'Görüş & Yorumunuz' : 'Your Feedback'}
              </Typography>
              <IconButton onClick={() => setShowReviewForm(false)} size="small"><Close /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField 
                fullWidth 
                label={language === 'tr' ? 'Adınız' : 'Your Name'}
                value={reviewForm.customerName} 
                onChange={e => setReviewForm({ ...reviewForm, customerName: e.target.value })} 
                required 
                placeholder={language === 'tr' ? 'İsminizi girin' : 'Enter your name'}
              />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {language === 'tr' ? 'Puanınız' : 'Your Rating'} *
                </Typography>
                <Rating 
                  value={reviewForm.rating} 
                  onChange={(e, v) => setReviewForm({ ...reviewForm, rating: v })} 
                  size="large" 
                  sx={{ fontSize: 40 }}
                />
              </Box>
              
              <TextField 
                fullWidth 
                label={language === 'tr' ? 'Yorumunuz' : 'Your Comment'}
                value={reviewForm.comment} 
                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} 
                multiline 
                rows={4} 
                placeholder={language === 'tr' ? 'Deneyiminizi bizimle paylaşın...' : 'Share your experience with us...'} 
              />
              
              <TextField 
                fullWidth 
                label={language === 'tr' ? 'İletişim Bilginiz (Opsiyonel)' : 'Contact Info (Optional)'}
                value={reviewForm.contact} 
                onChange={e => setReviewForm({ ...reviewForm, contact: e.target.value })} 
                placeholder={language === 'tr' ? 'Telefon veya email' : 'Phone or email'}
                helperText={language === 'tr' ? 'Size geri dönüş yapabilmemiz için' : 'So we can get back to you'} 
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowReviewForm(false)} sx={{ mr: 1 }}>
              {language === 'tr' ? 'İptal' : 'Cancel'}
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmitReview} 
              disabled={!reviewForm.customerName || submittingReview} 
              startIcon={submittingReview ? <CircularProgress size={20} /> : <Send />}
              sx={{ px: 4 }}
            >
              {submittingReview 
                ? (language === 'tr' ? 'Gönderiliyor...' : 'Sending...') 
                : (language === 'tr' ? 'Gönder' : 'Send')
              }
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========== 3D FLOATING BUTTON ========== */}
        <Floating3DButton
          onClick={handleOpenCarousel}
          productCount={products3D.length}
          language={language}
        />

        {/* ========== 3D CAROUSEL MODAL ========== */}
        <Carousel3DModal
          open={showCarousel}
          onClose={handleCloseCarousel}
          products={products3D}
          language={language}
          t={t}
          onProductSelect={(product) => {
            handleCloseCarousel()
            setTimeout(() => handleProductSelect(product), 100)
          }}
        />

      </Box>
    </ThemeProvider>
  )
}

// ==================== 3D FLOATING BUTTON ====================
function Floating3DButton({ onClick, productCount, language = 'tr' }) {
  const [pulse, setPulse] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => setPulse(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (productCount === 0) return null

  return (
    <Tooltip title={language === 'tr' ? '3D Menüde Gezin' : 'Browse 3D Menu'} placement="left">
      <Box
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          cursor: 'pointer',
        }}
      >
        {/* Pulse animasyonu */}
        {pulse && (
          <Box
            sx={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: 'pulse3d 2s infinite',
              '@keyframes pulse3d': {
                '0%': { transform: 'scale(1)', opacity: 0.5 },
                '50%': { transform: 'scale(1.3)', opacity: 0 },
                '100%': { transform: 'scale(1)', opacity: 0.5 },
              }
            }}
          />
        )}
        
        {/* Ana buton */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(229, 57, 53, 0.5)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 6px 30px rgba(229, 57, 53, 0.7)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            }
          }}
        >
          <ViewInAr sx={{ fontSize: 32, color: 'white' }} />
        </Box>
        
        {/* Badge - ürün sayısı */}
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: '#1e88e5',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #0a0a0a',
          }}
        >
          {productCount}
        </Box>
      </Box>
    </Tooltip>
  )
}

// ==================== 3D CAROUSEL MODAL ====================
function Carousel3DModal({ open, onClose, products, language = 'tr', t, onProductSelect }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const modelViewerRef = useRef(null)

  // Dile göre metin
  const getText = t || ((item, field) => {
    if (!item) return ''
    const enField = field + 'EN'
    if (language === 'en' && item[enField]) return item[enField]
    return item[field] || ''
  })

  // Kategorileri çıkar
  const categories = useMemo(() => {
    const cats = []
    const seen = new Set()
    products.forEach(p => {
      const catId = p.categoryId || p.category?._id || p.category?.id
      const catName = getText(p, 'categoryName') || p.categoryName || 'Diğer'
      if (catId && !seen.has(catId)) {
        seen.add(catId)
        cats.push({ id: catId, name: catName })
      }
    })
    return cats
  }, [products, language])

  // Filtrelenmiş ürünler
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products
    return products.filter(p => {
      const catId = p.categoryId || p.category?._id || p.category?.id
      return catId === selectedCategory
    })
  }, [products, selectedCategory])

  // Modal açıldığında sıfırla
  useEffect(() => {
    if (open) {
      setCurrentIndex(0)
      setSelectedCategory('all')
    }
  }, [open])

  // Kategori değiştiğinde index sıfırla
  useEffect(() => {
    setCurrentIndex(0)
  }, [selectedCategory])

  const currentProduct = filteredProducts[currentIndex]

  const handlePrev = () => {
    setCurrentIndex(prev => prev === 0 ? filteredProducts.length - 1 : prev - 1)
  }

  const handleNext = () => {
    setCurrentIndex(prev => prev === filteredProducts.length - 1 ? 0 : prev + 1)
  }

  // Touch/Swipe
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd = (e) => {
    if (!touchStart) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext()
      else handlePrev()
    }
    setTouchStart(null)
  }

  // Gerçek AR'ı aç
  const handleOpenRealAR = () => {
    const modelViewer = modelViewerRef.current
    if (modelViewer && modelViewer.canActivateAR) {
      modelViewer.activateAR()
    } else {
      alert(language === 'tr' ? 'AR bu cihazda desteklenmiyor. Android veya iOS cihaz gerekli.' : 'AR not supported. Android or iOS device required.')
    }
  }

  if (!open || products.length === 0) return null

  return (
    <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { bgcolor: '#0a0a0a' } }}>
      
      {/* Header */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 10,
        p: 2,
        pb: 1,
        bgcolor: 'rgba(0,0,0,0.95)',
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="white">
              {language === 'tr' ? '3D Menü' : '3D Menu'}
            </Typography>
            <Typography variant="caption" color="grey.400">
              {currentIndex + 1} / {filteredProducts.length} {language === 'tr' ? 'ürün' : 'products'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
            <Close />
          </IconButton>
        </Stack>

        {/* Kategori Filtresi */}
        {categories.length > 1 && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            overflowX: 'auto', 
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            <Chip
              label={language === 'tr' ? 'Tümü' : 'All'}
              onClick={() => setSelectedCategory('all')}
              sx={{
                bgcolor: selectedCategory === 'all' ? 'primary.main' : 'rgba(255,255,255,0.1)',
                color: 'white',
                fontWeight: 600,
                '&:hover': { bgcolor: selectedCategory === 'all' ? 'primary.dark' : 'rgba(255,255,255,0.2)' },
              }}
            />
            {categories.map(cat => (
              <Chip
                key={cat.id}
                label={cat.name}
                onClick={() => setSelectedCategory(cat.id)}
                sx={{
                  bgcolor: selectedCategory === cat.id ? 'primary.main' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: selectedCategory === cat.id ? 'primary.dark' : 'rgba(255,255,255,0.2)' },
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Model Viewer Area */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: categories.length > 1 ? 110 : 70,
          left: 0,
          right: 0,
          bottom: 220,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {filteredProducts.length > 0 ? (
          <>
            {/* Sol Ok */}
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 5,
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
            >
              <ChevronLeft sx={{ fontSize: 28 }} />
            </IconButton>

            {/* Model Viewer */}
            <model-viewer
              ref={modelViewerRef}
              key={`carousel-${currentProduct?.id}`}
              src={getGlbUrl(currentProduct?.glbFile)}
              alt={getText(currentProduct, 'name')}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              rotation-per-second="25deg"
              shadow-intensity="1"
              exposure="1"
              style={{ 
                width: '100%', 
                height: '100%',
                backgroundColor: '#0a0a0a',
              }}
            >
              <button slot="ar-button" style={{ display: 'none' }} />
            </model-viewer>

            {/* Sağ Ok */}
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 5,
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
            >
              <ChevronRight sx={{ fontSize: 28 }} />
            </IconButton>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="grey.500">
              {language === 'tr' ? 'Bu kategoride ürün yok' : 'No products in this category'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Sol Alt - Gerçek Ortamda Gör Butonu */}
      <Box sx={{
        position: 'absolute',
        left: 16,
        bottom: 230,
        zIndex: 15,
      }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<ViewInAr />}
          onClick={handleOpenRealAR}
          sx={{
            py: 1.5,
            px: 2.5,
            background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
            fontWeight: 700,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(76,175,80,0.5)',
            '&:hover': {
              background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
            },
          }}
        >
          {language === 'tr' ? 'Masaya Yerleştir' : 'Place on Table'}
        </Button>
      </Box>

      {/* Alt Panel */}
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'rgba(0,0,0,0.98)',
        p: 2,
      }}>
        {/* Thumbnails */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          overflowX: 'auto', 
          pb: 1.5,
          justifyContent: filteredProducts.length <= 5 ? 'center' : 'flex-start',
          '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {filteredProducts.map((product, index) => (
            <Box
              key={product.id}
              onClick={() => setCurrentIndex(index)}
              sx={{
                minWidth: 52,
                width: 52,
                height: 52,
                borderRadius: 1.5,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '3px solid',
                borderColor: index === currentIndex ? 'primary.main' : 'transparent',
                opacity: index === currentIndex ? 1 : 0.5,
                transform: index === currentIndex ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s',
                '&:hover': { opacity: 1 },
              }}
            >
              {product.thumbnail ? (
                <Box component="img" src={getImageUrl(product.thumbnail)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Box sx={{ width: '100%', height: '100%', bgcolor: 'grey.800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ViewInAr sx={{ fontSize: 20, color: 'grey.500' }} />
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* Ürün Bilgisi */}
        {currentProduct && (
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Box sx={{ flex: 1, mr: 2 }}>
              <Typography variant="h6" fontWeight={700} color="white" noWrap>
                {getText(currentProduct, 'name')}
              </Typography>
              {getText(currentProduct, 'description') && (
                <Typography variant="body2" color="grey.400" sx={{ 
                  mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                }}>
                  {getText(currentProduct, 'description')}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              {currentProduct?.isCampaign && currentProduct?.campaignPrice ? (
                <>
                  <Typography variant="h5" color="error.main" fontWeight={700}>
                    {formatPrice(currentProduct.campaignPrice)}
                  </Typography>
                  <Typography variant="body2" color="grey.500" sx={{ textDecoration: 'line-through' }}>
                    {formatPrice(currentProduct.price)}
                  </Typography>
                </>
              ) : (
                <Typography variant="h5" color="primary.main" fontWeight={700}>
                  {formatPrice(currentProduct?.price)}
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        {/* Detaylar Butonu */}
        <Button
          variant="outlined"
          fullWidth
          size="large"
          startIcon={<Info />}
          onClick={() => { onClose(); onProductSelect(currentProduct) }}
          sx={{
            py: 1.2,
            borderColor: 'grey.700',
            color: 'white',
            '&:hover': { borderColor: 'grey.500', bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          {language === 'tr' ? 'Ürün Detayları' : 'Product Details'}
        </Button>
      </Box>
    </Dialog>
  )
}

// ==================== PRODUCT DETAIL MODAL ====================
function ProductDetailModal({ product, onClose, onTagClick, language = 'tr', t, tArray }) {
  const [showAR, setShowAR] = useState(false)
  const modelViewerRef = useRef(null)

  // Fallback t ve tArray fonksiyonları
  const getText = t || ((item, field) => {
    if (!item) return ''
    const enField = field + 'EN'
    if (language === 'en' && item[enField]) return item[enField]
    return item[field] || ''
  })

  const getArray = tArray || ((item, field) => {
    if (!item) return []
    const enField = field + 'EN'
    if (language === 'en' && item[enField] && item[enField].length > 0) return item[enField]
    return item[field] || []
  })

  if (!product) return null

  const handleTagClick = (tag) => {
    if (onTagClick && typeof tag === 'object' && tag.slug) {
      onClose()
      onTagClick(tag)
    }
  }

  // Kategori adını dile göre al
  const getCategoryName = () => {
    if (language === 'en' && product.categoryNameEN) return product.categoryNameEN
    return product.categoryName || ''
  }

  // Resim var mı kontrol
  const hasImage = product.thumbnail

  return (
    <Dialog open={!!product} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ position: 'relative' }}>
        
        {/* Resim Alanı - Sadece resim varsa göster */}
        {hasImage && (
          <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'background.default' }}>
            <Box component="img" src={getImageUrl(product.thumbnail)} alt={getText(product, 'name')}
              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            
            <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
              <Close sx={{ color: 'white' }} />
            </IconButton>

            <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, left: 8 }}>
              {product.isCampaign && product.campaignPrice && (
                <Chip label={`-${Math.round((1 - product.campaignPrice / product.price) * 100)}%`} size="small" color="error" />
              )}
              {product.isFeatured && <Chip label="⭐" size="small" color="warning" />}
            </Stack>
          </Box>
        )}

        {/* Resim yoksa üst bar */}
        {!hasImage && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Stack direction="row" spacing={0.5}>
              {product.isCampaign && product.campaignPrice && (
                <Chip label={`-${Math.round((1 - product.campaignPrice / product.price) * 100)}%`} size="small" color="error" />
              )}
              {product.isFeatured && <Chip label="⭐" size="small" color="warning" />}
            </Stack>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        )}

        <DialogContent sx={{ pt: hasImage ? 2 : 1 }}>
          <Typography variant="h5" fontWeight={700}>{getText(product, 'name')}</Typography>
          {getCategoryName() && (
            <Typography variant="body2" color="text.secondary">
              {getCategoryName()}
            </Typography>
          )}

          <Stack direction="row" alignItems="baseline" spacing={2} sx={{ mt: 2 }}>
            {product.isCampaign && product.campaignPrice ? (
              <>
                <Typography variant="h4" color="error.main" fontWeight={700}>{formatPrice(product.campaignPrice)}</Typography>
                <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(product.price)}</Typography>
              </>
            ) : (
              <Typography variant="h4" color="primary.main" fontWeight={700}>{formatPrice(product.price)}</Typography>
            )}
          </Stack>

          {getText(product, 'description') && (
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
              {getText(product, 'description')}
            </Typography>
          )}

          {(product.calories || product.preparationTime) && (
            <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap" useFlexGap>
              {product.calories && (
                <Chip 
                  icon={<Info />} 
                  label={`${product.calories} kcal`} 
                  variant="outlined" 
                  size="small" 
                />
              )}
              {product.preparationTime && (
                <Chip 
                  icon={<AccessTime />} 
                  label={`${product.preparationTime} ${language === 'tr' ? 'dk' : 'min'}`} 
                  variant="outlined" 
                  size="small" 
                />
              )}
            </Stack>
          )}

          {getArray(product, 'allergens')?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {language === 'tr' ? 'Alerjenler:' : 'Allergens:'}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                {getArray(product, 'allergens').map((a, i) => (
                  <Chip key={i} label={a} size="small" color="warning" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}

          {product.tags?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                {language === 'tr' ? 'Etiketler:' : 'Tags:'}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {product.tags.map((tag, i) => {
                  const isClickable = typeof tag === 'object' && tag.slug
                  return (
                    <Chip 
                      key={tag.id || tag.slug || i} 
                      label={typeof tag === 'string' ? tag : getText(tag, 'name')} 
                      size="small" 
                      variant="outlined"
                      clickable={isClickable}
                      onClick={isClickable ? () => handleTagClick(tag) : undefined}
                      sx={isClickable ? {
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'primary.main', color: 'white', borderColor: 'primary.main' }
                      } : {}}
                    />
                  )
                })}
              </Stack>
            </Box>
          )}

          {/* 3D Model Butonu - Sadece GLB varsa göster */}
          {product.hasGlb && product.glbFile && (
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" fullWidth size="large" startIcon={<ViewInAr />} onClick={() => setShowAR(true)}
                sx={{ py: 1.5, background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)' }}>
                {language === 'tr' ? '3D Modeli Görüntüle (AR)' : 'View 3D Model (AR)'}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Box>

      {/* AR Viewer Dialog - Sadece GLB varsa */}
      {product.hasGlb && product.glbFile && (
        <Dialog open={showAR} onClose={() => setShowAR(false)} fullScreen>
          <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: '#1a1a1a' }}>
            <IconButton onClick={() => setShowAR(false)} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, bgcolor: 'rgba(0,0,0,0.5)' }}>
              <Close sx={{ color: 'white' }} />
            </IconButton>

            <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
              <Typography variant="h6" color="white" fontWeight={700}>{getText(product, 'name')}</Typography>
              <Typography variant="body2" color="grey.400">3D Model</Typography>
            </Box>

            <model-viewer
              ref={modelViewerRef}
              src={getGlbUrl(product.glbFile)}
              alt={getText(product, 'name')}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              shadow-intensity="1"
              style={{ width: '100%', height: '100%' }}
            >
              <button slot="ar-button" style={{
                position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
                padding: '12px 24px', background: '#e53935', color: 'white', border: 'none',
                borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer'
              }}>
                📱 {language === 'tr' ? "AR'da Görüntüle" : 'View in AR'}
              </button>
            </model-viewer>

            <Box sx={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
              <Alert severity="info" sx={{ bgcolor: 'rgba(30,136,229,0.2)' }}>
                {language === 'tr' 
                  ? 'Modeli parmağınızla döndürebilir, yakınlaştırabilirsiniz. AR butonu ile gerçek ortamda görün!'
                  : 'You can rotate and zoom the model. Use AR button to view in real environment!'
                }
              </Alert>
            </Box>
          </Box>
        </Dialog>
      )}
    </Dialog>
  )
}