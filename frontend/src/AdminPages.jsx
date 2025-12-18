import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, CardMedia, CardActions, CardHeader,
  Typography, Button, TextField, Stack, Chip, Avatar, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, LinearProgress, Tabs, Tab, Badge, Tooltip,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
  IconButton, InputAdornment, Rating, Alert, Divider,
  ToggleButton, ToggleButtonGroup, alpha, Container, Skeleton
} from '@mui/material'
import {
  Add, Edit, Delete, Search, Refresh, Check, Close, Restaurant,
  Category, ViewInAr, Campaign, RateReview, Store, People,
  PhotoCamera, CloudUpload, LocalOffer, ThreeDRotation,
  Phone, LocationOn, AccessTime, Instagram, WhatsApp,
  GridView, ViewModule, Fullscreen, ArrowUpward, ArrowDownward,
  DragIndicator, Reply, Lock, Star, TouchApp, ThreeSixty
} from '@mui/icons-material'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useDropzone } from 'react-dropzone'
import {
  api, useAuth, useSnackbar, useBranch,
  formatBytes, formatDate, formatPrice, formatRelativeTime,
  getImageUrl, getGlbUrl, isHeicFile, convertHeicToJpg
} from './App'

// ==================== IMAGE UPLOADER ====================
function ImageUploader({ value, onChange, label, aspectRatio = '16/9', size = 'medium' }) {
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

  const handleDrop = useCallback(async (acceptedFiles) => {
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
  }, [onChange, showSnackbar])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'] },
    maxFiles: 1
  })

  const sizes = { small: { height: 120 }, medium: { height: 180 }, large: { height: 240 } }

  return (
    <Box>
      {label && <Typography variant="subtitle2" gutterBottom>{label}</Typography>}
      <Paper {...getRootProps()} variant="outlined"
        sx={{
          position: 'relative', aspectRatio, minHeight: sizes[size].height,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden', borderStyle: 'dashed', borderWidth: 2,
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? alpha('#e53935', 0.1) : 'transparent',
          transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main' }
        }}>
        <input {...getInputProps()} />
        {uploading ? (
          <CircularProgress />
        ) : preview ? (
          <>
            <Box component="img" src={preview} alt={label} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { opacity: 1 } }}>
              <Stack alignItems="center" spacing={1}>
                <PhotoCamera sx={{ fontSize: 40, color: 'white' }} />
                <Typography color="white" variant="body2">Değiştir</Typography>
              </Stack>
            </Box>
          </>
        ) : (
          <Stack alignItems="center" spacing={1} sx={{ color: 'text.secondary', p: 2 }}>
            <CloudUpload sx={{ fontSize: 48 }} />
            <Typography variant="body2" textAlign="center">{isDragActive ? 'Bırakın...' : 'Görsel yükleyin'}</Typography>
          </Stack>
        )}
      </Paper>
    </Box>
  )
}

// ==================== 3D MODEL VIEWER - YENİ ====================
function ModelViewer3D({ glbFile, productName, size = 'medium' }) {
  const modelRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const sizes = {
    small: { height: 200 },
    medium: { height: 300 },
    large: { height: 400 }
  }

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

      {/* Döndür İpucu */}
      <Box sx={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
        bgcolor: 'rgba(0,0,0,0.7)', borderRadius: 2,
        animation: 'pulse 2s infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        }
      }}>
        <TouchApp sx={{ color: 'white', fontSize: 20, animation: 'swipe 1.5s ease-in-out infinite', '@keyframes swipe': { '0%, 100%': { transform: 'translateX(0) rotate(0deg)' }, '50%': { transform: 'translateX(10px) rotate(-15deg)' } } }} />
        <Typography variant="caption" color="white">Döndürmek için sürükleyin</Typography>
      </Box>

      {/* 3D Badge */}
      <Chip
        icon={<ThreeSixty />}
        label="3D"
        size="small"
        color="info"
        sx={{ position: 'absolute', top: 12, right: 12 }}
      />

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
function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = 'Sil', severity = 'error' }) {
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

function EmptyState({ icon, title, description, action }) {
  return (
    <Paper sx={{ p: 6, textAlign: 'center' }}>
      <Box sx={{ color: 'text.secondary', mb: 2 }}>{icon}</Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>{title}</Typography>
      {description && <Typography color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>}
      {action}
    </Paper>
  )
}

function StatCard({ title, value, icon, color = 'primary', subtitle, onClick }) {
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

// ==================== PAGE WRAPPER - RESPONSIVE ====================
function PageWrapper({ children }) {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 2, sm: 3 } }}>
      {children}
    </Box>
  )
}

// ==================== DASHBOARD PAGE ====================
export function DashboardPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (branchId) loadStats() }, [branchId])

  const loadStats = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/dashboard`)
      setStats(res.data)
    } catch { showSnackbar('İstatistikler yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1']

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard title="Toplam Ürün" value={stats?.counts?.products || 0} icon={<Restaurant />} color="primary" onClick={() => navigate(`/admin/branch/${branchId}/products`)} />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard title="Kategoriler" value={stats?.counts?.categories || 0} icon={<Category />} color="secondary" onClick={() => navigate(`/admin/branch/${branchId}/categories`)} />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard title="3D Modeller" value={stats?.counts?.glbFiles || 0} icon={<ViewInAr />} color="success" onClick={() => navigate(`/admin/branch/${branchId}/glb`)} />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard title="Kampanyalar" value={stats?.counts?.campaigns || 0} icon={<LocalOffer />} color="warning" onClick={() => navigate(`/admin/branch/${branchId}/products?filter=campaign`)} />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Yorumlar" value={stats?.counts?.reviews || 0} icon={<RateReview />} color="info" subtitle={`${stats?.counts?.pendingReviews || 0} bekleyen`} onClick={() => navigate(`/admin/branch/${branchId}/reviews`)} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary" variant="body2">Ortalama Puan</Typography>
                  <Rating value={stats?.averageRating || 0} precision={0.1} readOnly size="small" />
                </Stack>
                <Typography variant="h3" fontWeight={700} color="warning.main" sx={{ mt: 1 }}>{(stats?.averageRating || 0).toFixed(1)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="text.secondary" variant="body2" gutterBottom>Hızlı İşlemler</Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Button variant="outlined" fullWidth startIcon={<Add />} onClick={() => navigate(`/admin/branch/${branchId}/products?action=new`)}>Yeni Ürün</Button>
                  <Button variant="outlined" fullWidth startIcon={<Category />} onClick={() => navigate(`/admin/branch/${branchId}/categories?action=new`)}>Yeni Kategori</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 400 }}>
              <CardHeader title="Kategori Dağılımı" />
              <CardContent>
                {stats?.categoryStats?.length > 0 ? (
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.categoryStats} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {stats.categoryStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : <EmptyState icon={<Category sx={{ fontSize: 48 }} />} title="Henüz veri yok" />}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: 400 }}>
              <CardHeader title="Puan Dağılımı" />
              <CardContent>
                {stats?.ratingStats?.length > 0 ? (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = stats?.ratingStats?.find(r => r._id === rating)?.count || 0
                      const total = stats?.counts?.reviews || 1
                      const percent = (count / total) * 100
                      return (
                        <Stack key={rating} direction="row" alignItems="center" spacing={2}>
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: 50 }}>
                            <Typography variant="body2" fontWeight={600}>{rating}</Typography>
                            <Star sx={{ fontSize: 18, color: 'warning.main' }} />
                          </Stack>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress variant="determinate" value={percent}
                              sx={{ height: 12, borderRadius: 1, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: rating >= 4 ? 'success.main' : rating >= 3 ? 'warning.main' : 'error.main' } }} />
                          </Box>
                          <Typography variant="body2" sx={{ width: 40, textAlign: 'right' }}>{count}</Typography>
                        </Stack>
                      )
                    })}
                  </Stack>
                ) : <EmptyState icon={<Star sx={{ fontSize: 48 }} />} title="Henüz yorum yok" />}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Kampanyalı Ürünler" action={<Button size="small" onClick={() => navigate(`/admin/branch/${branchId}/products?filter=campaign`)}>Tümü</Button>} />
              <CardContent>
                {stats?.campaignProducts?.length > 0 ? (
                  <Stack spacing={2}>
                    {stats.campaignProducts.slice(0, 5).map(product => (
                      <Stack key={product._id} direction="row" alignItems="center" spacing={2}>
                        <Avatar src={product.thumbnail ? getImageUrl(product.thumbnail) : undefined} variant="rounded" sx={{ width: 48, height: 48 }}><Restaurant /></Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>{product.name}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" color="error.main" fontWeight={700}>{formatPrice(product.campaignPrice)}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(product.price)}</Typography>
                          </Stack>
                        </Box>
                        <Chip label={`-${Math.round((1 - product.campaignPrice / product.price) * 100)}%`} size="small" color="error" />
                      </Stack>
                    ))}
                  </Stack>
                ) : <EmptyState icon={<LocalOffer sx={{ fontSize: 48 }} />} title="Kampanya yok" />}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Son Yorumlar" action={<Button size="small" onClick={() => navigate(`/admin/branch/${branchId}/reviews`)}>Tümü</Button>} />
              <CardContent>
                {stats?.recentReviews?.length > 0 ? (
                  <Stack spacing={2}>
                    {stats.recentReviews.map(review => (
                      <Paper key={review._id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="start">
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Rating value={review.rating} readOnly size="small" />
                              {!review.isApproved && <Chip label="Bekliyor" size="small" color="warning" />}
                            </Stack>
                            <Typography variant="body2" sx={{ mt: 0.5 }} noWrap>{review.comment || 'Yorum yazılmamış'}</Typography>
                            <Typography variant="caption" color="text.secondary">{review.customerName} • {formatRelativeTime(review.createdAt)}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : <EmptyState icon={<RateReview sx={{ fontSize: 48 }} />} title="Henüz yorum yok" />}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </PageWrapper>
  )
}

// ==================== PRODUCTS PAGE ====================
export function ProductsPage() {
  const { branchId } = useParams()
  const location = useLocation()
  const showSnackbar = useSnackbar()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [glbFiles, setGlbFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null })
  const [previewDialog, setPreviewDialog] = useState({ open: false, product: null })

  useEffect(() => { if (branchId) loadData() }, [branchId])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') { setEditingProduct(null); setModalOpen(true) }
    if (params.get('filter') === 'campaign') setFilterStatus('campaign')
  }, [location.search])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, glbRes] = await Promise.all([
        api.get(`/branches/${branchId}/products`),
        api.get(`/branches/${branchId}/categories`),
        api.get(`/branches/${branchId}/glb`)
      ])
      setProducts(productsRes.data.products || productsRes.data)
      setCategories(categoriesRes.data)
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

  const filteredProducts = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCategory && p.categoryId !== filterCategory) return false
    if (filterStatus === 'active' && !p.isActive) return false
    if (filterStatus === 'inactive' && p.isActive) return false
    if (filterStatus === 'featured' && !p.isFeatured) return false
    if (filterStatus === 'campaign' && !p.isCampaign) return false
    if (filterStatus === 'has3d' && !p.hasGlb) return false
    return true
  })

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
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Kategori</InputLabel>
                  <Select value={filterCategory} label="Kategori" onChange={e => setFilterCategory(e.target.value)}>
                    <MenuItem value="">Tümü</MenuItem>
                    {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</MenuItem>)}
                  </Select>
                </FormControl>
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
                <Button startIcon={<Refresh />} onClick={loadData}>Yenile</Button>
                <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingProduct(null); setModalOpen(true) }}>Yeni Ürün</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Chip label={`Toplam: ${products.length}`} />
          <Chip label={`3D: ${products.filter(p => p.hasGlb).length}`} color="info" variant="outlined" />
          <Chip label={`Kampanya: ${products.filter(p => p.isCampaign).length}`} color="error" variant="outlined" />
        </Stack>

        <Grid container spacing={2}>
          {filteredProducts.map(product => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'background.default' }}>
                  {product.thumbnail ? (
                    <CardMedia component="img" image={getImageUrl(product.thumbnail)} alt={product.name}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Restaurant sx={{ fontSize: 48, color: 'text.secondary' }} />
                    </Box>
                  )}
                  <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, right: 8 }} flexWrap="wrap">
                    {product.hasGlb && (
                      <Chip 
                        label="3D" 
                        size="small" 
                        color="info" 
                        icon={<ViewInAr />} 
                        onClick={(e) => { e.stopPropagation(); setPreviewDialog({ open: true, product }) }}
                        sx={{ cursor: 'pointer' }}
                      />
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

                <CardContent sx={{ flex: 1, p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>{product.name}</Typography>
                  {product.categoryName && <Typography variant="caption" color="text.secondary" noWrap>{product.categoryIcon} {product.categoryName}</Typography>}
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
            </Grid>
          ))}
          {filteredProducts.length === 0 && (
            <Grid item xs={12}>
              <EmptyState icon={<Restaurant sx={{ fontSize: 64 }} />} title="Ürün bulunamadı"
                action={<Button variant="contained" startIcon={<Add />} onClick={() => { setEditingProduct(null); setModalOpen(true) }}>İlk Ürünü Ekle</Button>} />
            </Grid>
          )}
        </Grid>

        <ProductModal open={modalOpen} product={editingProduct} categories={categories} glbFiles={glbFiles} branchId={branchId}
          onClose={() => { setModalOpen(false); setEditingProduct(null) }}
          onSave={() => { setModalOpen(false); setEditingProduct(null); loadData() }} />

        <ConfirmDialog open={deleteDialog.open} title="Ürünü Sil" message={`"${deleteDialog.product?.name}" ürününü silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, product: null })} />

        {/* 3D Preview Dialog */}
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
      </Stack>
    </PageWrapper>
  )
}

// ==================== PRODUCT MODAL ====================
function ProductModal({ open, product, categories, glbFiles, branchId, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!product?.id
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState({
    name: '', price: '', description: '', categoryId: '', isActive: true,
    isFeatured: false, isCampaign: false, campaignPrice: '', glbFile: '',
    calories: '', preparationTime: '', allergens: '', tags: ''
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)

  useEffect(() => {
    if (open) {
      if (product) {
        setForm({
          name: product.name || '', 
          price: product.price || '', 
          description: product.description || '',
          categoryId: product.categoryId || product.category?._id || '', 
          isActive: product.isActive !== false,
          isFeatured: product.isFeatured || false, 
          isCampaign: product.isCampaign || false,
          campaignPrice: product.campaignPrice || '', 
          glbFile: product.glbFile || '',
          calories: product.calories || '', 
          preparationTime: product.preparationTime || '',
          allergens: product.allergens?.join(', ') || '', 
          tags: product.tags?.join(', ') || ''
        })
        if (product.thumbnail) {
          setThumbnailPreview(getImageUrl(product.thumbnail))
        } else {
          setThumbnailPreview(null)
        }
      } else {
        setForm({ 
          name: '', price: '', description: '', categoryId: '', isActive: true, 
          isFeatured: false, isCampaign: false, campaignPrice: '', glbFile: '', 
          calories: '', preparationTime: '', allergens: '', tags: '' 
        })
        setThumbnailPreview(null)
      }
      setThumbnailFile(null)
      setTab(0)
    }
  }, [open, product])

  const handleThumbnailChange = (file) => {
    if (!file) return
    setThumbnailFile(file)
    const previewUrl = URL.createObjectURL(file)
    setThumbnailPreview(previewUrl)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) { 
      showSnackbar('Ürün adı ve fiyat zorunludur', 'error')
      return 
    }

    setSaving(true)
    try {
      const data = {
        name: form.name, 
        price: parseFloat(form.price), 
        description: form.description,
        categoryId: form.categoryId || null, 
        isActive: form.isActive, 
        isFeatured: form.isFeatured,
        isCampaign: form.isCampaign, 
        campaignPrice: form.campaignPrice ? parseFloat(form.campaignPrice) : null,
        calories: form.calories ? parseInt(form.calories) : null,
        preparationTime: form.preparationTime ? parseInt(form.preparationTime) : null,
        allergens: form.allergens ? form.allergens.split(',').map(s => s.trim()).filter(Boolean) : [],
        tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : []
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
    }
    finally { setSaving(false) }
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
        <Tab label="Detaylar" />
        <Tab label="3D Model" />
      </Tabs>

      <DialogContent sx={{ pt: 3 }}>
        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ImageUploader 
                label="Ürün Görseli" 
                value={thumbnailFile || thumbnailPreview} 
                onChange={handleThumbnailChange} 
                aspectRatio="1/1" 
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack spacing={2.5}>
                <TextField fullWidth label="Ürün Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField fullWidth label="Fiyat" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }} required />
                  <FormControl fullWidth>
                    <InputLabel>Kategori</InputLabel>
                    <Select value={form.categoryId} label="Kategori" onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                      <MenuItem value="">Kategorisiz</MenuItem>
                      {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
                <TextField fullWidth label="Açıklama" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={3} />
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
            <Typography variant="subtitle2" color="text.secondary">Ürün Detayları (Opsiyonel)</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField fullWidth label="Kalori" type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })}
                InputProps={{ endAdornment: <InputAdornment position="end">kcal</InputAdornment> }} />
              <TextField fullWidth label="Hazırlama Süresi" type="number" value={form.preparationTime} onChange={e => setForm({ ...form, preparationTime: e.target.value })}
                InputProps={{ endAdornment: <InputAdornment position="end">dk</InputAdornment> }} />
            </Stack>
            <TextField fullWidth label="Alerjenler" value={form.allergens} onChange={e => setForm({ ...form, allergens: e.target.value })} placeholder="Gluten, Süt, Fındık..." />
            <TextField fullWidth label="Etiketler" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Vegan, Glutensiz, Acılı..." />
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={3}>
            <Alert severity="info" icon={<ViewInAr />}>
              GLB dosyaları backend/outputs klasörüne yüklenir. Yüklenen dosyaları buradan ürüne atayın.
            </Alert>
            
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
              <Alert severity="warning">
                Henüz GLB dosyası yüklenmemiş. backend/outputs klasörüne GLB dosyası ekleyin.
              </Alert>
            )}
            
            {/* 3D Model Önizleme */}
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
  const { branchId } = useParams()
  const location = useLocation()
  const showSnackbar = useSnackbar()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null })

  useEffect(() => { if (branchId) loadCategories() }, [branchId])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') { setEditingCategory(null); setModalOpen(true) }
  }, [location.search])

  const loadCategories = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/categories`)
      setCategories(res.data)
    } catch { showSnackbar('Kategoriler yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleteDialog.category.id}`)
      showSnackbar('Kategori silindi', 'success')
      setDeleteDialog({ open: false, category: null })
      loadCategories()
    } catch { showSnackbar('Silme başarısız', 'error') }
  }

  const handleImageUpload = async (categoryId, file) => {
    try {
      if (isHeicFile(file)) file = await convertHeicToJpg(file)
      const formData = new FormData()
      formData.append('image', file)
      await api.post(`/categories/${categoryId}/image`, formData)
      showSnackbar('Görsel yüklendi', 'success')
      loadCategories()
    } catch { showSnackbar('Yükleme başarısız', 'error') }
  }

  const getLayoutLabel = (size) => {
    switch(size) {
      case 'full': return 'Tam'
      case 'half': return '1/2'
      case 'third': return '1/3'
      default: return '1/2'
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{categories.length} Kategori</Typography>
            <Typography variant="body2" color="text.secondary">Kategorileri düzenleyin ve yerleşimlerini ayarlayın</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingCategory(null); setModalOpen(true) }}>Yeni Kategori</Button>
        </Stack>

        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>Yerleşim Boyutları:</Typography>
          <Stack direction="row" spacing={2}>
            <Chip label="Tam Satır" size="small" icon={<Fullscreen />} />
            <Chip label="Yarım (1/2)" size="small" icon={<ViewModule />} />
            <Chip label="Üçte Bir (1/3)" size="small" icon={<GridView />} />
          </Stack>
        </Alert>

        <Grid container spacing={2}>
          {categories.map(category => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={category.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'background.default' }}>
                  {category.image ? (
                    <CardMedia component="img" image={getImageUrl(category.image)} alt={category.name}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h2">{category.icon}</Typography>
                    </Box>
                  )}
                  <Tooltip title="Görsel Yükle">
                    <IconButton component="label" size="small" sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                      <PhotoCamera sx={{ color: 'white', fontSize: 20 }} />
                      <input type="file" hidden accept="image/*,.heic" onChange={e => e.target.files[0] && handleImageUpload(category.id, e.target.files[0])} />
                    </IconButton>
                  </Tooltip>
                  <Chip label={category.isActive ? 'Aktif' : 'Pasif'} size="small" color={category.isActive ? 'success' : 'default'} sx={{ position: 'absolute', top: 8, right: 8 }} />
                </Box>

                <CardContent sx={{ flex: 1, p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>{category.icon} {category.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{category.productCount || 0} ürün</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip 
                      label={getLayoutLabel(category.layoutSize)} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 1, pt: 0 }}>
                  <Button size="small" startIcon={<Edit />} onClick={() => { setEditingCategory(category); setModalOpen(true) }}>Düzenle</Button>
                  <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, category })}><Delete fontSize="small" /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {categories.length === 0 && (
            <Grid item xs={12}>
              <EmptyState icon={<Category sx={{ fontSize: 64 }} />} title="Henüz kategori yok"
                action={<Button variant="contained" startIcon={<Add />} onClick={() => { setEditingCategory(null); setModalOpen(true) }}>İlk Kategoriyi Ekle</Button>} />
            </Grid>
          )}
        </Grid>

        <CategoryModal open={modalOpen} category={editingCategory} branchId={branchId}
          onClose={() => { setModalOpen(false); setEditingCategory(null) }}
          onSave={() => { setModalOpen(false); setEditingCategory(null); loadCategories() }} />

        <ConfirmDialog open={deleteDialog.open} title="Kategori Sil"
          message={<><Typography>"{deleteDialog.category?.name}" kategorisini silmek istediğinize emin misiniz?</Typography><Alert severity="warning" sx={{ mt: 2 }}>Bu kategorideki ürünler kategorisiz kalacak.</Alert></>}
          onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, category: null })} />
      </Stack>
    </PageWrapper>
  )
}

// ==================== CATEGORY MODAL ====================
function CategoryModal({ open, category, branchId, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!category?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '📁', description: '', isActive: true, layoutSize: 'half' })

  const icons = ['🍕', '🍔', '🌮', '🍜', '🍣', '🥗', '🍰', '☕', '🍺', '🥤', '🍳', '🥪', '🍝', '🥘', '🍱', '🧁', '🍦', '🥩', '🍗', '🥙']

  useEffect(() => {
    if (open) {
      if (category) {
        setForm({ 
          name: category.name || '', 
          icon: category.icon || '📁', 
          description: category.description || '', 
          isActive: category.isActive !== false,
          layoutSize: category.layoutSize || 'half'
        })
      } else {
        setForm({ name: '', icon: '📁', description: '', isActive: true, layoutSize: 'half' })
      }
    }
  }, [open, category])

  const handleSubmit = async () => {
    if (!form.name) { showSnackbar('Kategori adı zorunludur', 'error'); return }

    setSaving(true)
    try {
      const dataToSend = {
        name: form.name,
        icon: form.icon,
        description: form.description,
        isActive: form.isActive,
        layoutSize: form.layoutSize
      }
      
      if (isEditing) {
        await api.put(`/categories/${category.id}`, dataToSend)
      } else {
        await api.post(`/branches/${branchId}/categories`, dataToSend)
      }
      showSnackbar(isEditing ? 'Kategori güncellendi' : 'Kategori oluşturuldu', 'success')
      onSave()
    } catch (err) { 
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error') 
    }
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
          <TextField fullWidth label="Kategori Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <TextField fullWidth label="Açıklama" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={2} />

          <Box>
            <Typography variant="subtitle2" gutterBottom>İkon Seçin</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {icons.map(icon => (
                <IconButton key={icon} onClick={() => setForm({ ...form, icon })}
                  sx={{ fontSize: 24, width: 44, height: 44, border: 2, borderColor: form.icon === icon ? 'primary.main' : 'transparent', bgcolor: form.icon === icon ? alpha('#e53935', 0.1) : 'transparent' }}>
                  {icon}
                </IconButton>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>Yerleşim Boyutu</Typography>
            <ToggleButtonGroup 
              value={form.layoutSize} 
              exclusive 
              onChange={(e, newValue) => { if (newValue !== null) setForm({ ...form, layoutSize: newValue }) }} 
              fullWidth
            >
              <ToggleButton value="full">
                <Stack alignItems="center" spacing={0.5}>
                  <Fullscreen />
                  <Typography variant="caption">Tam</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="half">
                <Stack alignItems="center" spacing={0.5}>
                  <ViewModule />
                  <Typography variant="caption">1/2</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="third">
                <Stack alignItems="center" spacing={0.5}>
                  <GridView />
                  <Typography variant="caption">1/3</Typography>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Seçili: {form.layoutSize === 'full' ? 'Tam Satır' : form.layoutSize === 'half' ? 'Yarım (1/2)' : 'Üçte Bir (1/3)'}
            </Typography>
          </Box>

          <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== CATEGORY LAYOUT PAGE ====================
export function CategoryLayoutPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [categories, setCategories] = useState([])
  const [layouts, setLayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (branchId) loadData() }, [branchId])

  const loadData = async () => {
    try {
      const [categoriesRes, layoutsRes] = await Promise.all([
        api.get(`/branches/${branchId}/categories`),
        api.get(`/branches/${branchId}/category-layouts`)
      ])
      
      const cats = categoriesRes.data || []
      const lays = layoutsRes.data || []
      
      setCategories(cats)
      
      if (lays.length === 0 && cats.length > 0) {
        setLayouts(createDefaultLayouts(cats))
      } else {
        setLayouts(lays.map(l => ({
          ...l,
          categories: l.categories?.map(c => ({
            category: c.category || c,
            size: c.size || 'half'
          })) || []
        })))
      }
    } catch (err) { 
      console.error(err)
      showSnackbar('Veriler yüklenemedi', 'error') 
    }
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
      const layoutsToSave = layouts.map(l => ({
        rowOrder: l.rowOrder,
        categories: l.categories.map(c => ({
          category: c.category?.id || c.category?._id || c.category,
          size: c.size
        }))
      }))
      await api.put(`/branches/${branchId}/category-layouts/bulk`, { layouts: layoutsToSave })
      showSnackbar('Düzen kaydedildi', 'success')
    } catch (err) { 
      console.error(err)
      showSnackbar('Kaydetme başarısız', 'error') 
    }
    finally { setSaving(false) }
  }

  const usedCategoryIds = layouts.flatMap(l => (l.categories || []).map(c => c.category?.id || c.category?._id || c.category)).filter(Boolean)
  const unusedCategories = categories.filter(c => !usedCategoryIds.includes(c.id))

  const getGridSize = (size) => size === 'full' ? 12 : size === 'half' ? 6 : 4

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Kategori Düzeni</Typography>
          <Typography variant="body2" color="text.secondary">Menüde kategorilerin görünümünü ayarlayın</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button onClick={loadData} startIcon={<Refresh />}>Yenile</Button>
          <Button variant="contained" onClick={saveLayouts} disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : <Check />}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info">Her satır maksimum 1 birim genişliğinde. Tam: 1, Yarım: 0.5, Üçte Bir: 0.33</Alert>

      {/* Kullanılmamış Kategoriler */}
      <Card>
        <CardHeader title={`Kullanılmayan Kategoriler (${unusedCategories.length})`} />
        <CardContent>
          {unusedCategories.length > 0 ? (
            <Grid container spacing={2}>
              {unusedCategories.map(cat => (
                <Grid item xs={4} sm={3} md={2} key={cat.id}>
                  <Paper
                    variant="outlined"
                    sx={{ 
                      p: 1, 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', transform: 'scale(1.02)' }
                    }}
                    onClick={() => {
                      if (layouts.length === 0) {
                        setLayouts([{ rowOrder: 0, categories: [{ category: cat, size: cat.layoutSize || 'half' }] }])
                      } else {
                        const lastRowIndex = layouts.length - 1
                        if (getRowWidth(layouts[lastRowIndex]) < 0.99) {
                          addCategoryToRow(lastRowIndex, cat, cat.layoutSize || 'half')
                        } else {
                          setLayouts([...layouts, { rowOrder: layouts.length, categories: [{ category: cat, size: cat.layoutSize || 'half' }] }])
                        }
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'background.default', borderRadius: 1, overflow: 'hidden', mb: 1 }}>
                      {cat.image ? (
                        <Box component="img" src={getImageUrl(cat.image)} alt={cat.name}
                          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="h4">{cat.icon}</Typography>
                        </Box>
                      )}
                      <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" fontWeight={600} noWrap display="block" textAlign="center">{cat.name}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" textAlign="center">Tüm kategoriler düzene eklenmiş ✓</Typography>
          )}
        </CardContent>
      </Card>

      {/* Layout Satırları */}
      <Stack spacing={2}>
        {layouts.map((row, rowIndex) => (
          <Card key={rowIndex}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DragIndicator color="action" />
                  <Typography variant="subtitle2">Satır {rowIndex + 1}</Typography>
                  <Chip 
                    label={`${Math.round(getRowWidth(row) * 100)}%`} 
                    size="small" 
                    color={getRowWidth(row) > 1.01 ? 'error' : getRowWidth(row) >= 0.99 ? 'success' : 'warning'} 
                  />
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
                            {cat.image ? (
                              <Box component="img" src={getImageUrl(cat.image)} alt={cat.name}
                                sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' }}>
                                <Typography variant="h2">{cat.icon || '📁'}</Typography>
                              </Box>
                            )}
                            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2 }}>
                              <Typography variant="subtitle1" fontWeight={700} color="white">{cat.icon} {cat.name || 'Kategori'}</Typography>
                            </Box>
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
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary', border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography>Yukarıdan kategori seçerek ekleyin</Typography>
                </Box>
              )}

              {getRowWidth(row) < 0.99 && unusedCategories.length > 0 && (
                <FormControl size="small" sx={{ mt: 2, minWidth: 200 }}>
                  <InputLabel>Kategori Ekle</InputLabel>
                  <Select value="" label="Kategori Ekle" onChange={(e) => {
                    const cat = categories.find(c => c.id === e.target.value)
                    if (cat) addCategoryToRow(rowIndex, cat, cat.layoutSize || 'half')
                  }}>
                    {unusedCategories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Button variant="outlined" startIcon={<Add />} onClick={addRow} fullWidth sx={{ py: 2 }}>Yeni Satır Ekle</Button>

      {/* 📱 TELEFON ÖNİZLEMESİ */}
      {layouts.length > 0 && (
        <Card>
          <CardHeader 
            title="📱 Canlı Önizleme" 
            subheader="Müşterilerinizin telefonlarında göreceği görünüm"
          />
          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4, bgcolor: 'background.default' }}>
            {/* Telefon Çerçevesi */}
            <Box sx={{
              position: 'relative',
              width: 280,
              height: 580,
              bgcolor: '#1a1a1a',
              borderRadius: '40px',
              p: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 80,
                height: 24,
                bgcolor: '#0a0a0a',
                borderRadius: '0 0 16px 16px',
                zIndex: 10
              }
            }}>
              {/* Yan Butonlar */}
              <Box sx={{ position: 'absolute', left: -2, top: 100, width: 3, height: 30, bgcolor: '#2a2a2a', borderRadius: '2px 0 0 2px' }} />
              <Box sx={{ position: 'absolute', left: -2, top: 150, width: 3, height: 50, bgcolor: '#2a2a2a', borderRadius: '2px 0 0 2px' }} />
              <Box sx={{ position: 'absolute', left: -2, top: 210, width: 3, height: 50, bgcolor: '#2a2a2a', borderRadius: '2px 0 0 2px' }} />
              <Box sx={{ position: 'absolute', right: -2, top: 140, width: 3, height: 70, bgcolor: '#2a2a2a', borderRadius: '0 2px 2px 0' }} />

              {/* Ekran */}
              <Box sx={{
                width: '100%',
                height: '100%',
                bgcolor: '#0a0a0a',
                borderRadius: '32px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Status Bar */}
                <Box sx={{ 
                  height: 44, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  px: 2,
                  pt: 1
                }}>
                  <Typography variant="caption" color="white" fontWeight={600}>9:41</Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ width: 16, height: 10, border: '1px solid white', borderRadius: 1, position: 'relative' }}>
                      <Box sx={{ position: 'absolute', right: 1, top: 1, bottom: 1, left: '30%', bgcolor: 'success.main', borderRadius: 0.5 }} />
                    </Box>
                  </Stack>
                </Box>

                {/* Header */}
                <Box sx={{ 
                  px: 2, 
                  py: 1.5, 
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  background: 'linear-gradient(180deg, rgba(229,57,53,0.2) 0%, transparent 100%)'
                }}>
                  <Typography variant="subtitle2" color="white" fontWeight={700} textAlign="center">
                    🍽️ Menü
                  </Typography>
                </Box>

                {/* İçerik - Kaydırılabilir */}
                <Box sx={{ 
                  height: 'calc(100% - 44px - 52px - 24px)', 
                  overflow: 'auto',
                  p: 1.5,
                  '&::-webkit-scrollbar': { display: 'none' }
                }}>
                  <Stack spacing={1}>
                    {layouts.map((row, rowIndex) => (
                      <Box 
                        key={rowIndex} 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'row',
                          flexWrap: 'nowrap',
                          gap: '6px',
                          width: '100%'
                        }}
                      >
                        {(row.categories || []).map((item, catIndex) => {
                          const cat = item.category || {}
                          const height = item.size === 'full' ? 70 : item.size === 'half' ? 85 : 85
                          
                          return (
                            <Box 
                              key={catIndex}
                              sx={{ 
                                flex: item.size === 'full' ? '1 1 100%' : item.size === 'half' ? '1 1 50%' : '1 1 33.333%',
                                minWidth: 0,
                                height, 
                                borderRadius: 2, 
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' }
                              }}
                            >
                              {cat.image ? (
                                <Box component="img" src={getImageUrl(cat.image)} alt={cat.name}
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
                                  <Typography sx={{ fontSize: item.size === 'third' ? 20 : 28 }}>{cat.icon || '📁'}</Typography>
                                </Box>
                              )}
                              <Box sx={{ 
                                position: 'absolute', 
                                inset: 0, 
                                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' 
                              }} />
                              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1 }}>
                                <Typography 
                                  color="white" 
                                  noWrap
                                  fontWeight={600}
                                  sx={{ 
                                    fontSize: item.size === 'third' ? '0.6rem' : '0.7rem',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  {cat.name}
                                </Typography>
                              </Box>
                            </Box>
                          )
                        })}
                      </Box>
                    ))}
                  </Stack>

                  {/* Örnek Alt Bilgi */}
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <Typography variant="caption" color="grey.500" textAlign="center" display="block">
                      Kategoriye tıklayarak ürünleri görüntüleyin
                    </Typography>
                  </Box>
                </Box>

                {/* Home Indicator */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  width: 100,
                  height: 4,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  borderRadius: 2
                }} />
              </Box>
            </Box>
          </CardContent>

          {/* Bilgi */}
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity="success" variant="outlined" sx={{ bgcolor: 'transparent' }}>
              <Typography variant="caption">
                📐 Önizleme iPhone 14 boyutlarında gösterilmektedir (390×844 px ölçeklendirilmiş)
              </Typography>
            </Alert>
          </Box>
        </Card>
      )}
    </Stack>
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
    try {
      const res = await api.get(`/branches/${branchId}/glb`)
      setFiles(res.data || [])
    } catch (err) { 
      console.error(err)
      showSnackbar('Dosyalar yüklenemedi', 'error') 
    }
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
            <Card><CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><ViewInAr /></Avatar>
                <Box><Typography variant="h4" fontWeight={700}>{files.length}</Typography><Typography variant="body2" color="text.secondary">Toplam</Typography></Box>
              </Stack>
            </CardContent></Card>
          </Grid>
          <Grid item xs={4}>
            <Card><CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}><Check /></Avatar>
                <Box><Typography variant="h4" fontWeight={700}>{assignedCount}</Typography><Typography variant="body2" color="text.secondary">Atanmış</Typography></Box>
              </Stack>
            </CardContent></Card>
          </Grid>
          <Grid item xs={4}>
            <Card><CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}><Close /></Avatar>
                <Box><Typography variant="h4" fontWeight={700}>{unassignedCount}</Typography><Typography variant="body2" color="text.secondary">Atanmamış</Typography></Box>
              </Stack>
            </CardContent></Card>
          </Grid>
        </Grid>

        <Alert severity="info" icon={<ViewInAr />}>
          GLB dosyaları backend/outputs klasörüne yüklenmelidir.
        </Alert>

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
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>{file.filename}</Typography>
                            <Typography variant="caption" color="text.secondary">{file.sizeFormatted}</Typography>
                          </Box>
                        </Stack>
                        
                        {file.isAssigned ? (
                          <Chip label={`✓ ${file.assignedTo}`} color="success" variant="outlined" size="small" icon={<Restaurant />} />
                        ) : (
                          <Chip label="Atanmamış" color="warning" variant="outlined" size="small" />
                        )}

                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<ThreeSixty />}
                          onClick={() => setPreviewDialog({ open: true, file })}
                        >
                          3D Önizle
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyState icon={<ViewInAr sx={{ fontSize: 64 }} />} title="Henüz 3D model yok" description="backend/outputs klasörüne .glb dosyası ekleyin" />
            )}
          </CardContent>
        </Card>

        {/* 3D Preview Dialog */}
        <Dialog open={previewDialog.open} onClose={() => setPreviewDialog({ open: false, file: null })} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>{previewDialog.file?.filename}</Typography>
              <IconButton onClick={() => setPreviewDialog({ open: false, file: null })}><Close /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {previewDialog.file && (
              <ModelViewer3D glbFile={previewDialog.file.filename} productName={previewDialog.file.filename} size="large" />
            )}
          </DialogContent>
        </Dialog>
      </Stack>
    </PageWrapper>
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
      setAnnouncements(res.data)
    } catch { showSnackbar('Duyurular yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const handleToggle = async (item) => {
    try {
      await api.put(`/announcements/${item.id}`, { isActive: !item.isActive })
      showSnackbar(item.isActive ? 'Duyuru gizlendi' : 'Duyuru yayınlandı', 'success')
      loadAnnouncements()
    } catch { showSnackbar('İşlem başarısız', 'error') }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/${deleteDialog.item.id}`)
      showSnackbar('Duyuru silindi', 'success')
      setDeleteDialog({ open: false, item: null })
      loadAnnouncements()
    } catch { showSnackbar('Silme başarısız', 'error') }
  }

  const typeColors = { info: 'info', warning: 'warning', success: 'success', promo: 'error' }
  const typeLabels = { info: 'Bilgi', warning: 'Uyarı', success: 'Başarı', promo: 'Promosyon' }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Typography variant="h6" fontWeight={700}>{announcements.length} Duyuru</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>Yeni Duyuru</Button>
        </Stack>

        {announcements.length > 0 ? (
          <Grid container spacing={2}>
            {announcements.map(item => (
              <Grid item xs={12} md={6} key={item.id}>
                <Card sx={{ opacity: item.isActive ? 1 : 0.6 }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Typography variant="h2">{item.icon}</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                          <Typography variant="h6" fontWeight={600}>{item.title}</Typography>
                          <Chip label={typeLabels[item.type]} size="small" color={typeColors[item.type]} />
                          {!item.isActive && <Chip label="Gizli" size="small" />}
                        </Stack>
                        <Typography color="text.secondary">{item.message}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={1}>{formatDate(item.createdAt)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleToggle(item)}>{item.isActive ? 'Gizle' : 'Yayınla'}</Button>
                    <Button size="small" startIcon={<Edit />} onClick={() => { setEditing(item); setModalOpen(true) }}>Düzenle</Button>
                    <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, item })}>Sil</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState icon={<Campaign sx={{ fontSize: 64 }} />} title="Henüz duyuru yok"
            action={<Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>İlk Duyuruyu Ekle</Button>} />
        )}

        <AnnouncementModal open={modalOpen} announcement={editing} branchId={branchId}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={() => { setModalOpen(false); setEditing(null); loadAnnouncements() }} />

        <ConfirmDialog open={deleteDialog.open} title="Duyuru Sil" message={`"${deleteDialog.item?.title}" duyurusunu silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, item: null })} />
      </Stack>
    </PageWrapper>
  )
}

// ==================== ANNOUNCEMENT MODAL ====================
function AnnouncementModal({ open, announcement, branchId, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!announcement?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', icon: '📢', type: 'info', isActive: true })

  const icons = ['📢', '🎉', '🔥', '⚠️', '✅', '❌', '💰', '🎁', '🆕', '⭐', '❤️', '🍽️', '☕', '🍕', '🍔', '🎊']
  const types = [{ value: 'info', label: 'Bilgi', color: 'info' }, { value: 'warning', label: 'Uyarı', color: 'warning' }, { value: 'success', label: 'Başarı', color: 'success' }, { value: 'promo', label: 'Promosyon', color: 'error' }]

  useEffect(() => {
    if (open) {
      if (announcement) setForm({ title: announcement.title || '', message: announcement.message || '', icon: announcement.icon || '📢', type: announcement.type || 'info', isActive: announcement.isActive !== false })
      else setForm({ title: '', message: '', icon: '📢', type: 'info', isActive: true })
    }
  }, [open, announcement])

  const handleSubmit = async () => {
    if (!form.title || !form.message) { showSnackbar('Başlık ve mesaj zorunludur', 'error'); return }
    setSaving(true)
    try {
      if (isEditing) await api.put(`/announcements/${announcement.id}`, form)
      else await api.post(`/branches/${branchId}/announcements`, form)
      showSnackbar(isEditing ? 'Duyuru güncellendi' : 'Duyuru oluşturuldu', 'success')
      onSave()
    } catch (err) { showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6" fontWeight={700}>{isEditing ? 'Duyuru Düzenle' : 'Yeni Duyuru'}</Typography><IconButton onClick={onClose} size="small"><Close /></IconButton></Stack></DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField fullWidth label="Başlık" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <TextField fullWidth label="Mesaj" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} multiline rows={3} required />
          <Box>
            <Typography variant="subtitle2" gutterBottom>İkon</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {icons.map(icon => <IconButton key={icon} onClick={() => setForm({ ...form, icon })} sx={{ fontSize: 24, width: 44, height: 44, border: 2, borderColor: form.icon === icon ? 'primary.main' : 'transparent' }}>{icon}</IconButton>)}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Tip</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {types.map(type => <Chip key={type.value} label={type.label} color={type.color} variant={form.type === type.value ? 'filled' : 'outlined'} onClick={() => setForm({ ...form, type: type.value })} sx={{ cursor: 'pointer' }} />)}
            </Stack>
          </Box>
          <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}><Button onClick={onClose}>İptal</Button><Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button></DialogActions>
    </Dialog>
  )
}

// ==================== REVIEWS PAGE ====================
export function ReviewsPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [replyDialog, setReplyDialog] = useState({ open: false, review: null, text: '' })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, review: null })

  useEffect(() => { if (branchId) loadReviews() }, [branchId, tab])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const params = {}
      if (tab === 1) params.isApproved = 'false'
      if (tab === 2) params.isApproved = 'true'
      const res = await api.get(`/branches/${branchId}/reviews`, { params })
      setReviews(res.data.reviews || res.data)
    } catch { showSnackbar('Yorumlar yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const handleApprove = async (reviewId) => {
    try { await api.put(`/reviews/${reviewId}/approve`); showSnackbar('Yorum onaylandı', 'success'); loadReviews() }
    catch { showSnackbar('Onaylama başarısız', 'error') }
  }

  const handleReply = async () => {
    try { await api.put(`/reviews/${replyDialog.review.id}/reply`, { reply: replyDialog.text }); showSnackbar('Yanıt gönderildi', 'success'); setReplyDialog({ open: false, review: null, text: '' }); loadReviews() }
    catch { showSnackbar('Yanıt gönderilemedi', 'error') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/reviews/${deleteDialog.review.id}`); showSnackbar('Yorum silindi', 'success'); setDeleteDialog({ open: false, review: null }); loadReviews() }
    catch { showSnackbar('Silme başarısız', 'error') }
  }

  const pendingCount = reviews.filter(r => !r.isApproved).length

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Card><Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable"><Tab label="Tümü" /><Tab label={<Badge badgeContent={tab === 0 ? pendingCount : 0} color="warning">Bekleyen</Badge>} /><Tab label="Onaylı" /></Tabs></Card>

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : reviews.length > 0 ? (
          <Stack spacing={2}>
            {reviews.map(review => (
              <Card key={review.id}>
                <CardContent>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>{review.customerName?.[0] || 'A'}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={1}>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                            <Typography variant="subtitle1" fontWeight={600}>{review.customerName}</Typography>
                            <Rating value={review.rating} readOnly size="small" />
                            {!review.isApproved && <Chip label="Bekliyor" size="small" color="warning" />}
                          </Stack>
                          {review.productName && <Typography variant="caption" color="text.secondary">📦 {review.productName}</Typography>}
                        </Box>
                        <Typography variant="caption" color="text.secondary">{formatRelativeTime(review.createdAt)}</Typography>
                      </Stack>
                      {review.comment && <Typography sx={{ mt: 1 }}>{review.comment}</Typography>}
                      {review.contact && <Typography variant="caption" color="text.secondary" display="block" mt={1}>📞 {review.contact}</Typography>}
                      {review.reply && (
                        <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="primary.main" fontWeight={600}>Yanıtınız:</Typography>
                          <Typography variant="body2">{review.reply}</Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(review.repliedAt)}</Typography>
                        </Paper>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ flexWrap: 'wrap' }}>
                  {!review.isApproved && <Button size="small" color="success" startIcon={<Check />} onClick={() => handleApprove(review.id)}>Onayla</Button>}
                  <Button size="small" startIcon={<Reply />} onClick={() => setReplyDialog({ open: true, review, text: review.reply || '' })}>{review.reply ? 'Yanıtı Düzenle' : 'Yanıtla'}</Button>
                  <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, review })}>Sil</Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
        ) : <EmptyState icon={<RateReview sx={{ fontSize: 64 }} />} title={tab === 1 ? 'Bekleyen yorum yok' : tab === 2 ? 'Onaylı yorum yok' : 'Henüz yorum yok'} />}

        <Dialog open={replyDialog.open} onClose={() => setReplyDialog({ open: false, review: null, text: '' })} maxWidth="sm" fullWidth>
          <DialogTitle>Yoruma Yanıt Ver</DialogTitle>
          <DialogContent>
            {replyDialog.review && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3, mt: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}><Typography fontWeight={600}>{replyDialog.review.customerName}</Typography><Rating value={replyDialog.review.rating} readOnly size="small" /></Stack>
                <Typography>{replyDialog.review.comment || 'Yorum yok'}</Typography>
              </Paper>
            )}
            <TextField fullWidth label="Yanıtınız" value={replyDialog.text} onChange={e => setReplyDialog({ ...replyDialog, text: e.target.value })} multiline rows={3} />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}><Button onClick={() => setReplyDialog({ open: false, review: null, text: '' })}>İptal</Button><Button onClick={handleReply} variant="contained" disabled={!replyDialog.text.trim()}>Yanıtla</Button></DialogActions>
        </Dialog>

        <ConfirmDialog open={deleteDialog.open} title="Yorum Sil" message="Bu yorumu silmek istediğinize emin misiniz?" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, review: null })} />
      </Stack>
    </PageWrapper>
  )
}

// ==================== BRANCH SETTINGS PAGE ====================
export function BranchSettingsPage() {
  const { branchId } = useParams()
  const { refreshBranch } = useBranch()
  const showSnackbar = useSnackbar()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branch, setBranch] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', address: '', phone: '', whatsapp: '', instagram: '', workingHours: '', isActive: true })

  useEffect(() => { if (branchId) loadBranch() }, [branchId])

  const loadBranch = async () => {
    try {
      const res = await api.get(`/branches/${branchId}`)
      setBranch(res.data)
      setForm({ name: res.data.name || '', description: res.data.description || '', address: res.data.address || '', phone: res.data.phone || '', whatsapp: res.data.whatsapp || '', instagram: res.data.instagram || '', workingHours: res.data.workingHours || '', isActive: res.data.isActive !== false })
    } catch { showSnackbar('Şube bilgileri yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!form.name) { showSnackbar('Şube adı zorunludur', 'error'); return }
    setSaving(true)
    try { await api.put(`/branches/${branchId}`, form); showSnackbar('Ayarlar kaydedildi', 'success'); refreshBranch(); loadBranch() }
    catch { showSnackbar('Kaydetme başarısız', 'error') }
    finally { setSaving(false) }
  }

  const handleImageUpload = async (file, type) => {
    try {
      if (isHeicFile(file)) file = await convertHeicToJpg(file)
      const formData = new FormData()
      formData.append('image', file)
      await api.post(`/branches/${branchId}/image?type=${type}`, formData)
      showSnackbar('Görsel yüklendi', 'success')
      loadBranch()
    } catch { showSnackbar('Yükleme başarısız', 'error') }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box><Typography variant="h6" fontWeight={700}>Şube Ayarları</Typography><Typography variant="body2" color="text.secondary">Şube bilgilerini ve görsellerini düzenleyin</Typography></Box>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : <Check />}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
        </Stack>

        <Card>
          <CardHeader title="Görseller" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}><ImageUploader label="Logo" value={branch?.logo} onChange={(file) => handleImageUpload(file, 'logo')} aspectRatio="1/1" size="small" /></Grid>
              <Grid item xs={6} sm={3}><ImageUploader label="Şube Görseli" value={branch?.image} onChange={(file) => handleImageUpload(file, 'image')} aspectRatio="16/9" size="small" /></Grid>
              <Grid item xs={6} sm={3}><ImageUploader label="Banner" value={branch?.banner} onChange={(file) => handleImageUpload(file, 'banner')} aspectRatio="21/9" size="small" /></Grid>
              <Grid item xs={6} sm={3}><ImageUploader label="Menü Üst Görseli" value={branch?.homepageImage} onChange={(file) => handleImageUpload(file, 'homepageImage')} aspectRatio="16/9" size="small" /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Temel Bilgiler" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth label="Şube Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="URL Slug" value={branch?.slug || ''} disabled helperText="Değiştirilemez" /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Açıklama" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={3} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Adres" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment> }} /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="İletişim Bilgileri" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Telefon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="WhatsApp" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><WhatsApp /></InputAdornment> }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Instagram" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><Instagram /></InputAdornment> }} placeholder="@kullaniciadi" /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Çalışma Saatleri" value={form.workingHours} onChange={e => setForm({ ...form, workingHours: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><AccessTime /></InputAdornment> }} placeholder="09:00 - 22:00" /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card><CardHeader title="Durum" /><CardContent><FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif (Şube seçim ekranında görünsün)" /></CardContent></Card>
      </Stack>
    </PageWrapper>
  )
}

// ==================== BRANCHES PAGE (SuperAdmin) ====================
export function BranchesPage() {
  const { user } = useAuth()
  const showSnackbar = useSnackbar()
  const navigate = useNavigate()
  const { loadBranches: reloadBranches } = useBranch()
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, branch: null })

  useEffect(() => { loadBranches() }, [])

  const loadBranches = async () => {
    try { const res = await api.get('/branches'); setBranches(res.data) }
    catch { showSnackbar('Şubeler yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    try { await api.delete(`/branches/${deleteDialog.branch.id}`); showSnackbar('Şube silindi', 'success'); setDeleteDialog({ open: false, branch: null }); loadBranches(); reloadBranches() }
    catch { showSnackbar('Silme başarısız', 'error') }
  }

  const handleImageUpload = async (branchId, file, type) => {
    try {
      if (isHeicFile(file)) file = await convertHeicToJpg(file)
      const formData = new FormData()
      formData.append('image', file)
      await api.post(`/branches/${branchId}/image?type=${type}`, formData)
      showSnackbar('Görsel yüklendi', 'success')
      loadBranches()
    } catch { showSnackbar('Yükleme başarısız', 'error') }
  }

  if (user?.role !== 'superadmin') return <EmptyState icon={<Lock sx={{ fontSize: 64 }} />} title="Erişim Engellendi" description="Sadece süper adminler erişebilir" />
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box><Typography variant="h5" fontWeight={700}>Şubeler</Typography><Typography color="text.secondary">{branches.length} şube</Typography></Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>Yeni Şube</Button>
        </Stack>

        <Grid container spacing={2}>
          {branches.map(branch => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={branch.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative', pt: '60%', bgcolor: 'background.default' }}>
                  {branch.image ? <CardMedia component="img" image={getImageUrl(branch.image)} alt={branch.name} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store sx={{ fontSize: 48, color: 'text.secondary' }} /></Box>}
                  <Tooltip title="Görsel Yükle">
                    <IconButton component="label" size="small" sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                      <PhotoCamera sx={{ color: 'white', fontSize: 18 }} /><input type="file" hidden accept="image/*,.heic" onChange={e => e.target.files[0] && handleImageUpload(branch.id, e.target.files[0], 'image')} />
                    </IconButton>
                  </Tooltip>
                  <Chip label={branch.isActive ? 'Aktif' : 'Pasif'} size="small" color={branch.isActive ? 'success' : 'default'} sx={{ position: 'absolute', top: 8, right: 8 }} />
                  {branch.logo && <Avatar src={getImageUrl(branch.logo)} sx={{ position: 'absolute', bottom: -20, left: 12, width: 40, height: 40, border: '2px solid', borderColor: 'background.paper' }} />}
                </Box>
                <CardContent sx={{ flex: 1, pt: branch.logo ? 3 : 2, p: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>{branch.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">/{branch.slug}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}><Chip label={`${branch.productCount || 0} ürün`} size="small" /></Stack>
                </CardContent>
                <CardActions sx={{ p: 1, pt: 0 }}>
                  <Button size="small" onClick={() => navigate(`/admin/branch/${branch.id}/dashboard`)}>Panel</Button>
                  <Button size="small" startIcon={<Edit />} onClick={() => { setEditing(branch); setModalOpen(true) }}>Düzenle</Button>
                  <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, branch })}><Delete fontSize="small" /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {branches.length === 0 && <Grid item xs={12}><EmptyState icon={<Store sx={{ fontSize: 64 }} />} title="Henüz şube yok" action={<Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>İlk Şubeyi Ekle</Button>} /></Grid>}
        </Grid>

        <BranchModal open={modalOpen} branch={editing} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={() => { setModalOpen(false); setEditing(null); loadBranches(); reloadBranches() }} />
        <ConfirmDialog open={deleteDialog.open} title="Şube Sil" message={<><Typography>"{deleteDialog.branch?.name}" şubesini silmek istediğinize emin misiniz?</Typography><Alert severity="error" sx={{ mt: 2 }}>Tüm ürünler, kategoriler ve yorumlar silinecek!</Alert></>}
          onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, branch: null })} />
      </Stack>
    </PageWrapper>
  )
}

// ==================== BRANCH MODAL ====================
function BranchModal({ open, branch, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!branch?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', address: '', phone: '', whatsapp: '', instagram: '', workingHours: '', isActive: true })

  useEffect(() => {
    if (open) {
      if (branch) setForm({ name: branch.name || '', slug: branch.slug || '', description: branch.description || '', address: branch.address || '', phone: branch.phone || '', whatsapp: branch.whatsapp || '', instagram: branch.instagram || '', workingHours: branch.workingHours || '', isActive: branch.isActive !== false })
      else setForm({ name: '', slug: '', description: '', address: '', phone: '', whatsapp: '', instagram: '', workingHours: '', isActive: true })
    }
  }, [open, branch])

  const handleSubmit = async () => {
    if (!form.name) { showSnackbar('Şube adı zorunludur', 'error'); return }
    setSaving(true)
    try {
      if (isEditing) await api.put(`/branches/${branch.id}`, form)
      else await api.post('/branches', form)
      showSnackbar(isEditing ? 'Şube güncellendi' : 'Şube oluşturuldu', 'success')
      onSave()
    } catch (err) { showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6" fontWeight={700}>{isEditing ? 'Şube Düzenle' : 'Yeni Şube'}</Typography><IconButton onClick={onClose} size="small"><Close /></IconButton></Stack></DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} md={6}><Stack spacing={2}>
            <TextField fullWidth label="Şube Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <TextField fullWidth label="URL Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="otomatik" helperText="Boş bırakırsanız otomatik oluşturulur" disabled={isEditing} />
            <TextField fullWidth label="Açıklama" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={3} />
            <TextField fullWidth label="Adres" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment> }} />
          </Stack></Grid>
          <Grid item xs={12} md={6}><Stack spacing={2}>
            <TextField fullWidth label="Telefon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }} />
            <TextField fullWidth label="WhatsApp" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><WhatsApp /></InputAdornment> }} />
            <TextField fullWidth label="Instagram" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><Instagram /></InputAdornment> }} placeholder="@kullaniciadi" />
            <TextField fullWidth label="Çalışma Saatleri" value={form.workingHours} onChange={e => setForm({ ...form, workingHours: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><AccessTime /></InputAdornment> }} placeholder="09:00 - 22:00" />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif" />
          </Stack></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}><Button onClick={onClose}>İptal</Button><Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button></DialogActions>
    </Dialog>
  )
}

// ==================== USERS PAGE (SuperAdmin) ====================
export function UsersPage() {
  const { user: currentUser } = useAuth()
  const showSnackbar = useSnackbar()
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([api.get('/users'), api.get('/branches')])
      setUsers(usersRes.data)
      setBranches(branchesRes.data)
    } catch { showSnackbar('Veriler yüklenemedi', 'error') }
    finally { setLoading(false) }
  }

  const handleToggleActive = async (user) => {
    try { await api.put(`/users/${user.id}`, { isActive: !user.isActive }); showSnackbar(user.isActive ? 'Kullanıcı pasifleştirildi' : 'Kullanıcı aktifleştirildi', 'success'); loadData() }
    catch { showSnackbar('İşlem başarısız', 'error') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/users/${deleteDialog.user.id}`); showSnackbar('Kullanıcı silindi', 'success'); setDeleteDialog({ open: false, user: null }); loadData() }
    catch (err) { showSnackbar(err.response?.data?.error || 'Silme başarısız', 'error') }
  }

  const roleColors = { superadmin: 'error', admin: 'warning', manager: 'info', staff: 'default' }
  const roleLabels = { superadmin: 'Süper Admin', admin: 'Admin', manager: 'Yönetici', staff: 'Personel' }

  if (currentUser?.role !== 'superadmin') return <EmptyState icon={<Lock sx={{ fontSize: 64 }} />} title="Erişim Engellendi" description="Sadece süper adminler erişebilir" />
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <PageWrapper>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box><Typography variant="h5" fontWeight={700}>Kullanıcılar</Typography><Typography color="text.secondary">{users.length} kullanıcı</Typography></Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>Yeni Kullanıcı</Button>
        </Stack>

        <Grid container spacing={2}>
          {users.map(user => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
              <Card sx={{ opacity: user.isActive ? 1 : 0.6 }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>{user.fullName?.[0] || user.username?.[0] || 'U'}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>{user.fullName || user.username}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>@{user.username}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                    <Chip label={roleLabels[user.role]} size="small" color={roleColors[user.role]} />
                    {!user.isActive && <Chip label="Pasif" size="small" />}
                  </Stack>
                </CardContent>
                <CardActions sx={{ p: 1, pt: 0 }}>
                  <Button size="small" onClick={() => handleToggleActive(user)} disabled={user.id === currentUser.id}>{user.isActive ? 'Pasif' : 'Aktif'}</Button>
                  <Button size="small" startIcon={<Edit />} onClick={() => { setEditing(user); setModalOpen(true) }}>Düzenle</Button>
                  <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, user })} disabled={user.id === currentUser.id}><Delete fontSize="small" /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <UserModal open={modalOpen} user={editing} branches={branches} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={() => { setModalOpen(false); setEditing(null); loadData() }} />
        <ConfirmDialog open={deleteDialog.open} title="Kullanıcı Sil" message={`"${deleteDialog.user?.username}" kullanıcısını silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, user: null })} />
      </Stack>
    </PageWrapper>
  )
}

// ==================== USER MODAL ====================
function UserModal({ open, user, branches, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!user?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', role: 'staff', branches: [], isActive: true })

  const roles = [{ value: 'superadmin', label: 'Süper Admin' }, { value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Yönetici' }, { value: 'staff', label: 'Personel' }]

  useEffect(() => {
    if (open) {
      if (user) setForm({ username: user.username || '', email: user.email || '', password: '', fullName: user.fullName || '', role: user.role || 'staff', branches: user.branches?.map(b => b._id || b.id) || [], isActive: user.isActive !== false })
      else setForm({ username: '', email: '', password: '', fullName: '', role: 'staff', branches: [], isActive: true })
    }
  }, [open, user])

  const handleSubmit = async () => {
    if (!form.username || !form.email) { showSnackbar('Kullanıcı adı ve email zorunludur', 'error'); return }
    if (!isEditing && !form.password) { showSnackbar('Yeni kullanıcı için şifre zorunludur', 'error'); return }

    setSaving(true)
    try {
      const data = { ...form }
      if (!data.password) delete data.password
      if (isEditing) await api.put(`/users/${user.id}`, data)
      else await api.post('/users', data)
      showSnackbar(isEditing ? 'Kullanıcı güncellendi' : 'Kullanıcı oluşturuldu', 'success')
      onSave()
    } catch (err) { showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6" fontWeight={700}>{isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</Typography><IconButton onClick={onClose} size="small"><Close /></IconButton></Stack></DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField fullWidth label="Kullanıcı Adı" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          <TextField fullWidth label="E-posta" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <TextField fullWidth label="Ad Soyad" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
          <TextField fullWidth label={isEditing ? 'Şifre (değiştirmek için)' : 'Şifre'} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!isEditing} />
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select value={form.role} label="Rol" onChange={e => setForm({ ...form, role: e.target.value })}>
              {roles.map(role => <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>)}
            </Select>
          </FormControl>
          {form.role !== 'superadmin' && (
            <FormControl fullWidth>
              <InputLabel>Şubeler</InputLabel>
              <Select multiple value={form.branches} label="Şubeler" onChange={e => setForm({ ...form, branches: e.target.value })}
                renderValue={(selected) => <Stack direction="row" spacing={0.5} flexWrap="wrap">{selected.map(id => { const branch = branches.find(b => b.id === id); return <Chip key={id} label={branch?.name || id} size="small" /> })}</Stack>}>
                {branches.map(branch => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}><Button onClick={onClose}>İptal</Button><Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button></DialogActions>
    </Dialog>
  )
}