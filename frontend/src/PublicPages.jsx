import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  Box, Grid, Card, CardContent, CardMedia, CardActions,
  Typography, Button, TextField, Stack, Chip, Avatar, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Rating, Alert, Divider, Fade, Grow, Slide,
  IconButton, InputAdornment, Tabs, Tab, Badge, Tooltip,
  useMediaQuery, alpha, Skeleton
} from '@mui/material'
import {
  Restaurant, Store, Phone, LocationOn, AccessTime, Instagram, WhatsApp,
  KeyboardArrowRight, ViewInAr, Close, ShoppingBag, Star, Search,
  Person, Lock, Visibility, VisibilityOff, Email, Login as LoginIcon,
  Send, ArrowBack, ExpandMore, LocalOffer, Info, RateReview, ChevronLeft, ChevronRight,
  Language, Place
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
  }, [sectionSlug]) // Sadece sectionSlug değiştiğinde çalış
  
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
        // Section yok, direkt menüyü yükle
        await loadMenuData(null)
      } else if (secs.length === 1) {
        // Tek section var, otomatik seç
        const section = secs[0]
        setSelectedSection(section)
        setSearchParams({ section: section.slug })
        await loadMenuData(section.slug)
      } else if (sectionSlug) {
        // URL'de section var
        const section = secs.find(s => s.slug === sectionSlug)
        if (section) {
          setSelectedSection(section)
          await loadMenuData(sectionSlug)
        } else {
          // Geçersiz section, bölüm seçim ekranı göster
          setLoading(false)
        }
      } else {
        // Birden fazla section var ve seçim yapılmamış
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
      
      // Önce yeni menu API'sini dene
      try {
        const menuUrl = sectionSlugParam 
          ? `${API_URL}/public/branches/${slug}/menu?section=${sectionSlugParam}`
          : `${API_URL}/public/branches/${slug}/menu`
        
        const menuRes = await axios.get(menuUrl)
        menuData = menuRes.data
      } catch (menuErr) {
        // Menu API not available, using fallback APIs
        
        // Fallback: Eski API'leri kullan
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
      
      // Reviews ayrı yükle
      const reviewsRes = await axios.get(`${API_URL}/public/branches/${slug}/reviews`).catch(() => ({ data: [] }))
      
      // Branch bilgisini güncelle (section'a özel homepageImage olabilir)
      if (menuData.branch) {
        setBranch(prev => ({ ...prev, ...menuData.branch }))
      }
      
      setCategories(menuData.categories || [])
      setProducts(menuData.products || [])
      setLayouts(menuData.layouts || [])
      setAnnouncements(menuData.announcements || [])
      setTags(menuData.tags || [])
      setReviews(reviewsRes.data.reviews || reviewsRes.data || [])
      
      // Seçili section bilgisini güncelle
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

  const handleTagSelect = async (tag) => {
    setSelectedCategory(null) // Önce kategoriyi temizle
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

  const handleBackToSections = () => {
    setSelectedSection(null)
    setSearchParams({})
    setCategories([])
    setProducts([])
    setLayouts([])
    setAnnouncements([])
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

  // Kategori bazlı ürün sayısı hesaplama
  const getCategoryProductCount = (categoryId) => {
    if (!categoryId) return 0
    return products.filter(p => {
      const pCatId = p.categoryId || p.category?._id || p.category?.id || p.category
      return pCatId === categoryId || String(pCatId) === String(categoryId)
    }).length
  }

  // Seçili kategorinin ürünleri
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return []
    return products.filter(p => {
      const pCatId = p.categoryId || p.category?._id || p.category?.id || p.category
      return pCatId === selectedCategory || String(pCatId) === String(selectedCategory)
    })
  }, [products, selectedCategory])

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
      p.name?.toLowerCase().includes(query) || 
      p.description?.toLowerCase().includes(query)
    )
  }, [products, searchQuery])

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0a0a0a' }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={60} />
            <Typography color="text.secondary">Menü yükleniyor...</Typography>
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
          <Button variant="contained" component={Link} to="/" sx={{ mt: 2 }}>Ana Sayfaya Dön</Button>
        </Box>
      </ThemeProvider>
    )
  }

  // ========== BÖLÜM SEÇİM EKRANI ==========
  // Birden fazla section var ve henüz seçim yapılmamış
  if (sections.length > 1 && !selectedSection) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>
          
          {/* Bölüm Seçimi */}
          <Box sx={{ px: 2, py: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h6" fontWeight={700} textAlign="center" sx={{ mb: 0.5 }}>
              Bölüm Seçin
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              Menüyü görüntülemek istediğiniz bölümü seçin
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
                    {/* Görsel */}
                    {section.image || section.homepageImage ? (
                      <Box
                        component="img"
                        src={getImageUrl(section.homepageImage || section.image)}
                        alt={section.name}
                        sx={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                      />
                    ) : (
                      <Box sx={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'
                      }} />
                    )}

                    {/* Gradient Overlay */}
                    <Box sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)'
                    }} />

                    {/* İsim */}
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
                        {section.name}
                      </Typography>
                    </Box>

                    {/* Ok ikonu */}
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
              <IconButton onClick={() => setSelectedCategory(null)}>
                <ArrowBack />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  {selectedCategoryInfo.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {categoryProducts.length} ürün
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Ürün Listesi */}
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {categoryProducts.length > 0 ? (
              <Stack divider={<Divider />}>
                {categoryProducts.map(product => (
                  <Box 
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
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
                    {/* Sol - Küçük Kare Resim */}
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
                      {product.thumbnail ? (
                        <Box 
                          component="img" 
                          src={getImageUrl(product.thumbnail)} 
                          alt={product.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <Box sx={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <Restaurant sx={{ fontSize: 24, color: 'text.secondary' }} />
                        </Box>
                      )}
                    </Box>

                    {/* Orta - İsim ve Açıklama */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>
                        {product.name}
                      </Typography>
                      {product.description && (
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
                          {product.description}
                        </Typography>
                      )}
                      {/* Etiketler */}
                      {product.tags?.length > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                          {product.tags.slice(0, 3).map((tag, i) => (
                            <Chip 
                              key={tag.id || tag.slug || i} 
                              label={typeof tag === 'string' ? tag : tag.name} 
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

                    {/* Noktalı Çizgi */}
                    <Box sx={{ 
                      flex: '0 0 auto',
                      borderBottom: '1px dotted',
                      borderColor: 'divider',
                      width: 40,
                      alignSelf: 'center',
                      mx: 1
                    }} />

                    {/* Sağ - Fiyat */}
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
                <Restaurant sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">Bu kategoride ürün bulunmuyor</Typography>
              </Box>
            )}
          </Box>

          {/* Ürün Detay Modal */}
          <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onTagClick={handleTagSelect} />
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
                  {selectedTag.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tagProducts.length} ürün
                </Typography>
              </Box>
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
                    onClick={() => setSelectedProduct(product)}
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
                    {/* Sol - Küçük Kare Resim */}
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
                      {product.thumbnail ? (
                        <Box 
                          component="img" 
                          src={getImageUrl(product.thumbnail)} 
                          alt={product.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <Box sx={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <Restaurant sx={{ fontSize: 24, color: 'text.secondary' }} />
                        </Box>
                      )}
                    </Box>

                    {/* Orta - İsim ve Açıklama */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>
                        {product.name}
                      </Typography>
                      {product.description && (
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
                          {product.description}
                        </Typography>
                      )}
                      {/* Kategori bilgisi */}
                      {product.categoryName && (
                        <Typography variant="caption" color="grey.500" sx={{ mt: 0.5, display: 'block' }}>
                          {product.categoryName}
                        </Typography>
                      )}
                    </Box>

                    {/* Noktalı Çizgi */}
                    <Box sx={{ 
                      flex: '0 0 auto',
                      borderBottom: '1px dotted',
                      borderColor: 'divider',
                      width: 40,
                      alignSelf: 'center',
                      mx: 1
                    }} />

                    {/* Sağ - Fiyat */}
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
                <Typography color="text.secondary">Bu etikette ürün bulunmuyor</Typography>
              </Box>
            )}
          </Box>

          {/* Ürün Detay Modal */}
          <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onTagClick={handleTagSelect} />
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
          {/* Sol - Bölümlere Geri veya Dil */}
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
            <IconButton 
              sx={{ 
                bgcolor: 'rgba(0,0,0,0.5)', 
                backdropFilter: 'blur(10px)',
                color: 'white',
                width: 40,
                height: 40,
                fontSize: '0.75rem',
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              TR
            </IconButton>
          )}
          
          {/* Sağ - Arama */}
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
        </Box>

        {/* ========== 1. HOMEPAGE IMAGE ========== */}
        <Box sx={{ position: 'relative', width: '100%', height: isMobile ? 220 : 320, overflow: 'hidden' }}>
          {/* Section'a özel homepageImage varsa onu göster */}
          {selectedSection?.homepageImage ? (
            <Box component="img" src={getImageUrl(selectedSection.homepageImage)} alt={selectedSection.name}
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
          
          {/* Logo ve İsim Overlay */}
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {branch?.logo && (
              <Avatar src={getImageUrl(branch.logo)} sx={{ width: 64, height: 64, border: '3px solid', borderColor: 'background.paper', boxShadow: 3 }} />
            )}
            <Box>
              <Typography variant="h5" fontWeight={800} color="white" sx={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {branch?.name}
              </Typography>
              {/* Section adını göster */}
              {selectedSection && (
                <Chip 
                  icon={<Place sx={{ fontSize: 14 }} />}
                  label={`${selectedSection.icon || ''} ${selectedSection.name}`}
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

        {/* ========== 2. GÖRÜŞ & YORUMLARINIZ - Minimal ========== */}
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
            💬 Görüş & Yorumlarınız
          </Typography>
          
          {/* Başarı mesajı */}
          {reviewSubmitted && (
            <Fade in>
              <Alert severity="success" sx={{ mt: 1 }}>
                Yorumunuz başarıyla gönderildi! Teşekkür ederiz 🎉
              </Alert>
            </Fade>
          )}
        </Box>

        {/* ========== 3. DUYURULAR - Kayan Slider ========== */}
        {announcements.length > 0 && (
          <Box sx={{ px: 2, pb: 2, maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
              {/* Slider Container */}
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
                    sx={{ 
                      minWidth: '100%',
                      px: 0.5
                    }}
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
                          <Typography fontWeight={600} color="white" sx={{ fontSize: '0.9rem' }}>{ann.title}</Typography>
                          <Typography variant="body2" color="grey.400" sx={{ mt: 0.25 }}>{ann.message}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Box>
              
              {/* Dots Indicator */}
              {announcements.length > 1 && (
                <Stack 
                  direction="row" 
                  spacing={0.75} 
                  justifyContent="center" 
                  sx={{ mt: 1.5 }}
                >
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
              <Typography variant="h6" fontWeight={700}>Kampanyalar</Typography>
              {/* Scroll Butonları - Desktop */}
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
                  {/* Ürün Görseli */}
                  {product.thumbnail ? (
                    <Box 
                      component="img" 
                      src={getImageUrl(product.thumbnail)} 
                      alt={product.name}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
                      <Restaurant sx={{ fontSize: 48, color: 'text.secondary' }} />
                    </Box>
                  )}
                  
                  {/* Gradient Overlay */}
                  <Box sx={{ 
                    position: 'absolute', 
                    inset: 0, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' 
                  }} />
                  
                  {/* İndirim Badge */}
                  <Chip 
                    label={`%${Math.round((1 - product.campaignPrice / product.price) * 100)}`} 
                    size="small" 
                    color="error" 
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      left: 8, 
                      fontWeight: 700, 
                      fontSize: '0.7rem',
                      height: 22
                    }} 
                  />
                  
                  {/* 3D Badge */}
                  {product.hasGlb && (
                    <Chip 
                      icon={<ViewInAr sx={{ fontSize: 14 }} />} 
                      label="3D" 
                      size="small" 
                      color="info" 
                      sx={{ position: 'absolute', top: 8, right: 8, height: 22 }} 
                    />
                  )}
                  
                  {/* İsim ve Fiyat - Resim üzerinde */}
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600} 
                      color="white"
                      noWrap
                      sx={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                    >
                      {product.name}
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

        {/* ========== 5. KATEGORİLER (Bölümler) ========== */}
        <Box sx={{ px: 2, py: 2, maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Kategoriler</Typography>
          
          {layouts && layouts.length > 0 ? (
            // Layout var - Admin panelinden ayarlanan düzende göster
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
                      
                      // Grid span değerleri
                      const gridSpan = size === 'full' ? 12 : size === 'half' ? 6 : 4
                      
                      // Aspect ratio - full için dikdörtgen, half ve third için kare
                      const aspectRatio = size === 'full' ? '16 / 9' : '1 / 1'
                      
                      return (
                        <Box 
                          key={categoryId || `cat-${catIndex}`}
                          onClick={() => setSelectedCategory(categoryId)}
                          sx={{ 
                            gridColumn: `span ${gridSpan}`,
                            aspectRatio,
                            borderRadius: 2, 
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': { 
                              transform: 'scale(1.02)', 
                              boxShadow: '0 8px 24px rgba(0,0,0,0.3)' 
                            },
                            '&:active': {
                              transform: 'scale(0.98)'
                            }
                          }}
                        >
                          {/* Görsel veya Icon */}
                          {category.image ? (
                            <Box 
                              component="img" 
                              src={getImageUrl(category.image)} 
                              alt={category.name}
                              sx={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }} 
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
                                {category.icon }
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Gradient Overlay */}
                          <Box sx={{ 
                            position: 'absolute', 
                            inset: 0, 
                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' 
                          }} />
                          
                          {/* İsim ve Ürün Sayısı */}
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
                              {category.name}
                            </Typography>
                            <Typography variant="caption" color="grey.400">
                              {productCount} ürün
                            </Typography>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )
              })}
            </Stack>
          ) : categories.length > 0 ? (
            // Layout yok - Varsayılan 2'li grid göster
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1.5
            }}>
              {categories.map(cat => {
                const productCount = getCategoryProductCount(cat.id)
                
                return (
                  <Box 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
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
                        alt={cat.name}
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
                    <Box sx={{ 
                      position: 'absolute', 
                      inset: 0, 
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' 
                    }} />
                    <Box sx={{ position: 'absolute', bottom: 8, left: 12, right: 12 }}>
                      <Typography color="white" fontWeight={700} noWrap>{cat.name}</Typography>
                      <Typography variant="caption" color="grey.400">{productCount} ürün</Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Henüz kategori eklenmemiş</Typography>
            </Box>
          )}
        </Box>

        {/* ========== 6. FOOTER ========== */}
        <Box sx={{ mt: 4, pt: 4, pb: 6, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ px: 2, maxWidth: 600, mx: 'auto' }}>
            {/* Logo - Genişletilmiş, Text yok */}
            <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
              {branch?.logo ? (
                <Avatar 
                  src={getImageUrl(branch.logo)} 
                  sx={{ 
                    width: 100, 
                    height: 100,
                    '& img': { objectFit: 'contain' }
                  }} 
                  variant="rounded"
                />
              ) : (
                <Box sx={{ width: 100, height: 100, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Restaurant sx={{ fontSize: 50, color: 'white' }} />
                </Box>
              )}
            </Stack>

            {/* İletişim Bilgileri */}
            <Stack spacing={2}>
              {branch?.address && (
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <LocationOn color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Adres</Typography>
                    <Typography variant="body2">{branch.address}</Typography>
                  </Box>
                </Stack>
              )}

              {branch?.phone && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Phone color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Telefon</Typography>
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
                    <Typography variant="caption" color="text.secondary">Çalışma Saatleri</Typography>
                    <Typography variant="body2">{branch.workingHours}</Typography>
                  </Box>
                </Stack>
              )}
            </Stack>

            {/* Sosyal Medya Butonları */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
              {branch?.whatsapp && (
                <IconButton
                  component="a"
                  href={`https://wa.me/${branch.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  sx={{ 
                    bgcolor: '#25D366', 
                    color: 'white',
                    width: 48,
                    height: 48,
                    '&:hover': { bgcolor: '#128C7E' }
                  }}
                >
                  <WhatsApp />
                </IconButton>
              )}
              {branch?.instagram && (
                <IconButton
                  component="a"
                  href={`https://instagram.com/${branch.instagram.replace('@', '')}`}
                  target="_blank"
                  sx={{ 
                    bgcolor: '#E4405F', 
                    color: 'white',
                    width: 48,
                    height: 48,
                    '&:hover': { bgcolor: '#C13584' }
                  }}
                >
                  <Instagram />
                </IconButton>
              )}
            </Stack>

            {/* Copyright */}
            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
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
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: '1.1rem' }
                }}
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
                        onClick={() => { setSelectedProduct(product); setShowSearch(false); setSearchQuery(''); }}
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
                            alt={product.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
                            <Restaurant sx={{ fontSize: 48, color: 'text.secondary' }} />
                          </Box>
                        )}
                        <Box sx={{ 
                          position: 'absolute', 
                          inset: 0, 
                          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' 
                        }} />
                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                          <Typography variant="subtitle2" fontWeight={600} color="white" noWrap>{product.name}</Typography>
                          <Typography variant="body2" color="primary.main" fontWeight={700}>{formatPrice(product.price)}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">"{searchQuery}" için sonuç bulunamadı</Typography>
                </Box>
              )
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">Ürün adı yazarak arama yapın</Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* ========== KATEGORİ ÜRÜN MODAL ========== */}
        {/* KALDIRILDI - Artık sayfa olarak gösteriliyor */}

        {/* ========== ÜRÜN DETAY MODAL ========== */}
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onTagClick={handleTagSelect} />

        {/* ========== YORUM FORMU MODAL ========== */}
        <Dialog open={showReviewForm} onClose={() => setShowReviewForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>💬 Görüş & Yorumunuz</Typography>
              <IconButton onClick={() => setShowReviewForm(false)} size="small"><Close /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField 
                fullWidth 
                label="Adınız" 
                value={reviewForm.customerName} 
                onChange={e => setReviewForm({ ...reviewForm, customerName: e.target.value })} 
                required 
                placeholder="İsminizi girin"
              />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>Puanınız *</Typography>
                <Rating 
                  value={reviewForm.rating} 
                  onChange={(e, v) => setReviewForm({ ...reviewForm, rating: v })} 
                  size="large" 
                  sx={{ fontSize: 40 }}
                />
              </Box>
              
              <TextField 
                fullWidth 
                label="Yorumunuz" 
                value={reviewForm.comment} 
                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} 
                multiline 
                rows={4} 
                placeholder="Deneyiminizi bizimle paylaşın..." 
              />
              
              <TextField 
                fullWidth 
                label="İletişim Bilginiz (Opsiyonel)" 
                value={reviewForm.contact} 
                onChange={e => setReviewForm({ ...reviewForm, contact: e.target.value })} 
                placeholder="Telefon veya email" 
                helperText="Size geri dönüş yapabilmemiz için" 
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowReviewForm(false)} sx={{ mr: 1 }}>İptal</Button>
            <Button 
              variant="contained" 
              onClick={handleSubmitReview} 
              disabled={!reviewForm.customerName || submittingReview} 
              startIcon={submittingReview ? <CircularProgress size={20} /> : <Send />}
              sx={{ px: 4 }}
            >
              {submittingReview ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </ThemeProvider>
  )
}

// ==================== PRODUCT DETAIL MODAL ====================
function ProductDetailModal({ product, onClose, onTagClick }) {
  const [showAR, setShowAR] = useState(false)
  const modelViewerRef = useRef(null)

  if (!product) return null

  const handleTagClick = (tag) => {
    if (onTagClick && typeof tag === 'object' && tag.slug) {
      onClose() // Önce ürün modalını kapat
      onTagClick(tag) // Sonra etiket sayfasını aç
    }
  }

  return (
    <Dialog open={!!product} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ position: 'relative' }}>
        {/* Image */}
        <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'background.default' }}>
          {product.thumbnail ? (
            <Box component="img" src={getImageUrl(product.thumbnail)} alt={product.name}
              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Restaurant sx={{ fontSize: 80, color: 'text.secondary' }} />
            </Box>
          )}
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
            <Close sx={{ color: 'white' }} />
          </IconButton>

          {/* Badges */}
          <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, left: 8 }}>
            {product.isCampaign && product.campaignPrice && (
              <Chip label={`-${Math.round((1 - product.campaignPrice / product.price) * 100)}%`} size="small" color="error" />
            )}
            {product.isFeatured && <Chip label="⭐ Öne Çıkan" size="small" color="warning" />}
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent>
          <Typography variant="h5" fontWeight={700}>{product.name}</Typography>
          {product.categoryName && (
            <Typography variant="body2" color="text.secondary">
              {product.categoryName}
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

          {product.description && (
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>{product.description}</Typography>
          )}

          {/* Details */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap" useFlexGap>
            {product.calories && <Chip icon={<Info />} label={`${product.calories} kcal`} variant="outlined" size="small" />}
            {product.preparationTime && <Chip icon={<AccessTime />} label={`${product.preparationTime} dk`} variant="outlined" size="small" />}
          </Stack>

          {product.allergens?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Alerjenler:</Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                {product.allergens.map((a, i) => <Chip key={i} label={a} size="small" color="warning" variant="outlined" />)}
              </Stack>
            </Box>
          )}

          {product.tags?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Etiketler:</Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {product.tags.map((tag, i) => {
                  const isClickable = typeof tag === 'object' && tag.slug
                  return (
                    <Chip 
                      key={tag.id || tag.slug || i} 
                      label={typeof tag === 'string' ? tag : tag.name} 
                      size="small" 
                      variant="outlined"
                      clickable={isClickable}
                      onClick={isClickable ? () => handleTagClick(tag) : undefined}
                      sx={isClickable ? {
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          borderColor: 'primary.main'
                        }
                      } : {}}
                    />
                  )
                })}
              </Stack>
            </Box>
          )}

          {/* AR Button */}
          {product.hasGlb && product.glbFile && (
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" fullWidth size="large" startIcon={<ViewInAr />} onClick={() => setShowAR(true)}
                sx={{ py: 1.5, background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)' }}>
                3D Modeli Görüntüle (AR)
              </Button>
            </Box>
          )}
        </DialogContent>
      </Box>

      {/* AR Viewer Dialog */}
      <Dialog open={showAR} onClose={() => setShowAR(false)} fullScreen>
        <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: '#1a1a1a' }}>
          <IconButton onClick={() => setShowAR(false)} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, bgcolor: 'rgba(0,0,0,0.5)' }}>
            <Close sx={{ color: 'white' }} />
          </IconButton>

          <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
            <Typography variant="h6" color="white" fontWeight={700}>{product.name}</Typography>
            <Typography variant="body2" color="grey.400">3D Model</Typography>
          </Box>

          {/* Model Viewer */}
          <model-viewer
            ref={modelViewerRef}
            src={getGlbUrl(product.glbFile)}
            alt={product.name}
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
              📱 AR'da Görüntüle
            </button>
          </model-viewer>

          <Box sx={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
            <Alert severity="info" sx={{ bgcolor: 'rgba(30,136,229,0.2)' }}>
              Modeli parmağınızla döndürebilir, yakınlaştırabilirsiniz. AR butonu ile gerçek ortamda görün!
            </Alert>
          </Box>
        </Box>
      </Dialog>
    </Dialog>
  )
}