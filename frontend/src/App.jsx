import { useState, useEffect, createContext, useContext, useMemo, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ThemeProvider, createTheme, CssBaseline,
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Divider,
  List, ListItem, ListItemIcon, ListItemText, ListItemButton,
  Button, Stack, Chip, Tooltip, Alert, Snackbar, CircularProgress, Paper,
  useMediaQuery, alpha
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard, Restaurant, Category, ViewInAr, Campaign, RateReview,
  Settings, People, Logout, Store, Check, DarkMode, LightMode, ExpandMore, Preview,
  Phone, Refresh, Place, Add, LocalOffer
} from '@mui/icons-material'

// ==================== CONFIG ====================
export const API_URL = 'http://localhost:3001/api'
export const FILES_URL = 'http://localhost:3001'

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
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/login'
    }
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
    localStorage.removeItem('currentSection')
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

// ==================== BRANCH PROVIDER (with Sections) ====================
function BranchProvider({ children }) {
  const [currentBranch, setCurrentBranch] = useState(null)
  const [branches, setBranches] = useState([])
  const [currentSection, setCurrentSection] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(false)

  // Load branches
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

  // Load sections for current branch
  const loadSections = useCallback(async (branchId) => {
    if (!branchId) {
      setSections([])
      setCurrentSection(null)
      return
    }
    try {
      const res = await api.get(`/branches/${branchId}/sections`)
      setSections(res.data || [])
      
      // Restore saved section or select first one
      const savedSection = localStorage.getItem('currentSection')
      const found = res.data.find(s => s.id === savedSection)
      if (found) {
        setCurrentSection(found)
      } else if (res.data.length > 0) {
        setCurrentSection(res.data[0])
        localStorage.setItem('currentSection', res.data[0].id)
      } else {
        setCurrentSection(null)
        localStorage.removeItem('currentSection')
      }
    } catch (err) { 
      console.error(err)
      setSections([])
      setCurrentSection(null)
    }
  }, [])

  // When branch changes, load its sections
  useEffect(() => {
    if (currentBranch?.id) {
      loadSections(currentBranch.id)
    } else {
      setSections([])
      setCurrentSection(null)
    }
  }, [currentBranch?.id, loadSections])

  const selectBranch = useCallback((branch) => {
    setCurrentBranch(branch)
    setCurrentSection(null) // Reset section when branch changes
    setSections([])
    localStorage.setItem('currentBranch', branch.id)
    localStorage.removeItem('currentSection')
  }, [])

  const selectSection = useCallback((section) => {
    setCurrentSection(section)
    if (section) {
      localStorage.setItem('currentSection', section.id)
    } else {
      localStorage.removeItem('currentSection')
    }
  }, [])

  const refreshBranch = useCallback(async () => {
    if (!currentBranch) return
    try {
      const res = await api.get(`/branches/${currentBranch.id}`)
      setCurrentBranch(res.data)
    } catch (err) { console.error(err) }
  }, [currentBranch])

  const refreshSections = useCallback(async () => {
    if (currentBranch?.id) {
      await loadSections(currentBranch.id)
    }
  }, [currentBranch?.id, loadSections])

  return (
    <BranchContext.Provider value={{ 
      currentBranch, branches, loadBranches, selectBranch, setCurrentBranch, refreshBranch, 
      currentSection, sections, selectSection, setCurrentSection, refreshSections, loadSections,
      loading 
    }}>
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
]

const branchSettingsItems = [
  { path: 'sections', icon: <Place />, label: 'Bölümler' },
  { path: 'tags', icon: <LocalOffer />, label: 'Etiketler' },
  { path: 'settings', icon: <Settings />, label: 'Şube Ayarları' },
]

const superAdminItems = [
  { path: '/admin/restaurants', icon: <Restaurant />, label: 'Restoranlar' },
]

function Sidebar({ open, onClose, isMobile }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { currentBranch, branches, selectBranch, currentSection, sections, selectSection, refreshSections } = useBranch()
  const [branchMenuAnchor, setBranchMenuAnchor] = useState(null)
  const [sectionMenuAnchor, setSectionMenuAnchor] = useState(null)

  const handleLogout = () => { logout(); navigate('/login') }

  const handleBranchChange = (branch) => {
    selectBranch(branch)
    setBranchMenuAnchor(null)
    // Şube seçilince bölüm seçim sayfasına git
    navigate(`/admin/branch/${branch.id}/select-section`)
  }

  const handleSectionChange = (section) => {
    selectSection(section)
    setSectionMenuAnchor(null)
    if (currentBranch && section) {
      navigate(`/admin/branch/${currentBranch.id}/section/${section.id}/dashboard`)
    }
  }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
            <Restaurant />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>AR Menu</Typography>
            <Typography variant="caption" color="text.secondary">Yönetim Paneli</Typography>
          </Box>
        </Stack>
      </Box>

      {/* Branch Selector */}
      {branches.length > 0 && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
            ŞUBE
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            onClick={(e) => setBranchMenuAnchor(e.currentTarget)}
            endIcon={<ExpandMore />}
            sx={{ justifyContent: 'space-between', textAlign: 'left', py: 1.5, borderColor: 'divider' }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ overflow: 'hidden' }}>
              <Avatar src={currentBranch?.logo ? getImageUrl(currentBranch.logo) : undefined} sx={{ width: 28, height: 28 }}>
                <Store fontSize="small" />
              </Avatar>
              <Typography noWrap fontWeight={600}>{currentBranch?.name || 'Şube Seç'}</Typography>
            </Stack>
          </Button>
          <Menu anchorEl={branchMenuAnchor} open={Boolean(branchMenuAnchor)} onClose={() => setBranchMenuAnchor(null)} PaperProps={{ sx: { width: 260, maxHeight: 400 } }}>
            {branches.map(branch => (
              <MenuItem key={branch.id} onClick={() => handleBranchChange(branch)} selected={currentBranch?.id === branch.id}>
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

      {/* Section Selector - Sadece şube seçiliyse ve bölümler varsa göster */}
      {currentBranch && sections.length > 0 && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
            BÖLÜM
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            onClick={(e) => setSectionMenuAnchor(e.currentTarget)}
            endIcon={<ExpandMore />}
            sx={{ 
              justifyContent: 'space-between', 
              textAlign: 'left', 
              py: 1.5, 
              borderColor: currentSection?.color || 'divider',
              bgcolor: currentSection?.color ? alpha(currentSection.color, 0.1) : 'transparent'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ overflow: 'hidden' }}>
              <Typography fontSize={20}>{currentSection?.icon || '📍'}</Typography>
              <Typography noWrap fontWeight={600}>{currentSection?.name || 'Bölüm Seç'}</Typography>
            </Stack>
          </Button>
          <Menu anchorEl={sectionMenuAnchor} open={Boolean(sectionMenuAnchor)} onClose={() => setSectionMenuAnchor(null)} PaperProps={{ sx: { width: 260, maxHeight: 400 } }}>
            {sections.filter(s => s.isActive).map(section => (
              <MenuItem 
                key={section.id} 
                onClick={() => handleSectionChange(section)} 
                selected={currentSection?.id === section.id}
                sx={{ 
                  bgcolor: currentSection?.id === section.id ? alpha(section.color || '#e53935', 0.1) : 'transparent'
                }}
              >
                <ListItemIcon>
                  <Typography fontSize={24}>{section.icon}</Typography>
                </ListItemIcon>
                <ListItemText 
                  primary={section.name} 
                  secondary={`${section.productCount || 0} ürün`} 
                />
                {currentSection?.id === section.id && <Check fontSize="small" color="primary" />}
              </MenuItem>
            ))}
            <Divider sx={{ my: 1 }} />
            <MenuItem component={Link} to={`/admin/branch/${currentBranch.id}/sections`} onClick={() => setSectionMenuAnchor(null)}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
              <ListItemText primary="Bölümleri Yönet" />
            </MenuItem>
          </Menu>
        </Box>
      )}

      {/* No Sections Message */}
      {currentBranch && sections.length === 0 && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Alert severity="info" sx={{ mb: 1 }}>
            Henüz bölüm oluşturulmamış
          </Alert>
          <Button 
            fullWidth 
            variant="outlined" 
            startIcon={<Add />}
            component={Link}
            to={`/admin/branch/${currentBranch.id}/sections`}
            onClick={() => isMobile && onClose()}
          >
            Bölüm Ekle
          </Button>
        </Box>
      )}

      {/* Menu Items - Sadece bölüm seçiliyse göster */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List sx={{ px: 2 }}>
          {currentBranch && currentSection && menuItems.map(item => {
            const fullPath = `/admin/branch/${currentBranch.id}/section/${currentSection.id}/${item.path}`
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
                    py: 1.5, 
                    '&.Mui-selected': { 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      '&:hover': { bgcolor: 'primary.dark' }, 
                      '& .MuiListItemIcon-root': { color: 'white' } 
                    } 
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }} />
                </ListItemButton>
              </ListItem>
            )
          })}

          {/* Şube Ayarları - Bölüm seçili olmasa bile göster */}
          {currentBranch && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}>
                ŞUBE AYARLARI
              </Typography>
              {branchSettingsItems.map(item => {
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
                        py: 1.5, 
                        '&.Mui-selected': { 
                          bgcolor: 'primary.main', 
                          color: 'white', 
                          '&:hover': { bgcolor: 'primary.dark' }, 
                          '& .MuiListItemIcon-root': { color: 'white' } 
                        } 
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }} />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </>
          )}

          {/* Super Admin Items */}
          {user?.role === 'superadmin' && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}>
                SİSTEM YÖNETİMİ
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
                        py: 1.5, 
                        '&.Mui-selected': { 
                          bgcolor: 'primary.main', 
                          color: 'white', 
                          '&:hover': { bgcolor: 'primary.dark' }, 
                          '& .MuiListItemIcon-root': { color: 'white' } 
                        } 
                      }}
                    >
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
      {currentBranch && currentSection && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            component={Link} 
            to={`/menu/${currentBranch.slug}?section=${currentSection.slug}`} 
            target="_blank" 
            startIcon={<Preview />} 
            sx={{ borderColor: 'divider' }}
          >
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

// ==================== PROTECTED ROUTE ====================
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// ==================== LIVE PREVIEW PHONE ====================
function LivePreviewPhone() {
  const { currentBranch, currentSection } = useBranch()
  const iframeRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)

  const previewUrl = currentBranch?.slug 
    ? currentSection?.slug 
      ? `/menu/${currentBranch.slug}?section=${currentSection.slug}&preview=1`
      : `/menu/${currentBranch.slug}?preview=1`
    : null

  if (!previewUrl) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
          <Phone sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">Şube ve bölüm seçin</Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', maxWidth: 280, mb: 1, px: 1 }}>
        <Phone sx={{ color: 'primary.main', fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>Canlı Önizleme</Typography>
        <IconButton size="small" onClick={() => { setIsLoading(true); iframeRef.current.src = iframeRef.current.src }}>
          <Refresh fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ position: 'relative', width: 280, height: 580, borderRadius: 5, border: '8px solid', borderColor: 'grey.800', bgcolor: 'black', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <Box sx={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 24, bgcolor: 'black', borderRadius: 3, zIndex: 10 }} />
        
        {isLoading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', zIndex: 5 }}>
            <CircularProgress size={32} />
          </Box>
        )}
        <Box
          component="iframe"
          ref={iframeRef}
          src={previewUrl}
          sx={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          onLoad={() => setIsLoading(false)}
          title="Menu Preview"
        />

        <Box sx={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 100, height: 4, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
      </Box>

      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Chip label={currentBranch?.name} size="small" color="primary" variant="outlined" icon={<Store fontSize="small" />} />
        {currentSection && <Chip label={currentSection.name} size="small" color="secondary" variant="outlined" icon={<Place fontSize="small" />} />}
      </Stack>
    </Box>
  )
}

// ==================== ADMIN LAYOUT ====================
function AdminLayout({ children }) {
  const { user } = useAuth()
  const { loadBranches, currentBranch, currentSection, branches, selectBranch, selectSection, sections } = useBranch()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width:900px)')
  const isLargeScreen = useMediaQuery('(min-width:1200px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false')

  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode])

  useEffect(() => { if (user) loadBranches() }, [user])

  // Auto-redirect logic
  useEffect(() => {
    if (branches.length > 0 && !currentBranch && location.pathname === '/admin') {
      const firstBranch = branches[0]
      selectBranch(firstBranch)
      navigate(`/admin/branch/${firstBranch.id}/select-section`)
    }
  }, [branches, currentBranch, location.pathname])

  const toggleDarkMode = () => { setDarkMode(!darkMode); localStorage.setItem('darkMode', (!darkMode).toString()) }

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/select-section')) return 'Bölüm Seç'
    if (path.includes('/dashboard')) return 'Dashboard'
    if (path.includes('/products')) return 'Ürünler'
    if (path.includes('/categories')) return 'Kategoriler'
    if (path.includes('/category-layout')) return 'Kategori Düzeni'
    if (path.includes('/glb')) return '3D Modeller'
    if (path.includes('/announcements')) return 'Duyurular'
    if (path.includes('/reviews')) return 'Yorumlar'
    if (path.includes('/sections')) return 'Bölümler'
    if (path.includes('/tags')) return 'Etiketler'
    if (path.includes('/settings')) return 'Şube Ayarları'
    if (path.includes('/branches')) return 'Şubeler'
    if (path.includes('/users')) return 'Kullanıcılar'
    return 'AR Menu Admin'
  }

  const showPreview = isLargeScreen && currentBranch && currentSection && 
    !location.pathname.includes('/branches') && 
    !location.pathname.includes('/users') &&
    !location.pathname.includes('/select-section') &&
    !location.pathname.includes('/sections')

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style>{`
        iframe::-webkit-scrollbar { display: none !important; }
        iframe { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      `}</style>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Toolbar>
              {isMobile && <IconButton edge="start" onClick={() => setSidebarOpen(true)} sx={{ mr: 2 }}><MenuIcon /></IconButton>}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>{getPageTitle()}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {currentBranch && <Typography variant="caption" color="text.secondary">{currentBranch.name}</Typography>}
                  {currentSection && (
                    <>
                      <Typography variant="caption" color="text.secondary">›</Typography>
                      <Typography variant="caption" color="primary">{currentSection.icon} {currentSection.name}</Typography>
                    </>
                  )}
                </Stack>
              </Box>
              <Tooltip title={darkMode ? 'Açık Mod' : 'Koyu Mod'}>
                <IconButton onClick={toggleDarkMode}>{darkMode ? <LightMode /> : <DarkMode />}</IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>
          
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Box component="main" sx={{ flex: 1, p: 3, bgcolor: 'background.default', overflow: 'auto', minWidth: 0 }}>
              {children}
            </Box>
            
            {showPreview && (
              <Box sx={{ width: 320, borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0, overflow: 'hidden' }}>
                <LivePreviewPhone />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

// ==================== SECTION SELECTION PAGE ====================
function SectionSelectionPage() {
  const { branchId } = useParams()
  const navigate = useNavigate()
  const { currentBranch, sections, selectSection, selectBranch, branches, loadSections } = useBranch()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // Eğer currentBranch yoksa veya farklıysa, doğru branch'i seç
      if (!currentBranch || currentBranch.id !== branchId) {
        const branch = branches.find(b => b.id === branchId)
        if (branch) {
          selectBranch(branch)
        }
      } else {
        // Branch zaten doğru, sections yüklenmiş mi kontrol et
        if (sections.length === 0) {
          await loadSections(branchId)
        }
      }
      setLoading(false)
    }
    init()
  }, [branchId, currentBranch, branches])

  const handleSectionSelect = (section) => {
    selectSection(section)
    navigate(`/admin/branch/${branchId}/section/${section.id}/dashboard`)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (sections.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Place sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight={700}>Henüz Bölüm Yok</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Bu şube için henüz bölüm oluşturulmamış. İlk bölümünüzü oluşturun.
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          startIcon={<Add />}
          onClick={() => navigate(`/admin/branch/${branchId}/sections`)}
        >
          İlk Bölümü Oluştur
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Bölüm Seçin</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Yönetmek istediğiniz restoran bölümünü seçin
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
        {sections.filter(s => s.isActive).map(section => (
          <Paper
            key={section.id}
            onClick={() => handleSectionSelect(section)}
            sx={{
              p: 3,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '2px solid',
              borderColor: 'divider',
              '&:hover': {
                borderColor: section.color || 'primary.main',
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
          >
            <Stack spacing={2} alignItems="center" textAlign="center">
              {section.image ? (
                <Avatar 
                  src={getImageUrl(section.image)} 
                  sx={{ width: 80, height: 80, bgcolor: section.color || 'primary.main' }}
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: alpha(section.color || '#e53935', 0.1),
                    fontSize: 40
                  }}
                >
                  {section.icon}
                </Avatar>
              )}
              <Box>
                <Typography variant="h6" fontWeight={700}>{section.name}</Typography>
                {section.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {section.description}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={`${section.productCount || 0} ürün`} size="small" />
                <Chip label={`${section.categoryCount || 0} kategori`} size="small" variant="outlined" />
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="outlined" 
          startIcon={<Settings />}
          onClick={() => navigate(`/admin/branch/${branchId}/sections`)}
        >
          Bölümleri Yönet
        </Button>
      </Box>
    </Box>
  )
}

// ==================== PAGES IMPORT ====================
import {
  DashboardPage, ProductsPage, CategoriesPage, CategoryLayoutPage,
  GlbFilesPage, AnnouncementsPage, ReviewsPage, BranchSettingsPage,
  BranchesPage, UsersPage, SectionsPage, TagsPage, RestaurantsPage
} from './AdminPages'
import { LoginPage, BranchSelectionPage, MenuPage } from './PublicPages'

// ==================== ADMIN HOME REDIRECT ====================
function AdminHomeRedirect() {
  const { user } = useAuth()
  const { branches } = useBranch()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role === 'superadmin') {
      navigate('/admin/restaurants', { replace: true })
    } else if (branches.length > 0) {
      navigate(`/admin/branch/${branches[0].id}/select-section`, { replace: true })
    }
  }, [user, branches, navigate])

  return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
}

// ==================== APP ====================
function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider>
        <AuthProvider>
          <BranchProvider>
            <Routes>
              {/* ===== PUBLIC ROUTES ===== */}
              <Route path="/" element={<BranchSelectionPage />} />
              <Route path="/menu/:slug" element={<MenuPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* ===== ADMIN ROUTES ===== */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout><AdminHomeRedirect /></AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/restaurants" element={
                <ProtectedRoute>
                  <AdminLayout><RestaurantsPage /></AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/restaurant/:restaurantId/branches" element={
                <ProtectedRoute>
                  <AdminLayout><BranchesPage /></AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/restaurant/:restaurantId/users" element={
                <ProtectedRoute>
                  <AdminLayout><UsersPage /></AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/users" element={
                <ProtectedRoute>
                  <AdminLayout><UsersPage /></AdminLayout>
                </ProtectedRoute>
              } />

              {/* Branch Section Selection */}
              <Route path="/admin/branch/:branchId/select-section" element={
                <ProtectedRoute>
                  <AdminLayout><SectionSelectionPage /></AdminLayout>
                </ProtectedRoute>
              } />

              {/* Branch Level Routes (No Section Required) */}
              <Route path="/admin/branch/:branchId/sections" element={
                <ProtectedRoute>
                  <AdminLayout><SectionsPage /></AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/branch/:branchId/settings" element={
                <ProtectedRoute>
                  <AdminLayout><BranchSettingsPage /></AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/branch/:branchId/tags" element={
                <ProtectedRoute>
                  <AdminLayout><TagsPage /></AdminLayout>
                </ProtectedRoute>
              } />

              {/* Section Level Routes */}
              <Route path="/admin/branch/:branchId/section/:sectionId/dashboard" element={
                <ProtectedRoute>
                  <AdminLayout><DashboardPage /></AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/branch/:branchId/section/:sectionId/products" element={
                <ProtectedRoute>
                  <AdminLayout><ProductsPage /></AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/branch/:branchId/section/:sectionId/categories" element={
                <ProtectedRoute>
                  <AdminLayout><CategoriesPage /></AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/branch/:branchId/section/:sectionId/category-layout" element={
                <ProtectedRoute>
                  <AdminLayout><CategoryLayoutPage /></AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/branch/:branchId/section/:sectionId/glb" element={
                <ProtectedRoute>
                  <AdminLayout><GlbFilesPage /></AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/branch/:branchId/section/:sectionId/announcements" element={
                <ProtectedRoute>
                  <AdminLayout><AnnouncementsPage /></AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/branch/:branchId/section/:sectionId/reviews" element={
                <ProtectedRoute>
                  <AdminLayout><ReviewsPage /></AdminLayout>
                </ProtectedRoute>
              } />

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