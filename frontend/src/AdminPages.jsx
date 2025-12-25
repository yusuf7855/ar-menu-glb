import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, CardMedia, CardActions, CardHeader,
  Typography, Button, TextField, Stack, Chip, Avatar, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, LinearProgress, Tabs, Tab, Badge, Tooltip,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
  IconButton, InputAdornment, Rating, Alert, Divider,
  ToggleButton, ToggleButtonGroup, alpha, Container, Skeleton,
  List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Menu
} from '@mui/material'
import {
  Add, Edit, Delete, Search, Refresh, Check, Close, Restaurant,
  Category, ViewInAr, Campaign, RateReview, Store, People,
  PhotoCamera, CloudUpload, LocalOffer, ThreeDRotation,
  Phone, LocationOn, AccessTime, Instagram, WhatsApp, Facebook, Language,
  GridView, ViewModule, Fullscreen, ArrowUpward, ArrowDownward,
  DragIndicator, Reply, Lock, Star, TouchApp, ThreeSixty, Place,
  Visibility, VisibilityOff, ContentCopy, OpenInNew, Translate,
  Business, Settings, Dashboard as DashboardIcon, Storefront,
  Email, Person, AdminPanelSettings, QrCode, Palette, Share,
  Link as LinkIcon, NotificationsActive, Schedule,
  ExpandMore, KeyboardArrowRight, TrendingUp
} from '@mui/icons-material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { useDropzone } from 'react-dropzone'
import {
  api, useAuth, useSnackbar, useBranch,
  formatBytes, formatDate, formatPrice, formatRelativeTime,
  getImageUrl, getGlbUrl, isHeicFile, convertHeicToJpg, FILES_URL
} from './App'

// ==================== PAGE WRAPPER ====================
export function PageWrapper({ children }) {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {children}
    </Box>
  )
}

// ==================== IMAGE UPLOADER ====================
export function ImageUploader({ value, onChange, onRemove, label, aspectRatio = '16/9', size = 'medium', disabled = false }) {
  const showSnackbar = useSnackbar()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!value) {
      setPreview(null)
      return
    }
    if (value instanceof File) {
      const url = URL.createObjectURL(value)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    if (typeof value === 'string') {
      if (value.startsWith('http') || value.startsWith('blob:')) {
        setPreview(value)
      } else {
        setPreview(getImageUrl(value))
      }
    }
  }, [value])

  const handleRemove = (e) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove()
    } else {
      onChange(null)
      setPreview(null)
    }
  }

  const handleDrop = useCallback(async (acceptedFiles) => {
    if (disabled) return
    let file = acceptedFiles[0]
    if (!file) return
    setUploading(true)
    try {
      if (isHeicFile(file)) file = await convertHeicToJpg(file)
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      onChange(file)
    } catch (err) {
      console.error(err)
      showSnackbar('Görsel yüklenemedi', 'error')
    } finally {
      setUploading(false)
    }
  }, [onChange, showSnackbar, disabled])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'] },
    maxFiles: 1,
    disabled
  })

  const sizes = { small: { height: 120 }, medium: { height: 180 }, large: { height: 240 } }

  return (
    <Box>
      {label && <Typography variant="subtitle2" gutterBottom>{label}</Typography>}
      <Paper {...getRootProps()} variant="outlined"
        sx={{
          position: 'relative', aspectRatio, minHeight: sizes[size].height,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer', overflow: 'hidden', borderStyle: 'dashed', borderWidth: 2,
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? alpha('#e53935', 0.1) : 'transparent',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s', '&:hover': { borderColor: disabled ? 'divider' : 'primary.main' }
        }}>
        <input {...getInputProps()} />
        {uploading ? (
          <CircularProgress />
        ) : preview ? (
          <>
            <Box component="img" src={preview} alt={label} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
            {!disabled && (
              <>
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { opacity: 1 } }}>
                  <Stack alignItems="center" spacing={1}>
                    <PhotoCamera sx={{ fontSize: 40, color: 'white' }} />
                    <Typography color="white" variant="body2">Değiştir</Typography>
                  </Stack>
                </Box>
                <IconButton
                  onClick={handleRemove}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                    zIndex: 2
                  }}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </>
            )}
          </>
        ) : (
          <Stack alignItems="center" spacing={1} sx={{ color: 'text.secondary', p: 2 }}>
            <CloudUpload sx={{ fontSize: 48 }} />
            <Typography variant="body2" textAlign="center">{isDragActive ? 'Bırakın...' : disabled ? 'Görsel yüklenemez' : 'Görsel yükleyin'}</Typography>
          </Stack>
        )}
      </Paper>
    </Box>
  )
}

// ==================== 3D MODEL VIEWER ====================
export function ModelViewer3D({ glbFile, productName, size = 'medium' }) {
  const modelRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const sizes = { small: { height: 200 }, medium: { height: 300 }, large: { height: 400 } }

  useEffect(() => {
    setLoading(true)
    setError(false)
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [glbFile])

  if (!glbFile) return null

  return (
    <Box sx={{ position: 'relative', height: sizes[size].height, bgcolor: 'background.default', borderRadius: 2, overflow: 'hidden' }}>
      {loading && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', zIndex: 2 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">3D Model yükleniyor...</Typography>
          </Stack>
        </Box>
      )}
      
      <model-viewer
        ref={modelRef}
        src={getGlbUrl(glbFile)}
        alt={productName}
        camera-controls
        auto-rotate
        rotation-per-second="30deg"
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1"
        style={{ width: '100%', height: '100%' }}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
      />

      <Box sx={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
        bgcolor: 'rgba(0,0,0,0.7)', borderRadius: 2,
        animation: 'pulse 2s infinite',
        '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } }
      }}>
        <TouchApp sx={{ color: 'white', fontSize: 20 }} />
        <Typography variant="caption" color="white">Döndürmek için sürükleyin</Typography>
      </Box>

      <Chip icon={<ThreeSixty />} label="3D" size="small" color="info" sx={{ position: 'absolute', top: 12, right: 12 }} />

      {error && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
          <Stack alignItems="center" spacing={1}>
            <ViewInAr sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography color="text.secondary">Model yüklenemedi</Typography>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

// ==================== SHARED COMPONENTS ====================
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = 'Sil', severity = 'error' }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{typeof message === 'string' ? <Typography>{message}</Typography> : message}</DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel}>İptal</Button>
        <Button onClick={onConfirm} variant="contained" color={severity}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <Paper sx={{ p: 6, textAlign: 'center' }}>
      <Box sx={{ color: 'text.secondary', mb: 2 }}>{icon}</Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>{title}</Typography>
      {description && <Typography color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>}
      {action}
    </Paper>
  )
}

export function StatCard({ title, value, icon, color = 'primary', subtitle, onClick }) {
  return (
    <Card sx={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s', '&:hover': onClick ? { transform: 'translateY(-4px)' } : {} }} onClick={onClick}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight={700}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ==================== RESTAURANT DASHBOARD ====================
export function RestaurantDashboardPage() {
  const { restaurantId } = useParams()
  const { user } = useAuth()
  const showSnackbar = useSnackbar()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    if (restaurantId) loadData() 
  }, [restaurantId])

  const loadData = async () => {
    try {
      const [restaurantRes, statsRes] = await Promise.all([
        api.get(`/restaurants/${restaurantId}`),
        api.get(`/restaurants/${restaurantId}/dashboard`)
      ])
      setRestaurant(restaurantRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
      showSnackbar('Veriler yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{restaurant?.name}</Typography>
            <Typography color="text.secondary">Restoran Paneli</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button 
              startIcon={<Settings />}
              onClick={() => navigate(`/admin/restaurant/${restaurantId}/settings`)}
            >
              Ayarlar
            </Button>
            <Button 
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate(`/admin/restaurant/${restaurantId}/branches/new`)}
            >
              Yeni Şube
            </Button>
          </Stack>
        </Stack>

        {/* Stats */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard 
              title="Toplam Şube" 
              value={stats?.counts?.branches || 0} 
              icon={<Store />} 
              color="primary"
              onClick={() => navigate(`/admin/restaurant/${restaurantId}/branches`)}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard 
              title="Toplam Ürün" 
              value={stats?.counts?.products || 0} 
              icon={<Restaurant />} 
              color="secondary"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard 
              title="Kategoriler" 
              value={stats?.counts?.categories || 0} 
              icon={<Category />} 
              color="info"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard 
              title="Kullanıcılar" 
              value={stats?.counts?.users || 0} 
              icon={<People />} 
              color="warning"
              onClick={() => navigate(`/admin/restaurant/${restaurantId}/users`)}
            />
          </Grid>
        </Grid>

        {/* Branch Stats */}
        <Card>
          <CardHeader 
            title="Şube İstatistikleri" 
            action={
              <Button 
                size="small" 
                onClick={() => navigate(`/admin/restaurant/${restaurantId}/branches`)}
              >
                Tümünü Gör
              </Button>
            }
          />
          <CardContent>
            {stats?.branchStats?.length > 0 ? (
              <Grid container spacing={2}>
                {stats.branchStats.map((branch, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={600}>{branch.name}</Typography>
                        <Chip label={`${branch.count} ürün`} size="small" color="primary" />
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyState 
                icon={<Store sx={{ fontSize: 48 }} />} 
                title="Henüz şube yok"
                action={
                  <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={() => navigate(`/admin/restaurant/${restaurantId}/branches/new`)}
                  >
                    İlk Şubeyi Ekle
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader title="Son Yorumlar" />
          <CardContent>
            {stats?.recentReviews?.length > 0 ? (
              <Stack spacing={2}>
                {stats.recentReviews.map(review => (
                  <Paper key={review._id} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start">
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Rating value={review.rating} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {review.branch?.name}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5 }} noWrap>
                          {review.comment || 'Yorum yazılmamış'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {review.customerName} • {formatRelativeTime(review.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <EmptyState icon={<RateReview sx={{ fontSize: 48 }} />} title="Henüz yorum yok" />
            )}
          </CardContent>
        </Card>
      </Stack>
    </PageWrapper>
  )
}

// ==================== DASHBOARD PAGE ====================
export function DashboardPage() {
  const { branchId, sectionId } = useParams()
  const { currentSection, currentBranch } = useBranch()
  const showSnackbar = useSnackbar()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (branchId && sectionId) loadStats() }, [branchId, sectionId])

  const loadStats = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/dashboard?section=${sectionId}`)
      setStats(res.data)
    } catch { showSnackbar('İstatistikler yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#5c6bc0', '#26a69a']
  const totalProducts = stats?.counts?.products || 0
  const totalCategories = stats?.counts?.categories || 0
  const campaignCount = stats?.counts?.campaigns || 0
  const avgRating = stats?.averageRating || 0

  return (
    <PageWrapper>
      <Stack spacing={3}>
        {/* Ana İstatistik Kartları - 5 Sütun */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' }
            }} onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/products`)}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.9 }}>Ürünler</Typography>
                    <Typography variant="h4" fontWeight={700}>{totalProducts}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    <Restaurant />
                  </Avatar>
                </Stack>
                <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                  {campaignCount > 0 ? `${campaignCount} kampanyalı` : 'Menüdeki tüm ürünler'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' }
            }} onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/categories`)}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.9 }}>Kategoriler</Typography>
                    <Typography variant="h4" fontWeight={700}>{totalCategories}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    <Category />
                  </Avatar>
                </Stack>
                <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                  Menü kategorileri
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' }
            }} onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/reviews`)}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.9 }}>Yorumlar</Typography>
                    <Typography variant="h4" fontWeight={700}>{stats?.counts?.reviews || 0}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    <RateReview />
                  </Avatar>
                </Stack>
                <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                  {stats?.counts?.pendingReviews > 0 ? `${stats.counts.pendingReviews} bekleyen` : 'Tüm yorumlar onaylı'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' }
            }} onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/glb`)}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.9 }}>3D Modeller</Typography>
                    <Typography variant="h4" fontWeight={700}>{stats?.counts?.glbFiles || 0}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    <ViewInAr />
                  </Avatar>
                </Stack>
                <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                  AR için hazır modeller
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' }
            }} onClick={() => navigate(`/admin/branch/${branchId}/tags`)}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.9 }}>Etiketler</Typography>
                    <Typography variant="h4" fontWeight={700}>{stats?.counts?.tags || 0}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    <LocalOffer />
                  </Avatar>
                </Stack>
                <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                  Ürün etiketleri
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Ortalama Puan ve Hızlı İşlemler */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderTop: 4, borderColor: 'warning.main' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Müşteri Memnuniyeti</Typography>
                  <Star sx={{ color: 'warning.main', fontSize: 28 }} />
                </Stack>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography variant="h2" fontWeight={700} color="warning.main">{avgRating.toFixed(1)}</Typography>
                  <Typography variant="h6" color="text.secondary">/ 5</Typography>
                </Stack>
                <Rating value={avgRating} precision={0.1} readOnly size="large" sx={{ mt: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {stats?.counts?.reviews > 0
                    ? `${stats.counts.reviews} değerlendirme üzerinden`
                    : 'Henüz değerlendirme yok'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Hızlı İşlemler</Typography>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Button variant="contained" fullWidth startIcon={<Add />} size="large"
                      onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/products?action=new`)}
                      sx={{ py: 1.5 }}>
                      Yeni Ürün
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button variant="outlined" fullWidth startIcon={<Category />} size="large"
                      onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/categories`)}
                      sx={{ py: 1.5 }}>
                      Kategoriler
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button variant="outlined" fullWidth startIcon={<Place />} size="large"
                      onClick={() => navigate(`/admin/branch/${branchId}/sections`)}
                      sx={{ py: 1.5 }}>
                      Bölümler
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button variant="outlined" fullWidth startIcon={<Settings />} size="large"
                      onClick={() => navigate(`/admin/branch/${branchId}/settings`)}
                      sx={{ py: 1.5 }}>
                      Ayarlar
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderTop: 4, borderColor: 'success.main' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Menü Özeti</Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Restaurant sx={{ color: 'primary.main' }} />
                      <Typography color="text.primary">Toplam Ürün</Typography>
                    </Stack>
                    <Typography fontWeight={700} color="text.primary">{totalProducts}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Category sx={{ color: 'secondary.main' }} />
                      <Typography color="text.primary">Kategori</Typography>
                    </Stack>
                    <Typography fontWeight={700} color="text.primary">{totalCategories}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LocalOffer sx={{ color: 'error.main' }} />
                      <Typography color="text.primary">Kampanyalı</Typography>
                    </Stack>
                    <Typography fontWeight={700} color="error.main">{campaignCount}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Place sx={{ color: 'info.main' }} />
                      <Typography color="text.primary">Bölüm</Typography>
                    </Stack>
                    <Typography fontWeight={700} color="text.primary">{stats?.counts?.sections || 0}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Grafikler ve Listeler */}
        <Grid container spacing={2}>
          {/* Kategori Dağılımı - Daha Geniş */}
          <Grid item xs={12} lg={5}>
            <Card sx={{ height: 420 }}>
              <CardHeader
                title="Kategori Dağılımı"
                titleTypographyProps={{ fontWeight: 600 }}
                action={
                  <Chip
                    label={`${stats?.categoryStats?.length || 0} kategori`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                }
              />
              <CardContent sx={{ pt: 0 }}>
                {stats?.categoryStats?.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.categoryStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={{ stroke: '#666', strokeWidth: 1 }}
                        >
                          {stats.categoryStats.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => [`${value} ürün`, 'Ürün Sayısı']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stack alignItems="center" spacing={2}>
                      <Category sx={{ fontSize: 64, color: 'action.disabled' }} />
                      <Typography color="text.secondary">Kategori ekleyin ve ürünler oluşturun</Typography>
                      <Button variant="outlined" startIcon={<Add />}
                        onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/categories`)}>
                        Kategori Ekle
                      </Button>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Puan Dağılımı */}
          <Grid item xs={12} sm={6} lg={3.5}>
            <Card sx={{ height: 420 }}>
              <CardHeader
                title="Puan Dağılımı"
                titleTypographyProps={{ fontWeight: 600 }}
              />
              <CardContent>
                {stats?.counts?.reviews > 0 ? (
                  <Stack spacing={2.5}>
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = stats?.ratingStats?.find(r => r._id === rating)?.count || 0
                      const total = stats?.counts?.reviews || 1
                      const percent = (count / total) * 100
                      return (
                        <Stack key={rating} direction="row" alignItems="center" spacing={2}>
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: 45 }}>
                            <Typography variant="body2" fontWeight={600}>{rating}</Typography>
                            <Star sx={{ fontSize: 18, color: 'warning.main' }} />
                          </Stack>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={percent}
                              sx={{
                                height: 16,
                                borderRadius: 2,
                                bgcolor: 'grey.100',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 2,
                                  bgcolor: rating >= 4 ? 'success.main' : rating >= 3 ? 'warning.main' : 'error.main'
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="body2" fontWeight={600} sx={{ width: 35, textAlign: 'right' }}>
                            {count}
                          </Typography>
                        </Stack>
                      )
                    })}
                  </Stack>
                ) : (
                  <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stack alignItems="center" spacing={2}>
                      <Star sx={{ fontSize: 64, color: 'action.disabled' }} />
                      <Typography color="text.secondary" textAlign="center">
                        Müşterileriniz yorum bıraktığında<br />puanlar burada görünecek
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* En Çok Görüntülenen Ürünler */}
          <Grid item xs={12} sm={6} lg={3.5}>
            <Card sx={{ height: 420 }}>
              <CardHeader
                title="Popüler Ürünler"
                titleTypographyProps={{ fontWeight: 600 }}
                action={
                  <Button size="small" onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/products`)}>
                    Tümü
                  </Button>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                {stats?.topProducts?.length > 0 ? (
                  <Stack spacing={1.5}>
                    {stats.topProducts.map((product, index) => (
                      <Paper
                        key={product._id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' }
                        }}
                        onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/products`)}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar
                            sx={{
                              bgcolor: COLORS[index % COLORS.length],
                              width: 36,
                              height: 36,
                              fontSize: 14,
                              fontWeight: 700
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.viewCount || 0} görüntülenme
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stack alignItems="center" spacing={2}>
                      <TrendingUp sx={{ fontSize: 64, color: 'action.disabled' }} />
                      <Typography color="text.secondary" textAlign="center">
                        Ürün ekleyin ve<br />popülerliklerini takip edin
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alt Kısım - Kampanyalar ve Yorumlar */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 380 }}>
              <CardHeader
                title="Kampanyalı Ürünler"
                titleTypographyProps={{ fontWeight: 600 }}
                avatar={<LocalOffer color="error" />}
                action={
                  stats?.campaignProducts?.length > 0 && (
                    <Button size="small" onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/products?filter=campaign`)}>
                      Tümü
                    </Button>
                  )
                }
              />
              <CardContent sx={{ pt: 0, height: 290, overflow: 'auto' }}>
                {stats?.campaignProducts?.length > 0 ? (
                  <Stack spacing={2}>
                    {stats.campaignProducts.map(product => (
                      <Paper
                        key={product._id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: 'action.hover', borderColor: 'error.main' }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar
                            src={product.thumbnail ? getImageUrl(product.thumbnail) : undefined}
                            variant="rounded"
                            sx={{ width: 56, height: 56 }}
                          >
                            <Restaurant />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>
                              {product.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <Typography variant="body1" color="error.main" fontWeight={700}>
                                {formatPrice(product.campaignPrice)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                {formatPrice(product.price)}
                              </Typography>
                            </Stack>
                          </Box>
                          <Chip
                            label={`-${Math.round((1 - product.campaignPrice / product.price) * 100)}%`}
                            size="medium"
                            color="error"
                            sx={{ fontWeight: 700 }}
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stack alignItems="center" spacing={2}>
                      <LocalOffer sx={{ fontSize: 64, color: 'action.disabled' }} />
                      <Typography color="text.secondary" textAlign="center">
                        Henüz kampanyalı ürün yok
                      </Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Add />}
                        onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/products`)}
                      >
                        Kampanya Ekle
                      </Button>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: 380 }}>
              <CardHeader
                title="Son Yorumlar"
                titleTypographyProps={{ fontWeight: 600 }}
                avatar={<RateReview color="primary" />}
                action={
                  stats?.recentReviews?.length > 0 && (
                    <Button size="small" onClick={() => navigate(`/admin/branch/${branchId}/section/${sectionId}/reviews`)}>
                      Tümü
                    </Button>
                  )
                }
              />
              <CardContent sx={{ pt: 0, height: 290, overflow: 'auto' }}>
                {stats?.recentReviews?.length > 0 ? (
                  <Stack spacing={2}>
                    {stats.recentReviews.map(review => (
                      <Paper
                        key={review._id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderLeft: 4,
                          borderLeftColor: review.isApproved ? 'success.main' : 'warning.main'
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              <Rating value={review.rating} readOnly size="small" />
                              {!review.isApproved && <Chip label="Bekliyor" size="small" color="warning" />}
                            </Stack>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {review.comment || 'Yorum yazılmamış'}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                {review.customerName?.charAt(0)?.toUpperCase() || '?'}
                              </Avatar>
                              <Typography variant="caption" color="text.secondary">
                                {review.customerName} • {formatRelativeTime(review.createdAt)}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stack alignItems="center" spacing={2}>
                      <RateReview sx={{ fontSize: 64, color: 'action.disabled' }} />
                      <Typography color="text.secondary" textAlign="center">
                        Müşteri yorumları burada görünecek
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </PageWrapper>
  )
}

// ==================== SECTIONS PAGE ====================
export function SectionsPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const navigate = useNavigate()
  const { currentBranch } = useBranch()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [reordering, setReordering] = useState(false)

  useEffect(() => { if (branchId) loadSections() }, [branchId])

  const loadSections = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/sections`)
      setSections(res.data)
    } catch (err) { 
      console.error(err)
      showSnackbar('Bölümler yüklenemedi', 'error') 
    }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/sections/${deleteDialog.id}`)
      showSnackbar('Bölüm silindi', 'success')
      setDeleteDialog(null)
      loadSections()
    } catch (err) { 
      console.error(err)
      showSnackbar('Silinemedi', 'error') 
    }
  }

  const handleReorder = async (index, direction) => {
    const newSections = [...sections]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newSections.length) return

    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
    setSections(newSections)

    setReordering(true)
    try {
      await api.put(`/branches/${branchId}/sections/reorder`, {
        sectionIds: newSections.map(s => s.id)
      })
    } catch (err) {
      console.error(err)
      showSnackbar('Sıralama kaydedilemedi', 'error')
      loadSections()
    } finally {
      setReordering(false)
    }
  }

  const handleToggleActive = async (section) => {
    try {
      await api.put(`/sections/${section.id}`, { isActive: !section.isActive })
      showSnackbar(section.isActive ? 'Bölüm gizlendi' : 'Bölüm aktifleştirildi', 'success')
      loadSections()
    } catch (err) {
      console.error(err)
      showSnackbar('İşlem başarısız', 'error')
    }
  }

  const copyMenuLink = (section) => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/${currentBranch?.slug || 'menu'}?section=${section.slug}`
    navigator.clipboard.writeText(link)
    showSnackbar('Menü linki kopyalandı', 'success')
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Restoran Bölümleri</Typography>
            <Typography color="text.secondary">
              Restoranınızın farklı alanlarını yönetin (Bahçe, Teras, Roof, VIP vb.)
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button startIcon={<Refresh />} onClick={loadSections} disabled={reordering}>Yenile</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingSection(null); setModalOpen(true) }}>
              Yeni Bölüm
            </Button>
          </Stack>
        </Stack>

        {sections.length > 0 ? (
          <Grid container spacing={3}>
            {sections.map((section, index) => (
              <Grid item xs={12} sm={6} md={4} key={section.id}>
                <Card sx={{ 
                  height: '100%', 
                  position: 'relative', 
                  overflow: 'visible',
                  opacity: section.isActive ? 1 : 0.7,
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}>
                  {section.image ? (
                    <CardMedia 
                      component="img" 
                      height="180" 
                      image={getImageUrl(section.image)} 
                      alt={section.name} 
                      sx={{ objectFit: 'cover' }} 
                    />
                  ) : (
                    <Box sx={{
                      height: 180,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: section.color || 'primary.main',
                      color: 'white',
                      position: 'relative'
                    }}>
                      <Typography variant="h4" fontWeight={700}>{section.name}</Typography>
                      <Box sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)'
                      }} />
                    </Box>
                  )}
                  
                  <Chip 
                    label={section.isActive ? 'Aktif' : 'Gizli'} 
                    size="small" 
                    color={section.isActive ? 'success' : 'default'}
                    icon={section.isActive ? <Visibility sx={{ fontSize: 16 }} /> : <VisibilityOff sx={{ fontSize: 16 }} />}
                    sx={{ position: 'absolute', top: 12, right: 12 }} 
                  />

                  <Stack 
                    direction="column" 
                    spacing={0.5} 
                    sx={{ position: 'absolute', top: 12, left: 12 }}
                  >
                    <IconButton 
                      size="small" 
                      onClick={() => handleReorder(index, -1)}
                      disabled={index === 0 || reordering}
                      sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleReorder(index, 1)}
                      disabled={index === sections.length - 1 || reordering}
                      sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </Stack>
                  
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Typography variant="h6" fontWeight={700}>
                        {section.name}
                      </Typography>
                      
                      {section.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical' 
                          }}
                        >
                          {section.description}
                        </Typography>
                      )}
                      
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip 
                          icon={<Restaurant fontSize="small" />} 
                          label={`${section.productCount || 0} ürün`} 
                          size="small" 
                          variant="outlined" 
                        />
                        <Chip 
                          icon={<Category fontSize="small" />} 
                          label={`${section.categoryCount || 0} kategori`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Stack>
                      
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          Slug: <strong>/{section.slug}</strong>
                        </Typography>
                        <Tooltip title="Menü linkini kopyala">
                          <IconButton size="small" onClick={() => copyMenuLink(section)}>
                            <ContentCopy sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Düzenle">
                        <IconButton 
                          size="small" 
                          onClick={() => { setEditingSection(section); setModalOpen(true) }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={section.isActive ? 'Gizle' : 'Aktifleştir'}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleToggleActive(section)}
                        >
                          {section.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => setDeleteDialog(section)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Button 
                      size="small" 
                      endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                      onClick={() => {
                        const baseUrl = window.location.origin
                        window.open(`${baseUrl}/${currentBranch?.slug || 'menu'}?section=${section.slug}`, '_blank')
                      }}
                    >
                      Önizle
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState 
            icon={<Place sx={{ fontSize: 64 }} />} 
            title="Henüz bölüm yok" 
            description="Restoran içi farklı alanlar için bölümler oluşturun. Müşteriler menüye girdiğinde önce bölüm seçecek." 
            action={
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => setModalOpen(true)}
              >
                İlk Bölümü Ekle
              </Button>
            } 
          />
        )}
      </Stack>

      <SectionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSection(null) }}
        section={editingSection}
        branchId={branchId}
        onSuccess={() => { setModalOpen(false); setEditingSection(null); loadSections() }}
        onImageUploaded={loadSections}
      />
      
      <ConfirmDialog 
        open={!!deleteDialog} 
        onCancel={() => setDeleteDialog(null)} 
        onConfirm={handleDelete}
        title="Bölümü Sil" 
        message={
          <>
            <Typography gutterBottom>
              <strong>"{deleteDialog?.name}"</strong> bölümünü silmek istediğinize emin misiniz?
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Bu bölüme ait ürün ve kategoriler <strong>Genel</strong> bölüme taşınacak ve tüm bölümlerde görünür olacak.
            </Alert>
          </>
        } 
      />
    </PageWrapper>
  )
}

// ==================== SECTION MODAL ====================
export function SectionModal({ open, onClose, section, branchId, onSuccess, onImageUploaded }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!section?.id
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#e53935',
    isActive: true,
    image: null,
    heroImage: null
  })

  const colors = ['#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047', '#7cb342', '#c0ca33', '#fdd835', '#ffb300', '#fb8c00', '#f4511e', '#6d4c41', '#546e7a']

  useEffect(() => {
    if (open) {
      if (section) {
        setForm({
          name: section.name || '',
          slug: section.slug || '',
          description: section.description || '',
          color: section.color || '#e53935',
          isActive: section.isActive !== false,
          image: section.image || null,
          heroImage: section.heroImage || null
        })
      } else {
        setForm({
          name: '',
          slug: '',
          description: '',
          color: '#e53935',
          isActive: true,
          image: null,
          heroImage: null
        })
      }
    }
  }, [section, open])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showSnackbar('Bölüm adı gerekli', 'error')
      return
    }
    
    setSaving(true)
    try {
      const data = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description,
        color: form.color,
        isActive: form.isActive
      }

      if (isEditing) {
        await api.put(`/sections/${section.id}`, data)
        showSnackbar('Bölüm güncellendi', 'success')
      } else {
        await api.post(`/branches/${branchId}/sections`, data)
        showSnackbar('Bölüm eklendi', 'success')
      }
      onSuccess()
    } catch (err) { 
      console.error(err)
      showSnackbar(err.response?.data?.error || 'Kaydedilemedi', 'error') 
    }
    finally { setSaving(false) }
  }

  const handleImageUpload = async (file, type = 'image') => {
    if (!isEditing) {
      showSnackbar('Görsel yüklemek için önce bölümü kaydedin', 'warning')
      return
    }
    
    setUploadingImage(true)
    try {
      let processedFile = file
      if (isHeicFile(file)) {
        processedFile = await convertHeicToJpg(file)
      }
      
      const formData = new FormData()
      formData.append('image', processedFile)
      
      const res = await api.post(`/sections/${section.id}/image?type=${type}`, formData)
      setForm(prev => ({ ...prev, [type]: res.data[type] }))
      showSnackbar('Görsel yüklendi', 'success')
      if (onImageUploaded) onImageUploaded()
    } catch (err) { 
      console.error(err)
      showSnackbar('Yüklenemedi', 'error') 
    }
    finally { setUploadingImage(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>
            {isEditing ? 'Bölümü Düzenle' : 'Yeni Bölüm Ekle'}
          </Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2.5}>
              <TextField 
                fullWidth 
                label="Bölüm Adı" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
                placeholder="Bahçe, Teras, VIP Salon, Roof..."
                helperText="Müşteriler bu ismi görecek"
              />
              
              <TextField 
                fullWidth 
                label="Slug (URL)" 
                value={form.slug} 
                onChange={e => setForm({ ...form, slug: e.target.value })} 
                helperText="Boş bırakılırsa otomatik oluşturulur (örn: bahce, teras, vip-salon)" 
                placeholder="bahce"
              />
              
              <TextField 
                fullWidth 
                label="Açıklama" 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                multiline 
                rows={2} 
                placeholder="Bölüm hakkında kısa açıklama..."
              />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>Arka Plan Rengi</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {colors.map(color => (
                    <Button 
                      key={color} 
                      onClick={() => setForm({ ...form, color })} 
                      sx={{ 
                        minWidth: 32, 
                        height: 32, 
                        bgcolor: color, 
                        border: form.color === color ? '3px solid' : '2px solid transparent', 
                        borderColor: form.color === color ? 'white' : 'transparent',
                        boxShadow: form.color === color ? `0 0 0 2px ${color}` : 'none',
                        '&:hover': { bgcolor: color, opacity: 0.8 } 
                      }} 
                    />
                  ))}
                </Stack>
              </Box>
              
              <FormControlLabel 
                control={
                  <Switch 
                    checked={form.isActive} 
                    onChange={e => setForm({ ...form, isActive: e.target.checked })} 
                  />
                } 
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Aktif</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pasif bölümler müşterilere görünmez
                    </Typography>
                  </Box>
                }
              />
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Önizleme</Typography>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: form.color,
                    color: 'white',
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h5" fontWeight={700}>
                    {form.name || 'Bölüm Adı'}
                  </Typography>
                  {form.description && (
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      {form.description}
                    </Typography>
                  )}
                </Paper>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Bölüm Görseli {!isEditing && <Chip label="Kaydet" size="small" sx={{ ml: 1 }} />}
                </Typography>
                {isEditing ? (
                  <Box 
                    component="label" 
                    sx={{ 
                      display: 'block', 
                      position: 'relative', 
                      width: '100%', 
                      paddingTop: '56.25%', 
                      borderRadius: 2, 
                      overflow: 'hidden', 
                      cursor: uploadingImage ? 'wait' : 'pointer', 
                      border: '2px dashed', 
                      borderColor: form.image ? 'transparent' : 'divider', 
                      bgcolor: 'background.default', 
                      '&:hover .overlay': { opacity: 1 } 
                    }}
                  >
                    {uploadingImage && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        bgcolor: 'rgba(0,0,0,0.5)',
                        zIndex: 10
                      }}>
                        <CircularProgress sx={{ color: 'white' }} />
                      </Box>
                    )}
                    {form.image ? (
                      <>
                        <Box 
                          component="img" 
                          src={getImageUrl(form.image)} 
                          alt="Bölüm" 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, left: 0, 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }} 
                        />
                        <Box 
                          className="overlay" 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, left: 0, right: 0, bottom: 0, 
                            bgcolor: 'rgba(0,0,0,0.6)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            opacity: 0, 
                            transition: 'opacity 0.2s' 
                          }}
                        >
                          <Stack alignItems="center" spacing={0.5}>
                            <PhotoCamera sx={{ color: 'white', fontSize: 28 }} />
                            <Typography variant="caption" color="white">Değiştir</Typography>
                          </Stack>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Stack alignItems="center" spacing={0.5}>
                          <CloudUpload sx={{ fontSize: 32, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">Görsel Yükle</Typography>
                        </Stack>
                      </Box>
                    )}
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*,.heic" 
                      onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0], 'image')} 
                      disabled={uploadingImage}
                    />
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Görsel yüklemek için önce bölümü kaydedin
                  </Alert>
                )}
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Anasayfa Görseli (Opsiyonel)
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Bu bölüm seçildiğinde menü üstünde gösterilecek büyük görsel
                </Typography>
                {isEditing ? (
                  <Box 
                    component="label" 
                    sx={{ 
                      display: 'block', 
                      position: 'relative', 
                      width: '100%', 
                      paddingTop: '40%', 
                      borderRadius: 2, 
                      overflow: 'hidden', 
                      cursor: uploadingImage ? 'wait' : 'pointer', 
                      border: '2px dashed', 
                      borderColor: form.heroImage ? 'success.main' : 'divider',
                      bgcolor: form.heroImage ? 'background.default' : alpha('#e53935', 0.05),
                      '&:hover .overlay': { opacity: 1 } 
                    }}
                  >
                    {form.heroImage ? (
                      <>
                        <Box
                          component="img"
                          src={getImageUrl(form.heroImage)}
                          alt="Anasayfa" 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, left: 0, 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }} 
                        />
                        <Chip 
                          label="Aktif" 
                          color="success" 
                          size="small" 
                          sx={{ position: 'absolute', top: 8, right: 8 }} 
                        />
                        <Box 
                          className="overlay" 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, left: 0, right: 0, bottom: 0, 
                            bgcolor: 'rgba(0,0,0,0.6)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            opacity: 0, 
                            transition: 'opacity 0.2s' 
                          }}
                        >
                          <Stack alignItems="center" spacing={0.5}>
                            <PhotoCamera sx={{ color: 'white', fontSize: 28 }} />
                            <Typography variant="caption" color="white">Değiştir</Typography>
                          </Stack>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Stack alignItems="center" spacing={0.5}>
                          <CloudUpload sx={{ fontSize: 28, color: 'primary.main' }} />
                          <Typography variant="caption" color="primary.main">Yükle</Typography>
                        </Stack>
                      </Box>
                    )}
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*,.heic" 
                      onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0], 'heroImage')} 
                      disabled={uploadingImage}
                    />
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Kayıt sonrası yüklenebilir
                  </Typography>
                )}
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>İptal</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={saving || uploadingImage}
          startIcon={saving ? <CircularProgress size={20} /> : <Check />}
        >
          {saving ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== PRODUCTS PAGE ====================
export function ProductsPage() {
  const { branchId, sectionId } = useParams()
  const { currentSection } = useBranch()
  const location = useLocation()
  const showSnackbar = useSnackbar()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [glbFiles, setGlbFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null })
  const [previewDialog, setPreviewDialog] = useState({ open: false, product: null })
  const [quickSortOpen, setQuickSortOpen] = useState(false)
  const [quickSortItems, setQuickSortItems] = useState([])
  const [draggedProduct, setDraggedProduct] = useState(null)

  useEffect(() => { if (branchId && sectionId) loadData() }, [branchId, sectionId])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') { setEditingProduct(null); setModalOpen(true) }
    if (params.get('filter') === 'campaign') setFilterStatus('campaign')
  }, [location.search])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, tagsRes, glbRes] = await Promise.all([
        api.get(`/branches/${branchId}/products?section=${sectionId}`),
        api.get(`/branches/${branchId}/categories?section=${sectionId}`),
        api.get(`/branches/${branchId}/tags`),
        api.get(`/branches/${branchId}/glb`)
      ])
      const prods = productsRes.data.products || productsRes.data
      setProducts(prods.sort((a, b) => (a.order || 0) - (b.order || 0)))
      setCategories(categoriesRes.data)
      setTags(tagsRes.data || [])
      setGlbFiles(glbRes.data || [])
    } catch (err) {
      console.error(err)
      showSnackbar('Veriler yüklenemedi', 'error')
    }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteDialog.product.id}`)
      showSnackbar('Ürün silindi', 'success')
      setDeleteDialog({ open: false, product: null })
      loadData()
    } catch { showSnackbar('Silme başarısız', 'error') }
  }

  // Hiyerarşik kategori listesi oluştur
  const buildCategoryTree = useCallback((cats, parentId = null, level = 0) => {
    return cats
      .filter(c => {
        const catParent = c.parent?._id || c.parent || null
        return catParent === parentId
      })
      .flatMap(c => [
        { ...c, level },
        ...buildCategoryTree(cats, c.id || c._id, level + 1)
      ])
  }, [])

  const hierarchicalCategories = useMemo(() => buildCategoryTree(categories), [categories, buildCategoryTree])

  // Kategori ve alt kategorilerinin ID'lerini bul
  const getCategoryAndChildIds = useCallback((categoryId) => {
    const ids = [categoryId]
    const findChildren = (parentId) => {
      categories.forEach(c => {
        const pId = c.parent?._id || c.parent
        if (pId === parentId || String(pId) === String(parentId)) {
          ids.push(c.id || c._id)
          findChildren(c.id || c._id)
        }
      })
    }
    findChildren(categoryId)
    return ids
  }, [categories])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterCategory) {
        const allowedCatIds = getCategoryAndChildIds(filterCategory)
        if (!allowedCatIds.some(catId => p.categoryId === catId || String(p.categoryId) === String(catId))) return false
      }
      if (filterStatus === 'active' && !p.isActive) return false
      if (filterStatus === 'inactive' && p.isActive) return false
      if (filterStatus === 'featured' && !p.isFeatured) return false
      if (filterStatus === 'campaign' && !p.isCampaign) return false
      if (filterStatus === 'has3d' && !p.hasGlb) return false
      return true
    })
  }, [products, search, filterCategory, filterStatus, getCategoryAndChildIds])

  // Drag & Drop
  const handleDragStart = (e, product) => {
    setDraggedProduct(product)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetProduct) => {
    e.preventDefault()
    if (!draggedProduct || draggedProduct.id === targetProduct.id) {
      setDraggedProduct(null)
      return
    }

    try {
      const draggedIndex = filteredProducts.findIndex(p => p.id === draggedProduct.id)
      const targetIndex = filteredProducts.findIndex(p => p.id === targetProduct.id)

      const newOrder = [...filteredProducts]
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedProduct)

      await api.put('/products/reorder', {
        orders: newOrder.map((p, i) => ({ id: p.id, order: i }))
      })

      showSnackbar('Sıralama güncellendi', 'success')
      loadData()
    } catch {
      showSnackbar('Sıralama güncellenemedi', 'error')
    }
    setDraggedProduct(null)
  }

  // Hızlı Sıralama Modal
  const openQuickSort = () => {
    setQuickSortItems([...filteredProducts])
    setQuickSortOpen(true)
  }

  const handleQuickSortDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index)
  }

  const handleQuickSortDrop = (e, targetIndex) => {
    e.preventDefault()
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (sourceIndex === targetIndex) return

    const newItems = [...quickSortItems]
    const [removed] = newItems.splice(sourceIndex, 1)
    newItems.splice(targetIndex, 0, removed)
    setQuickSortItems(newItems)
  }

  const saveQuickSort = async () => {
    try {
      await api.put('/products/reorder', {
        orders: quickSortItems.map((p, i) => ({ id: p.id, order: i }))
      })
      showSnackbar('Sıralama güncellendi', 'success')
      setQuickSortOpen(false)
      loadData()
    } catch {
      showSnackbar('Sıralama güncellenemedi', 'error')
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
                <TextField size="small" placeholder="Ürün ara..." value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ minWidth: 200 }} />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Kategori</InputLabel>
                  <Select value={filterCategory} label="Kategori" onChange={e => setFilterCategory(e.target.value)}>
                    <MenuItem value="">Tümü</MenuItem>
                    {hierarchicalCategories.map(cat => (
                      <MenuItem key={cat.id} value={cat.id} sx={{ pl: 2 + cat.level * 2 }}>
                        {cat.level > 0 && <Typography component="span" color="text.secondary" sx={{ mr: 0.5 }}>└</Typography>}
                        {cat.icon} {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {currentSection && (
                  <Chip icon={<Place />} label={`${currentSection.icon} ${currentSection.name}`} color="primary" variant="outlined" />
                )}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Durum</InputLabel>
                  <Select value={filterStatus} label="Durum" onChange={e => setFilterStatus(e.target.value)}>
                    <MenuItem value="">Tümü</MenuItem>
                    <MenuItem value="active">Aktif</MenuItem>
                    <MenuItem value="inactive">Pasif</MenuItem>
                    <MenuItem value="featured">Öne Çıkan</MenuItem>
                    <MenuItem value="campaign">Kampanyalı</MenuItem>
                    <MenuItem value="has3d">3D Modelli</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button startIcon={<DragIndicator />} onClick={openQuickSort} variant="outlined">Hızlı Sırala</Button>
                <Button startIcon={<Refresh />} onClick={loadData}>Yenile</Button>
                <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingProduct(null); setModalOpen(true) }}>Yeni Ürün</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Chip label={`Toplam: ${products.length}`} />
          <Chip label={`Gösterilen: ${filteredProducts.length}`} variant="outlined" />
          <Chip label={`3D: ${products.filter(p => p.hasGlb).length}`} color="info" variant="outlined" />
          <Chip label={`Kampanya: ${products.filter(p => p.isCampaign).length}`} color="error" variant="outlined" />
        </Stack>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
          {filteredProducts.map(product => (
            <Card
              key={product.id}
              draggable
              onDragStart={(e) => handleDragStart(e, product)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, product)}
              sx={{
                width: 200,
                height: 320,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                cursor: 'grab',
                transition: 'all 0.2s',
                border: draggedProduct?.id === product.id ? '2px solid' : '1px solid',
                borderColor: draggedProduct?.id === product.id ? 'primary.main' : 'divider',
                '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 4 }
              }}
            >
              <Box sx={{ position: 'relative', width: 200, height: 160, bgcolor: 'background.default', overflow: 'hidden', flexShrink: 0 }}>
                {product.thumbnail ? (
                  <Box component="img" src={getImageUrl(product.thumbnail)} alt={product.name} sx={{ width: 200, height: 160, objectFit: 'cover', objectPosition: 'center' }} />
                ) : (
                  <Box sx={{ width: 200, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
                    <Restaurant sx={{ fontSize: 48, color: 'text.secondary' }} />
                  </Box>
                )}
                <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                  <DragIndicator sx={{ color: 'white', fontSize: 20, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }} />
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, right: 8 }} flexWrap="wrap">
                  {product.hasGlb && (
                    <Chip label="3D" size="small" color="info" icon={<ViewInAr />} onClick={(e) => { e.stopPropagation(); setPreviewDialog({ open: true, product }) }} sx={{ cursor: 'pointer' }} />
                  )}
                  {product.isFeatured && <Chip label="⭐" size="small" color="warning" />}
                  {product.isCampaign && <Chip label="🔥" size="small" color="error" />}
                </Stack>
                {!product.isActive && (
                  <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Chip label="Pasif" />
                  </Box>
                )}
              </Box>

              <CardContent sx={{ flex: 1, p: 1.5, overflow: 'hidden' }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>{product.name}</Typography>
                {product.categoryName && <Typography variant="caption" color="text.secondary" noWrap display="block">{product.categoryIcon} {product.categoryName}</Typography>}
                <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
                  {product.isCampaign && product.campaignPrice ? (
                    <>
                      <Typography variant="subtitle1" color="error.main" fontWeight={700}>{formatPrice(product.campaignPrice)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(product.price)}</Typography>
                    </>
                  ) : (
                    <Typography variant="subtitle1" color="primary.main" fontWeight={700}>{formatPrice(product.price)}</Typography>
                  )}
                </Stack>
              </CardContent>

              <CardActions sx={{ p: 1, pt: 0 }}>
                <Button size="small" startIcon={<Edit />} onClick={() => { setEditingProduct(product); setModalOpen(true) }}>Düzenle</Button>
                <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, product })}><Delete fontSize="small" /></IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>

        {filteredProducts.length === 0 && (
          <EmptyState icon={<Restaurant sx={{ fontSize: 64 }} />} title="Ürün bulunamadı"
            action={<Button variant="contained" startIcon={<Add />} onClick={() => { setEditingProduct(null); setModalOpen(true) }}>İlk Ürünü Ekle</Button>} />
        )}

        <ProductModal open={modalOpen} product={editingProduct} categories={categories} tags={tags} sectionId={sectionId} glbFiles={glbFiles} branchId={branchId}
          onClose={() => { setModalOpen(false); setEditingProduct(null) }}
          onSave={() => { setModalOpen(false); setEditingProduct(null); loadData() }} />

        <ConfirmDialog open={deleteDialog.open} title="Ürünü Sil" message={`"${deleteDialog.product?.name}" ürününü silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, product: null })} />

        <Dialog open={previewDialog.open} onClose={() => setPreviewDialog({ open: false, product: null })} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>{previewDialog.product?.name} - 3D Görünüm</Typography>
              <IconButton onClick={() => setPreviewDialog({ open: false, product: null })}><Close /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {previewDialog.product?.glbFile && (
              <ModelViewer3D glbFile={previewDialog.product.glbFile} productName={previewDialog.product.name} size="large" />
            )}
          </DialogContent>
        </Dialog>

        {/* Hızlı Sıralama Modal */}
        <Dialog open={quickSortOpen} onClose={() => setQuickSortOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>Ürün Sıralaması</Typography>
              <IconButton onClick={() => setQuickSortOpen(false)}><Close /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
              Ürünleri sürükleyerek sıralayın. {filterCategory && 'Seçili kategorideki ürünler gösteriliyor.'}
            </Typography>
            <Box sx={{ maxHeight: 450, overflow: 'auto' }}>
              {quickSortItems.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">Ürün bulunamadı</Typography>
                </Box>
              ) : (
                quickSortItems.map((product, index) => (
                  <Paper
                    key={product.id}
                    draggable
                    onDragStart={(e) => handleQuickSortDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleQuickSortDrop(e, index)}
                    sx={{
                      p: 1.5,
                      mx: 2,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      cursor: 'grab',
                      transition: 'all 0.15s',
                      '&:hover': { bgcolor: 'action.hover', transform: 'scale(1.01)' }
                    }}
                  >
                    <DragIndicator sx={{ color: 'text.disabled' }} />
                    <Typography variant="body2" sx={{ minWidth: 35, color: 'text.secondary', fontWeight: 600 }}>#{index + 1}</Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={500} noWrap>{product.name}</Typography>
                      {product.categoryName && (
                        <Typography variant="caption" color="text.secondary" noWrap>{product.categoryIcon} {product.categoryName}</Typography>
                      )}
                    </Box>
                    <Typography variant="body2" color="primary.main" fontWeight={600}>{formatPrice(product.price)}</Typography>
                  </Paper>
                ))
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setQuickSortOpen(false)}>İptal</Button>
            <Button variant="contained" onClick={saveQuickSort} startIcon={<Check />}>Kaydet</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </PageWrapper>
  )
}

// ==================== CASCADE MENU ITEM ====================
function CascadeMenuItem({ category, onSelect, level = 0 }) {
  const [subMenuAnchor, setSubMenuAnchor] = useState(null)
  const hasChildren = category.children && category.children.length > 0
  const catId = category.id || category._id

  const handleMouseEnter = (e) => {
    if (hasChildren) {
      setSubMenuAnchor(e.currentTarget)
    }
  }

  const handleMouseLeave = () => {
    setSubMenuAnchor(null)
  }

  const handleClick = () => {
    onSelect(catId)
  }

  return (
    <Box onMouseLeave={handleMouseLeave}>
      <MenuItem
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pl: 2 + level * 1.5
        }}
      >
        <Typography>
          {category.icon} {category.name}
        </Typography>
        {hasChildren && <KeyboardArrowRight sx={{ ml: 2, color: 'text.secondary' }} />}
      </MenuItem>

      {hasChildren && (
        <Menu
          anchorEl={subMenuAnchor}
          open={Boolean(subMenuAnchor)}
          onClose={() => setSubMenuAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: { minWidth: 180, maxHeight: 300 },
            onMouseLeave: () => setSubMenuAnchor(null)
          }}
          MenuListProps={{ onMouseLeave: () => setSubMenuAnchor(null) }}
        >
          {category.children.map(child => (
            <CascadeMenuItem
              key={child.id || child._id}
              category={child}
              onSelect={onSelect}
              level={0}
            />
          ))}
        </Menu>
      )}
    </Box>
  )
}

// ==================== PRODUCT MODAL ====================
function ProductModal({ open, product, categories, tags = [], sectionId, glbFiles, branchId, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!product?.id
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState(0)
  const [translating, setTranslating] = useState({ name: false, description: false, allergens: false })
  const [form, setForm] = useState({
    name: '', nameEN: '', price: '', description: '', descriptionEN: '',
    categoryId: '', isActive: true, isFeatured: false, isCampaign: false,
    campaignPrice: '', glbFile: '', calories: '', preparationTime: '',
    allergens: '', allergensEN: '', selectedTags: []
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null)
  const [hoveredCategory, setHoveredCategory] = useState(null)

  // Hiyerarşik kategori yapısı
  const buildCategoryTree = useCallback((cats, parentId = null) => {
    return cats
      .filter(c => {
        const catParent = c.parent?._id || c.parent || null
        return catParent === parentId
      })
      .map(c => ({
        ...c,
        children: buildCategoryTree(cats, c.id || c._id)
      }))
  }, [])

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories, buildCategoryTree])

  // Seçili kategorinin tam yolunu bul
  const getCategoryPath = useCallback((categoryId, cats = categories) => {
    const path = []
    let current = cats.find(c => (c.id || c._id) === categoryId)
    while (current) {
      path.unshift(current)
      const parentId = current.parent?._id || current.parent
      current = parentId ? cats.find(c => (c.id || c._id) === parentId) : null
    }
    return path
  }, [categories])

  const selectedCategoryPath = useMemo(() =>
    form.categoryId ? getCategoryPath(form.categoryId) : [],
    [form.categoryId, getCategoryPath]
  )

  useEffect(() => {
    if (open) {
      if (product) {
        const productTagIds = product.tags?.map(t => t.id || t._id || t) || []
        setForm({
          name: product.name || '', nameEN: product.nameEN || '',
          price: product.price || '', description: product.description || '',
          descriptionEN: product.descriptionEN || '',
          categoryId: product.categoryId || product.category?._id || '',
          isActive: product.isActive !== false, isFeatured: product.isFeatured || false,
          isCampaign: product.isCampaign || false, campaignPrice: product.campaignPrice || '',
          glbFile: product.glbFile || '', calories: product.calories || '',
          preparationTime: product.preparationTime || '',
          allergens: product.allergens?.join(', ') || '',
          allergensEN: product.allergensEN?.join(', ') || '',
          selectedTags: productTagIds
        })
        setThumbnailPreview(product.thumbnail ? getImageUrl(product.thumbnail) : null)
      } else {
        setForm({
          name: '', nameEN: '', price: '', description: '', descriptionEN: '',
          categoryId: '', isActive: true, isFeatured: false, isCampaign: false,
          campaignPrice: '', glbFile: '', calories: '', preparationTime: '',
          allergens: '', allergensEN: '', selectedTags: []
        })
        setThumbnailPreview(null)
      }
      setThumbnailFile(null)
      setTab(0)
    }
  }, [open, product])

  const handleAutoTranslate = async (field) => {
    const sourceField = field.replace('EN', '')
    const sourceText = form[sourceField]
    if (!sourceText?.trim()) {
      showSnackbar(`Önce ${sourceField === 'name' ? 'ürün adını' : sourceField === 'description' ? 'açıklamayı' : 'alerjenleri'} girin`, 'warning')
      return
    }
    setTranslating(prev => ({ ...prev, [sourceField]: true }))
    try {
      const res = await api.post('/translate', { text: sourceText, targetLang: 'en', sourceLang: 'tr' })
      if (res.data.success && res.data.translatedText) {
        setForm(prev => ({ ...prev, [field]: res.data.translatedText }))
        showSnackbar('Çeviri başarılı', 'success')
      } else {
        showSnackbar('Çeviri yapılamadı', 'error')
      }
    } catch (err) {
      console.error('Translation error:', err)
      showSnackbar('Çeviri hatası', 'error')
    } finally {
      setTranslating(prev => ({ ...prev, [sourceField]: false }))
    }
  }

  const handleTranslateAll = async () => {
    const fieldsToTranslate = []
    if (form.name && !form.nameEN) fieldsToTranslate.push({ source: 'name', target: 'nameEN' })
    if (form.description && !form.descriptionEN) fieldsToTranslate.push({ source: 'description', target: 'descriptionEN' })
    if (form.allergens && !form.allergensEN) fieldsToTranslate.push({ source: 'allergens', target: 'allergensEN' })
    if (fieldsToTranslate.length === 0) { showSnackbar('Çevrilecek alan bulunamadı', 'info'); return }

    setTranslating({ name: true, description: true, allergens: true })
    try {
      const texts = fieldsToTranslate.map(f => form[f.source])
      const res = await api.post('/translate/bulk', { texts, targetLang: 'en', sourceLang: 'tr' })
      if (res.data.success) {
        const updates = {}
        res.data.translations.forEach((t, i) => { if (t.translated) updates[fieldsToTranslate[i].target] = t.translated })
        setForm(prev => ({ ...prev, ...updates }))
        showSnackbar(`${Object.keys(updates).length} alan çevrildi`, 'success')
      }
    } catch (err) {
      console.error('Bulk translation error:', err)
      showSnackbar('Toplu çeviri hatası', 'error')
    } finally {
      setTranslating({ name: false, description: false, allergens: false })
    }
  }

  const handleThumbnailChange = (file) => {
    if (!file) return
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) { showSnackbar('Ürün adı ve fiyat zorunludur', 'error'); return }
    setSaving(true)
    try {
      const data = {
        name: form.name, nameEN: form.nameEN || '',
        price: parseFloat(form.price), description: form.description,
        descriptionEN: form.descriptionEN || '',
        categoryId: form.categoryId || null, section: sectionId,
        isActive: form.isActive, isFeatured: form.isFeatured,
        isCampaign: form.isCampaign,
        campaignPrice: form.campaignPrice ? parseFloat(form.campaignPrice) : null,
        calories: form.calories ? parseInt(form.calories) : null,
        preparationTime: form.preparationTime ? parseInt(form.preparationTime) : null,
        allergens: form.allergens ? form.allergens.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergensEN: form.allergensEN ? form.allergensEN.split(',').map(s => s.trim()).filter(Boolean) : [],
        tags: form.selectedTags
      }

      let productId = product?.id
      if (isEditing) {
        await api.put(`/products/${productId}`, data)
      } else {
        const res = await api.post(`/branches/${branchId}/products`, data)
        productId = res.data.id
      }

      if (thumbnailFile) {
        const formData = new FormData()
        formData.append('image', thumbnailFile)
        await api.post(`/products/${productId}/thumbnail`, formData)
      }

      if (form.glbFile !== (product?.glbFile || '')) {
        await api.put(`/products/${productId}/assign-glb`, { glbFile: form.glbFile || null })
      }

      showSnackbar(isEditing ? 'Ürün güncellendi' : 'Ürün oluşturuldu', 'success')
      onSave()
    } catch (err) {
      console.error(err)
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally { setSaving(false) }
  }

  const availableGlbFiles = glbFiles.filter(g => !g.isAssigned || g.filename === product?.glbFile)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>{isEditing ? 'Ürün Düzenle' : 'Yeni Ürün'}</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
      </DialogTitle>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Genel Bilgiler" />
        <Tab label="Çeviriler 🌐" />
        <Tab label="Detaylar & Etiketler" />
        <Tab label="3D Model" />
      </Tabs>

      <DialogContent sx={{ pt: 3 }}>
        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ImageUploader label="Ürün Görseli" value={thumbnailFile || thumbnailPreview} onChange={handleThumbnailChange} aspectRatio="1/1" />
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack spacing={2.5}>
                <TextField fullWidth label="Ürün Adı (Türkçe)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField fullWidth label="Fiyat" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }} required />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Kategori</Typography>
                    <Paper
                      variant="outlined"
                      onClick={(e) => setCategoryMenuAnchor(e.currentTarget)}
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      {selectedCategoryPath.length > 0 ? (
                        <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                          {selectedCategoryPath.map((cat, i) => (
                            <Stack key={cat.id || cat._id} direction="row" alignItems="center" spacing={0.5}>
                              {i > 0 && <KeyboardArrowRight sx={{ fontSize: 16, color: 'text.secondary' }} />}
                              <Chip
                                size="small"
                                label={`${cat.icon || ''} ${cat.name}`}
                                sx={{ height: 24 }}
                              />
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography color="text.secondary">Kategori seçin...</Typography>
                      )}
                      <ExpandMore />
                    </Paper>

                    {/* Cascade Kategori Menüsü */}
                    <Menu
                      anchorEl={categoryMenuAnchor}
                      open={Boolean(categoryMenuAnchor)}
                      onClose={() => { setCategoryMenuAnchor(null); setHoveredCategory(null) }}
                      PaperProps={{ sx: { minWidth: 200, maxHeight: 400 } }}
                    >
                      <MenuItem onClick={() => { setForm({ ...form, categoryId: '' }); setCategoryMenuAnchor(null) }}>
                        <em>Kategorisiz</em>
                      </MenuItem>
                      <Divider />
                      {categoryTree.map(cat => (
                        <CascadeMenuItem
                          key={cat.id || cat._id}
                          category={cat}
                          onSelect={(catId) => { setForm({ ...form, categoryId: catId }); setCategoryMenuAnchor(null) }}
                          level={0}
                        />
                      ))}
                    </Menu>
                  </Box>
                </Stack>
                <TextField fullWidth label="Açıklama (Türkçe)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={3} />
                <Divider />
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif" />
                  <FormControlLabel control={<Switch checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} color="warning" />} label="⭐ Öne Çıkan" />
                  <FormControlLabel control={<Switch checked={form.isCampaign} onChange={e => setForm({ ...form, isCampaign: e.target.checked })} color="error" />} label="🔥 Kampanya" />
                </Stack>
                {form.isCampaign && (
                  <TextField fullWidth label="Kampanya Fiyatı" type="number" value={form.campaignPrice} onChange={e => setForm({ ...form, campaignPrice: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }}
                    helperText={form.price && form.campaignPrice ? `${Math.round((1 - form.campaignPrice / form.price) * 100)}% indirim` : ''} />
                )}
              </Stack>
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Stack spacing={3}>
            <Alert severity="info" icon={<Translate />}>
              Türkçe içerikleri otomatik olarak İngilizceye çevirebilirsiniz.
              <Button size="small" variant="outlined" sx={{ ml: 2 }} onClick={handleTranslateAll}
                disabled={translating.name || translating.description || translating.allergens}>
                Tümünü Çevir
              </Button>
            </Alert>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Ürün Adı</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <TextField fullWidth label="Türkçe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">🇹🇷</InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tooltip title="Türkçeden İngilizceye Çevir">
                    <span>
                      <IconButton onClick={() => handleAutoTranslate('nameEN')} disabled={translating.name || !form.name?.trim()} color="primary">
                        {translating.name ? <CircularProgress size={24} /> : <Translate />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField fullWidth label="İngilizce" value={form.nameEN} onChange={e => setForm({ ...form, nameEN: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">🇬🇧</InputAdornment> }} />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Açıklama</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <TextField fullWidth label="Türkçe" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={3}
                    InputProps={{ startAdornment: <InputAdornment position="start">🇹🇷</InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 2 }}>
                  <Tooltip title="Türkçeden İngilizceye Çevir">
                    <span>
                      <IconButton onClick={() => handleAutoTranslate('descriptionEN')} disabled={translating.description || !form.description?.trim()} color="primary">
                        {translating.description ? <CircularProgress size={24} /> : <Translate />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField fullWidth label="İngilizce" value={form.descriptionEN} onChange={e => setForm({ ...form, descriptionEN: e.target.value })} multiline rows={3}
                    InputProps={{ startAdornment: <InputAdornment position="start">🇬🇧</InputAdornment> }} />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Alerjenler</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <TextField fullWidth label="Türkçe" value={form.allergens} onChange={e => setForm({ ...form, allergens: e.target.value })}
                    placeholder="Gluten, Süt, Fındık..." helperText="Virgülle ayırarak yazın"
                    InputProps={{ startAdornment: <InputAdornment position="start">🇹🇷</InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 2 }}>
                  <Tooltip title="Türkçeden İngilizceye Çevir">
                    <span>
                      <IconButton onClick={() => handleAutoTranslate('allergensEN')} disabled={translating.allergens || !form.allergens?.trim()} color="primary">
                        {translating.allergens ? <CircularProgress size={24} /> : <Translate />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField fullWidth label="İngilizce" value={form.allergensEN} onChange={e => setForm({ ...form, allergensEN: e.target.value })}
                    placeholder="Gluten, Milk, Hazelnut..." helperText="Separated by commas"
                    InputProps={{ startAdornment: <InputAdornment position="start">🇬🇧</InputAdornment> }} />
                </Grid>
              </Grid>
            </Box>
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Etiketler</Typography>
              {tags.length > 0 ? (
                <FormControl fullWidth>
                  <InputLabel>Etiketler Seçin</InputLabel>
                  <Select multiple value={form.selectedTags} label="Etiketler Seçin" onChange={e => setForm({ ...form, selectedTags: e.target.value })}
                    renderValue={(selected) => (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {selected.map(id => {
                          const tag = tags.find(t => t.id === id)
                          return tag ? (
                            <Chip key={id} label={`${tag.icon || ''} ${tag.name}`} size="small" sx={{ bgcolor: tag.color, color: 'white' }}
                              onDelete={() => setForm({ ...form, selectedTags: form.selectedTags.filter(t => t !== id) })}
                              onMouseDown={(e) => e.stopPropagation()} />
                          ) : null
                        })}
                      </Stack>
                    )}>
                    {tags.filter(t => t.isActive).map(tag => (
                      <MenuItem key={tag.id} value={tag.id}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: tag.color || 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ fontSize: 14 }}>{tag.icon || '🏷️'}</Typography>
                          </Box>
                          <Typography sx={{ flex: 1 }}>{tag.name}</Typography>
                          {form.selectedTags.includes(tag.id) && <Check color="primary" />}
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Alert severity="info">Henüz etiket eklenmemiş. Etiketler sayfasından etiket ekleyebilirsiniz.</Alert>
              )}
            </Box>

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">Ürün Detayları (Opsiyonel)</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField fullWidth label="Kalori" type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })}
                InputProps={{ endAdornment: <InputAdornment position="end">kcal</InputAdornment> }} />
              <TextField fullWidth label="Hazırlama Süresi" type="number" value={form.preparationTime} onChange={e => setForm({ ...form, preparationTime: e.target.value })}
                InputProps={{ endAdornment: <InputAdornment position="end">dk</InputAdornment> }} />
            </Stack>
          </Stack>
        )}

        {tab === 3 && (
          <Stack spacing={3}>
            <Alert severity="info" icon={<ViewInAr />}>GLB dosyaları backend/outputs klasörüne yüklenir. Yüklenen dosyaları buradan ürüne atayın.</Alert>
            {glbFiles.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel>3D Model (GLB)</InputLabel>
                <Select value={form.glbFile} label="3D Model (GLB)" onChange={e => setForm({ ...form, glbFile: e.target.value })}>
                  <MenuItem value=""><em>Seçim yok</em></MenuItem>
                  {availableGlbFiles.map(glb => (
                    <MenuItem key={glb.filename} value={glb.filename}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                        <ViewInAr color={glb.isAssigned ? 'success' : 'action'} />
                        <Box sx={{ flex: 1 }}>
                          <Typography>{glb.filename}</Typography>
                          <Typography variant="caption" color="text.secondary">{glb.sizeFormatted}</Typography>
                        </Box>
                        {glb.filename === product?.glbFile && <Chip label="Mevcut" size="small" color="success" />}
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Alert severity="warning">Henüz GLB dosyası yüklenmemiş. backend/outputs klasörüne GLB dosyası ekleyin.</Alert>
            )}
            {form.glbFile && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>3D Model Önizleme</Typography>
                <ModelViewer3D glbFile={form.glbFile} productName={form.name || 'Ürün'} size="medium" />
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={saving}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : <Check />}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== CATEGORIES PAGE ====================
export function CategoriesPage() {
  const { branchId, sectionId } = useParams()
  const { currentSection } = useBranch()
  const location = useLocation()
  const showSnackbar = useSnackbar()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null })
  const [search, setSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})
  const [draggedCategory, setDraggedCategory] = useState(null)

  useEffect(() => { if (branchId && sectionId) loadData() }, [branchId, sectionId])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') { setEditingCategory(null); setModalOpen(true) }
  }, [location.search])

  const loadData = async () => {
    try {
      const catRes = await api.get(`/branches/${branchId}/categories?section=${sectionId}`)
      setCategories(catRes.data)
    } catch { showSnackbar('Veriler yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleteDialog.category.id}`)
      showSnackbar('Kategori silindi', 'success')
      setDeleteDialog({ open: false, category: null })
      loadData()
    } catch { showSnackbar('Silme başarısız', 'error') }
  }

  const handleImageUpload = async (categoryId, file) => {
    try {
      if (isHeicFile(file)) file = await convertHeicToJpg(file)
      const formData = new FormData()
      formData.append('image', file)
      await api.post(`/categories/${categoryId}/image`, formData)
      showSnackbar('Görsel yüklendi', 'success')
      loadData()
    } catch { showSnackbar('Yükleme başarısız', 'error') }
  }

  // Toggle expand/collapse
  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }

  // Ana kategoriler (parent yok)
  const mainCategories = useMemo(() => {
    return categories.filter(c => !c.parent).sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [categories])

  // Bir kategorinin alt kategorilerini bul
  const getChildCategories = useCallback((parentId) => {
    return categories.filter(c => {
      const pId = c.parent?._id || c.parent
      return pId === parentId || String(pId) === String(parentId)
    }).sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [categories])

  // Alt kategori sayısını hesapla (recursive)
  const getSubCategoryCount = useCallback((parentId) => {
    const children = getChildCategories(parentId)
    let count = children.length
    children.forEach(child => {
      count += getSubCategoryCount(child.id || child._id)
    })
    return count
  }, [getChildCategories])

  // Drag & Drop handlers
  const handleDragStart = (e, category) => {
    setDraggedCategory(category)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault()
    if (!draggedCategory || draggedCategory.id === targetCategory.id) {
      setDraggedCategory(null)
      return
    }

    // Aynı parent altındaki kategorilerin sırasını değiştir
    const draggedParent = draggedCategory.parent?._id || draggedCategory.parent || null
    const targetParent = targetCategory.parent?._id || targetCategory.parent || null

    if (draggedParent !== targetParent && String(draggedParent) !== String(targetParent)) {
      showSnackbar('Farklı üst kategoriler arası taşıma yapılamaz', 'warning')
      setDraggedCategory(null)
      return
    }

    try {
      // Sıralama güncelle
      const siblings = draggedParent
        ? getChildCategories(draggedParent)
        : mainCategories

      const draggedIndex = siblings.findIndex(c => c.id === draggedCategory.id)
      const targetIndex = siblings.findIndex(c => c.id === targetCategory.id)

      const newOrder = [...siblings]
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedCategory)

      // Backend'e sıralama gönder
      await api.put(`/categories/reorder`, {
        orders: newOrder.map((c, i) => ({ id: c.id, order: i }))
      })

      showSnackbar('Sıralama güncellendi', 'success')
      loadData()
    } catch {
      showSnackbar('Sıralama güncellenemedi', 'error')
    }
    setDraggedCategory(null)
  }

  const filteredMainCategories = mainCategories.filter(category => {
    if (!search.trim()) return true
    const searchLower = search.toLowerCase()
    return category.name?.toLowerCase().includes(searchLower) || category.nameEN?.toLowerCase().includes(searchLower)
  })

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  // Alt kategori renderı (recursive)
  const renderSubCategories = (parentId, level = 1) => {
    const children = getChildCategories(parentId)
    if (children.length === 0) return null

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5, pl: 1, borderLeft: '2px solid', borderColor: 'primary.main', ml: 1 }}>
        {children.map(subCat => {
          const subChildren = getChildCategories(subCat.id || subCat._id)
          const hasChildren = subChildren.length > 0
          const isExpanded = expandedCategories[subCat.id]

          return (
            <Box key={subCat.id} sx={{ width: 'calc(20% - 12px)', minWidth: 160 }}>
              <Paper
                draggable
                onDragStart={(e) => handleDragStart(e, subCat)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, subCat)}
                elevation={2}
                sx={{
                  p: 1.5,
                  cursor: 'grab',
                  transition: 'all 0.2s',
                  border: '1px solid',
                  borderColor: draggedCategory?.id === subCat.id ? 'primary.main' : 'transparent',
                  bgcolor: draggedCategory?.id === subCat.id ? 'action.selected' : 'background.paper',
                  '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 4 }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <DragIndicator sx={{ fontSize: 18, color: 'text.disabled', cursor: 'grab' }} />
                  <Typography sx={{ fontSize: '1.5rem' }}>{subCat.icon}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{subCat.name}</Typography>
                    {subCat.nameEN && <Typography variant="caption" color="text.secondary" noWrap>EN: {subCat.nameEN}</Typography>}
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {hasChildren && (
                      <Chip
                        size="small"
                        label={`${subChildren.length} alt`}
                        color="primary"
                        variant="outlined"
                        onClick={() => toggleExpand(subCat.id)}
                        icon={isExpanded ? <ExpandMore sx={{ fontSize: 14 }} /> : <KeyboardArrowRight sx={{ fontSize: 14 }} />}
                        sx={{ height: 22, fontSize: '0.7rem', cursor: 'pointer' }}
                      />
                    )}
                    <Chip size="small" label={subCat.isActive ? 'Aktif' : 'Pasif'} color={subCat.isActive ? 'success' : 'default'} sx={{ height: 20, fontSize: '0.65rem' }} />
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => { setEditingCategory(subCat); setModalOpen(true) }}>
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, category: subCat })}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
              {hasChildren && isExpanded && renderSubCategories(subCat.id || subCat._id, level + 1)}
            </Box>
          )
        })}
      </Box>
    )
  }

  return (
    <PageWrapper>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{categories.length} Kategori</Typography>
            <Typography variant="body2" color="text.secondary">{currentSection?.icon} {currentSection?.name} bölümü</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingCategory(null); setModalOpen(true) }}>Yeni Kategori</Button>
        </Stack>

        <TextField size="small" fullWidth placeholder="Kategori ara..." value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" fontSize="small" /></InputAdornment> }}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }} />

        {/* Ana kategoriler - 5'li grid */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {filteredMainCategories.map(category => {
            const subCount = getSubCategoryCount(category.id)
            const isExpanded = expandedCategories[category.id]
            const children = getChildCategories(category.id)

            return (
              <Box key={category.id} sx={{ width: 'calc(20% - 13px)', minWidth: 180, display: 'flex', flexDirection: 'column' }}>
                <Card
                  draggable
                  onDragStart={(e) => handleDragStart(e, category)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category)}
                  sx={{
                    cursor: 'grab',
                    transition: 'all 0.2s',
                    border: draggedCategory?.id === category.id ? '2px solid' : '1px solid',
                    borderColor: draggedCategory?.id === category.id ? 'primary.main' : 'divider',
                    '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    height: 280
                  }}
                >
                  {/* Resim alanı - 16:9 oran, sabit yükseklik */}
                  <Box sx={{ position: 'relative', height: 120, flexShrink: 0, bgcolor: 'background.default' }}>
                    {category.image ? (
                      <Box component="img" src={getImageUrl(category.image)} alt={category.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
                        <Typography variant="h2">{category.icon}</Typography>
                      </Box>
                    )}
                    <IconButton component="label" size="small" sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.7)', p: 0.75, '&:hover': { bgcolor: 'primary.main' } }}>
                      <PhotoCamera sx={{ color: 'white', fontSize: 18 }} />
                      <input type="file" hidden accept="image/*,.heic" onChange={e => e.target.files[0] && handleImageUpload(category.id, e.target.files[0])} />
                    </IconButton>
                    <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                      <DragIndicator sx={{ color: 'white', fontSize: 20, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }} />
                    </Box>
                    <Chip label={category.isActive ? 'Aktif' : 'Pasif'} size="small" color={category.isActive ? 'success' : 'default'} sx={{ position: 'absolute', top: 8, right: 8, height: 20, fontSize: '0.65rem' }} />
                  </Box>

                  <CardContent sx={{ p: 1.5, pb: '12px !important', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{category.icon} {category.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ minHeight: 18 }}>
                      {category.nameEN ? `EN: ${category.nameEN}` : ''}
                    </Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 'auto' }}>
                      <Typography variant="body2" color="text.secondary">{category.productCount || 0} ürün</Typography>
                      {subCount > 0 && (
                        <Chip
                          label={`${subCount} alt`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          onClick={() => toggleExpand(category.id)}
                          icon={isExpanded ? <ExpandMore sx={{ fontSize: 16 }} /> : <KeyboardArrowRight sx={{ fontSize: 16 }} />}
                          sx={{ height: 24, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                      <Button size="small" fullWidth variant="contained" startIcon={<Edit sx={{ fontSize: 16 }} />} onClick={() => { setEditingCategory(category); setModalOpen(true) }}>
                        Düzenle
                      </Button>
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, category })}><Delete sx={{ fontSize: 18 }} /></IconButton>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Alt kategoriler dropdown */}
                {children.length > 0 && isExpanded && renderSubCategories(category.id)}
              </Box>
            )
          })}
        </Box>

        {filteredMainCategories.length === 0 && !search && (
          <EmptyState icon={<Category sx={{ fontSize: 64 }} />} title="Henüz kategori yok"
            action={<Button variant="contained" startIcon={<Add />} onClick={() => { setEditingCategory(null); setModalOpen(true) }}>İlk Kategoriyi Ekle</Button>} />
        )}

        {filteredMainCategories.length === 0 && search && (
          <EmptyState icon={<Search sx={{ fontSize: 64 }} />} title="Sonuç bulunamadı" description={`"${search}" için kategori bulunamadı`}
            action={<Button variant="outlined" onClick={() => setSearch('')}>Aramayı Temizle</Button>} />
        )}

        <CategoryModal open={modalOpen} category={editingCategory} sectionId={sectionId} branchId={branchId}
          onClose={() => { setModalOpen(false); setEditingCategory(null) }}
          onSave={() => { setModalOpen(false); setEditingCategory(null); loadData() }} />

        <ConfirmDialog open={deleteDialog.open} title="Kategori Sil"
          message={<><Typography>"{deleteDialog.category?.name}" kategorisini silmek istediğinize emin misiniz?</Typography><Alert severity="warning" sx={{ mt: 2 }}>Bu kategorideki ürünler kategorisiz kalacak.</Alert></>}
          onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, category: null })} />
      </Stack>
    </PageWrapper>
  )
}

// ==================== CATEGORY MODAL ====================
function CategoryModal({ open, category, sectionId, branchId, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!category?.id
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [allCategories, setAllCategories] = useState([])
  const [form, setForm] = useState({ name: '', nameEN: '', icon: '', description: '', isActive: true, layoutSize: 'half', categoryType: 'product_title', parentId: '' })

  const icons = ['🍕', '🍔', '🌮', '🍜', '🍣', '🥗', '🍰', '☕', '🍺', '🥤', '🍳', '🥪', '🍝', '🥘', '🍱', '🧁', '🍦', '🥩', '🍗', '🥙', '🌯', '🥡', '🍛', '🍲', '🥧', '🧇', '🥞', '🧆', '🍤', '🦐']

  const categoryTypes = [
    { value: 'category_title', label: 'Kategori Başlığı', description: 'En büyük başlık (örn: YEMEKLER)', size: 'h4' },
    { value: 'product_main_title', label: 'Ürün Ana Başlık', description: 'Büyük başlık (örn: Ana Yemekler)', size: 'h5' },
    { value: 'product_title', label: 'Ürün Başlığı', description: 'Normal başlık (örn: Izgara Çeşitleri)', size: 'h6' },
    { value: 'product_subtitle', label: 'Alt Ürün Başlığı', description: 'Küçük başlık (örn: Ekstra Soslar)', size: 'subtitle1' }
  ]

  // Kategorileri yükle
  useEffect(() => {
    if (open && branchId) {
      loadCategories()
    }
  }, [open, branchId, sectionId])

  const loadCategories = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/categories${sectionId ? `?section=${sectionId}` : ''}`)
      setAllCategories(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  // Hiyerarşik kategori listesi oluştur
  const buildCategoryTree = (categories, parentId = null, level = 0) => {
    return categories
      .filter(c => (c.parent || null) === parentId || (c.parent?._id || c.parent) === parentId)
      .flatMap(c => [
        { ...c, level },
        ...buildCategoryTree(categories, c.id || c._id, level + 1)
      ])
  }

  const categoryTree = useMemo(() => {
    // Düzenlenen kategoriyi ve alt kategorilerini hariç tut
    const filtered = allCategories.filter(c => {
      if (!isEditing) return true
      const catId = c.id || c._id
      if (catId === category?.id) return false
      // Alt kategorileri de hariç tut (döngü önleme)
      let parent = c.parent
      while (parent) {
        const parentId = parent._id || parent
        if (parentId === category?.id) return false
        const parentCat = allCategories.find(p => (p.id || p._id) === parentId)
        parent = parentCat?.parent
      }
      return true
    })
    return buildCategoryTree(filtered)
  }, [allCategories, isEditing, category?.id])

  useEffect(() => {
    if (open) {
      if (category) {
        setForm({
          name: category.name || '',
          nameEN: category.nameEN || '',
          icon: category.icon || '',
          description: category.description || '',
          isActive: category.isActive !== false,
          layoutSize: category.layoutSize || 'half',
          categoryType: category.categoryType || 'product_title',
          parentId: category.parent?._id || category.parent || ''
        })
      } else {
        setForm({ name: '', nameEN: '', icon: '', description: '', isActive: true, layoutSize: 'half', categoryType: 'product_title', parentId: '' })
      }
    }
  }, [open, category])

  const handleAutoTranslate = async () => {
    if (!form.name.trim()) { showSnackbar('Önce kategori adını girin', 'warning'); return }
    setTranslating(true)
    try {
      const res = await api.post('/translate', { text: form.name, targetLang: 'en', sourceLang: 'tr' })
      if (res.data.success && res.data.translatedText) {
        setForm(prev => ({ ...prev, nameEN: res.data.translatedText }))
        showSnackbar('Çeviri başarılı', 'success')
      } else { showSnackbar('Çeviri yapılamadı', 'error') }
    } catch (err) {
      console.error('Translation error:', err)
      showSnackbar('Çeviri hatası: ' + (err.response?.data?.error || err.message), 'error')
    } finally { setTranslating(false) }
  }

  const handleSubmit = async () => {
    if (!form.name) { showSnackbar('Kategori adı zorunludur', 'error'); return }
    setSaving(true)
    try {
      const data = {
        name: form.name,
        nameEN: form.nameEN,
        icon: form.icon,
        description: form.description,
        isActive: form.isActive,
        layoutSize: form.layoutSize,
        categoryType: form.categoryType,
        section: sectionId,
        parent: form.parentId || null
      }
      if (isEditing) { await api.put(`/categories/${category.id}`, data) }
      else { await api.post(`/branches/${branchId}/categories`, data) }
      showSnackbar(isEditing ? 'Kategori güncellendi' : 'Kategori oluşturuldu', 'success')
      onSave()
    } catch (err) { showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>{isEditing ? 'Kategori Düzenle' : 'Yeni Kategori'}</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Kategori Tipi Seçimi */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>Başlık Tipi</Typography>
            <Stack spacing={1}>
              {categoryTypes.map(type => (
                <Paper
                  key={type.value}
                  variant="outlined"
                  onClick={() => setForm({ ...form, categoryType: type.value })}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderColor: form.categoryType === type.value ? 'primary.main' : 'divider',
                    borderWidth: form.categoryType === type.value ? 2 : 1,
                    bgcolor: form.categoryType === type.value ? 'primary.50' : 'transparent',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                    </Box>
                    <Typography
                      variant={type.size}
                      fontWeight={700}
                      sx={{
                        color: form.categoryType === type.value ? 'primary.main' : 'text.secondary',
                        fontSize: type.value === 'category_title' ? 20 : type.value === 'product_main_title' ? 17 : type.value === 'product_title' ? 14 : 12
                      }}
                    >
                      Aa
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* Üst Kategori Seçimi */}
          {categoryTree.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Üst Kategori (Opsiyonel)</InputLabel>
              <Select
                value={form.parentId}
                label="Üst Kategori (Opsiyonel)"
                onChange={e => setForm({ ...form, parentId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Ana Kategori (Üst kategori yok)</em>
                </MenuItem>
                {categoryTree.map(cat => (
                  <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ ml: cat.level * 2, color: cat.level > 0 ? 'text.secondary' : 'text.primary' }}>
                        {'─'.repeat(cat.level)} {cat.icon} {cat.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField fullWidth label="Kategori Adı (Türkçe)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Örn: Ana Yemekler" />
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField fullWidth label="Kategori Adı (İngilizce)" value={form.nameEN} onChange={e => setForm({ ...form, nameEN: e.target.value })} placeholder="Örn: Main Courses" />
            <Tooltip title="Türkçeden İngilizceye Otomatik Çevir">
              <span>
                <Button variant="outlined" onClick={handleAutoTranslate} disabled={translating || !form.name.trim()} sx={{ minWidth: 56, height: 56, px: 2 }}>
                  {translating ? <CircularProgress size={20} /> : <Translate />}
                </Button>
              </span>
            </Tooltip>
          </Stack>

          <Box>
            <Typography variant="subtitle2" gutterBottom>İkon Seçin</Typography>
            <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 140, overflow: 'auto' }}>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {icons.map(icon => (
                  <Button key={icon} variant={form.icon === icon ? 'contained' : 'outlined'} onClick={() => setForm({ ...form, icon })} sx={{ minWidth: 44, height: 44, fontSize: 20, p: 0 }}>{icon}</Button>
                ))}
              </Stack>
            </Paper>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>Yerleşim Boyutu</Typography>
            <ToggleButtonGroup value={form.layoutSize} exclusive onChange={(e, v) => { if (v) setForm({ ...form, layoutSize: v }) }} fullWidth>
              <ToggleButton value="full"><Stack alignItems="center" spacing={0.5}><Fullscreen /><Typography variant="caption">Tam</Typography></Stack></ToggleButton>
              <ToggleButton value="half"><Stack alignItems="center" spacing={0.5}><ViewModule /><Typography variant="caption">1/2</Typography></Stack></ToggleButton>
              <ToggleButton value="third"><Stack alignItems="center" spacing={0.5}><GridView /><Typography variant="caption">1/3</Typography></Stack></ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : <Check />}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== CATEGORY LAYOUT PAGE ====================
export function CategoryLayoutPage() {
  const { branchId, sectionId } = useParams()
  const showSnackbar = useSnackbar()
  const [categories, setCategories] = useState([])
  const [layouts, setLayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (branchId && sectionId) loadData() }, [branchId, sectionId])

  const loadData = async () => {
    try {
      const [categoriesRes, layoutsRes] = await Promise.all([
        api.get(`/branches/${branchId}/categories?section=${sectionId}`),
        api.get(`/branches/${branchId}/category-layouts?section=${sectionId}`)
      ])
      const cats = categoriesRes.data || []
      const lays = layoutsRes.data || []
      setCategories(cats)
      if (lays.length === 0 && cats.length > 0) {
        setLayouts(createDefaultLayouts(cats))
      } else {
        setLayouts(lays.map(l => ({ ...l, categories: l.categories?.map(c => ({ category: c.category || c, size: c.size || 'half' })) || [] })))
      }
    } catch (err) { console.error(err); showSnackbar('Veriler yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const createDefaultLayouts = (cats) => {
    const result = []
    let currentRow = { rowOrder: 0, categories: [] }
    let currentWidth = 0
    cats.forEach(cat => {
      const size = cat.layoutSize || 'half'
      const width = size === 'full' ? 1 : size === 'half' ? 0.5 : 0.333
      if (currentWidth + width > 1.01) {
        if (currentRow.categories.length > 0) result.push(currentRow)
        currentRow = { rowOrder: result.length, categories: [] }
        currentWidth = 0
      }
      currentRow.categories.push({ category: cat, size })
      currentWidth += width
      if (currentWidth >= 0.99) {
        result.push(currentRow)
        currentRow = { rowOrder: result.length, categories: [] }
        currentWidth = 0
      }
    })
    if (currentRow.categories.length > 0) result.push(currentRow)
    return result
  }

  const addRow = () => setLayouts([...layouts, { rowOrder: layouts.length, categories: [] }])
  const removeRow = (rowIndex) => setLayouts(layouts.filter((_, i) => i !== rowIndex).map((l, i) => ({ ...l, rowOrder: i })))
  const moveRow = (rowIndex, direction) => {
    const newLayouts = [...layouts]
    const targetIndex = rowIndex + direction
    if (targetIndex < 0 || targetIndex >= newLayouts.length) return
    [newLayouts[rowIndex], newLayouts[targetIndex]] = [newLayouts[targetIndex], newLayouts[rowIndex]]
    setLayouts(newLayouts.map((l, i) => ({ ...l, rowOrder: i })))
  }
  const addCategoryToRow = (rowIndex, category, size) => {
    const newLayouts = [...layouts]
    newLayouts[rowIndex].categories.push({ category, size })
    setLayouts(newLayouts)
  }
  const removeCategoryFromRow = (rowIndex, catIndex) => {
    const newLayouts = [...layouts]
    newLayouts[rowIndex].categories.splice(catIndex, 1)
    setLayouts(newLayouts)
  }
  const changeCategorySize = (rowIndex, catIndex, size) => {
    const newLayouts = [...layouts]
    newLayouts[rowIndex].categories[catIndex].size = size
    setLayouts(newLayouts)
  }
  const getRowWidth = (row) => (row.categories || []).reduce((sum, c) => sum + (c.size === 'full' ? 1 : c.size === 'half' ? 0.5 : 0.333), 0)

  const saveLayouts = async () => {
    setSaving(true)
    try {
      const layoutsToSave = layouts.map(l => ({ rowOrder: l.rowOrder, categories: l.categories.map(c => ({ category: c.category?.id || c.category?._id || c.category, size: c.size })) }))
      await api.put(`/branches/${branchId}/category-layouts/bulk`, { layouts: layoutsToSave, section: sectionId })
      showSnackbar('Düzen kaydedildi', 'success')
    } catch (err) { console.error(err); showSnackbar('Kaydetme başarısız', 'error') }
    finally { setSaving(false) }
  }

  // Sadece ana kategoriler (parent'ı olmayan)
  const mainCategories = useMemo(() => {
    return categories.filter(c => !c.parent).sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [categories])

  const usedCategoryIds = layouts.flatMap(l => (l.categories || []).map(c => c.category?.id || c.category?._id || c.category)).filter(Boolean)
  const unusedCategories = mainCategories.filter(c => !usedCategoryIds.includes(c.id))
  const getGridSize = (size) => size === 'full' ? 12 : size === 'half' ? 6 : 4

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button onClick={loadData} startIcon={<Refresh />}>Yenile</Button>
          <Button variant="contained" onClick={saveLayouts} disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : <Check />}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
        </Stack>

        <Card>
          <CardHeader title={`Kullanılmayan Kategoriler (${unusedCategories.length})`} />
          <CardContent>
            {unusedCategories.length > 0 ? (
              <Grid container spacing={2}>
                {unusedCategories.map(cat => (
                  <Grid item xs={4} sm={3} md={2} key={cat.id}>
                    <Paper variant="outlined" sx={{ p: 1, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', transform: 'scale(1.02)' } }}
                      onClick={() => {
                        if (layouts.length === 0) { setLayouts([{ rowOrder: 0, categories: [{ category: cat, size: cat.layoutSize || 'half' }] }]) }
                        else {
                          const lastRowIndex = layouts.length - 1
                          if (getRowWidth(layouts[lastRowIndex]) < 0.99) { addCategoryToRow(lastRowIndex, cat, cat.layoutSize || 'half') }
                          else { setLayouts([...layouts, { rowOrder: layouts.length, categories: [{ category: cat, size: cat.layoutSize || 'half' }] }]) }
                        }
                      }}>
                      <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'background.default', borderRadius: 1, overflow: 'hidden', mb: 1 }}>
                        {cat.image ? <Box component="img" src={getImageUrl(cat.image)} alt={cat.name} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="h4">{cat.icon}</Typography></Box>}
                        <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}><Add fontSize="small" /></IconButton>
                      </Box>
                      <Typography variant="caption" fontWeight={600} noWrap display="block" textAlign="center">{cat.name}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : <Typography color="text.secondary" textAlign="center">Tüm kategoriler düzene eklenmiş ✓</Typography>}
          </CardContent>
        </Card>

        <Stack spacing={2}>
          {layouts.map((row, rowIndex) => (
            <Card key={rowIndex}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle2">Satır {rowIndex + 1}</Typography>
                    <Chip label={`${Math.round(getRowWidth(row) * 100)}%`} size="small" color={getRowWidth(row) > 1.01 ? 'error' : getRowWidth(row) >= 0.99 ? 'success' : 'warning'} />
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => moveRow(rowIndex, -1)} disabled={rowIndex === 0}><ArrowUpward fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => moveRow(rowIndex, 1)} disabled={rowIndex === layouts.length - 1}><ArrowDownward fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => removeRow(rowIndex)}><Delete fontSize="small" /></IconButton>
                  </Stack>
                </Stack>

                {(row.categories || []).length > 0 ? (
                  <Grid container spacing={2}>
                    {row.categories.map((item, catIndex) => {
                      const gridSize = getGridSize(item.size)
                      const cat = item.category || {}
                      return (
                        <Grid item xs={gridSize} key={catIndex}>
                          <Paper variant="outlined" sx={{ position: 'relative', overflow: 'hidden' }}>
                            <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'error.main' } }} onClick={() => removeCategoryFromRow(rowIndex, catIndex)}>
                              <Close fontSize="small" sx={{ color: 'white' }} />
                            </IconButton>
                            <Box sx={{ position: 'relative', pt: item.size === 'full' ? '40%' : '60%', bgcolor: 'background.default' }}>
                              {cat.image ? <Box component="img" src={getImageUrl(cat.image)} alt={cat.name} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' }}><Typography variant="h2">{cat.icon || ''}</Typography></Box>}
                              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
                              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2 }}><Typography variant="subtitle1" fontWeight={700} color="white">{cat.icon} {cat.name || 'Kategori'}</Typography></Box>
                            </Box>
                            <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
                              <Typography variant="caption" color="text.secondary" gutterBottom display="block">Boyut:</Typography>
                              <ToggleButtonGroup size="small" value={item.size} exclusive onChange={(e, v) => v && changeCategorySize(rowIndex, catIndex, v)} fullWidth>
                                <ToggleButton value="full"><Fullscreen fontSize="small" /></ToggleButton>
                                <ToggleButton value="half"><ViewModule fontSize="small" /></ToggleButton>
                                <ToggleButton value="third"><GridView fontSize="small" /></ToggleButton>
                              </ToggleButtonGroup>
                            </Box>
                          </Paper>
                        </Grid>
                      )
                    })}
                  </Grid>
                ) : <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary', border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography>Yukarıdan kategori seçerek ekleyin</Typography></Box>}

                {getRowWidth(row) < 0.99 && unusedCategories.length > 0 && (
                  <FormControl size="small" sx={{ mt: 2, minWidth: 200 }}>
                    <InputLabel>Kategori Ekle</InputLabel>
                    <Select value="" label="Kategori Ekle" onChange={(e) => { const cat = categories.find(c => c.id === e.target.value); if (cat) addCategoryToRow(rowIndex, cat, cat.layoutSize || 'half') }}>
                      {unusedCategories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Button variant="outlined" startIcon={<Add />} onClick={addRow} fullWidth sx={{ py: 2 }}>Yeni Satır Ekle</Button>
      </Stack>
    </PageWrapper>
  )
}

// ==================== GLB FILES PAGE ====================
export function GlbFilesPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewDialog, setPreviewDialog] = useState({ open: false, file: null })

  useEffect(() => { if (branchId) loadFiles() }, [branchId])

  const loadFiles = async () => {
    try { const res = await api.get(`/branches/${branchId}/glb`); setFiles(res.data || []) }
    catch (err) { console.error(err); showSnackbar('Dosyalar yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const assignedCount = files.filter(f => f.isAssigned).length
  const unassignedCount = files.filter(f => !f.isAssigned).length

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Card><CardContent><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><ViewInAr /></Avatar><Box><Typography variant="h4" fontWeight={700}>{files.length}</Typography><Typography variant="body2" color="text.secondary">Toplam</Typography></Box></Stack></CardContent></Card>
          </Grid>
          <Grid item xs={4}>
            <Card><CardContent><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}><Check /></Avatar><Box><Typography variant="h4" fontWeight={700}>{assignedCount}</Typography><Typography variant="body2" color="text.secondary">Atanmış</Typography></Box></Stack></CardContent></Card>
          </Grid>
          <Grid item xs={4}>
            <Card><CardContent><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}><Close /></Avatar><Box><Typography variant="h4" fontWeight={700}>{unassignedCount}</Typography><Typography variant="body2" color="text.secondary">Atanmamış</Typography></Box></Stack></CardContent></Card>
          </Grid>
        </Grid>

        <Alert severity="info" icon={<ViewInAr />}>GLB dosyaları backend/outputs klasörüne yüklenmelidir.</Alert>

        <Card>
          <CardHeader title="3D Model Dosyaları" action={<Button startIcon={<Refresh />} onClick={loadFiles}>Yenile</Button>} />
          <CardContent>
            {files.length > 0 ? (
              <Grid container spacing={2}>
                {files.map(file => (
                  <Grid item xs={12} sm={6} md={4} key={file.filename}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: file.isAssigned ? 'success.main' : 'grey.600', width: 48, height: 48 }}><ViewInAr /></Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="subtitle2" fontWeight={600} noWrap>{file.filename}</Typography><Typography variant="caption" color="text.secondary">{file.sizeFormatted}</Typography></Box>
                        </Stack>
                        {file.isAssigned ? <Chip label={`✓ ${file.assignedTo}`} color="success" variant="outlined" size="small" icon={<Restaurant />} /> : <Chip label="Atanmamış" color="warning" variant="outlined" size="small" />}
                        <Button variant="outlined" size="small" startIcon={<ThreeSixty />} onClick={() => setPreviewDialog({ open: true, file })}>3D Önizle</Button>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : <EmptyState icon={<ViewInAr sx={{ fontSize: 64 }} />} title="Henüz 3D model yok" description="backend/outputs klasörüne .glb dosyası ekleyin" />}
          </CardContent>
        </Card>

        <Dialog open={previewDialog.open} onClose={() => setPreviewDialog({ open: false, file: null })} maxWidth="sm" fullWidth>
          <DialogTitle><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6" fontWeight={700}>{previewDialog.file?.filename}</Typography><IconButton onClick={() => setPreviewDialog({ open: false, file: null })}><Close /></IconButton></Stack></DialogTitle>
          <DialogContent>{previewDialog.file && <ModelViewer3D glbFile={previewDialog.file.filename} productName={previewDialog.file.filename} size="large" />}</DialogContent>
        </Dialog>
      </Stack>
    </PageWrapper>
  )
}

// ==================== TAGS PAGE ====================
export function TagsPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null })
  const [reordering, setReordering] = useState(false)

  useEffect(() => { if (branchId) loadTags() }, [branchId])

  const loadTags = async () => {
    try { const res = await api.get(`/branches/${branchId}/tags`); setTags(res.data) }
    catch (err) { console.error(err); showSnackbar('Etiketler yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    try { await api.delete(`/tags/${deleteDialog.item.id}`); showSnackbar('Etiket silindi', 'success'); setDeleteDialog({ open: false, item: null }); loadTags() }
    catch (err) { console.error(err); showSnackbar('Silinemedi', 'error') }
  }

  const handleToggleActive = async (tag) => {
    try { await api.put(`/tags/${tag.id}`, { isActive: !tag.isActive }); showSnackbar(tag.isActive ? 'Etiket gizlendi' : 'Etiket aktifleştirildi', 'success'); loadTags() }
    catch (err) { console.error(err); showSnackbar('İşlem başarısız', 'error') }
  }

  const handleReorder = async (index, direction) => {
    const newTags = [...tags]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newTags.length) return
    [newTags[index], newTags[targetIndex]] = [newTags[targetIndex], newTags[index]]
    setTags(newTags)
    setReordering(true)
    try { await api.put(`/branches/${branchId}/tags/reorder`, { tagIds: newTags.map(t => t.id) }) }
    catch (err) { console.error(err); showSnackbar('Sıralama kaydedilemedi', 'error'); loadTags() }
    finally { setReordering(false) }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Etiketler</Typography>
            <Typography color="text.secondary">Ürünlerinizi gruplamak için etiketler oluşturun (Vegan, Glutensiz, Acılı vb.)</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button startIcon={<Refresh />} onClick={loadTags} disabled={reordering}>Yenile</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>Yeni Etiket</Button>
          </Stack>
        </Stack>

        <Alert severity="info" icon={<LocalOffer />}>
          <Typography variant="subtitle2" gutterBottom>Etiketler Nasıl Çalışır?</Typography>
          <Typography variant="body2">• Etiketler ürünleri gruplamak için kullanılır (örn: Vegan, Glutensiz, Acılı, Şefin Önerisi)<br/>• Bir ürüne birden fazla etiket atayabilirsiniz<br/>• Müşteriler menüde etiketlere tıklayarak o etiketteki ürünleri görebilir</Typography>
        </Alert>

        {tags.length > 0 ? (
          <Grid container spacing={2}>
            {tags.map((tag, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={tag.id}>
                <Card sx={{ height: '100%', opacity: tag.isActive ? 1 : 0.6, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight={700}>{tag.name}</Typography>
                          {tag.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{tag.description}</Typography>}
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => handleReorder(index, -1)} disabled={index === 0 || reordering}><ArrowUpward fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleReorder(index, 1)} disabled={index === tags.length - 1 || reordering}><ArrowDownward fontSize="small" /></IconButton>
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip icon={<Restaurant fontSize="small" />} label={`${tag.productCount || 0} ürün`} size="small" variant="outlined" />
                        <Chip label={tag.isActive ? 'Aktif' : 'Gizli'} size="small" color={tag.isActive ? 'success' : 'default'} />
                      </Stack>
                    </Stack>
                  </CardContent>
                  <Divider />
                  <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Düzenle"><IconButton size="small" onClick={() => { setEditing(tag); setModalOpen(true) }}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title={tag.isActive ? 'Gizle' : 'Aktifleştir'}><IconButton size="small" onClick={() => handleToggleActive(tag)}>{tag.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></Tooltip>
                      <Tooltip title="Sil"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: tag })} disabled={tag.productCount > 0}><Delete fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState icon={<LocalOffer sx={{ fontSize: 64 }} />} title="Henüz etiket yok" description="Ürünlerinizi gruplamak için etiketler oluşturun"
            action={<Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>İlk Etiketi Ekle</Button>} />
        )}
      </Stack>

      <TagModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} tag={editing} branchId={branchId} onSuccess={() => { setModalOpen(false); setEditing(null); loadTags() }} />
      <ConfirmDialog open={deleteDialog.open} onCancel={() => setDeleteDialog({ open: false, item: null })} onConfirm={handleDelete} title="Etiket Sil"
        message={<><Typography gutterBottom><strong>"{deleteDialog.item?.name}"</strong> etiketini silmek istediğinize emin misiniz?</Typography>
          {deleteDialog.item?.productCount > 0 && <Alert severity="warning" sx={{ mt: 2 }}>Bu etiket <strong>{deleteDialog.item.productCount} ürüne</strong> atanmış. Önce ürünlerden bu etiketi kaldırın.</Alert>}</>} />
    </PageWrapper>
  )
}

// ==================== TAG MODAL ====================
function TagModal({ open, onClose, tag, branchId, onSuccess }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!tag?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', isActive: true })

  useEffect(() => {
    if (open) {
      if (tag) { setForm({ name: tag.name || '', description: tag.description || '', isActive: tag.isActive !== false }) }
      else { setForm({ name: '', description: '', isActive: true }) }
    }
  }, [tag, open])

  const handleSubmit = async () => {
    if (!form.name.trim()) { showSnackbar('Etiket adı gerekli', 'error'); return }
    setSaving(true)
    try {
      if (isEditing) { await api.put(`/tags/${tag.id}`, form); showSnackbar('Etiket güncellendi', 'success') }
      else { await api.post(`/branches/${branchId}/tags`, form); showSnackbar('Etiket eklendi', 'success') }
      onSuccess()
    } catch (err) { console.error(err); showSnackbar(err.response?.data?.error || 'Kaydedilemedi', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6" fontWeight={700}>{isEditing ? 'Etiketi Düzenle' : 'Yeni Etiket Ekle'}</Typography><IconButton onClick={onClose} size="small"><Close /></IconButton></Stack></DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <TextField fullWidth label="Etiket Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Vegan, Glutensiz, Şefin Önerisi..." autoFocus />
          <TextField fullWidth label="Açıklama (Opsiyonel)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={2} placeholder="Etiket hakkında kısa açıklama..." />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />}
            label={<Box><Typography variant="body2" fontWeight={600}>Aktif</Typography><Typography variant="caption" color="text.secondary">Pasif etiketler menüde görünmez</Typography></Box>} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : <Check />}>{saving ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Kaydet'}</Button>
      </DialogActions>
    </Dialog>
  )
}
// ==================== ANNOUNCEMENTS PAGE ====================
export function AnnouncementsPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null })

  useEffect(() => { if (branchId) loadAnnouncements() }, [branchId])

  const loadAnnouncements = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/announcements`)
      setAnnouncements(res.data || [])
    } catch (err) {
      console.error(err)
      showSnackbar('Duyurular yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/${deleteDialog.item.id}`)
      showSnackbar('Duyuru silindi', 'success')
      setDeleteDialog({ open: false, item: null })
      loadAnnouncements()
    } catch (err) {
      console.error(err)
      showSnackbar('Silinemedi', 'error')
    }
  }

  const handleToggleActive = async (announcement) => {
    try {
      await api.put(`/announcements/${announcement.id}`, { isActive: !announcement.isActive })
      showSnackbar(announcement.isActive ? 'Duyuru gizlendi' : 'Duyuru aktifleştirildi', 'success')
      loadAnnouncements()
    } catch (err) {
      console.error(err)
      showSnackbar('İşlem başarısız', 'error')
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Duyurular</Typography>
            <Typography color="text.secondary">Menüde gösterilecek duyuru ve kampanyalar</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button startIcon={<Refresh />} onClick={loadAnnouncements}>Yenile</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>
              Yeni Duyuru
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" icon={<Campaign />}>
          <Typography variant="subtitle2" gutterBottom>Duyurular Nasıl Çalışır?</Typography>
          <Typography variant="body2">
            • Duyurular menü sayfasının üst kısmında kaydırılır şekilde gösterilir<br/>
            • Başlangıç ve bitiş tarihi belirleyerek zaman sınırlı kampanyalar oluşturabilirsiniz<br/>
            • Aktif olmayan duyurular müşterilere gösterilmez
          </Typography>
        </Alert>

        {announcements.length > 0 ? (
          <Grid container spacing={2}>
            {announcements.map((announcement) => (
              <Grid item xs={12} sm={6} md={4} key={announcement.id}>
                <Card sx={{
                  height: '100%',
                  opacity: announcement.isActive ? 1 : 0.6,
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}>
                  {announcement.image && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={getImageUrl(announcement.image)}
                      alt={announcement.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="h6" fontWeight={700}>{announcement.title}</Typography>
                        <Chip
                          label={announcement.isActive ? 'Aktif' : 'Pasif'}
                          size="small"
                          color={announcement.isActive ? 'success' : 'default'}
                        />
                      </Stack>

                      {announcement.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {announcement.description}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          icon={<Schedule fontSize="small" />}
                          label={announcement.startDate ? formatDate(announcement.startDate) : 'Süresiz'}
                          size="small"
                          variant="outlined"
                        />
                        {announcement.endDate && (
                          <Chip
                            label={`→ ${formatDate(announcement.endDate)}`}
                            size="small"
                            variant="outlined"
                            color={new Date(announcement.endDate) < new Date() ? 'error' : 'default'}
                          />
                        )}
                      </Stack>

                      {announcement.type && (
                        <Chip
                          label={announcement.type === 'campaign' ? '🔥 Kampanya' : announcement.type === 'info' ? 'ℹ️ Bilgi' : '📢 Duyuru'}
                          size="small"
                          color={announcement.type === 'campaign' ? 'error' : 'primary'}
                        />
                      )}
                    </Stack>
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={() => { setEditing(announcement); setModalOpen(true) }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={announcement.isActive ? 'Gizle' : 'Aktifleştir'}>
                        <IconButton size="small" onClick={() => handleToggleActive(announcement)}>
                          {announcement.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: announcement })}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState
            icon={<Campaign sx={{ fontSize: 64 }} />}
            title="Henüz duyuru yok"
            description="Kampanya ve duyurularınızı buradan yönetin"
            action={
              <Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>
                İlk Duyuruyu Ekle
              </Button>
            }
          />
        )}
      </Stack>

      <AnnouncementModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        announcement={editing}
        branchId={branchId}
        onSuccess={() => { setModalOpen(false); setEditing(null); loadAnnouncements() }}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onCancel={() => setDeleteDialog({ open: false, item: null })}
        onConfirm={handleDelete}
        title="Duyuru Sil"
        message={`"${deleteDialog.item?.title}" duyurusunu silmek istediğinize emin misiniz?`}
      />
    </PageWrapper>
  )
}

// ==================== ANNOUNCEMENT MODAL ====================
function AnnouncementModal({ open, onClose, announcement, branchId, onSuccess }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!announcement?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'announcement',
    startDate: '',
    endDate: '',
    isActive: true,
    link: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (open) {
      if (announcement) {
        setForm({
          title: announcement.title || '',
          description: announcement.description || '',
          type: announcement.type || 'announcement',
          startDate: announcement.startDate ? announcement.startDate.split('T')[0] : '',
          endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
          isActive: announcement.isActive !== false,
          link: announcement.link || ''
        })
        setImagePreview(announcement.image ? getImageUrl(announcement.image) : null)
      } else {
        setForm({
          title: '',
          description: '',
          type: 'announcement',
          startDate: '',
          endDate: '',
          isActive: true,
          link: ''
        })
        setImagePreview(null)
      }
      setImageFile(null)
    }
  }, [announcement, open])

  const handleImageChange = (file) => {
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      showSnackbar('Duyuru başlığı gerekli', 'error')
      return
    }

    setSaving(true)
    try {
      let announcementId = announcement?.id

      const data = {
        title: form.title,
        description: form.description,
        type: form.type,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isActive: form.isActive,
        link: form.link || null
      }

      if (isEditing) {
        await api.put(`/announcements/${announcementId}`, data)
      } else {
        const res = await api.post(`/branches/${branchId}/announcements`, data)
        announcementId = res.data.id
      }

      if (imageFile && announcementId) {
        let processedFile = imageFile
        if (isHeicFile(imageFile)) {
          processedFile = await convertHeicToJpg(imageFile)
        }
        const formData = new FormData()
        formData.append('image', processedFile)
        await api.post(`/announcements/${announcementId}/image`, formData)
      }

      showSnackbar(isEditing ? 'Duyuru güncellendi' : 'Duyuru eklendi', 'success')
      onSuccess()
    } catch (err) {
      console.error(err)
      showSnackbar(err.response?.data?.error || 'Kaydedilemedi', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>
            {isEditing ? 'Duyuru Düzenle' : 'Yeni Duyuru'}
          </Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Başlık"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
            placeholder="Yaz Kampanyası Başladı!"
          />

          <TextField
            fullWidth
            label="Açıklama"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            multiline
            rows={3}
            placeholder="Tüm içeceklerde %20 indirim..."
          />

          <FormControl fullWidth>
            <InputLabel>Duyuru Tipi</InputLabel>
            <Select value={form.type} label="Duyuru Tipi" onChange={e => setForm({ ...form, type: e.target.value })}>
              <MenuItem value="announcement">📢 Duyuru</MenuItem>
              <MenuItem value="campaign">🔥 Kampanya</MenuItem>
              <MenuItem value="info">ℹ️ Bilgilendirme</MenuItem>
            </Select>
          </FormControl>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Başlangıç Tarihi"
              type="date"
              value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Bitiş Tarihi"
              type="date"
              value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <TextField
            fullWidth
            label="Bağlantı (Opsiyonel)"
            value={form.link}
            onChange={e => setForm({ ...form, link: e.target.value })}
            placeholder="https://..."
            InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon /></InputAdornment> }}
          />

          <ImageUploader
            label="Duyuru Görseli (Opsiyonel)"
            value={imageFile || imagePreview}
            onChange={handleImageChange}
            aspectRatio="16/9"
          />

          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />}
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>Aktif</Typography>
                <Typography variant="caption" color="text.secondary">Pasif duyurular müşterilere görünmez</Typography>
              </Box>
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>İptal</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Check />}
        >
          {saving ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== REVIEWS PAGE ====================
export function ReviewsPage() {
  const { branchId, sectionId } = useParams()
  const { currentSection } = useBranch()
  const showSnackbar = useSnackbar()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [replyDialog, setReplyDialog] = useState({ open: false, review: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, review: null })

  useEffect(() => { if (branchId) loadReviews() }, [branchId, sectionId])

  const loadReviews = async () => {
    try {
      const url = sectionId
        ? `/branches/${branchId}/reviews?section=${sectionId}`
        : `/branches/${branchId}/reviews`
      const res = await api.get(url)
      setReviews(res.data || [])
    } catch (err) {
      console.error(err)
      showSnackbar('Yorumlar yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (review) => {
    try {
      await api.put(`/reviews/${review.id}/approve`)
      showSnackbar('Yorum onaylandı', 'success')
      loadReviews()
    } catch (err) {
      console.error(err)
      showSnackbar('İşlem başarısız', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/reviews/${deleteDialog.review.id}`)
      showSnackbar('Yorum silindi', 'success')
      setDeleteDialog({ open: false, review: null })
      loadReviews()
    } catch (err) {
      console.error(err)
      showSnackbar('Silinemedi', 'error')
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return !r.isApproved
    if (filter === 'approved') return r.isApproved
    if (filter === 'replied') return r.reply
    return true
  })

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => !r.isApproved).length,
    approved: reviews.filter(r => r.isApproved).length,
    avgRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Müşteri Yorumları</Typography>
            <Typography color="text.secondary">
              {currentSection ? `${currentSection.icon} ${currentSection.name} bölümü` : 'Tüm bölümler'}
            </Typography>
          </Box>
          <Button startIcon={<Refresh />} onClick={loadReviews}>Yenile</Button>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <StatCard title="Toplam" value={stats.total} icon={<RateReview />} color="primary" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Bekleyen" value={stats.pending} icon={<Schedule />} color="warning" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Onaylanan" value={stats.approved} icon={<Check />} color="success" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary" variant="body2">Ortalama</Typography>
                  <Rating value={parseFloat(stats.avgRating)} precision={0.1} readOnly size="small" />
                </Stack>
                <Typography variant="h4" fontWeight={700} color="warning.main">{stats.avgRating}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent sx={{ pb: 0 }}>
            <Tabs value={filter} onChange={(e, v) => setFilter(v)}>
              <Tab label={`Tümü (${stats.total})`} value="all" />
              <Tab label={<Badge badgeContent={stats.pending} color="warning">Bekleyen</Badge>} value="pending" />
              <Tab label="Onaylanan" value="approved" />
              <Tab label="Yanıtlanan" value="replied" />
            </Tabs>
          </CardContent>
        </Card>

        {filteredReviews.length > 0 ? (
          <Stack spacing={2}>
            {filteredReviews.map(review => (
              <Card key={review.id}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={1}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {review.customerName?.charAt(0)?.toUpperCase() || 'M'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{review.customerName || 'Misafir'}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Rating value={review.rating} readOnly size="small" />
                            <Typography variant="caption" color="text.secondary">
                              {formatRelativeTime(review.createdAt)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        {!review.isApproved && (
                          <Chip label="Onay Bekliyor" size="small" color="warning" />
                        )}
                        {review.product && (
                          <Chip
                            icon={<Restaurant fontSize="small" />}
                            label={review.product.name}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Stack>

                    {review.comment && (
                      <Typography variant="body1" sx={{ pl: 7 }}>
                        "{review.comment}"
                      </Typography>
                    )}

                    {review.reply && (
                      <Paper variant="outlined" sx={{ p: 2, ml: 7, bgcolor: alpha('#e53935', 0.05) }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Reply sx={{ fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="subtitle2" color="primary">İşletme Yanıtı</Typography>
                        </Stack>
                        <Typography variant="body2">{review.reply}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {review.replyDate && formatRelativeTime(review.replyDate)}
                        </Typography>
                      </Paper>
                    )}

                    <Divider />

                    <Stack direction="row" spacing={1} sx={{ pl: 7 }}>
                      {!review.isApproved && (
                        <Button size="small" startIcon={<Check />} color="success" onClick={() => handleApprove(review)}>
                          Onayla
                        </Button>
                      )}
                      {!review.reply && (
                        <Button size="small" startIcon={<Reply />} onClick={() => setReplyDialog({ open: true, review })}>
                          Yanıtla
                        </Button>
                      )}
                      <Button size="small" startIcon={<Delete />} color="error" onClick={() => setDeleteDialog({ open: true, review })}>
                        Sil
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={<RateReview sx={{ fontSize: 64 }} />}
            title={filter === 'pending' ? 'Bekleyen yorum yok' : 'Henüz yorum yok'}
            description={filter === 'all' ? 'Müşterilerinizden gelen yorumlar burada görünecek' : undefined}
          />
        )}
      </Stack>

      <ReplyDialog
        open={replyDialog.open}
        review={replyDialog.review}
        onClose={() => setReplyDialog({ open: false, review: null })}
        onSuccess={() => { setReplyDialog({ open: false, review: null }); loadReviews() }}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onCancel={() => setDeleteDialog({ open: false, review: null })}
        onConfirm={handleDelete}
        title="Yorumu Sil"
        message={`${deleteDialog.review?.customerName || 'Misafir'} kullanıcısının yorumunu silmek istediğinize emin misiniz?`}
      />
    </PageWrapper>
  )
}

// ==================== REPLY DIALOG ====================
function ReplyDialog({ open, review, onClose, onSuccess }) {
  const showSnackbar = useSnackbar()
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setReply(review?.reply || '')
  }, [open, review])

  const handleSubmit = async () => {
    if (!reply.trim()) {
      showSnackbar('Yanıt yazın', 'error')
      return
    }

    setSaving(true)
    try {
      await api.put(`/reviews/${review.id}/reply`, { reply })
      showSnackbar('Yanıt gönderildi', 'success')
      onSuccess()
    } catch (err) {
      console.error(err)
      showSnackbar('Gönderilemedi', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Yoruma Yanıt Ver</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {review && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Avatar sx={{ width: 32, height: 32 }}>{review.customerName?.charAt(0)}</Avatar>
                <Typography variant="subtitle2">{review.customerName}</Typography>
                <Rating value={review.rating} readOnly size="small" />
              </Stack>
              <Typography variant="body2" color="text.secondary">"{review.comment}"</Typography>
            </Paper>
          )}

          <TextField
            fullWidth
            label="Yanıtınız"
            value={reply}
            onChange={e => setReply(e.target.value)}
            multiline
            rows={4}
            placeholder="Değerli yorumunuz için teşekkür ederiz..."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>İptal</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Reply />}
        >
          {saving ? 'Gönderiliyor...' : 'Yanıtla'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== BRANCH SETTINGS PAGE ====================
export function BranchSettingsPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [branch, setBranch] = useState(null)
  const [sections, setSections] = useState([])
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    phone: '',
    address: '',
    workingHours: '',
    socialMedia: { instagram: '', whatsapp: '', facebook: '', website: '' },
    settings: { requiresApproval: true, showPrices: true, allowOrders: false },
    theme: { primaryColor: '#e53935', layout: 'grid' }
  })

  const loadBranch = async () => {
    if (!branchId) return
    try {
      const [branchRes, sectionsRes] = await Promise.all([
        api.get(`/branches/${branchId}`),
        api.get(`/branches/${branchId}/sections`)
      ])
      setBranch(branchRes.data)
      setSections(sectionsRes.data || [])
      const res = branchRes
      setForm({
        name: res.data.name || '',
        slug: res.data.slug || '',
        description: res.data.description || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        workingHours: res.data.workingHours || '',
        socialMedia: {
          instagram: res.data.socialMedia?.instagram || '',
          whatsapp: res.data.socialMedia?.whatsapp || '',
          facebook: res.data.socialMedia?.facebook || '',
          website: res.data.socialMedia?.website || ''
        },
        settings: {
          requiresApproval: res.data.settings?.requiresApproval !== false,
          showPrices: res.data.settings?.showPrices !== false,
          allowOrders: res.data.settings?.allowOrders || false
        },
        theme: {
          primaryColor: res.data.theme?.primaryColor || '#e53935',
          layout: res.data.theme?.layout || 'grid'
        }
      })
    } catch (err) {
      console.error(err)
      showSnackbar('Şube bilgileri yüklenemedi', 'error')
    }
  }

  useEffect(() => {
    loadBranch()
  }, [branchId])

  const handleSave = async () => {
    if (!form.name.trim()) {
      showSnackbar('Şube adı gerekli', 'error')
      return
    }

    setSaving(true)
    try {
      await api.put(`/branches/${branchId}`, form)
      showSnackbar('Ayarlar kaydedildi', 'success')
      loadBranch()
    } catch (err) {
      console.error(err)
      showSnackbar(err.response?.data?.error || 'Kaydedilemedi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (file) => {
    try {
      let processedFile = file
      if (isHeicFile(file)) {
        processedFile = await convertHeicToJpg(file)
      }
      const formData = new FormData()
      formData.append('image', processedFile)
      await api.post(`/branches/${branchId}/image?type=logo`, formData)
      showSnackbar('Logo yüklendi', 'success')
      loadBranch()
    } catch (err) {
      console.error(err)
      showSnackbar('Yüklenemedi', 'error')
    }
  }

  const handleHeroUpload = async (file) => {
    try {
      let processedFile = file
      if (isHeicFile(file)) {
        processedFile = await convertHeicToJpg(file)
      }
      const formData = new FormData()
      formData.append('image', processedFile)
      await api.post(`/branches/${branchId}/image?type=hero`, formData)
      showSnackbar('Anasayfa görseli yüklendi', 'success')
      loadBranch()
    } catch (err) {
      console.error(err)
      showSnackbar('Yüklenemedi', 'error')
    }
  }

  const copyMenuLink = () => {
    const link = `${window.location.origin}/${branch?.slug || 'menu'}`
    navigator.clipboard.writeText(link)
    showSnackbar('Menü linki kopyalandı', 'success')
  }

  const colors = ['#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047', '#7cb342', '#f4511e']

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Şube Ayarları</Typography>
            <Typography color="text.secondary">{branch?.name}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ContentCopy />} onClick={copyMenuLink}>Linki Kopyala</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Check />}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Stack>
        </Stack>

        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Genel" />
          <Tab label="İletişim" />
          <Tab label="Sosyal Medya" />
          <Tab label="Görünüm" />
          <Tab label="Özellikler" />
        </Tabs>

        {/* TAB 0: Genel */}
        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                {/* Şube Logosu */}
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Şube Logosu</Typography>
                    <Box
                      component="label"
                      sx={{
                        display: 'block',
                        position: 'relative',
                        width: '100%',
                        paddingTop: '100%',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px dashed',
                        borderColor: branch?.logo ? 'transparent' : 'divider',
                        bgcolor: 'background.default',
                        '&:hover .overlay': { opacity: 1 }
                      }}
                    >
                      {branch?.logo ? (
                        <>
                          <Box
                            component="img"
                            src={getImageUrl(branch.logo)}
                            alt="Logo"
                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', p: 2 }}
                          />
                          <Box
                            className="overlay"
                            sx={{
                              position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: 0, transition: 'opacity 0.2s'
                            }}
                          >
                            <Stack alignItems="center" spacing={0.5}>
                              <PhotoCamera sx={{ color: 'white', fontSize: 32 }} />
                              <Typography variant="caption" color="white">Değiştir</Typography>
                            </Stack>
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Stack alignItems="center" spacing={0.5}>
                            <CloudUpload sx={{ fontSize: 40, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">Logo Yükle</Typography>
                          </Stack>
                        </Box>
                      )}
                      <input
                        type="file"
                        hidden
                        accept="image/*,.heic"
                        onChange={e => e.target.files[0] && handleLogoUpload(e.target.files[0])}
                      />
                    </Box>
                  </CardContent>
                </Card>

                {/* Anasayfa Görseli (Hero) - Sadece bölüm yoksa göster */}
                {sections.length === 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Anasayfa Görseli</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Menünün en üstünde görünecek kapak resmi
                      </Typography>
                      <Box
                        component="label"
                        sx={{
                          display: 'block',
                          position: 'relative',
                          width: '100%',
                          paddingTop: '56.25%', // 16:9 aspect ratio
                          borderRadius: 2,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '2px dashed',
                          borderColor: branch?.heroImage ? 'transparent' : 'divider',
                          bgcolor: 'background.default',
                          '&:hover .overlay': { opacity: 1 }
                        }}
                      >
                        {branch?.heroImage ? (
                          <>
                            <Box
                              component="img"
                              src={getImageUrl(branch.heroImage)}
                              alt="Hero"
                              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <Box
                              className="overlay"
                              sx={{
                                position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.2s'
                              }}
                            >
                              <Stack alignItems="center" spacing={0.5}>
                                <PhotoCamera sx={{ color: 'white', fontSize: 32 }} />
                                <Typography variant="caption" color="white">Değiştir</Typography>
                              </Stack>
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Stack alignItems="center" spacing={0.5}>
                              <CloudUpload sx={{ fontSize: 40, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">Kapak Resmi Yükle</Typography>
                            </Stack>
                          </Box>
                        )}
                        <input
                          type="file"
                          hidden
                          accept="image/*,.heic"
                          onChange={e => e.target.files[0] && handleHeroUpload(e.target.files[0])}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Bölüm varsa bilgilendirme */}
                {sections.length > 0 && (
                  <Alert severity="info" sx={{ mt: 0 }}>
                    Anasayfa görseli her bölüm için ayrı ayarlanabilir. Bölümler sayfasından düzenleyebilirsiniz.
                  </Alert>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      label="Şube Adı"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                    <TextField
                      fullWidth
                      label="URL Slug"
                      value={form.slug}
                      onChange={e => setForm({ ...form, slug: e.target.value })}
                      helperText={`Menü adresi: ${window.location.origin}/${form.slug || 'slug'}`}
                    />
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      multiline
                      rows={3}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 1: İletişim */}
        {tab === 1 && (
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Telefon"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }}
                />
                <TextField
                  fullWidth
                  label="Adres"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  multiline
                  rows={2}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment> }}
                />
                <TextField
                  fullWidth
                  label="Çalışma Saatleri"
                  value={form.workingHours}
                  onChange={e => setForm({ ...form, workingHours: e.target.value })}
                  placeholder="Pazartesi-Cuma: 09:00-22:00, Cumartesi-Pazar: 10:00-23:00"
                  InputProps={{ startAdornment: <InputAdornment position="start"><AccessTime /></InputAdornment> }}
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: Sosyal Medya */}
        {tab === 2 && (
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Instagram"
                  value={form.socialMedia.instagram}
                  onChange={e => setForm({ ...form, socialMedia: { ...form.socialMedia, instagram: e.target.value } })}
                  placeholder="@kullaniciadi"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Instagram /></InputAdornment> }}
                />
                <TextField
                  fullWidth
                  label="WhatsApp"
                  value={form.socialMedia.whatsapp}
                  onChange={e => setForm({ ...form, socialMedia: { ...form.socialMedia, whatsapp: e.target.value } })}
                  placeholder="+90 5XX XXX XX XX"
                  InputProps={{ startAdornment: <InputAdornment position="start"><WhatsApp /></InputAdornment> }}
                />
                <TextField
                  fullWidth
                  label="Facebook"
                  value={form.socialMedia.facebook}
                  onChange={e => setForm({ ...form, socialMedia: { ...form.socialMedia, facebook: e.target.value } })}
                  placeholder="facebook.com/sayfaadi"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Facebook /></InputAdornment> }}
                />
                <TextField
                  fullWidth
                  label="Web Sitesi"
                  value={form.socialMedia.website}
                  onChange={e => setForm({ ...form, socialMedia: { ...form.socialMedia, website: e.target.value } })}
                  placeholder="https://www.siteniz.com"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Language /></InputAdornment> }}
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: Görünüm */}
        {tab === 3 && (
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Ana Renk</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {colors.map(color => (
                      <Button
                        key={color}
                        onClick={() => setForm({ ...form, theme: { ...form.theme, primaryColor: color } })}
                        sx={{
                          minWidth: 40,
                          height: 40,
                          bgcolor: color,
                          border: form.theme.primaryColor === color ? '3px solid white' : '2px solid transparent',
                          boxShadow: form.theme.primaryColor === color ? `0 0 0 2px ${color}` : 'none',
                          '&:hover': { bgcolor: color, opacity: 0.8 }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

              </Stack>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: Özellikler */}
        {tab === 4 && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.settings.requiresApproval}
                      onChange={e => setForm({ ...form, settings: { ...form.settings, requiresApproval: e.target.checked } })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Yorum Onayı Gerekli</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Müşteri yorumları yayınlanmadan önce onay bekler
                      </Typography>
                    </Box>
                  }
                />
                <Divider />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.settings.showPrices}
                      onChange={e => setForm({ ...form, settings: { ...form.settings, showPrices: e.target.checked } })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Fiyatları Göster</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Menüde ürün fiyatlarını göster
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </PageWrapper>
  )
}

// ==================== BRANCHES PAGE (SuperAdmin) ====================
export function BranchesPage() {
  const { restaurantId } = useParams()
  const { user } = useAuth()
  const showSnackbar = useSnackbar()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, branch: null })

  useEffect(() => {
    if (restaurantId) {
      loadRestaurant()
      loadBranches()
    }
  }, [restaurantId])

  const loadRestaurant = async () => {
    try {
      const res = await api.get(`/restaurants/${restaurantId}`)
      setRestaurant(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadBranches = async () => {
    try {
      const res = await api.get(`/restaurants/${restaurantId}/branches`)
      setBranches(res.data || [])
    } catch (err) {
      console.error(err)
      showSnackbar('Şubeler yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/branches/${deleteDialog.branch.id}`)
      showSnackbar('Şube silindi', 'success')
      setDeleteDialog({ open: false, branch: null })
      loadBranches()
    } catch (err) {
      console.error(err)
      showSnackbar('Silme başarısız', 'error')
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Button
              startIcon={<ArrowUpward sx={{ transform: 'rotate(-90deg)' }} />}
              onClick={() => navigate('/admin/restaurants')}
              sx={{ mb: 1 }}
            >
              Restoranlar
            </Button>
            <Typography variant="h5" fontWeight={700}>
              {restaurant?.name || 'Şubeler'}
            </Typography>
            <Typography color="text.secondary">{branches.length} şube</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>
            Yeni Şube
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {branches.map(branch => (
            <Grid item xs={12} sm={6} md={4} key={branch.id}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
              }}>
                <Box sx={{
                  position: 'relative',
                  pt: '50%',
                  bgcolor: 'background.default'
                }}>
                  {branch.logo ? (
                    <Box
                      component="img"
                      src={getImageUrl(branch.logo)}
                      alt={branch.name}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', p: 2 }}
                    />
                  ) : (
                    <Box sx={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      <Store sx={{ fontSize: 64, color: 'white' }} />
                    </Box>
                  )}
                  <Chip
                    label={branch.isActive ? 'Aktif' : 'Pasif'}
                    size="small"
                    color={branch.isActive ? 'success' : 'default'}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </Box>

                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} noWrap>{branch.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">/{branch.slug}</Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                    <Chip icon={<Restaurant fontSize="small" />} label={`${branch.productCount || 0} ürün`} size="small" variant="outlined" />
                    <Chip icon={<RateReview fontSize="small" />} label={`${branch.reviewCount || 0} yorum`} size="small" variant="outlined" />
                  </Stack>
                </CardContent>

                <Divider />

                <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                  <Stack direction="row" spacing={0.5}>
                    <Button size="small" startIcon={<Settings />} onClick={() => navigate(`/admin/branch/${branch.id}/settings`)}>
                      Ayarlar
                    </Button>
                    <IconButton size="small" onClick={() => { setEditing(branch); setModalOpen(true) }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    {user?.role === 'superadmin' && (
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, branch })}>
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                  <Button
                    size="small"
                    endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                    onClick={() => window.open(`/${branch.slug}`, '_blank')}
                  >
                    Önizle
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {branches.length === 0 && (
            <Grid item xs={12}>
              <EmptyState
                icon={<Store sx={{ fontSize: 64 }} />}
                title="Henüz şube yok"
                action={
                  <Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>
                    İlk Şubeyi Ekle
                  </Button>
                }
              />
            </Grid>
          )}
        </Grid>

        <BranchModal
          open={modalOpen}
          branch={editing}
          restaurantId={restaurantId}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={() => { setModalOpen(false); setEditing(null); loadBranches() }}
        />

        <ConfirmDialog
          open={deleteDialog.open}
          title="Şube Sil"
          message={
            <>
              <Typography>"{deleteDialog.branch?.name}" şubesini silmek istediğinize emin misiniz?</Typography>
              <Alert severity="error" sx={{ mt: 2 }}>Bu işlem geri alınamaz! Tüm ürünler, kategoriler ve yorumlar silinecek.</Alert>
            </>
          }
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialog({ open: false, branch: null })}
        />
      </Stack>
    </PageWrapper>
  )
}

// ==================== BRANCH MODAL ====================
function BranchModal({ open, branch, restaurantId, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!branch?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    phone: '',
    address: '',
    isActive: true
  })

  useEffect(() => {
    if (open) {
      if (branch) {
        setForm({
          name: branch.name || '',
          slug: branch.slug || '',
          description: branch.description || '',
          phone: branch.phone || '',
          address: branch.address || '',
          isActive: branch.isActive !== false
        })
      } else {
        setForm({ name: '', slug: '', description: '', phone: '', address: '', isActive: true })
      }
    }
  }, [open, branch])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showSnackbar('Şube adı gerekli', 'error')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await api.put(`/branches/${branch.id}`, form)
        showSnackbar('Şube güncellendi', 'success')
      } else {
        await api.post(`/restaurants/${restaurantId}/branches`, form)
        showSnackbar('Şube oluşturuldu', 'success')
      }
      onSave()
    } catch (err) {
      console.error(err)
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>{isEditing ? 'Şube Düzenle' : 'Yeni Şube'}</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Şube Adı"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Merkez Şube"
          />
          <TextField
            fullWidth
            label="URL Slug"
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
            placeholder="Boş bırakılırsa otomatik oluşturulur"
            helperText="Örn: merkez → siteniz.com/merkez"
          />
          <TextField
            fullWidth
            label="Açıklama"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Telefon"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }}
          />
          <TextField
            fullWidth
            label="Adres"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            multiline
            rows={2}
            InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment> }}
          />
          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />}
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>Aktif</Typography>
                <Typography variant="caption" color="text.secondary">Pasif şubeler müşterilere görünmez</Typography>
              </Box>
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>İptal</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Check />}
        >
          {saving ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== USERS PAGE ====================
export function UsersPage() {
  const { restaurantId } = useParams()
  const { user } = useAuth()
  const showSnackbar = useSnackbar()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })

  useEffect(() => { loadUsers() }, [restaurantId])

  const loadUsers = async () => {
    try {
      const url = restaurantId ? `/restaurants/${restaurantId}/users` : '/users'
      const res = await api.get(url)
      setUsers(res.data)
    } catch (err) {
      console.error(err)
      showSnackbar('Kullanıcılar yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteDialog.user.id}`)
      showSnackbar('Kullanıcı silindi', 'success')
      setDeleteDialog({ open: false, user: null })
      loadUsers()
    } catch (err) {
      console.error(err)
      showSnackbar('Silme başarısız', 'error')
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'superadmin': return { label: 'Süper Admin', color: 'error' }
      case 'admin': return { label: 'Admin', color: 'warning' }
      case 'manager': return { label: 'Yönetici', color: 'info' }
      case 'staff': return { label: 'Personel', color: 'default' }
      default: return { label: role, color: 'default' }
    }
  }

  if (user?.role !== 'superadmin' && user?.role !== 'admin') {
    return <EmptyState icon={<Lock sx={{ fontSize: 64 }} />} title="Erişim Engellendi" description="Bu sayfaya erişim yetkiniz yok" />
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Kullanıcılar</Typography>
            <Typography color="text.secondary">{users.length} kullanıcı</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>
            Yeni Kullanıcı
          </Button>
        </Stack>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kullanıcı</TableCell>
                  <TableCell>E-posta</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Şube</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => {
                  const roleInfo = getRoleLabel(u.role)
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar
                            src={u.avatar ? getImageUrl(u.avatar) : undefined}
                            sx={{ bgcolor: u.role === 'superadmin' ? 'error.main' : u.role === 'admin' ? 'warning.main' : 'primary.main' }}
                          >
                            {!u.avatar && (u.fullName?.charAt(0)?.toUpperCase() || u.username?.charAt(0)?.toUpperCase() || <Person />)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>{u.fullName || u.username || 'İsimsiz'}</Typography>
                            {u.fullName && <Typography variant="caption" color="text.secondary">@{u.username}</Typography>}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={roleInfo.label} size="small" color={roleInfo.color} />
                      </TableCell>
                      <TableCell>
                        {u.branches && u.branches.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {u.branches.length <= 2 ? (
                              u.branches.map(b => (
                                <Chip key={b._id || b.id} icon={<Store fontSize="small" />} label={b.name} size="small" variant="outlined" />
                              ))
                            ) : (
                              <>
                                <Chip icon={<Store fontSize="small" />} label={u.branches[0].name} size="small" variant="outlined" />
                                <Chip label={`+${u.branches.length - 1} şube`} size="small" variant="outlined" />
                              </>
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Tüm şubeler</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.isActive ? 'Aktif' : 'Pasif'}
                          size="small"
                          color={u.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Düzenle">
                            <IconButton size="small" onClick={() => { setEditing(u); setModalOpen(true) }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {user?.id !== u.id && user?.role === 'superadmin' && (
                            <Tooltip title="Sil">
                              <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, user: u })}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <EmptyState
                        icon={<People sx={{ fontSize: 48 }} />}
                        title="Henüz kullanıcı yok"
                        action={
                          <Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>
                            İlk Kullanıcıyı Ekle
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <UserModal
          open={modalOpen}
          user={editing}
          restaurantId={restaurantId}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={() => { setModalOpen(false); setEditing(null); loadUsers() }}
        />

        <ConfirmDialog
          open={deleteDialog.open}
          title="Kullanıcı Sil"
          message={`"${deleteDialog.user?.name || deleteDialog.user?.email}" kullanıcısını silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialog({ open: false, user: null })}
        />
      </Stack>
    </PageWrapper>
  )
}

// ==================== USER MODAL ====================
function UserModal({ open, user: editingUser, restaurantId, onClose, onSave }) {
  const { user: currentUser } = useAuth()
  const showSnackbar = useSnackbar()
  const isEditing = !!editingUser?.id
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState([])
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'staff',
    selectedBranches: [],
    allBranches: false,
    isActive: true
  })

  useEffect(() => {
    if (open) {
      loadBranches()
      if (editingUser) {
        const userBranchIds = editingUser.branches?.map(b => b.id || b._id || b) || []
        setForm({
          name: editingUser.name || editingUser.fullName || '',
          username: editingUser.username || '',
          email: editingUser.email || '',
          password: '',
          role: editingUser.role || 'staff',
          selectedBranches: userBranchIds,
          allBranches: false,
          isActive: editingUser.isActive !== false
        })
        setAvatarPreview(editingUser.avatar ? getImageUrl(editingUser.avatar) : null)
        setAvatarFile(null)
      } else {
        setForm({ name: '', username: '', email: '', password: '', role: 'staff', selectedBranches: [], allBranches: false, isActive: true })
        setAvatarPreview(null)
        setAvatarFile(null)
      }
    }
  }, [open, editingUser])

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    let processedFile = file
    if (isHeicFile(file)) {
      processedFile = await convertHeicToJpg(file)
    }

    setAvatarFile(processedFile)
    setAvatarPreview(URL.createObjectURL(processedFile))
  }

  useEffect(() => {
    // Tüm şubeler seçiliyse allBranches'ı güncelle
    if (branches.length > 0 && form.selectedBranches.length === branches.length) {
      setForm(f => ({ ...f, allBranches: true }))
    }
  }, [branches, form.selectedBranches])

  const loadBranches = async () => {
    try {
      const url = restaurantId ? `/restaurants/${restaurantId}/branches` : '/branches'
      const res = await api.get(url)
      setBranches(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleBranchChange = (event) => {
    const value = event.target.value
    if (value.includes('all')) {
      // Tüm şubeleri seç/kaldır
      if (form.allBranches) {
        setForm({ ...form, selectedBranches: [], allBranches: false })
      } else {
        setForm({ ...form, selectedBranches: branches.map(b => b.id || b._id), allBranches: true })
      }
    } else {
      setForm({ ...form, selectedBranches: value, allBranches: value.length === branches.length })
    }
  }

  const handleSubmit = async () => {
    if (!form.username.trim()) {
      showSnackbar('Kullanıcı adı gerekli', 'error')
      return
    }
    if (!form.email.trim()) {
      showSnackbar('E-posta gerekli', 'error')
      return
    }
    if (!isEditing && !form.password) {
      showSnackbar('Şifre gerekli', 'error')
      return
    }

    setSaving(true)
    try {
      const data = {
        name: form.name,
        fullName: form.name,
        username: form.username,
        email: form.email,
        role: form.role,
        branches: form.selectedBranches,
        isActive: form.isActive
      }
      if (form.password) data.password = form.password

      let userId = editingUser?.id
      if (isEditing) {
        await api.put(`/users/${editingUser.id}`, data)
        showSnackbar('Kullanıcı güncellendi', 'success')
      } else {
        const url = restaurantId ? `/restaurants/${restaurantId}/users` : '/users'
        const res = await api.post(url, data)
        userId = res.data.id
        showSnackbar('Kullanıcı oluşturuldu', 'success')
      }

      // Avatar yükle
      if (avatarFile && userId) {
        const formData = new FormData()
        formData.append('image', avatarFile)
        await api.post(`/users/${userId}/avatar`, formData)
      }

      onSave()
    } catch (err) {
      console.error(err)
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const roles = [
    { value: 'staff', label: 'Personel', description: 'Sadece görüntüleme' },
    { value: 'manager', label: 'Yönetici', description: 'Ürün ve kategori yönetimi' },
    { value: 'admin', label: 'Admin', description: 'Tüm yönetim yetkileri' }
  ]

  if (currentUser?.role === 'superadmin') {
    roles.push({ value: 'superadmin', label: 'Süper Admin', description: 'Sistem yönetimi' })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>{isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Avatar Upload */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              component="label"
              sx={{
                position: 'relative',
                cursor: 'pointer',
                '&:hover .avatar-overlay': { opacity: 1 }
              }}
            >
              <Avatar
                src={avatarPreview}
                sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'primary.main' }}
              >
                {!avatarPreview && (form.name?.charAt(0)?.toUpperCase() || form.username?.charAt(0)?.toUpperCase() || <Person sx={{ fontSize: 48 }} />)}
              </Avatar>
              <Box
                className="avatar-overlay"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
              >
                <PhotoCamera sx={{ color: 'white' }} />
              </Box>
              <input type="file" hidden accept="image/*,.heic" onChange={handleAvatarChange} />
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Ad Soyad"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ahmet Yılmaz"
          />
          <TextField
            fullWidth
            label="Kullanıcı Adı"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            required
            placeholder="ahmet.yilmaz"
            InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
          />
          <TextField
            fullWidth
            label="E-posta"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
            InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
          />
          <TextField
            fullWidth
            label={isEditing ? 'Yeni Şifre (opsiyonel)' : 'Şifre'}
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required={!isEditing}
            helperText={isEditing ? 'Değiştirmek istemiyorsanız boş bırakın' : 'En az 6 karakter'}
            InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }}
          />

          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select value={form.role} label="Rol" onChange={e => setForm({ ...form, role: e.target.value })}>
              {roles.map(role => (
                <MenuItem key={role.value} value={role.value}>
                  <Stack>
                    <Typography variant="body2" fontWeight={600}>{role.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {branches.length > 0 && form.role !== 'superadmin' && (
            <FormControl fullWidth>
              <InputLabel>Şubeler</InputLabel>
              <Select
                multiple
                value={form.selectedBranches}
                label="Şubeler"
                onChange={handleBranchChange}
                renderValue={(selected) => {
                  if (selected.length === 0) return 'Şube seçin'
                  if (selected.length === branches.length) return 'Tüm Şubeler'
                  return branches.filter(b => selected.includes(b.id || b._id)).map(b => b.name).join(', ')
                }}
              >
                <MenuItem value="all">
                  <FormControlLabel
                    control={<Switch checked={form.allBranches} size="small" />}
                    label={<Typography fontWeight={600}>Tüm Şubeler</Typography>}
                  />
                </MenuItem>
                <Divider />
                {branches.map(branch => (
                  <MenuItem key={branch.id || branch._id} value={branch.id || branch._id}>
                    <FormControlLabel
                      control={<Switch checked={form.selectedBranches.includes(branch.id || branch._id)} size="small" />}
                      label={branch.name}
                    />
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {form.selectedBranches.length === 0
                  ? 'Hiç şube seçilmedi - kullanıcı hiçbir şubeye erişemez'
                  : `${form.selectedBranches.length} şube seçildi`}
              </Typography>
            </FormControl>
          )}

          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />}
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>Aktif</Typography>
                <Typography variant="caption" color="text.secondary">Pasif kullanıcılar giriş yapamaz</Typography>
              </Box>
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>İptal</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Check />}
        >
          {saving ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== RESTAURANTS PAGE ====================
export function RestaurantsPage() {
  const { user } = useAuth()
  const showSnackbar = useSnackbar()
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, restaurant: null })

  const loadRestaurants = async () => {
    try {
      const res = await api.get('/restaurants')
      setRestaurants(res.data || [])
    } catch (err) {
      console.error(err)
      showSnackbar('Restoranlar yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'superadmin') loadRestaurants()
  }, [user])

  // Sadece superadmin erişebilir
  if (user?.role !== 'superadmin') {
    return (
      <PageWrapper>
        <EmptyState
          icon={<Lock sx={{ fontSize: 64 }} />}
          title="Erişim Engellendi"
          description="Bu sayfaya sadece süper admin erişebilir"
        />
      </PageWrapper>
    )
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/restaurants/${deleteDialog.restaurant.id || deleteDialog.restaurant._id}`)
      showSnackbar('Restoran silindi', 'success')
      setDeleteDialog({ open: false, restaurant: null })
      loadRestaurants()
    } catch (err) {
      console.error(err)
      showSnackbar('Silme başarısız', 'error')
    }
  }

  const handleLogoUpload = async (restaurantId, file) => {
    try {
      if (isHeicFile(file)) file = await convertHeicToJpg(file)
      const formData = new FormData()
      formData.append('image', file)
      await api.post(`/restaurants/${restaurantId}/logo`, formData)
      showSnackbar('Logo yüklendi', 'success')
      loadRestaurants()
    } catch (err) {
      console.error(err)
      showSnackbar('Logo yüklenemedi', 'error')
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Restoranlar</Typography>
            <Typography color="text.secondary">{restaurants.length} restoran</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>
            Yeni Restoran
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {restaurants.map(restaurant => (
            <Grid item xs={12} sm={6} md={4} key={restaurant.id || restaurant._id}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
              }}>
                <Box sx={{
                  position: 'relative',
                  pt: '50%',
                  bgcolor: 'background.default'
                }}>
                  {restaurant.logo ? (
                    <Box
                      component="img"
                      src={getImageUrl(restaurant.logo)}
                      alt={restaurant.name}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', p: 2 }}
                    />
                  ) : (
                    <Box sx={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      <Restaurant sx={{ fontSize: 64, color: 'white' }} />
                    </Box>
                  )}
                  <Tooltip title="Logo Yükle">
                    <IconButton
                      component="label"
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                      }}
                    >
                      <PhotoCamera fontSize="small" />
                      <input
                        type="file"
                        hidden
                        accept="image/*,.heic"
                        onChange={e => e.target.files[0] && handleLogoUpload(restaurant.id || restaurant._id, e.target.files[0])}
                      />
                    </IconButton>
                  </Tooltip>
                  <Chip
                    label={restaurant.isActive !== false ? 'Aktif' : 'Pasif'}
                    size="small"
                    color={restaurant.isActive !== false ? 'success' : 'default'}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </Box>

                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} noWrap>{restaurant.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">/{restaurant.slug}</Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                    <Chip icon={<Store fontSize="small" />} label={`${restaurant.branchCount || 0} şube`} size="small" variant="outlined" />
                  </Stack>
                </CardContent>

                <Divider />

                <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                  <Stack direction="row" spacing={0.5}>
                    <Button size="small" startIcon={<Store />} onClick={() => navigate(`/admin/restaurant/${restaurant.id || restaurant._id}/branches`)}>
                      Şubeler
                    </Button>
                    <Button size="small" startIcon={<People />} onClick={() => navigate(`/admin/restaurant/${restaurant.id || restaurant._id}/users`)}>
                      Kullanıcılar
                    </Button>
                    <IconButton size="small" onClick={() => { setEditing(restaurant); setModalOpen(true) }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    {user?.role === 'superadmin' && (
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, restaurant })}>
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {restaurants.length === 0 && (
            <Grid item xs={12}>
              <EmptyState
                icon={<Restaurant sx={{ fontSize: 64 }} />}
                title="Henüz restoran yok"
                description="İlk restoranınızı ekleyerek başlayın"
                action={
                  <Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>
                    İlk Restoranı Ekle
                  </Button>
                }
              />
            </Grid>
          )}
        </Grid>

        <RestaurantFormModal
          open={modalOpen}
          restaurant={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={() => { setModalOpen(false); setEditing(null); loadRestaurants() }}
        />

        <ConfirmDialog
          open={deleteDialog.open}
          title="Restoran Sil"
          message={
            <>
              <strong>{deleteDialog.restaurant?.name}</strong> restoranını silmek istediğinize emin misiniz?
              <Alert severity="warning" sx={{ mt: 2 }}>Bu işlem restorana ait tüm şubeleri de silecektir!</Alert>
            </>
          }
          confirmText="Sil"
          confirmColor="error"
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialog({ open: false, restaurant: null })}
        />
      </Stack>
    </PageWrapper>
  )
}

function RestaurantFormModal({ open, restaurant, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!(restaurant?.id || restaurant?._id)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    if (open) {
      if (restaurant) {
        setForm({
          name: restaurant.name || '',
          slug: restaurant.slug || '',
          description: restaurant.description || '',
          isActive: restaurant.isActive !== false
        })
      } else {
        setForm({ name: '', slug: '', description: '', isActive: true })
      }
    }
  }, [open, restaurant])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showSnackbar('Restoran adı gerekli', 'error')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await api.put(`/restaurants/${restaurant.id || restaurant._id}`, form)
        showSnackbar('Restoran güncellendi', 'success')
      } else {
        await api.post('/restaurants', form)
        showSnackbar('Restoran oluşturuldu', 'success')
      }
      onSave()
    } catch (err) {
      console.error(err)
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>{isEditing ? 'Restoran Düzenle' : 'Yeni Restoran'}</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Restoran Adı"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Lezzet Köşesi"
          />
          <TextField
            fullWidth
            label="URL Slug"
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
            placeholder="Boş bırakılırsa otomatik oluşturulur"
            helperText="Örn: lezzet-kosesi"
          />
          <TextField
            fullWidth
            label="Açıklama"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            multiline
            rows={3}
            placeholder="Restoran hakkında kısa bir açıklama..."
          />
          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />}
            label="Aktif"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>İptal</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Check />}
        >
          {saving ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}