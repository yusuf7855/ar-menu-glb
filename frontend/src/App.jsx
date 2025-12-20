import { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ThemeProvider, createTheme, CssBaseline,
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Divider,
  List, ListItem, ListItemIcon, ListItemText, ListItemButton,
  Button, Stack, Chip, Tooltip, Alert, Snackbar, CircularProgress,
  useMediaQuery, alpha
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard, Restaurant, Category, ViewInAr, Campaign, RateReview,
  Settings, People, Logout, Store, Check, DarkMode, LightMode, ExpandMore, Preview
} from '@mui/icons-material'

// Pages
import {
  DashboardPage, ProductsPage, CategoriesPage, CategoryLayoutPage,
  GlbFilesPage, AnnouncementsPage, ReviewsPage, BranchSettingsPage,
  BranchesPage, UsersPage
} from './AdminPages'
import { LoginPage, BranchSelectionPage, MenuPage } from './PublicPages'

// ==================== CONFIG ====================
export const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.134:3001/api'
export const FILES_URL = import.meta.env.VITE_FILES_URL || 'http://192.168.1.134:3001'

// ==================== AXIOS ====================
export const api = axios.create({ baseURL: API_URL })
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

// ==================== HELPERS ====================
export const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const formatPrice = (price) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price || 0)
}

export const formatRelativeTime = (date) => {
  if (!date) return '-'
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'Az önce'
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`
  return formatDate(date)
}

export const getImageUrl = (filename) => {
  if (!filename) return null
  if (filename.startsWith('http')) return filename
  return `${FILES_URL}/uploads/images/${filename}`
}

export const getGlbUrl = (filename) => {
  if (!filename) return null
  return `${FILES_URL}/outputs/${filename}`
}

export const isHeicFile = (file) => file?.name?.toLowerCase().endsWith('.heic') || file?.type === 'image/heic'

export const convertHeicToJpg = async (file) => {
  try {
    const heic2any = (await import('heic2any')).default
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    return new File([Array.isArray(blob) ? blob[0] : blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
  } catch (err) {
    console.error('HEIC conversion error:', err)
    return file
  }
}

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
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } }
  }
})

// ==================== SNACKBAR PROVIDER ====================
function SnackbarProvider({ children }) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      {children}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" elevation={6}>{snackbar.message}</Alert>
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

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentBranch')
    setUser(null)
  }

  const setup = async (data) => {
    const res = await api.post('/auth/setup', data)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0a0a0a' }}>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress color="primary" size={60} />
        <Typography color="text.secondary">Yükleniyor...</Typography>
      </Stack>
    </Box>
  )

  return <AuthContext.Provider value={{ user, login, logout, setup, checkAuth }}>{children}</AuthContext.Provider>
}

// ==================== BRANCH PROVIDER ====================
function BranchProvider({ children }) {
  const [currentBranch, setCurrentBranch] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)

  const loadBranches = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/branches')
      setBranches(res.data)
      if (res.data.length > 0 && !currentBranch) {
        const saved = localStorage.getItem('currentBranch')
        const found = res.data.find(b => b.id === saved)
        if (found) setCurrentBranch(found)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [currentBranch])

  const selectBranch = useCallback((branch) => {
    setCurrentBranch(branch)
    localStorage.setItem('currentBranch', branch.id)
  }, [])

  const refreshBranch = useCallback(async () => {
    if (!currentBranch) return
    try {
      const res = await api.get(`/branches/${currentBranch.id}`)
      setCurrentBranch(res.data)
    } catch (err) { console.error(err) }
  }, [currentBranch])

  return (
    <BranchContext.Provider value={{ currentBranch, branches, loadBranches, selectBranch, setCurrentBranch, refreshBranch, loading }}>
      {children}
    </BranchContext.Provider>
  )
}

// ==================== SIDEBAR ====================
const drawerWidth = 280

const menuItems = [
  { path: 'dashboard', icon: <Dashboard />, label: 'Dashboard' },
  { path: 'products', icon: <Restaurant />, label: 'Ürünler' },
  { path: 'categories', icon: <Category />, label: 'Kategoriler' },
  { path: 'category-layout', icon: <Settings />, label: 'Kategori Düzeni' },
  { path: 'glb', icon: <ViewInAr />, label: '3D Modeller' },
  { path: 'announcements', icon: <Campaign />, label: 'Duyurular' },
  { path: 'reviews', icon: <RateReview />, label: 'Yorumlar' },
  { path: 'settings', icon: <Settings />, label: 'Şube Ayarları' },
]

const superAdminItems = [
  { path: '/admin/branches', icon: <Store />, label: 'Şubeler' },
  { path: '/admin/users', icon: <People />, label: 'Kullanıcılar' },
]

function Sidebar({ open, onClose, isMobile }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { currentBranch, branches, selectBranch } = useBranch()
  const [branchMenuAnchor, setBranchMenuAnchor] = useState(null)

  const handleLogout = () => { logout(); navigate('/login') }

  const handleBranchChange = (branch) => {
    selectBranch(branch)
    setBranchMenuAnchor(null)
    navigate(`/admin/branch/${branch.id}/dashboard`)
  }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Restaurant sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>AR Menu</Typography>
            <Typography variant="caption" color="text.secondary">Yönetim Paneli</Typography>
          </Box>
        </Stack>
      </Box>

      {/* Branch Selector */}
      {branches.length > 0 && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Aktif Şube</Typography>
          <Button fullWidth variant="outlined" onClick={(e) => setBranchMenuAnchor(e.currentTarget)} endIcon={<ExpandMore />}
            sx={{ justifyContent: 'space-between', py: 1.5, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}><Store sx={{ fontSize: 16 }} /></Avatar>
              <Typography noWrap sx={{ maxWidth: 140 }}>{currentBranch?.name || 'Şube Seç'}</Typography>
            </Stack>
          </Button>
          <Menu anchorEl={branchMenuAnchor} open={Boolean(branchMenuAnchor)} onClose={() => setBranchMenuAnchor(null)} PaperProps={{ sx: { width: 250, maxHeight: 400 } }}>
            {branches.map(branch => (
              <MenuItem key={branch.id} onClick={() => handleBranchChange(branch)} selected={currentBranch?.id === branch.id} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <Avatar sx={{ width: 32, height: 32 }} src={branch.logo ? getImageUrl(branch.logo) : undefined}><Store fontSize="small" /></Avatar>
                </ListItemIcon>
                <ListItemText primary={branch.name} secondary={`${branch.productCount || 0} ürün`} />
                {currentBranch?.id === branch.id && <Check fontSize="small" color="primary" />}
              </MenuItem>
            ))}
            <Divider sx={{ my: 1 }} />
            <MenuItem component={Link} to="/admin/branches" onClick={() => setBranchMenuAnchor(null)}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
              <ListItemText primary="Şubeleri Yönet" />
            </MenuItem>
          </Menu>
        </Box>
      )}

      {/* Menu Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List sx={{ px: 2 }}>
          {currentBranch && menuItems.map(item => {
            const fullPath = `/admin/branch/${currentBranch.id}/${item.path}`
            const isActive = location.pathname === fullPath
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton component={Link} to={fullPath} selected={isActive} onClick={() => isMobile && onClose()}
                  sx={{ borderRadius: 2, py: 1.5, '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '& .MuiListItemIcon-root': { color: 'white' } } }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }} />
                </ListItemButton>
              </ListItem>
            )
          })}

          {user?.role === 'superadmin' && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}>SİSTEM YÖNETİMİ</Typography>
              {superAdminItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton component={Link} to={item.path} selected={isActive} onClick={() => isMobile && onClose()}
                      sx={{ borderRadius: 2, py: 1.5, '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '& .MuiListItemIcon-root': { color: 'white' } } }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }} />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </>
          )}
        </List>
      </Box>

      {/* Preview Button */}
      {currentBranch && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Button fullWidth variant="outlined" component={Link} to={`/menu/${currentBranch.slug}`} target="_blank" startIcon={<Preview />} sx={{ borderColor: 'divider' }}>
            Menüyü Önizle
          </Button>
        </Box>
      )}

      {/* User */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>{user?.fullName?.[0] || user?.username?.[0] || 'A'}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>{user?.fullName || user?.username}</Typography>
            <Chip label={user?.role === 'superadmin' ? 'Süper Admin' : user?.role} size="small" color={user?.role === 'superadmin' ? 'error' : 'default'} sx={{ height: 20, fontSize: 10 }} />
          </Box>
          <Tooltip title="Çıkış Yap">
            <IconButton onClick={handleLogout} size="small" color="error"><Logout fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  )

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {isMobile ? (
        <Drawer variant="temporary" open={open} onClose={onClose} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}>{drawer}</Drawer>
      ) : (
        <Drawer variant="permanent" sx={{ '& .MuiDrawer-paper': { width: drawerWidth, borderRight: 1, borderColor: 'divider' } }} open>{drawer}</Drawer>
      )}
    </Box>
  )
}

// ==================== ADMIN LAYOUT ====================
function AdminLayout({ children }) {
  const { user } = useAuth()
  const { loadBranches, currentBranch, branches, selectBranch } = useBranch()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width:900px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false')

  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode])

  useEffect(() => { if (user) loadBranches() }, [user])

  useEffect(() => {
    if (branches.length > 0 && !currentBranch && location.pathname === '/admin') {
      const firstBranch = branches[0]
      selectBranch(firstBranch)
      navigate(`/admin/branch/${firstBranch.id}/dashboard`)
    }
  }, [branches, currentBranch, location.pathname])

  const toggleDarkMode = () => { setDarkMode(!darkMode); localStorage.setItem('darkMode', (!darkMode).toString()) }

  if (!user) return <Navigate to="/login" replace />

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return 'Dashboard'
    if (path.includes('/products')) return 'Ürünler'
    if (path.includes('/categories')) return 'Kategoriler'
    if (path.includes('/category-layout')) return 'Kategori Düzeni'
    if (path.includes('/glb')) return '3D Modeller'
    if (path.includes('/announcements')) return 'Duyurular'
    if (path.includes('/reviews')) return 'Yorumlar'
    if (path.includes('/settings')) return 'Şube Ayarları'
    if (path.includes('/branches')) return 'Şubeler'
    if (path.includes('/users')) return 'Kullanıcılar'
    return 'AR Menu Admin'
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Toolbar>
              {isMobile && <IconButton edge="start" onClick={() => setSidebarOpen(true)} sx={{ mr: 2 }}><MenuIcon /></IconButton>}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>{getPageTitle()}</Typography>
                {currentBranch && <Typography variant="caption" color="text.secondary">{currentBranch.name}</Typography>}
              </Box>
              <Tooltip title={darkMode ? 'Açık Mod' : 'Koyu Mod'}>
                <IconButton onClick={toggleDarkMode}>{darkMode ? <LightMode /> : <DarkMode />}</IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flex: 1, p: 3, bgcolor: 'background.default', overflow: 'auto' }}>{children}</Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

// ==================== APP ====================
function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider>
        <AuthProvider>
          <BranchProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<BranchSelectionPage />} />
              <Route path="/menu/:slug" element={<MenuPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminLayout><Navigate to="/admin/branches" replace /></AdminLayout>} />
              <Route path="/admin/branches" element={<AdminLayout><BranchesPage /></AdminLayout>} />
              <Route path="/admin/users" element={<AdminLayout><UsersPage /></AdminLayout>} />

              {/* Branch Routes */}
              <Route path="/admin/branch/:branchId/dashboard" element={<AdminLayout><DashboardPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/products" element={<AdminLayout><ProductsPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/categories" element={<AdminLayout><CategoriesPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/category-layout" element={<AdminLayout><CategoryLayoutPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/glb" element={<AdminLayout><GlbFilesPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/announcements" element={<AdminLayout><AnnouncementsPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/reviews" element={<AdminLayout><ReviewsPage /></AdminLayout>} />
              <Route path="/admin/branch/:branchId/settings" element={<AdminLayout><BranchSettingsPage /></AdminLayout>} />

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