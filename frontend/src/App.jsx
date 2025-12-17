// App.jsx - Part 1
import { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ThemeProvider, createTheme, CssBaseline,
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Divider,
  List, ListItem, ListItemIcon, ListItemText, ListItemButton,
  Card, CardContent, CardMedia, CardActions, CardHeader,
  Grid, Paper, Stack, Chip, Badge, Tooltip, Alert, Snackbar,
  Button, TextField, Select, FormControl, InputLabel, FormControlLabel, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, LinearProgress, Tabs, Tab,
  InputAdornment, Rating, useMediaQuery, alpha
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard, Restaurant, Category, ViewInAr, Campaign, RateReview, 
  Settings, People, Logout, Add, Edit, Delete, Search, Refresh, CloudUpload,
  Store, Check, Close, Visibility, VisibilityOff, DarkMode, LightMode,
  Star, Person, Email, Lock, Login as LoginIcon, ExpandMore, Image
} from '@mui/icons-material'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip } from 'recharts'

// ==================== CONFIG ====================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const FILES_URL = import.meta.env.VITE_FILES_URL || 'http://localhost:3001'

// ==================== AXIOS ====================
const api = axios.create({ baseURL: API_URL })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

// ==================== CONTEXTS ====================
const AuthContext = createContext(null)
const SnackbarContext = createContext(null)
const BranchContext = createContext(null)

export const useAuth = () => useContext(AuthContext)
export const useSnackbar = () => useContext(SnackbarContext)
export const useBranch = () => useContext(BranchContext)

// ==================== THEME ====================
const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: { main: '#e53935' },
    secondary: { main: '#1e88e5' },
    success: { main: '#43a047' },
    warning: { main: '#fb8c00' },
    background: mode === 'dark' 
      ? { default: '#0a0a0a', paper: '#141414' }
      : { default: '#f5f5f5', paper: '#ffffff' }
  },
  typography: { fontFamily: '"Inter", sans-serif' },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } }
  }
})

// ==================== HELPERS ====================
const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// HEIC Converter
const isHeicFile = (file) => file?.name?.toLowerCase().endsWith('.heic') || file?.type === 'image/heic'
const convertHeicToJpg = async (file) => {
  const heic2any = (await import('heic2any')).default
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  return new File([Array.isArray(blob) ? blob[0] : blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
}

// ==================== SNACKBAR PROVIDER ====================
function SnackbarProvider({ children }) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  const showSnackbar = (message, severity = 'info') => setSnackbar({ open: true, message, severity })
  return (
    <SnackbarContext.Provider value={showSnackbar}>
      {children}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

// ==================== AUTH PROVIDER ====================
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch { localStorage.removeItem('token') }
    finally { setLoading(false) }
  }

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const logout = () => { localStorage.removeItem('token'); setUser(null) }

  const setup = async (data) => {
    const res = await api.post('/auth/setup', data)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0a0a0a' }}>
      <CircularProgress color="primary" size={60} />
    </Box>
  )

  return <AuthContext.Provider value={{ user, login, logout, setup }}>{children}</AuthContext.Provider>
}

// ==================== BRANCH PROVIDER ====================
function BranchProvider({ children }) {
  const [currentBranch, setCurrentBranch] = useState(null)
  const [branches, setBranches] = useState([])

  const loadBranches = async () => {
    try {
      const res = await api.get('/branches')
      setBranches(res.data)
      if (res.data.length > 0 && !currentBranch) {
        const saved = localStorage.getItem('currentBranch')
        const found = res.data.find(b => b.id === saved)
        setCurrentBranch(found || res.data[0])
      }
    } catch (err) { console.error(err) }
  }

  const selectBranch = (branch) => {
    setCurrentBranch(branch)
    localStorage.setItem('currentBranch', branch.id)
  }

  return (
    <BranchContext.Provider value={{ currentBranch, branches, loadBranches, selectBranch, setCurrentBranch }}>
      {children}
    </BranchContext.Provider>
  )
}
// ==================== LOGIN PAGE ====================
function LoginPage() {
  const { login, setup } = useAuth()
  const navigate = useNavigate()
  const showSnackbar = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', email: '', fullName: '' })

  useEffect(() => {
    api.get('/auth/check-setup').then(res => setNeedsSetup(res.data.needsSetup)).catch(console.error)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (needsSetup) {
        await setup(form)
        showSnackbar('Admin hesabı oluşturuldu!', 'success')
      } else {
        await login(form.username, form.password)
        showSnackbar('Giriş başarılı!', 'success')
      }
      navigate('/admin')
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0a0a0a', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%', p: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Restaurant sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" fontWeight={700} color="white">AR Menu</Typography>
            <Typography color="text.secondary">
              {needsSetup ? 'Admin Hesabı Oluştur' : 'Yönetim Paneli'}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Kullanıcı Adı"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
                required
              />

              {needsSetup && (
                <>
                  <TextField
                    fullWidth
                    label="E-posta"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Ad Soyad"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
                  />
                </>
              )}

              <TextField
                fullWidth
                label="Şifre"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }}
                required
              />

              <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}>
                {loading ? 'Yükleniyor...' : needsSetup ? 'Hesap Oluştur' : 'Giriş Yap'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

// ==================== BRANCH SELECTION PAGE (Şube Seçim Ekranı) ====================
function BranchSelectionPage() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const res = await axios.get(API_URL + '/public/branches')
      setBranches(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0a0a0a' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (branches.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#0a0a0a', p: 3 }}>
        <Store sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="white" gutterBottom>Henüz şube eklenmemiş</Typography>
        <Typography color="text.secondary" mb={3}>Admin panelden şube ekleyin</Typography>
        <Button variant="contained" component={Link} to="/admin">Admin Panel</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6, pt: 4 }}>
          <Restaurant sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" fontWeight={700} color="white" gutterBottom>
            AR Menu
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Şube Seçin
          </Typography>
        </Box>

        {/* Branch Cards */}
        <Grid container spacing={3} justifyContent="center">
          {branches.map(branch => (
            <Grid item xs={12} sm={6} md={4} key={branch.id}>
              <Card 
                component={Link} 
                to={`/menu/${branch.slug}`}
                sx={{ 
                  textDecoration: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(229,57,53,0.3)'
                  }
                }}
              >
                {/* Branch Image */}
                <Box sx={{ position: 'relative', pt: '60%', bgcolor: 'background.default' }}>
                  {branch.image ? (
                    <CardMedia
                      component="img"
                      image={`${FILES_URL}/uploads/images/${branch.image}`}
                      alt={branch.name}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Store sx={{ fontSize: 80, color: 'text.secondary' }} />
                    </Box>
                  )}
                  {/* Logo overlay */}
                  {branch.logo && (
                    <Avatar
                      src={`${FILES_URL}/uploads/images/${branch.logo}`}
                      sx={{ position: 'absolute', bottom: -30, left: 20, width: 60, height: 60, border: '3px solid', borderColor: 'background.paper' }}
                    />
                  )}
                </Box>

                {/* Content */}
                <CardContent sx={{ pt: branch.logo ? 5 : 2, flexGrow: 1 }}>
                  <Typography variant="h5" fontWeight={700} color="white" gutterBottom>
                    {branch.name}
                  </Typography>
                  {branch.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {branch.description}
                    </Typography>
                  )}
                  {branch.address && (
                    <Typography variant="body2" color="text.secondary">
                      📍 {branch.address}
                    </Typography>
                  )}
                </CardContent>

                {/* Action */}
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button variant="contained" fullWidth size="large">
                    Menüyü Görüntüle
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Admin Link */}
        <Box sx={{ textAlign: 'center', mt: 6, pb: 4 }}>
          <Button component={Link} to="/admin" color="inherit" sx={{ color: 'text.secondary' }}>
            🔐 Admin Panel
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
// ==================== SIDEBAR ====================
const drawerWidth = 280

const menuItems = [
  { path: 'dashboard', icon: <Dashboard />, label: 'Dashboard' },
  { path: 'products', icon: <Restaurant />, label: 'Ürünler' },
  { path: 'categories', icon: <Category />, label: 'Kategoriler' },
  { path: 'glb', icon: <ViewInAr />, label: '3D Modeller' },
  { path: 'announcements', icon: <Campaign />, label: 'Duyurular' },
  { path: 'reviews', icon: <RateReview />, label: 'Yorumlar' },
]

const superAdminItems = [
  { path: '/admin/branches', icon: <Store />, label: 'Şubeler', global: true },
  { path: '/admin/users', icon: <People />, label: 'Kullanıcılar', global: true },
]

function Sidebar({ open, onClose, isMobile }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { currentBranch, branches, selectBranch } = useBranch()
  const [branchMenuAnchor, setBranchMenuAnchor] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBranchChange = (branch) => {
    selectBranch(branch)
    setBranchMenuAnchor(null)
    navigate(`/admin/branch/${branch.id}/dashboard`)
  }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Restaurant sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>AR Menu</Typography>
            <Typography variant="caption" color="text.secondary">Yönetim Paneli</Typography>
          </Box>
        </Stack>
      </Box>

      {/* Branch Selector */}
      {branches.length > 0 && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={(e) => setBranchMenuAnchor(e.currentTarget)}
            endIcon={<ExpandMore />}
            sx={{ justifyContent: 'space-between', py: 1.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Store fontSize="small" />
              <Typography noWrap>{currentBranch?.name || 'Şube Seç'}</Typography>
            </Stack>
          </Button>
          <Menu
            anchorEl={branchMenuAnchor}
            open={Boolean(branchMenuAnchor)}
            onClose={() => setBranchMenuAnchor(null)}
            PaperProps={{ sx: { width: 240 } }}
          >
            {branches.map(branch => (
              <MenuItem 
                key={branch.id} 
                onClick={() => handleBranchChange(branch)}
                selected={currentBranch?.id === branch.id}
              >
                <ListItemIcon><Store fontSize="small" /></ListItemIcon>
                <ListItemText>{branch.name}</ListItemText>
                {currentBranch?.id === branch.id && <Check fontSize="small" color="primary" />}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      )}

      {/* Menu Items */}
      <List sx={{ flex: 1, px: 2, py: 1 }}>
        {currentBranch && menuItems.map(item => {
          const fullPath = `/admin/branch/${currentBranch.id}/${item.path}`
          const isActive = location.pathname === fullPath
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={fullPath}
                selected={isActive}
                onClick={() => isMobile && onClose()}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'white' }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          )
        })}

        {/* SuperAdmin Items */}
        {user?.role === 'superadmin' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1, display: 'block' }}>
              Süper Admin
            </Typography>
            {superAdminItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={isActive}
                    onClick={() => isMobile && onClose()}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'white' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </>
        )}
      </List>

      {/* User */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {user?.fullName?.[0] || user?.username?.[0] || 'A'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>{user?.fullName || user?.username}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{user?.role}</Typography>
          </Box>
          <IconButton onClick={handleLogout} size="small">
            <Logout fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  )

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {isMobile ? (
        <Drawer variant="temporary" open={open} onClose={onClose} ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent"
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: 1, borderColor: 'divider' } }}
          open>
          {drawer}
        </Drawer>
      )}
    </Box>
  )
}

// ==================== ADMIN LAYOUT ====================
function AdminLayout({ children }) {
  const { user } = useAuth()
  const { loadBranches, currentBranch, branches } = useBranch()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width:900px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false')

  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode])

  useEffect(() => {
    if (user) loadBranches()
  }, [user])

  useEffect(() => {
    // İlk şubeye yönlendir
    if (branches.length > 0 && !currentBranch) {
      navigate(`/admin/branch/${branches[0].id}/dashboard`)
    }
  }, [branches, currentBranch])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    localStorage.setItem('darkMode', (!darkMode).toString())
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
        
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* AppBar */}
          <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar>
              {isMobile && (
                <IconButton edge="start" onClick={() => setSidebarOpen(true)} sx={{ mr: 2 }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                {currentBranch?.name || 'AR Menu Admin'}
              </Typography>
              <IconButton onClick={toggleDarkMode}>
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* Content */}
          <Box component="main" sx={{ flex: 1, p: 3, bgcolor: 'background.default' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

// ==================== STAT CARD ====================
function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>{title}</Typography>
            <Typography variant="h3" fontWeight={700}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ==================== DASHBOARD PAGE ====================
function DashboardPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (branchId) loadStats()
  }, [branchId])

  const loadStats = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/dashboard`)
      setStats(res.data)
    } catch (err) {
      showSnackbar('İstatistikler yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa']

  return (
    <Stack spacing={3}>
      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Toplam Ürün" value={stats?.counts?.products || 0} icon={<Restaurant />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Kategoriler" value={stats?.counts?.categories || 0} icon={<Category />} color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="3D Modeller" value={stats?.counts?.glbFiles || 0} icon={<ViewInAr />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Yorumlar" value={stats?.counts?.reviews || 0} icon={<RateReview />} color="warning" 
            subtitle={`${stats?.counts?.pendingReviews || 0} bekleyen`} />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Category Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Kategori Dağılımı" />
            <CardContent>
              {stats?.categoryStats?.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.categoryStats} cx="50%" cy="50%" innerRadius={60} outerRadius={100} 
                        paddingAngle={5} dataKey="count" nameKey="name" label={({ name, count }) => `${name}: ${count}`}>
                        {stats.categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <Category sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>Henüz veri yok</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Average Rating */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Müşteri Memnuniyeti" />
            <CardContent>
              <Stack alignItems="center" spacing={2} py={4}>
                <Typography variant="h1" fontWeight={700} color="warning.main">
                  {(stats?.averageRating || 0).toFixed(1)}
                </Typography>
                <Rating value={stats?.averageRating || 0} precision={0.1} readOnly size="large" />
                <Typography color="text.secondary">
                  {stats?.counts?.reviews || 0} değerlendirme
                </Typography>
              </Stack>
              
              {/* Rating Bars */}
              <Stack spacing={1} sx={{ mt: 2 }}>
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = stats?.ratingStats?.find(r => r._id === rating)?.count || 0
                  const total = stats?.counts?.reviews || 1
                  const percent = (count / total) * 100
                  return (
                    <Stack key={rating} direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ width: 20 }}>{rating}</Typography>
                      <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                      <LinearProgress variant="determinate" value={percent} sx={{ flex: 1, height: 8, borderRadius: 1 }} />
                      <Typography variant="body2" sx={{ width: 30 }}>{count}</Typography>
                    </Stack>
                  )
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Reviews & Top Products */}
      <Grid container spacing={3}>
        {/* Recent Reviews */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Son Yorumlar" />
            <CardContent>
              {stats?.recentReviews?.length > 0 ? (
                <Stack spacing={2}>
                  {stats.recentReviews.map(review => (
                    <Paper key={review._id} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Rating value={review.rating} readOnly size="small" />
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{review.comment || 'Yorum yok'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {review.customerName} • {formatDate(review.createdAt)}
                          </Typography>
                        </Box>
                        {!review.isApproved && <Chip label="Bekliyor" size="small" color="warning" />}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <RateReview sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>Henüz yorum yok</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Popüler Ürünler" />
            <CardContent>
              {stats?.topProducts?.length > 0 ? (
                <Stack spacing={2}>
                  {stats.topProducts.map((product, index) => (
                    <Stack key={product._id} direction="row" alignItems="center" spacing={2}>
                      <Typography variant="h6" color="text.secondary" sx={{ width: 24 }}>#{index + 1}</Typography>
                      <Avatar src={product.thumbnail ? `${FILES_URL}/uploads/images/${product.thumbnail}` : undefined} variant="rounded">
                        <Restaurant />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{product.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{product.viewCount} görüntülenme</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Restaurant sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>Henüz ürün yok</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
// ==================== PRODUCTS PAGE ====================
function ProductsPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [glbFiles, setGlbFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null })

  useEffect(() => {
    if (branchId) loadData()
  }, [branchId])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, glbRes] = await Promise.all([
        api.get(`/branches/${branchId}/products`),
        api.get(`/branches/${branchId}/categories`),
        api.get(`/branches/${branchId}/glb`)
      ])
      setProducts(productsRes.data.products || productsRes.data)
      setCategories(categoriesRes.data)
      setGlbFiles(glbRes.data)
    } catch (err) {
      showSnackbar('Veriler yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteDialog.product.id}`)
      showSnackbar('Ürün silindi', 'success')
      setDeleteDialog({ open: false, product: null })
      loadData()
    } catch (err) {
      showSnackbar('Silme başarısız', 'error')
    }
  }

  const filteredProducts = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCategory && p.categoryId !== filterCategory) return false
    return true
  })

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Stack spacing={3}>
      {/* Toolbar */}
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Ürün ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                sx={{ width: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Kategori</InputLabel>
                <Select value={filterCategory} label="Kategori" onChange={e => setFilterCategory(e.target.value)}>
                  <MenuItem value="">Tümü</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Refresh />} onClick={loadData}>Yenile</Button>
              <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingProduct(null); setModalOpen(true) }}>
                Yeni Ürün
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <Grid container spacing={2}>
        {filteredProducts.map(product => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ position: 'relative', pt: '70%', bgcolor: 'background.default' }}>
                {product.thumbnail ? (
                  <CardMedia
                    component="img"
                    image={`${FILES_URL}/uploads/images/${product.thumbnail}`}
                    alt={product.name}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Restaurant sx={{ fontSize: 64, color: 'text.secondary' }} />
                  </Box>
                )}
                {/* Badges */}
                <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, left: 8 }}>
                  {product.hasGlb && <Chip label="3D" size="small" color="info" icon={<ViewInAr />} />}
                  {product.isFeatured && <Chip label="⭐" size="small" color="warning" />}
                  {product.isCampaign && <Chip label="🔥" size="small" color="error" />}
                </Stack>
                {!product.isActive && (
                  <Chip label="Pasif" size="small" sx={{ position: 'absolute', top: 8, right: 8 }} />
                )}
              </Box>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>{product.name}</Typography>
                {product.categoryName && (
                  <Typography variant="caption" color="text.secondary">{product.categoryIcon} {product.categoryName}</Typography>
                )}
                <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ mt: 1 }}>₺{product.price}</Typography>
                {product.glbFile && (
                  <Typography variant="caption" color="success.main" display="block">📦 {product.glbFile}</Typography>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<Edit />} onClick={() => { setEditingProduct(product); setModalOpen(true) }}>
                  Düzenle
                </Button>
                <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, product })}>
                  Sil
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {filteredProducts.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Restaurant sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Ürün bulunamadı</Typography>
              <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => { setEditingProduct(null); setModalOpen(true) }}>
                İlk Ürünü Ekle
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Product Modal */}
      <ProductModal
        open={modalOpen}
        product={editingProduct}
        categories={categories}
        glbFiles={glbFiles}
        branchId={branchId}
        onClose={() => { setModalOpen(false); setEditingProduct(null) }}
        onSave={() => { setModalOpen(false); setEditingProduct(null); loadData() }}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, product: null })}>
        <DialogTitle>Ürünü Sil</DialogTitle>
        <DialogContent>
          <Typography>"{deleteDialog.product?.name}" ürününü silmek istediğinize emin misiniz?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, product: null })}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>
    </Stack>
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
          categoryId: product.categoryId || '',
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
        setThumbnailPreview(product.thumbnail ? `${FILES_URL}/uploads/images/${product.thumbnail}` : null)
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

  const handleThumbnailChange = async (e) => {
    let file = e.target.files[0]
    if (!file) return
    if (isHeicFile(file)) file = await convertHeicToJpg(file)
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      showSnackbar('İsim ve fiyat zorunludur', 'error')
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

      // Upload thumbnail
      if (thumbnailFile) {
        const formData = new FormData()
        formData.append('image', thumbnailFile)
        await api.post(`/products/${productId}/thumbnail`, formData)
      }

      // Assign GLB
      await api.put(`/products/${productId}/assign-glb`, { glbFile: form.glbFile || null })

      showSnackbar(isEditing ? 'Ürün güncellendi' : 'Ürün oluşturuldu', 'success')
      onSave()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? 'Ürün Düzenle' : 'Yeni Ürün'}</DialogTitle>
      
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Genel" />
        <Tab label="Detaylar" />
        <Tab label="3D Model" />
      </Tabs>

      <DialogContent>
        {tab === 0 && (
          <Grid container spacing={3} sx={{ mt: 0 }}>
            {/* Thumbnail */}
            <Grid item xs={12} md={4}>
              <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 2, textAlign: 'center' }}>
                {thumbnailPreview ? (
                  <Box component="img" src={thumbnailPreview} alt="Preview" sx={{ width: '100%', borderRadius: 1, mb: 1 }} />
                ) : (
                  <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 1 }} />
                )}
                <Button component="label" variant="outlined" startIcon={<Image />}>
                  Görsel Seç
                  <input type="file" hidden accept="image/*,.heic" onChange={handleThumbnailChange} />
                </Button>
              </Box>
            </Grid>

            {/* Form */}
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                <TextField fullWidth label="Ürün Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <Stack direction="row" spacing={2}>
                  <TextField fullWidth label="Fiyat" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }} required />
                  <FormControl fullWidth>
                    <InputLabel>Kategori</InputLabel>
                    <Select value={form.categoryId} label="Kategori" onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                      <MenuItem value="">Seçiniz</MenuItem>
                      {categories.map(cat => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                <TextField fullWidth label="Açıklama" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={3} />
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif" />
                  <FormControlLabel control={<Switch checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} color="warning" />} label="Öne Çıkan" />
                  <FormControlLabel control={<Switch checked={form.isCampaign} onChange={e => setForm({ ...form, isCampaign: e.target.checked })} color="error" />} label="Kampanya" />
                </Stack>
                {form.isCampaign && (
                  <TextField fullWidth label="Kampanya Fiyatı" type="number" value={form.campaignPrice} onChange={e => setForm({ ...form, campaignPrice: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }} />
                )}
              </Stack>
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="Kalori" type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })}
                InputProps={{ endAdornment: <InputAdornment position="end">kcal</InputAdornment> }} />
              <TextField fullWidth label="Hazırlama Süresi" type="number" value={form.preparationTime} onChange={e => setForm({ ...form, preparationTime: e.target.value })}
                InputProps={{ endAdornment: <InputAdornment position="end">dk</InputAdornment> }} />
            </Stack>
            <TextField fullWidth label="Alerjenler (virgülle ayırın)" value={form.allergens} onChange={e => setForm({ ...form, allergens: e.target.value })} placeholder="Gluten, Süt, Fındık..." />
            <TextField fullWidth label="Etiketler (virgülle ayırın)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Vegan, Popüler, Yeni..." />
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert severity="info" icon={<ViewInAr />}>
              GLB dosyaları Mac'teki Swift-CLI ile yüklenir ve buradan ürüne atanır.
            </Alert>
            <FormControl fullWidth>
              <InputLabel>3D Model (GLB)</InputLabel>
              <Select value={form.glbFile} label="3D Model (GLB)" onChange={e => setForm({ ...form, glbFile: e.target.value })}>
                <MenuItem value="">Seçim yok</MenuItem>
                {glbFiles.map(glb => (
                  <MenuItem key={glb.filename} value={glb.filename}>
                    <Stack direction="row" spacing={2} alignItems="center" width="100%">
                      <ViewInAr />
                      <Box flex={1}>
                        <Typography>{glb.filename}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {glb.sizeFormatted} {glb.isAssigned && `• ${glb.assignedTo}`}
                        </Typography>
                      </Box>
                      {glb.isAssigned && <Chip label="Atanmış" size="small" />}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {form.glbFile && (
              <Alert severity="success" icon={<Check />}>Seçili model: <strong>{form.glbFile}</strong></Alert>
            )}
          </Stack>
        )}
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

// ==================== CATEGORIES PAGE ====================
function CategoriesPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null })

  useEffect(() => {
    if (branchId) loadCategories()
  }, [branchId])

  const loadCategories = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/categories`)
      setCategories(res.data)
    } catch (err) {
      showSnackbar('Kategoriler yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleteDialog.category.id}`)
      showSnackbar('Kategori silindi', 'success')
      setDeleteDialog({ open: false, category: null })
      loadCategories()
    } catch (err) {
      showSnackbar('Silme başarısız', 'error')
    }
  }

  const handleImageUpload = async (categoryId, file) => {
    try {
      if (isHeicFile(file)) file = await convertHeicToJpg(file)
      const formData = new FormData()
      formData.append('image', file)
      await api.post(`/categories/${categoryId}/image`, formData)
      showSnackbar('Görsel yüklendi', 'success')
      loadCategories()
    } catch (err) {
      showSnackbar('Yükleme başarısız', 'error')
    }
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography color="text.secondary">{categories.length} kategori</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingCategory(null); setModalOpen(true) }}>
          Yeni Kategori
        </Button>
      </Stack>

      {/* Categories Grid */}
      <Grid container spacing={2}>
        {categories.map(category => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card>
              <Box sx={{ position: 'relative', pt: '50%', bgcolor: 'background.default' }}>
                {category.image ? (
                  <CardMedia
                    component="img"
                    image={`${FILES_URL}/uploads/images/${category.image}`}
                    alt={category.name}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h1">{category.icon}</Typography>
                  </Box>
                )}
                <IconButton component="label" sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                  <Image sx={{ color: 'white' }} />
                  <input type="file" hidden accept="image/*,.heic" onChange={e => e.target.files[0] && handleImageUpload(category.id, e.target.files[0])} />
                </IconButton>
              </Box>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{category.icon} {category.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{category.productCount || 0} ürün</Typography>
                  </Box>
                  <Chip label={category.isActive ? 'Aktif' : 'Pasif'} size="small" color={category.isActive ? 'success' : 'default'} />
                </Stack>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<Edit />} onClick={() => { setEditingCategory(category); setModalOpen(true) }}>Düzenle</Button>
                <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, category })}>Sil</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {categories.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Category sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Henüz kategori yok</Typography>
              <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => { setEditingCategory(null); setModalOpen(true) }}>
                İlk Kategoriyi Ekle
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Category Modal */}
      <CategoryModal
        open={modalOpen}
        category={editingCategory}
        branchId={branchId}
        onClose={() => { setModalOpen(false); setEditingCategory(null) }}
        onSave={() => { setModalOpen(false); setEditingCategory(null); loadCategories() }}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, category: null })}>
        <DialogTitle>Kategori Sil</DialogTitle>
        <DialogContent>
          <Typography>"{deleteDialog.category?.name}" kategorisini silmek istediğinize emin misiniz?</Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>Bu kategorideki ürünler kategorisiz kalacak.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, category: null })}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

// ==================== CATEGORY MODAL ====================
function CategoryModal({ open, category, branchId, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!category?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '📁', isActive: true })

  const icons = ['🍕', '🍔', '🌮', '🍜', '🍣', '🥗', '🍰', '☕', '🍺', '🥤', '🍳', '🥪', '🍝', '🥘', '🍱', '🧁', '🍦', '🥩', '🍗', '🥙']

  useEffect(() => {
    if (open) {
      if (category) {
        setForm({ name: category.name || '', icon: category.icon || '📁', isActive: category.isActive !== false })
      } else {
        setForm({ name: '', icon: '📁', isActive: true })
      }
    }
  }, [open, category])

  const handleSubmit = async () => {
    if (!form.name) {
      showSnackbar('Kategori adı zorunludur', 'error')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await api.put(`/categories/${category.id}`, form)
      } else {
        await api.post(`/branches/${branchId}/categories`, form)
      }
      showSnackbar(isEditing ? 'Kategori güncellendi' : 'Kategori oluşturuldu', 'success')
      onSave()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField fullWidth label="Kategori Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Box>
            <Typography variant="subtitle2" gutterBottom>İkon Seçin</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {icons.map(icon => (
                <IconButton key={icon} onClick={() => setForm({ ...form, icon })}
                  sx={{ fontSize: 24, border: form.icon === icon ? 2 : 1, borderColor: form.icon === icon ? 'primary.main' : 'divider',
                    bgcolor: form.icon === icon ? 'primary.main' : 'transparent', color: form.icon === icon ? 'white' : 'inherit' }}>
                  {icon}
                </IconButton>
              ))}
            </Stack>
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
// ==================== GLB FILES PAGE ====================
function GlbFilesPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (branchId) loadFiles()
  }, [branchId])

  const loadFiles = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/glb`)
      setFiles(res.data)
    } catch (err) {
      showSnackbar('Dosyalar yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const assignedCount = files.filter(f => f.isAssigned).length
  const unassignedCount = files.filter(f => !f.isAssigned).length

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Stack spacing={3}>
      {/* Stats */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}><ViewInAr /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{files.length}</Typography>
                  <Typography color="text.secondary">Toplam Model</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}><Check /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{assignedCount}</Typography>
                  <Typography color="text.secondary">Atanmış</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}><Close /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{unassignedCount}</Typography>
                  <Typography color="text.secondary">Atanmamış</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info */}
      <Alert severity="info" icon={<ViewInAr />}>
        GLB dosyaları Mac'teki Swift-CLI uygulaması ile oluşturulup yüklenir. Yüklenen dosyalar burada listelenir ve ürünlere atanabilir.
      </Alert>

      {/* CLI Instructions */}
      <Card>
        <CardHeader title="Swift-CLI Kullanımı" />
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: 14 }}>
              <Typography color="text.secondary" gutterBottom># 1. Sunucu yapılandır</Typography>
              <Typography>swift-cli config --server http://SUNUCU_IP:3001 --api-key API_KEY</Typography>
              <Typography color="text.secondary" gutterBottom sx={{ mt: 2 }}># 2. Fotoğraflardan 3D model oluştur</Typography>
              <Typography>swift-cli create --input ~/Photos/urun --output urun.glb</Typography>
              <Typography color="text.secondary" gutterBottom sx={{ mt: 2 }}># 3. Sunucuya yükle</Typography>
              <Typography>swift-cli upload urun.glb</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader title="3D Model Dosyaları" action={<Button startIcon={<Refresh />} onClick={loadFiles}>Yenile</Button>} />
        <CardContent>
          {files.length > 0 ? (
            <Stack spacing={2}>
              {files.map(file => (
                <Paper key={file.filename} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: file.isAssigned ? 'success.main' : 'grey.600' }}>
                      <ViewInAr />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>{file.filename}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {file.sizeFormatted} • {formatDate(file.uploadedAt)}
                      </Typography>
                    </Box>
                    {file.isAssigned ? (
                      <Chip label={`📦 ${file.assignedTo}`} color="success" variant="outlined" />
                    ) : (
                      <Chip label="Atanmamış" color="warning" variant="outlined" />
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ViewInAr sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Henüz 3D model yok</Typography>
              <Typography color="text.secondary">Swift-CLI ile model yükleyin</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}

// ==================== ANNOUNCEMENTS PAGE ====================
function AnnouncementsPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null })

  useEffect(() => {
    if (branchId) loadAnnouncements()
  }, [branchId])

  const loadAnnouncements = async () => {
    try {
      const res = await api.get(`/branches/${branchId}/announcements`)
      setAnnouncements(res.data)
    } catch (err) {
      showSnackbar('Duyurular yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (item) => {
    try {
      await api.put(`/announcements/${item.id}`, { isActive: !item.isActive })
      showSnackbar(item.isActive ? 'Duyuru gizlendi' : 'Duyuru yayınlandı', 'success')
      loadAnnouncements()
    } catch (err) {
      showSnackbar('İşlem başarısız', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/${deleteDialog.item.id}`)
      showSnackbar('Duyuru silindi', 'success')
      setDeleteDialog({ open: false, item: null })
      loadAnnouncements()
    } catch (err) {
      showSnackbar('Silme başarısız', 'error')
    }
  }

  const typeColors = { info: 'info', warning: 'warning', success: 'success', promo: 'error' }
  const typeLabels = { info: 'Bilgi', warning: 'Uyarı', success: 'Başarı', promo: 'Promosyon' }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography color="text.secondary">{announcements.length} duyuru</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>
          Yeni Duyuru
        </Button>
      </Stack>

      {/* Announcements List */}
      {announcements.length > 0 ? (
        <Grid container spacing={2}>
          {announcements.map(item => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card sx={{ opacity: item.isActive ? 1 : 0.6 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Typography variant="h2">{item.icon}</Typography>
                    <Box flex={1}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <Typography variant="h6" fontWeight={600}>{item.title}</Typography>
                        <Chip label={typeLabels[item.type]} size="small" color={typeColors[item.type]} />
                        {!item.isActive && <Chip label="Gizli" size="small" />}
                      </Stack>
                      <Typography color="text.secondary">{item.message}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleToggle(item)}>
                    {item.isActive ? 'Gizle' : 'Yayınla'}
                  </Button>
                  <Button size="small" startIcon={<Edit />} onClick={() => { setEditing(item); setModalOpen(true) }}>
                    Düzenle
                  </Button>
                  <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, item })}>
                    Sil
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Campaign sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Henüz duyuru yok</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => { setEditing(null); setModalOpen(true) }}>
            İlk Duyuruyu Ekle
          </Button>
        </Paper>
      )}

      {/* Announcement Modal */}
      <AnnouncementModal
        open={modalOpen}
        announcement={editing}
        branchId={branchId}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={() => { setModalOpen(false); setEditing(null); loadAnnouncements() }}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Duyuru Sil</DialogTitle>
        <DialogContent>
          <Typography>"{deleteDialog.item?.title}" duyurusunu silmek istediğinize emin misiniz?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

// ==================== ANNOUNCEMENT MODAL ====================
function AnnouncementModal({ open, announcement, branchId, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!announcement?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', icon: '📢', type: 'info', isActive: true })

  const icons = ['📢', '🎉', '🔥', '⚠️', '✅', '❌', '💰', '🎁', '🆕', '⭐', '❤️', '🍽️', '☕', '🍕', '🍔', '🎊']
  const types = [
    { value: 'info', label: 'Bilgi', color: 'info' },
    { value: 'warning', label: 'Uyarı', color: 'warning' },
    { value: 'success', label: 'Başarı', color: 'success' },
    { value: 'promo', label: 'Promosyon', color: 'error' }
  ]

  useEffect(() => {
    if (open) {
      if (announcement) {
        setForm({
          title: announcement.title || '',
          message: announcement.message || '',
          icon: announcement.icon || '📢',
          type: announcement.type || 'info',
          isActive: announcement.isActive !== false
        })
      } else {
        setForm({ title: '', message: '', icon: '📢', type: 'info', isActive: true })
      }
    }
  }, [open, announcement])

  const handleSubmit = async () => {
    if (!form.title || !form.message) {
      showSnackbar('Başlık ve mesaj zorunludur', 'error')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await api.put(`/announcements/${announcement.id}`, form)
      } else {
        await api.post(`/branches/${branchId}/announcements`, form)
      }
      showSnackbar(isEditing ? 'Duyuru güncellendi' : 'Duyuru oluşturuldu', 'success')
      onSave()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Duyuru Düzenle' : 'Yeni Duyuru'}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField fullWidth label="Başlık" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <TextField fullWidth label="Mesaj" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} multiline rows={3} required />
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>İkon</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {icons.map(icon => (
                <IconButton key={icon} onClick={() => setForm({ ...form, icon })}
                  sx={{ fontSize: 24, border: form.icon === icon ? 2 : 1, borderColor: form.icon === icon ? 'primary.main' : 'divider' }}>
                  {icon}
                </IconButton>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>Tip</Typography>
            <Stack direction="row" spacing={1}>
              {types.map(type => (
                <Chip
                  key={type.value}
                  label={type.label}
                  color={type.color}
                  variant={form.type === type.value ? 'filled' : 'outlined'}
                  onClick={() => setForm({ ...form, type: type.value })}
                />
              ))}
            </Stack>
          </Box>

          <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif (Menüde görünsün)" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== REVIEWS PAGE ====================
function ReviewsPage() {
  const { branchId } = useParams()
  const showSnackbar = useSnackbar()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0) // 0: Tümü, 1: Bekleyen, 2: Onaylı
  const [replyDialog, setReplyDialog] = useState({ open: false, review: null, text: '' })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, review: null })

  useEffect(() => {
    if (branchId) loadReviews()
  }, [branchId, tab])

  const loadReviews = async () => {
    try {
      const params = {}
      if (tab === 1) params.isApproved = 'false'
      if (tab === 2) params.isApproved = 'true'
      const res = await api.get(`/branches/${branchId}/reviews`, { params })
      setReviews(res.data.reviews || res.data)
    } catch (err) {
      showSnackbar('Yorumlar yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reviewId) => {
    try {
      await api.put(`/reviews/${reviewId}/approve`)
      showSnackbar('Yorum onaylandı', 'success')
      loadReviews()
    } catch (err) {
      showSnackbar('Onaylama başarısız', 'error')
    }
  }

  const handleReply = async () => {
    try {
      await api.put(`/reviews/${replyDialog.review.id}/reply`, { reply: replyDialog.text })
      showSnackbar('Yanıt gönderildi', 'success')
      setReplyDialog({ open: false, review: null, text: '' })
      loadReviews()
    } catch (err) {
      showSnackbar('Yanıt gönderilemedi', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/reviews/${deleteDialog.review.id}`)
      showSnackbar('Yorum silindi', 'success')
      setDeleteDialog({ open: false, review: null })
      loadReviews()
    } catch (err) {
      showSnackbar('Silme başarısız', 'error')
    }
  }

  const pendingCount = reviews.filter(r => !r.isApproved).length

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Stack spacing={3}>
      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(e, v) => { setTab(v); setLoading(true) }}>
          <Tab label="Tümü" />
          <Tab label={<Badge badgeContent={pendingCount} color="warning">Bekleyen</Badge>} />
          <Tab label="Onaylı" />
        </Tabs>
      </Card>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <Stack spacing={2}>
          {reviews.map(review => (
            <Card key={review.id}>
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{review.customerName?.[0] || 'A'}</Avatar>
                  <Box flex={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" fontWeight={600}>{review.customerName}</Typography>
                          <Rating value={review.rating} readOnly size="small" />
                          {!review.isApproved && <Chip label="Bekliyor" size="small" color="warning" />}
                        </Stack>
                        {review.productName && (
                          <Typography variant="caption" color="text.secondary">📦 {review.productName}</Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">{formatDate(review.createdAt)}</Typography>
                    </Stack>
                    
                    {review.comment && (
                      <Typography sx={{ mt: 1 }}>{review.comment}</Typography>
                    )}
                    
                    {review.contact && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>📞 {review.contact}</Typography>
                    )}

                    {/* Reply */}
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
              <CardActions>
                {!review.isApproved && (
                  <Button size="small" color="success" startIcon={<Check />} onClick={() => handleApprove(review.id)}>Onayla</Button>
                )}
                <Button size="small" startIcon={<Edit />} onClick={() => setReplyDialog({ open: true, review, text: review.reply || '' })}>
                  {review.reply ? 'Yanıtı Düzenle' : 'Yanıtla'}
                </Button>
                <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, review })}>Sil</Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <RateReview sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {tab === 1 ? 'Bekleyen yorum yok' : tab === 2 ? 'Onaylı yorum yok' : 'Henüz yorum yok'}
          </Typography>
        </Paper>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialog.open} onClose={() => setReplyDialog({ open: false, review: null, text: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Yoruma Yanıt Ver</DialogTitle>
        <DialogContent>
          {replyDialog.review && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3, mt: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Typography fontWeight={600}>{replyDialog.review.customerName}</Typography>
                <Rating value={replyDialog.review.rating} readOnly size="small" />
              </Stack>
              <Typography>{replyDialog.review.comment || 'Yorum yok'}</Typography>
            </Paper>
          )}
          <TextField
            fullWidth
            label="Yanıtınız"
            value={replyDialog.text}
            onChange={e => setReplyDialog({ ...replyDialog, text: e.target.value })}
            multiline
            rows={3}
            placeholder="Değerli yorumunuz için teşekkürler..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReplyDialog({ open: false, review: null, text: '' })}>İptal</Button>
          <Button onClick={handleReply} variant="contained" disabled={!replyDialog.text.trim()}>Yanıtla</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, review: null })}>
        <DialogTitle>Yorum Sil</DialogTitle>
        <DialogContent>
          <Typography>Bu yorumu silmek istediğinize emin misiniz?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, review: null })}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
// ==================== BRANCHES PAGE (SuperAdmin) ====================
function BranchesPage() {
  const { user } = useAuth()
  const showSnackbar = useSnackbar()
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, branch: null })

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const res = await api.get('/branches')
      setBranches(res.data)
    } catch (err) {
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
      showSnackbar('Silme başarısız', 'error')
    }
  }

  const handleImageUpload = async (branchId, file, type) => {
    try {
      if (isHeicFile(file)) file = await convertHeicToJpg(file)
      const formData = new FormData()
      formData.append('image', file)
      await api.post(`/branches/${branchId}/image?type=${type}`, formData)
      showSnackbar('Görsel yüklendi', 'success')
      loadBranches()
    } catch (err) {
      showSnackbar('Yükleme başarısız', 'error')
    }
  }

  if (user?.role !== 'superadmin') {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <Typography color="error">Bu sayfaya erişim yetkiniz yok.</Typography>
      </Paper>
    )
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h5" fontWeight={700}>Şubeler</Typography>
          <Typography color="text.secondary">{branches.length} şube</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>
          Yeni Şube
        </Button>
      </Stack>

      {/* Branches Grid */}
      <Grid container spacing={3}>
        {branches.map(branch => (
          <Grid item xs={12} sm={6} md={4} key={branch.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Image */}
              <Box sx={{ position: 'relative', pt: '50%', bgcolor: 'background.default' }}>
                {branch.image ? (
                  <CardMedia
                    component="img"
                    image={`${FILES_URL}/uploads/images/${branch.image}`}
                    alt={branch.name}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Store sx={{ fontSize: 64, color: 'text.secondary' }} />
                  </Box>
                )}
                {/* Upload Button */}
                <IconButton
                  component="label"
                  sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                >
                  <Image sx={{ color: 'white' }} />
                  <input type="file" hidden accept="image/*,.heic" onChange={e => e.target.files[0] && handleImageUpload(branch.id, e.target.files[0], 'image')} />
                </IconButton>
                {/* Status */}
                <Chip
                  label={branch.isActive ? 'Aktif' : 'Pasif'}
                  size="small"
                  color={branch.isActive ? 'success' : 'default'}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                />
                {/* Logo */}
                {branch.logo && (
                  <Avatar
                    src={`${FILES_URL}/uploads/images/${branch.logo}`}
                    sx={{ position: 'absolute', bottom: -24, left: 16, width: 48, height: 48, border: '3px solid', borderColor: 'background.paper' }}
                  />
                )}
              </Box>

              {/* Content */}
              <CardContent sx={{ flex: 1, pt: branch.logo ? 4 : 2 }}>
                <Typography variant="h6" fontWeight={700}>{branch.name}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">/{branch.slug}</Typography>
                {branch.address && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>📍 {branch.address}</Typography>
                )}
                {branch.phone && (
                  <Typography variant="body2" color="text.secondary">📞 {branch.phone}</Typography>
                )}
                <Chip label={`${branch.productCount || 0} ürün`} size="small" sx={{ mt: 1 }} />
              </CardContent>

              {/* Actions */}
              <CardActions>
                <Button size="small" onClick={() => navigate(`/admin/branch/${branch.id}/dashboard`)}>
                  Panele Git
                </Button>
                <Button size="small" startIcon={<Edit />} onClick={() => { setEditing(branch); setModalOpen(true) }}>
                  Düzenle
                </Button>
                <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, branch })}>
                  Sil
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {branches.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Store sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Henüz şube yok</Typography>
              <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => { setEditing(null); setModalOpen(true) }}>
                İlk Şubeyi Ekle
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Branch Modal */}
      <BranchModal
        open={modalOpen}
        branch={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={() => { setModalOpen(false); setEditing(null); loadBranches() }}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, branch: null })}>
        <DialogTitle>Şube Sil</DialogTitle>
        <DialogContent>
          <Typography>"{deleteDialog.branch?.name}" şubesini silmek istediğinize emin misiniz?</Typography>
          <Alert severity="error" sx={{ mt: 2 }}>Bu şubeye ait tüm ürünler, kategoriler ve yorumlar da silinecek!</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, branch: null })}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

// ==================== BRANCH MODAL ====================
function BranchModal({ open, branch, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!branch?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', slug: '', description: '', address: '', phone: '', whatsapp: '', instagram: '', workingHours: '', isActive: true
  })

  useEffect(() => {
    if (open) {
      if (branch) {
        setForm({
          name: branch.name || '',
          slug: branch.slug || '',
          description: branch.description || '',
          address: branch.address || '',
          phone: branch.phone || '',
          whatsapp: branch.whatsapp || '',
          instagram: branch.instagram || '',
          workingHours: branch.workingHours || '',
          isActive: branch.isActive !== false
        })
      } else {
        setForm({ name: '', slug: '', description: '', address: '', phone: '', whatsapp: '', instagram: '', workingHours: '', isActive: true })
      }
    }
  }, [open, branch])

  const handleSubmit = async () => {
    if (!form.name) {
      showSnackbar('Şube adı zorunludur', 'error')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await api.put(`/branches/${branch.id}`, form)
      } else {
        await api.post('/branches', form)
      }
      showSnackbar(isEditing ? 'Şube güncellendi' : 'Şube oluşturuldu', 'success')
      onSave()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? 'Şube Düzenle' : 'Yeni Şube'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField fullWidth label="Şube Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <TextField fullWidth label="URL Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="otomatik-olusturulur" helperText="Boş bırakırsanız otomatik oluşturulur" />
              <TextField fullWidth label="Açıklama" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={3} />
              <TextField fullWidth label="Adres" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField fullWidth label="Telefon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <TextField fullWidth label="WhatsApp" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
              <TextField fullWidth label="Instagram" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@kullaniciadi" />
              <TextField fullWidth label="Çalışma Saatleri" value={form.workingHours} onChange={e => setForm({ ...form, workingHours: e.target.value })} placeholder="09:00 - 22:00" />
              <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Aktif (Menüde görünsün)" />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== USERS PAGE (SuperAdmin) ====================
function UsersPage() {
  const { user: currentUser } = useAuth()
  const showSnackbar = useSnackbar()
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        api.get('/users'),
        api.get('/branches')
      ])
      setUsers(usersRes.data)
      setBranches(branchesRes.data)
    } catch (err) {
      showSnackbar('Veriler yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive })
      showSnackbar(user.isActive ? 'Kullanıcı pasifleştirildi' : 'Kullanıcı aktifleştirildi', 'success')
      loadData()
    } catch (err) {
      showSnackbar('İşlem başarısız', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteDialog.user.id}`)
      showSnackbar('Kullanıcı silindi', 'success')
      setDeleteDialog({ open: false, user: null })
      loadData()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Silme başarısız', 'error')
    }
  }

  const roleColors = { superadmin: 'error', admin: 'warning', manager: 'info', staff: 'default' }
  const roleLabels = { superadmin: 'Süper Admin', admin: 'Admin', manager: 'Yönetici', staff: 'Personel' }

  if (currentUser?.role !== 'superadmin') {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <Typography color="error">Bu sayfaya erişim yetkiniz yok.</Typography>
      </Paper>
    )
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h5" fontWeight={700}>Kullanıcılar</Typography>
          <Typography color="text.secondary">{users.length} kullanıcı</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setModalOpen(true) }}>
          Yeni Kullanıcı
        </Button>
      </Stack>

      {/* Users Grid */}
      <Grid container spacing={2}>
        {users.map(user => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card sx={{ opacity: user.isActive ? 1 : 0.6 }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    {user.fullName?.[0] || user.username?.[0] || 'U'}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight={600}>{user.fullName || user.username}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">@{user.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                  <Chip label={roleLabels[user.role]} size="small" color={roleColors[user.role]} />
                  {!user.isActive && <Chip label="Pasif" size="small" />}
                </Stack>
                {user.branches?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">Şubeler:</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {user.branches.map(b => (
                        <Chip key={b._id || b.id} label={b.name} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
                {user.lastLogin && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Son giriş: {formatDate(user.lastLogin)}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleToggleActive(user)} disabled={user.id === currentUser.id}>
                  {user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                </Button>
                <Button size="small" startIcon={<Edit />} onClick={() => { setEditing(user); setModalOpen(true) }}>
                  Düzenle
                </Button>
                <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, user })} disabled={user.id === currentUser.id}>
                  Sil
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* User Modal */}
      <UserModal
        open={modalOpen}
        user={editing}
        branches={branches}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={() => { setModalOpen(false); setEditing(null); loadData() }}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
        <DialogTitle>Kullanıcı Sil</DialogTitle>
        <DialogContent>
          <Typography>"{deleteDialog.user?.username}" kullanıcısını silmek istediğinize emin misiniz?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

// ==================== USER MODAL ====================
function UserModal({ open, user, branches, onClose, onSave }) {
  const showSnackbar = useSnackbar()
  const isEditing = !!user?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', role: 'staff', branches: [], isActive: true
  })

  const roles = [
    { value: 'superadmin', label: 'Süper Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Yönetici' },
    { value: 'staff', label: 'Personel' }
  ]

  useEffect(() => {
    if (open) {
      if (user) {
        setForm({
          username: user.username || '',
          email: user.email || '',
          password: '',
          fullName: user.fullName || '',
          role: user.role || 'staff',
          branches: user.branches?.map(b => b._id || b.id) || [],
          isActive: user.isActive !== false
        })
      } else {
        setForm({ username: '', email: '', password: '', fullName: '', role: 'staff', branches: [], isActive: true })
      }
    }
  }, [open, user])

  const handleSubmit = async () => {
    if (!form.username || !form.email) {
      showSnackbar('Kullanıcı adı ve email zorunludur', 'error')
      return
    }
    if (!isEditing && !form.password) {
      showSnackbar('Yeni kullanıcı için şifre zorunludur', 'error')
      return
    }

    setSaving(true)
    try {
      const data = { ...form }
      if (!data.password) delete data.password

      if (isEditing) {
        await api.put(`/users/${user.id}`, data)
      } else {
        await api.post('/users', data)
      }
      showSnackbar(isEditing ? 'Kullanıcı güncellendi' : 'Kullanıcı oluşturuldu', 'success')
      onSave()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField fullWidth label="Kullanıcı Adı" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          <TextField fullWidth label="E-posta" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <TextField fullWidth label="Ad Soyad" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
          <TextField fullWidth label={isEditing ? 'Şifre (değiştirmek için girin)' : 'Şifre'} type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required={!isEditing} />
          
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select value={form.role} label="Rol" onChange={e => setForm({ ...form, role: e.target.value })}>
              {roles.map(role => (
                <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.role !== 'superadmin' && (
            <FormControl fullWidth>
              <InputLabel>Erişebileceği Şubeler</InputLabel>
              <Select
                multiple
                value={form.branches}
                label="Erişebileceği Şubeler"
                onChange={e => setForm({ ...form, branches: e.target.value })}
                renderValue={(selected) => (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {selected.map(id => {
                      const branch = branches.find(b => b.id === id)
                      return <Chip key={id} label={branch?.name || id} size="small" />
                    })}
                  </Stack>
                )}
              >
                {branches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

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

// ==================== MENU PAGE (Public - Müşteri Menüsü) ====================
function MenuPage() {
  const { slug } = useParams()
  const [branch, setBranch] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    loadMenu()
  }, [slug])

  const loadMenu = async () => {
    try {
      const [branchRes, categoriesRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/public/branches/${slug}`),
        axios.get(`${API_URL}/public/branches/${slug}/categories`),
        axios.get(`${API_URL}/public/branches/${slug}/products`)
      ])
      setBranch(branchRes.data)
      setCategories(categoriesRes.data)
      setProducts(productsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category?.id === selectedCategory)
    : products

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0a0a0a' }}><CircularProgress /></Box>
  }

  if (!branch) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#0a0a0a', p: 3 }}>
        <Typography variant="h5" color="white">Şube bulunamadı</Typography>
        <Button component={Link} to="/" sx={{ mt: 2 }}>Ana Sayfa</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>
      {/* Header */}
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {branch.banner ? (
          <Box component="img" src={`${FILES_URL}/uploads/images/${branch.banner}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ width: '100%', height: '100%', bgcolor: 'primary.main' }} />
        )}
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            {branch.logo && <Avatar src={`${FILES_URL}/uploads/images/${branch.logo}`} sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }} />}
            <Typography variant="h4" fontWeight={700} color="white">{branch.name}</Typography>
            {branch.description && <Typography color="white" sx={{ opacity: 0.8 }}>{branch.description}</Typography>}
          </Box>
        </Box>
        <Button component={Link} to="/" sx={{ position: 'absolute', top: 16, left: 16, color: 'white' }}>← Şubeler</Button>
      </Box>

      {/* Categories */}
      {categories.length > 0 && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
            <Chip label="Tümü" onClick={() => setSelectedCategory(null)} color={!selectedCategory ? 'primary' : 'default'} />
            {categories.map(cat => (
              <Chip
                key={cat.id}
                label={`${cat.icon} ${cat.name}`}
                onClick={() => setSelectedCategory(cat.id)}
                color={selectedCategory === cat.id ? 'primary' : 'default'}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Products */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {filteredProducts.map(product => (
            <Grid item xs={6} sm={4} md={3} key={product.id}>
              <Card>
                <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'background.default' }}>
                  {product.thumbnail ? (
                    <CardMedia component="img" image={`${FILES_URL}/uploads/images/${product.thumbnail}`} alt={product.name}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Restaurant sx={{ fontSize: 48, color: 'text.secondary' }} />
                    </Box>
                  )}
                  {product.hasGlb && <Chip label="3D" size="small" color="info" sx={{ position: 'absolute', top: 8, right: 8 }} icon={<ViewInAr />} />}
                </Box>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" noWrap>{product.name}</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight={700}>₺{product.isCampaign && product.campaignPrice ? product.campaignPrice : product.price}</Typography>
                  {product.isCampaign && product.campaignPrice && (
                    <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>₺{product.price}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  )
}

// ==================== APP COMPONENT ====================
function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider>
        <AuthProvider>
          <BranchProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<BranchSelectionPage />} />
              <Route path="/menu/:slug" element={<MenuPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout><Navigate to="/admin/branches" replace /></AdminLayout>} />
              <Route path="/admin/branches" element={<AdminLayout><BranchesPage /></AdminLayout>} />
              <Route path="/admin/users" element={<AdminLayout><UsersPage /></AdminLayout>} />
              
              {/* Branch Specific Routes */}
              <Route path="/admin/branch/:branchId/dashboard" element={<AdminLayout><DashboardPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/products" element={<AdminLayout><ProductsPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/categories" element={<AdminLayout><CategoriesPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/glb" element={<AdminLayout><GlbFilesPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/announcements" element={<AdminLayout><AnnouncementsPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/reviews" element={<AdminLayout><ReviewsPage /></AdminLayout>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BranchProvider>
        </AuthProvider>
      </SnackbarProvider>
    </BrowserRouter>
  )
}

export default App