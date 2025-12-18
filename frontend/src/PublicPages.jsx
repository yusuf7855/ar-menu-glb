import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  Send, ArrowBack, ExpandMore, LocalOffer, Info, RateReview, ChevronLeft, ChevronRight
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
  const isMobile = useMediaQuery('(max-width:600px)')
  const campaignScrollRef = useRef(null)

  const [branch, setBranch] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [layouts, setLayouts] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '', contact: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => { if (slug) loadData() }, [slug])

  const loadData = async () => {
    try {
      const [branchRes, categoriesRes, productsRes, layoutsRes, announcementsRes, reviewsRes] = await Promise.all([
        axios.get(`${API_URL}/public/branches/${slug}`),
        axios.get(`${API_URL}/public/branches/${slug}/categories`),
        axios.get(`${API_URL}/public/branches/${slug}/products`),
        axios.get(`${API_URL}/public/branches/${slug}/category-layouts`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/public/branches/${slug}/announcements`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/public/branches/${slug}/reviews`).catch(() => ({ data: [] }))
      ])
      
      setBranch(branchRes.data)
      setCategories(categoriesRes.data)
      
      // Products - array veya object olabilir
      const prods = productsRes.data.products || productsRes.data || []
      setProducts(prods)
      
      // Layouts - Backend'den gelen veriyi işle
      const lays = layoutsRes.data || []
      setLayouts(lays)
      
      setAnnouncements(announcementsRes.data || [])
      setReviews(reviewsRes.data.reviews || reviewsRes.data || [])
    } catch (err) {
      console.error('Load error:', err)
      setError(err.response?.status === 404 ? 'Şube bulunamadı' : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
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
      loadData()
    } catch (err) { console.error(err) }
    finally { setSubmittingReview(false) }
  }

  // Kampanyalı ürünler
  const campaignProducts = useMemo(() => 
    products.filter(p => p.isCampaign && p.campaignPrice), 
    [products]
  )

  // Kategori bazlı ürün sayısı hesaplama - DÜZELTME: String() karşılaştırması
  const getCategoryProductCount = (categoryId) => {
    if (!categoryId) return 0
    return products.filter(p => String(p.categoryId) === String(categoryId)).length
  }

  // Seçili kategorinin ürünleri - DÜZELTME: String() karşılaştırması
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return []
    return products.filter(p => String(p.categoryId) === String(selectedCategory))
  }, [products, selectedCategory])

  // Seçili kategori bilgisi
  const selectedCategoryInfo = useMemo(() => {
    if (!selectedCategory) return null
    return categories.find(c => String(c.id) === String(selectedCategory))
  }, [categories, selectedCategory])

  // Kampanya scroll fonksiyonları
  const scrollCampaign = (direction) => {
    if (campaignScrollRef.current) {
      const scrollAmount = 220
      campaignScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

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

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>

        {/* ========== 1. HOMEPAGE IMAGE ========== */}
        <Box sx={{ position: 'relative', width: '100%', height: isMobile ? 220 : 320, overflow: 'hidden' }}>
          {branch?.homepageImage ? (
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
              {branch?.description && (
                <Typography variant="body2" color="grey.300" sx={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                  {branch.description}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* ========== 2. GÖRÜŞ & YORUMLARINIZ BUTONU ========== */}
        <Box sx={{ px: 2, py: 2 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<RateReview />}
            onClick={() => setShowReviewForm(true)}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(229,57,53,0.4)'
            }}
          >
            Görüş & Yorumlarınız
          </Button>
          
          {/* Başarı mesajı */}
          {reviewSubmitted && (
            <Fade in>
              <Alert severity="success" sx={{ mt: 1 }}>
                Yorumunuz başarıyla gönderildi! Teşekkür ederiz 🎉
              </Alert>
            </Fade>
          )}
        </Box>

        {/* ========== 3. DUYURULAR ========== */}
        {announcements.length > 0 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Stack spacing={1}>
              {announcements.map(ann => (
                <Alert key={ann.id} severity={ann.type === 'promo' ? 'error' : ann.type} icon={<Typography>{ann.icon}</Typography>}
                  sx={{ '& .MuiAlert-message': { width: '100%' }, borderRadius: 2 }}>
                  <Typography fontWeight={600}>{ann.title}</Typography>
                  <Typography variant="body2">{ann.message}</Typography>
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        {/* ========== 4. KAMPANYALI ÜRÜNLER ========== */}
        {campaignProducts.length > 0 && (
          <Box sx={{ py: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalOffer color="error" />
                <Typography variant="h6" fontWeight={700}>🔥 Kampanyalar</Typography>
              </Stack>
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
                gap: 2, 
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
                <Card 
                  key={product.id} 
                  onClick={() => setSelectedProduct(product)}
                  sx={{ 
                    minWidth: 180, 
                    maxWidth: 180, 
                    cursor: 'pointer', 
                    flexShrink: 0, 
                    scrollSnapAlign: 'start',
                    border: '2px solid', 
                    borderColor: 'error.main',
                    borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s', 
                    '&:hover': { transform: 'scale(1.03)', boxShadow: '0 8px 24px rgba(229,57,53,0.3)' } 
                  }}
                >
                  <Box sx={{ position: 'relative', pt: '100%' }}>
                    {product.thumbnail ? (
                      <CardMedia component="img" image={getImageUrl(product.thumbnail)} alt={product.name}
                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                        <Restaurant sx={{ fontSize: 48, color: 'text.secondary' }} />
                      </Box>
                    )}
                    <Chip 
                      label={`%${Math.round((1 - product.campaignPrice / product.price) * 100)} İNDİRİM`} 
                      size="small" 
                      color="error" 
                      sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 700, fontSize: '0.7rem' }} 
                    />
                    {product.hasGlb && (
                      <Chip icon={<ViewInAr sx={{ fontSize: 14 }} />} label="3D" size="small" color="info" sx={{ position: 'absolute', top: 8, right: 8 }} />
                    )}
                  </Box>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>{product.name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 0.5 }}>
                      <Typography variant="h6" color="error.main" fontWeight={700}>{formatPrice(product.campaignPrice)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(product.price)}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* ========== 5. KATEGORİLER (Bölümler) ========== */}
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>📂 Bölümler</Typography>
          
          {layouts.length > 0 ? (
            // Layout var - Admin panelinden ayarlanan düzende göster
            <Stack spacing={1.5}>
              {layouts.map((row, rowIndex) => {
                const rowCategories = row.categories || []
                if (rowCategories.length === 0) return null
                
                return (
                  <Box 
                    key={row.id || rowIndex} 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'row',
                      flexWrap: 'nowrap',
                      gap: '8px',
                      width: '100%'
                    }}
                  >
                    {rowCategories.map((item, catIndex) => {
                      // Kategori bilgisini al - nested object veya direkt obje olabilir
                      const category = item.category || {}
                      const categoryId = category.id || category._id
                      
                      // Kategori bulunamadıysa atla
                      if (!categoryId && !category.name) return null
                      
                      const size = item.size || 'half'
                      const productCount = getCategoryProductCount(categoryId)
                      
                      // Boyuta göre yükseklik
                      const height = size === 'full' ? 100 : size === 'half' ? 120 : 130
                      
                      // Flex değerleri
                      const flexValue = size === 'full' 
                        ? '1 1 100%' 
                        : size === 'half' 
                          ? '1 1 calc(50% - 4px)' 
                          : '1 1 calc(33.333% - 5.33px)'
                      
                      return (
                        <Box 
                          key={categoryId || catIndex}
                          onClick={() => setSelectedCategory(categoryId)}
                          sx={{ 
                            flex: flexValue,
                            minWidth: 0,
                            height, 
                            borderRadius: 2, 
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': { transform: 'scale(1.02)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }
                          }}
                        >
                          {category.image ? (
                            <Box component="img" src={getImageUrl(category.image)} alt={category.name}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Box sx={{ 
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)' 
                            }}>
                              <Typography sx={{ fontSize: size === 'third' ? 32 : 48 }}>
                                {category.icon || '📁'}
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ 
                            position: 'absolute', 
                            inset: 0, 
                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' 
                          }} />
                          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                            <Typography 
                              color="white" 
                              fontWeight={700}
                              noWrap
                              sx={{ 
                                fontSize: size === 'third' ? '0.75rem' : '0.9rem',
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
            // Layout yok - Basit 2'li grid göster
            <Grid container spacing={1.5}>
              {categories.map(cat => {
                const productCount = getCategoryProductCount(cat.id)
                return (
                  <Grid item xs={6} key={cat.id}>
                    <Card 
                      onClick={() => setSelectedCategory(cat.id)}
                      sx={{ 
                        height: 120, 
                        cursor: 'pointer', 
                        position: 'relative', 
                        overflow: 'hidden',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.02)' }
                      }}
                    >
                      {cat.image ? (
                        <CardMedia component="img" image={getImageUrl(cat.image)} alt={cat.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                          <Typography variant="h2">{cat.icon}</Typography>
                        </Box>
                      )}
                      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="white">{cat.icon} {cat.name}</Typography>
                        <Typography variant="caption" color="grey.400">{productCount} ürün</Typography>
                      </Box>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Henüz kategori eklenmemiş</Typography>
            </Box>
          )}
        </Box>

        {/* ========== 6. FOOTER ========== */}
        <Box sx={{ mt: 4, pt: 4, pb: 6, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ px: 2, maxWidth: 600, mx: 'auto' }}>
            {/* Logo ve İsim */}
            <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
              {branch?.logo ? (
                <Avatar src={getImageUrl(branch.logo)} sx={{ width: 60, height: 60 }} />
              ) : (
                <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Restaurant sx={{ fontSize: 30, color: 'white' }} />
                </Box>
              )}
              <Typography variant="h6" fontWeight={700}>{branch?.name}</Typography>
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
                    <Typography variant="body2" component="a" href={`tel:${branch.phone}`} sx={{ color: 'white', textDecoration: 'none' }}>
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
                <Button
                  component="a"
                  href={`https://wa.me/${branch.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  variant="contained"
                  color="success"
                  startIcon={<WhatsApp />}
                  sx={{ borderRadius: 3 }}
                >
                  WhatsApp
                </Button>
              )}
              {branch?.instagram && (
                <Button
                  component="a"
                  href={`https://instagram.com/${branch.instagram.replace('@', '')}`}
                  target="_blank"
                  variant="outlined"
                  color="secondary"
                  startIcon={<Instagram />}
                  sx={{ borderRadius: 3 }}
                >
                  {branch.instagram}
                </Button>
              )}
            </Stack>

            {/* Copyright */}
            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                AR Menu ile oluşturuldu • © {new Date().getFullYear()} {branch?.name}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ========== KATEGORİ ÜRÜN MODAL ========== */}
        <Dialog 
          open={!!selectedCategory} 
          onClose={() => setSelectedCategory(null)} 
          fullScreen={isMobile}
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { bgcolor: 'background.default' } }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={() => setSelectedCategory(null)} edge="start">
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {selectedCategoryInfo?.icon} {selectedCategoryInfo?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {categoryProducts.length} ürün
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {categoryProducts.map(product => (
                <Grid item xs={6} sm={4} key={product.id}>
                  <Card 
                    onClick={() => setSelectedProduct(product)}
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer', 
                      transition: 'transform 0.2s', 
                      '&:hover': { transform: 'scale(1.02)' } 
                    }}
                  >
                    <Box sx={{ position: 'relative', pt: '100%' }}>
                      {product.thumbnail ? (
                        <CardMedia component="img" image={getImageUrl(product.thumbnail)} alt={product.name}
                          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                          <Restaurant sx={{ fontSize: 48, color: 'text.secondary' }} />
                        </Box>
                      )}
                      <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, right: 8 }}>
                        {product.hasGlb && <Chip icon={<ViewInAr />} label="AR" size="small" color="info" />}
                      </Stack>
                      {product.isCampaign && product.campaignPrice && (
                        <Chip label={`-${Math.round((1 - product.campaignPrice / product.price) * 100)}%`} size="small" color="error" sx={{ position: 'absolute', top: 8, left: 8 }} />
                      )}
                    </Box>
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>{product.name}</Typography>
                      {product.isCampaign && product.campaignPrice ? (
                        <Stack direction="row" spacing={1} alignItems="baseline">
                          <Typography variant="h6" color="error.main" fontWeight={700}>{formatPrice(product.campaignPrice)}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(product.price)}</Typography>
                        </Stack>
                      ) : (
                        <Typography variant="h6" color="primary.main" fontWeight={700}>{formatPrice(product.price)}</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {categoryProducts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Restaurant sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">Bu kategoride ürün bulunmuyor</Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* ========== ÜRÜN DETAY MODAL ========== */}
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

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
function ProductDetailModal({ product, onClose }) {
  const [showAR, setShowAR] = useState(false)
  const modelViewerRef = useRef(null)

  if (!product) return null

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
              {product.categoryIcon} {product.categoryName}
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
            <Stack direction="row" spacing={0.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
              {product.tags.map((tag, i) => <Chip key={i} label={tag} size="small" variant="outlined" />)}
            </Stack>
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