const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const app = express()

// ==================== CONFIG ====================
const PORT = process.env.PORT || 3001;
const MONGODB_URI = 'mongodb://localhost:27017/ar-menu-qr1';
const JWT_SECRET = process.env.JWT_SECRET || 'ar-menu-secret-key-change-in-production';
const API_KEY = process.env.API_KEY || "test123";

// ==================== MIDDLEWARE ====================
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/outputs', express.static(path.join(__dirname, 'outputs')))

// Create directories
const dirs = ['uploads/images', 'outputs']
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir)
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true })
})

// ==================== SCHEMAS ====================

// Restaurant (Ana Restoran - Multi-tenant için)
const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  logo: { type: String, default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  address: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'basic' },
    expiresAt: { type: Date, default: null },
    maxBranches: { type: Number, default: 5 },
    maxProducts: { type: Number, default: 100 },
    features: {
      glbSupport: { type: Boolean, default: true },
      multiLanguage: { type: Boolean, default: true },
      customDomain: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false }
    }
  },
  settings: {
    currency: { type: String, default: 'TRY' },
    currencySymbol: { type: String, default: '₺' },
    defaultLanguage: { type: String, default: 'tr' },
    languages: [{ type: String, default: ['tr'] }],
    timezone: { type: String, default: 'Europe/Istanbul' }
  },
  customDomain: { type: String, default: null }
}, { timestamps: true })

// Branch (Şube) - Restaurant'a bağlı
const branchSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: null },
  logo: { type: String, default: null },
  banner: { type: String, default: null },
  homepageImage: { type: String, default: null },
  heroImage: { type: String, default: null },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  instagram: { type: String, default: '' },
  workingHours: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  theme: {
    primaryColor: { type: String, default: '#e53935' },
    secondaryColor: { type: String, default: '#1e88e5' }
  }
}, { timestamps: true })

// Compound index for unique slug within restaurant
branchSchema.index({ restaurant: 1, slug: 1 }, { unique: true })

// Section (Bölüm) - Restoran içi alanlar (Bahçe, Teras, VIP vb.)
const sectionSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '📍' },
  image: { type: String, default: null },
  homepageImage: { type: String, default: null },
  heroImage: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  color: { type: String, default: '#e53935' }
}, { timestamps: true })

// Tag (Etiket)
const tagSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  slug: { type: String },
  icon: { type: String, default: '🏷️' },
  color: { type: String, default: '#e53935' },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true })

// Category
const categorySchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  name: { type: String, required: true },
  nameEN: { type: String, default: '' },
  icon: { type: String, default: '' },
  image: { type: String, default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  description: { type: String, default: '' },
  layoutSize: { type: String, enum: ['full', 'half', 'third'], default: 'half' },
  categoryType: { type: String, enum: ['category_title', 'product_main_title', 'product_title', 'product_subtitle'], default: 'product_title' }
}, { timestamps: true })

// CategoryLayout
const categoryLayoutSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
  rowOrder: { type: Number, default: 0 },
  categories: [{
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    size: { type: String, enum: ['full', 'half', 'third'], default: 'half' }
  }]
}, { timestamps: true })

// Product
const productSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
  name: { type: String, required: true },
  nameEN: { type: String, default: '' },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  descriptionEN: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  thumbnail: { type: String, default: null },
  images: [{ type: String }],
  glbFile: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isCampaign: { type: Boolean, default: false },
  campaignPrice: { type: Number, default: null },
  calories: { type: Number, default: null },
  preparationTime: { type: Number, default: null },
  allergens: [{ type: String }],
  allergensEN: [{ type: String }],
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  viewCount: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  sectionPrices: [{
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    price: { type: Number, required: true },
    campaignPrice: { type: Number, default: null },
    isActive: { type: Boolean, default: true }
  }]
}, { timestamps: true })

// Announcement
const announcementSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: { type: String, default: '📢' },
  type: { type: String, enum: ['info', 'warning', 'success', 'promo'], default: 'info' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true })

// Review
const reviewSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  contact: { type: String, default: '' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  customerName: { type: String, default: 'Anonim' },
  isApproved: { type: Boolean, default: false },
  reply: { type: String, default: '' },
  repliedAt: { type: Date, default: null }
}, { timestamps: true })

// GlbFile
const glbFileSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  filename: { type: String, required: true },
  originalName: { type: String },
  size: { type: Number },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }
}, { timestamps: true })

// Compound index for unique filename within restaurant
glbFileSchema.index({ restaurant: 1, filename: 1 }, { unique: true })

// User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'manager', 'staff'], default: 'staff' },
  // superadmin: Tüm sistem yöneticisi
  // admin: Restoran sahibi/yöneticisi (kendi restoranlarını yönetir)
  // manager: Şube müdürü (belirli şubeleri yönetir)
  // staff: Personel (sadece görüntüleme ve sınırlı düzenleme)
  restaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }], // Erişebildiği restoranlar
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }], // Erişebildiği şubeler
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  avatar: { type: String, default: null },
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' }
}, { timestamps: true })

// Models
const Restaurant = mongoose.model('Restaurant', restaurantSchema)
const Branch = mongoose.model('Branch', branchSchema)
const Section = mongoose.model('Section', sectionSchema)
const Tag = mongoose.model('Tag', tagSchema)
const Category = mongoose.model('Category', categorySchema)
const CategoryLayout = mongoose.model('CategoryLayout', categoryLayoutSchema)
const Product = mongoose.model('Product', productSchema)
const Announcement = mongoose.model('Announcement', announcementSchema)
const Review = mongoose.model('Review', reviewSchema)
const GlbFile = mongoose.model('GlbFile', glbFileSchema)
const User = mongoose.model('User', userSchema)

// ==================== MULTER ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = file.fieldname === 'file' ? 'outputs' : 'uploads/images'
    cb(null, path.join(__dirname, dest))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } })

// ==================== HELPERS ====================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId)
      .populate('restaurants')
      .populate('branches')
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid token' })
    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

const apiKeyMiddleware = (req, res, next) => {
  if (req.headers['x-api-key'] !== API_KEY) return res.status(401).json({ error: 'Invalid API key' })
  next()
}

// Restoran erişim kontrolü
const checkRestaurantAccess = (user, restaurantId) => {
  if (user.role === 'superadmin') return true
  if (!restaurantId) return false
  return user.restaurants.some(r => r._id.toString() === restaurantId.toString())
}

// Şube erişim kontrolü
const checkBranchAccess = async (user, branchId) => {
  if (user.role === 'superadmin') return true
  if (!branchId) return false

  // Önce branch'i bul
  const branch = await Branch.findById(branchId)
  if (!branch) return false

  // Kullanıcının belirli şubeleri varsa, sadece o şubelere erişim
  if (user.branches && user.branches.length > 0) {
    return user.branches.some(b => b._id.toString() === branchId.toString())
  }

  // Şube kısıtlaması yoksa, restoran erişimi kontrol et
  if (user.restaurants.some(r => r._id.toString() === branch.restaurant.toString())) {
    return true
  }

  return false
}

// Backward compat için senkron versiyon (branch objesi varsa)
const checkBranchAccessSync = (user, branch) => {
  if (user.role === 'superadmin') return true
  if (!branch) return false

  const branchId = branch._id
  const restaurantId = branch.restaurant?._id || branch.restaurant

  // Kullanıcının belirli şubeleri varsa, sadece o şubelere erişim
  if (user.branches && user.branches.length > 0) {
    return user.branches.some(b => b._id.toString() === branchId.toString())
  }

  // Şube kısıtlaması yoksa, restoran erişimi kontrol et
  if (user.restaurants.some(r => r._id.toString() === restaurantId.toString())) {
    return true
  }

  return false
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const createSlug = (text) => {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Restaurant'tan Branch'e veri taşıma yardımcısı
const getRestaurantFromBranch = async (branchId) => {
  const branch = await Branch.findById(branchId)
  return branch?.restaurant
}

// ==================== TRANSLATE API ====================
app.post('/api/translate', authMiddleware, async (req, res) => {
  try {
    const { text, targetLang = 'en', sourceLang = 'tr' } = req.body
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.responseStatus === 200 && data.responseData) {
      res.json({ 
        success: true,
        translatedText: data.responseData.translatedText,
        source: text,
        sourceLang,
        targetLang
      })
    } else {
      res.status(400).json({ 
        error: 'Translation failed', 
        details: data.responseDetails 
      })
    }
  } catch (err) {
    console.error('Translation error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/translate/bulk', authMiddleware, async (req, res) => {
  try {
    const { texts, targetLang = 'en', sourceLang = 'tr' } = req.body
    
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Texts array is required' })
    }

    const translations = await Promise.all(
      texts.map(async (text) => {
        if (!text || !text.trim()) return { source: text, translated: '' }
        
        try {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
          const response = await fetch(url)
          const data = await response.json()
          
          return {
            source: text,
            translated: data.responseData?.translatedText || ''
          }
        } catch {
          return { source: text, translated: '' }
        }
      })
    )

    res.json({ success: true, translations })
  } catch (err) {
    console.error('Bulk translation error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ==================== PUBLIC ROUTES ====================

// Get all restaurants for main selection
app.get('/api/public/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true }).sort({ name: 1 })
    res.json(restaurants.map(r => ({
      id: r._id, name: r.name, slug: r.slug, description: r.description,
      logo: r.logo, address: r.address, contactPhone: r.contactPhone
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get restaurant with branches
app.get('/api/public/restaurants/:slug', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isActive: true })
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
    
    const branches = await Branch.find({ restaurant: restaurant._id, isActive: true }).sort({ order: 1 })
    
    res.json({
      id: restaurant._id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      logo: restaurant.logo,
      settings: restaurant.settings,
      branches: branches.map(b => ({
        id: b._id, name: b.name, slug: b.slug, description: b.description,
        image: b.image, logo: b.logo, address: b.address, phone: b.phone
      }))
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get all branches for selection screen (backward compat)
app.get('/api/public/branches', async (req, res) => {
  try {
    const { restaurant: restaurantSlug } = req.query
    
    let filter = { isActive: true }
    
    if (restaurantSlug) {
      const restaurant = await Restaurant.findOne({ slug: restaurantSlug, isActive: true })
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
      filter.restaurant = restaurant._id
    }
    
    const branches = await Branch.find(filter)
      .populate('restaurant', 'name slug logo settings')
      .sort({ order: 1, name: 1 })
    
    res.json(branches.map(b => ({
      id: b._id, name: b.name, slug: b.slug, description: b.description,
      image: b.image, logo: b.logo || b.restaurant?.logo, address: b.address, phone: b.phone,
      restaurantId: b.restaurant?._id,
      restaurantName: b.restaurant?.name,
      restaurantSlug: b.restaurant?.slug
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get branch details with sections
app.get('/api/public/branches/:slug', async (req, res) => {
  try {
    const { restaurant: restaurantSlug } = req.query
    
    let branchQuery = { slug: req.params.slug, isActive: true }
    
    if (restaurantSlug) {
      const restaurant = await Restaurant.findOne({ slug: restaurantSlug, isActive: true })
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
      branchQuery.restaurant = restaurant._id
    }
    
    const branch = await Branch.findOne(branchQuery).populate('restaurant', 'name slug logo settings')
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    
    const sections = await Section.find({ branch: branch._id, isActive: true }).sort({ order: 1 })
    
    res.json({
      id: branch._id,
      name: branch.name,
      slug: branch.slug,
      description: branch.description,
      image: branch.image,
      logo: branch.logo || branch.restaurant?.logo,
      banner: branch.banner,
      heroImage: branch.heroImage,
      address: branch.address,
      phone: branch.phone,
      whatsapp: branch.whatsapp,
      instagram: branch.instagram,
      workingHours: branch.workingHours,
      theme: branch.theme,
      restaurantId: branch.restaurant?._id,
      restaurantName: branch.restaurant?.name,
      restaurantSlug: branch.restaurant?.slug,
      settings: branch.restaurant?.settings,
      sections: sections.map(s => ({
        id: s._id, name: s.name, slug: s.slug, description: s.description,
        image: s.image, heroImage: s.heroImage, color: s.color
      }))
    })
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
})

// Get sections for a branch
app.get('/api/public/branches/:slug/sections', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug, isActive: true })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    
    const sections = await Section.find({ branch: branch._id, isActive: true }).sort({ order: 1 })
    res.json(sections.map(s => ({
      id: s._id, name: s.name, slug: s.slug, description: s.description,
      image: s.image, heroImage: s.heroImage, color: s.color
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUBLIC: Get all tags for a branch
app.get('/api/public/branches/:slug/tags', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug, isActive: true })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    
    const tags = await Tag.find({ branch: branch._id, isActive: true }).sort({ order: 1, name: 1 })
    
    const tagsWithCount = await Promise.all(tags.map(async (tag) => {
      const productCount = await Product.countDocuments({ 
        branch: branch._id,
        tags: tag._id,
        isActive: true
      })
      return {
        id: tag._id,
        name: tag.name,
        slug: tag.slug,
        icon: tag.icon,
        color: tag.color,
        description: tag.description,
        productCount
      }
    }))
    
    res.json(tagsWithCount.filter(t => t.productCount > 0))
  } catch (err) { 
    console.error('Get public tags error:', err)
    res.status(500).json({ error: err.message }) 
  }
})

// PUBLIC: Get products by tag
app.get('/api/public/branches/:slug/products/by-tag/:tagSlug', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug, isActive: true })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    
    const tag = await Tag.findOne({ 
      branch: branch._id,
      slug: req.params.tagSlug,
      isActive: true
    })
    
    if (!tag) return res.status(404).json({ error: 'Tag not found' })
    
    const products = await Product.find({
      branch: branch._id,
      tags: tag._id,
      isActive: true
    })
    .populate('category', 'name nameEN icon')
    .populate('tags', 'name slug icon color')
    .sort({ isFeatured: -1, name: 1 })
    
    res.json({
      tag: {
        id: tag._id,
        name: tag.name,
        slug: tag.slug,
        icon: tag.icon,
        color: tag.color,
        description: tag.description
      },
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        description: p.description,
        price: p.price,
        campaignPrice: p.campaignPrice,
        isCampaign: p.isCampaign,
        isFeatured: p.isFeatured,
        thumbnail: p.thumbnail,
        hasGlb: !!p.glbFile,
        glbFile: p.glbFile,
        categoryId: p.category?._id,
        categoryName: p.category?.name,
        categoryNameEN: p.category?.nameEN || '',
        categoryIcon: p.category?.icon,
        tags: p.tags?.map(t => ({
          id: t._id,
          name: t.name,
          slug: t.slug,
          icon: t.icon,
          color: t.color
        }))
      }))
    })
  } catch (err) { 
    console.error('Get products by tag error:', err)
    res.status(500).json({ error: err.message }) 
  }
})

// Get categories with layout info
app.get('/api/public/branches/:slug/categories', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    const categories = await Category.find({ branch: branch._id, isActive: true }).sort({ order: 1 })
    res.json(categories.map(c => ({
      id: c._id,
      name: c.name,
      nameEN: c.nameEN || '',
      icon: c.icon,
      image: c.image,
      description: c.description,
      layoutSize: c.layoutSize,
      parent: c.parent || null,
      categoryType: c.categoryType || 'product_title'
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get category layouts (PUBLIC)
app.get('/api/public/branches/:slug/category-layouts', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    
    const layouts = await CategoryLayout.find({ branch: branch._id })
      .populate('categories.category', 'name nameEN icon image description')
      .sort({ rowOrder: 1 })
    
    const result = layouts.map(l => ({
      id: l._id,
      _id: l._id,
      rowOrder: l.rowOrder,
      categories: l.categories.map(c => ({
        category: c.category ? {
          id: c.category._id,
          _id: c.category._id,
          name: c.category.name,
          nameEN: c.category.nameEN || '',
          icon: c.category.icon,
          image: c.category.image,
          description: c.category.description
        } : null,
        size: c.size
      })).filter(c => c.category)
    }))
    
    res.json(result)
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
})

// Get products
app.get('/api/public/branches/:slug/products', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    const filter = { branch: branch._id, isActive: true }
    if (req.query.category) filter.category = req.query.category
    if (req.query.isCampaign === 'true') filter.isCampaign = true
    if (req.query.isFeatured === 'true') filter.isFeatured = true
    
    const products = await Product.find(filter)
      .populate('category', 'name nameEN icon')
      .populate('tags', 'name slug icon color')
      .sort({ isFeatured: -1, name: 1 })
    
    res.json(products.map(p => ({
      id: p._id, 
      name: p.name, 
      price: p.price, 
      description: p.description,
      thumbnail: p.thumbnail, 
      glbFile: p.glbFile, 
      hasGlb: !!p.glbFile,
      isFeatured: p.isFeatured, 
      isCampaign: p.isCampaign, 
      campaignPrice: p.campaignPrice,
      calories: p.calories, 
      preparationTime: p.preparationTime,
      allergens: p.allergens || [],
      tags: p.tags?.map(t => ({
        id: t._id,
        name: t.name,
        slug: t.slug,
        icon: t.icon,
        color: t.color
      })) || [],
      categoryId: p.category?._id || null,
      categoryName: p.category?.name || null,
      categoryNameEN: p.category?.nameEN || '',
      categoryIcon: p.category?.icon || null,
      category: p.category ? { 
        id: p.category._id, 
        name: p.category.name, 
        nameEN: p.category.nameEN || '',
        icon: p.category.icon 
      } : null,
      sectionPrices: p.sectionPrices || []
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get menu with section filter
app.get('/api/public/branches/:slug/menu', async (req, res) => {
  try {
    const { section: sectionSlug } = req.query
    const branch = await Branch.findOne({ slug: req.params.slug, isActive: true })
      .populate('restaurant', 'settings')
    if (!branch) return res.status(404).json({ error: 'Branch not found' })

    let selectedSection = null
    if (sectionSlug) {
      selectedSection = await Section.findOne({ branch: branch._id, slug: sectionSlug, isActive: true })
    }

    const categoryFilter = { branch: branch._id, isActive: true }
    if (selectedSection) {
      categoryFilter.$or = [{ section: null }, { section: selectedSection._id }]
    }
    const categories = await Category.find(categoryFilter).sort({ order: 1 })

    const productFilter = { branch: branch._id, isActive: true }
    if (selectedSection) {
      productFilter.$or = [{ section: null }, { section: selectedSection._id }]
    }
    const products = await Product.find(productFilter)
      .populate('category', 'name nameEN icon')
      .populate('tags', 'name slug icon color')
      .populate('sectionPrices.section', 'name slug')
      .sort({ isFeatured: -1, createdAt: -1 })

    const announcementFilter = { branch: branch._id, isActive: true }
    if (selectedSection) {
      announcementFilter.$or = [{ section: null }, { section: selectedSection._id }]
    }
    const announcements = await Announcement.find(announcementFilter).sort({ order: 1 })

    const layoutFilter = { branch: branch._id }
    if (selectedSection) {
      layoutFilter.$or = [{ section: null }, { section: selectedSection._id }]
    }
    const layouts = await CategoryLayout.find(layoutFilter)
      .populate('categories.category', 'name nameEN icon image')
      .sort({ rowOrder: 1 })

    const tags = await Tag.find({ branch: branch._id, isActive: true }).sort({ order: 1 })

    const processedProducts = products.map(p => {
      const product = p.toObject()
      product.id = p._id
      product.categoryId = p.category?._id
      product.categoryName = p.category?.name
      product.categoryNameEN = p.category?.nameEN || ''
      product.categoryIcon = p.category?.icon
      product.hasGlb = !!p.glbFile
      product.tags = p.tags?.map(t => ({
        id: t._id,
        name: t.name,
        slug: t.slug,
        icon: t.icon,
        color: t.color
      })) || []
      
      if (selectedSection && product.sectionPrices?.length > 0) {
        const sectionPrice = product.sectionPrices.find(
          sp => sp.section?._id?.toString() === selectedSection._id.toString() && sp.isActive
        )
        if (sectionPrice) {
          product.price = sectionPrice.price
          if (sectionPrice.campaignPrice) {
            product.campaignPrice = sectionPrice.campaignPrice
            product.isCampaign = true
          }
        }
      }
      
      return product
    })

    let homepageImage = branch.homepageImage
    if (selectedSection?.homepageImage) {
      homepageImage = selectedSection.homepageImage
    }

    res.json({
      branch: {
        id: branch._id, name: branch.name, logo: branch.logo || branch.restaurant?.logo,
        banner: branch.banner, homepageImage: homepageImage,
        phone: branch.phone, whatsapp: branch.whatsapp,
        instagram: branch.instagram, address: branch.address,
        workingHours: branch.workingHours, theme: branch.theme,
        settings: branch.restaurant?.settings
      },
      categories: categories.map(c => ({
        id: c._id,
        name: c.name,
        nameEN: c.nameEN || '',
        icon: c.icon,
        image: c.image,
        description: c.description,
        parent: c.parent || null,
        categoryType: c.categoryType || 'product_title'
      })),
      products: processedProducts,
      announcements: announcements.map(a => ({
        id: a._id, title: a.title, message: a.message, icon: a.icon, type: a.type
      })),
      layouts: layouts.map(l => ({
        id: l._id, rowOrder: l.rowOrder,
        categories: l.categories.map(c => ({
          category: c.category ? {
            id: c.category._id, 
            name: c.category.name,
            nameEN: c.category.nameEN || '',
            icon: c.category.icon, 
            image: c.category.image
          } : null,
          size: c.size
        })).filter(c => c.category)
      })),
      tags: tags.map(t => ({
        id: t._id, name: t.name, slug: t.slug, icon: t.icon, color: t.color
      })),
      selectedSection: selectedSection ? {
        id: selectedSection._id, name: selectedSection.name,
        slug: selectedSection.slug, homepageImage: selectedSection.homepageImage
      } : null
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get announcements
app.get('/api/public/branches/:slug/announcements', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    const announcements = await Announcement.find({ branch: branch._id, isActive: true }).sort({ order: 1 })
    res.json(announcements.map(a => ({ id: a._id, title: a.title, message: a.message, icon: a.icon, type: a.type })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get approved reviews (Public)
app.get('/api/public/branches/:slug/reviews', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    const reviews = await Review.find({ branch: branch._id, isApproved: true })
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(reviews.map(r => ({
      id: r._id, rating: r.rating, comment: r.comment, customerName: r.customerName,
      productName: r.product?.name, reply: r.reply, createdAt: r.createdAt
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Submit review
app.post('/api/public/branches/:slug/reviews', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    const review = await Review.create({ 
      ...req.body, 
      branch: branch._id,
      restaurant: branch.restaurant
    })
    res.status(201).json({ id: review._id, message: 'Review submitted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ $or: [{ username }, { email: username }] })
      .populate('restaurants')
      .populate('branches')
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' })
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' })
    user.lastLogin = new Date()
    await user.save()
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      token,
      user: {
        id: user._id, username: user.username, email: user.email, role: user.role,
        fullName: user.fullName, avatar: user.avatar, phone: user.phone,
        restaurants: user.restaurants.map(r => ({ id: r._id, name: r.name, slug: r.slug, logo: r.logo })),
        branches: user.branches.map(b => ({ id: b._id, name: b.name, slug: b.slug }))
      }
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('restaurants')
    .populate('branches')
  res.json({
    id: user._id, username: user.username, email: user.email, role: user.role,
    fullName: user.fullName, avatar: user.avatar, phone: user.phone,
    restaurants: user.restaurants.map(r => ({ id: r._id, name: r.name, slug: r.slug, logo: r.logo })),
    branches: user.branches.map(b => ({ id: b._id, name: b.name, slug: b.slug }))
  })
})

app.post('/api/auth/setup', async (req, res) => {
  try {
    if (await User.findOne({ role: 'superadmin' })) return res.status(400).json({ error: 'Admin exists' })
    const { username, email, password, fullName } = req.body
    const admin = await User.create({
      username, email, password: await bcrypt.hash(password, 10), fullName, role: 'superadmin'
    })
    const token = jwt.sign({ userId: admin._id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: admin._id, username, email, role: 'superadmin', fullName, restaurants: [], branches: [] } })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/auth/check-setup', async (req, res) => {
  res.json({ needsSetup: !await User.exists({ role: 'superadmin' }) })
})

// Change password
app.put('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    
    if (!await bcrypt.compare(currentPassword, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }
    
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== RESTAURANTS (Admin Only) ====================
app.get('/api/restaurants', authMiddleware, async (req, res) => {
  try {
    let restaurants
    if (req.user.role === 'superadmin') {
      restaurants = await Restaurant.find().sort({ name: 1 })
    } else {
      restaurants = await Restaurant.find({ _id: { $in: req.user.restaurants } }).sort({ name: 1 })
    }
    
    // Her restoran için istatistikler
    const restaurantsWithStats = await Promise.all(restaurants.map(async (r) => {
      const [branchCount, productCount, userCount] = await Promise.all([
        Branch.countDocuments({ restaurant: r._id }),
        Product.countDocuments({ restaurant: r._id }),
        User.countDocuments({ restaurants: r._id })
      ])
      return {
        ...r.toObject(),
        id: r._id,
        branchCount,
        productCount,
        userCount
      }
    }))
    
    res.json(restaurantsWithStats)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/restaurants/:id', authMiddleware, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) return res.status(404).json({ error: 'Not found' })
    if (!checkRestaurantAccess(req.user, restaurant._id)) return res.status(403).json({ error: 'Access denied' })
    
    res.json({ ...restaurant.toObject(), id: restaurant._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/restaurants', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    
    let slug = req.body.slug || createSlug(req.body.name)
    if (await Restaurant.findOne({ slug })) slug = slug + '-' + Date.now()
    
    const restaurant = await Restaurant.create({ ...req.body, slug })
    res.status(201).json({ ...restaurant.toObject(), id: restaurant._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/restaurants/:id', authMiddleware, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) return res.status(404).json({ error: 'Not found' })
    if (!checkRestaurantAccess(req.user, restaurant._id)) return res.status(403).json({ error: 'Access denied' })
    
    Object.assign(restaurant, req.body)
    await restaurant.save()
    res.json({ ...restaurant.toObject(), id: restaurant._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/restaurants/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) return res.status(404).json({ error: 'Not found' })
    
    // Tüm ilişkili verileri sil
    const branches = await Branch.find({ restaurant: restaurant._id })
    const branchIds = branches.map(b => b._id)
    
    await Promise.all([
      Branch.deleteMany({ restaurant: restaurant._id }),
      Section.deleteMany({ restaurant: restaurant._id }),
      Tag.deleteMany({ restaurant: restaurant._id }),
      Category.deleteMany({ restaurant: restaurant._id }),
      CategoryLayout.deleteMany({ restaurant: restaurant._id }),
      Product.deleteMany({ restaurant: restaurant._id }),
      Announcement.deleteMany({ restaurant: restaurant._id }),
      Review.deleteMany({ restaurant: restaurant._id }),
      GlbFile.deleteMany({ restaurant: restaurant._id }),
      User.updateMany(
        { restaurants: restaurant._id },
        { $pull: { restaurants: restaurant._id, branches: { $in: branchIds } } }
      )
    ])
    
    await restaurant.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/restaurants/:id/logo', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) return res.status(404).json({ error: 'Not found' })
    if (!checkRestaurantAccess(req.user, restaurant._id)) return res.status(403).json({ error: 'Access denied' })
    
    restaurant.logo = req.file.filename
    await restaurant.save()
    res.json({ ...restaurant.toObject(), id: restaurant._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== BRANCHES ====================
app.get('/api/branches', authMiddleware, async (req, res) => {
  try {
    const { restaurant: restaurantId } = req.query
    let filter = {}

    if (req.user.role === 'superadmin') {
      if (restaurantId) filter.restaurant = restaurantId
    } else {
      const branchIds = req.user.branches?.map(b => b._id) || []
      const restaurantIds = req.user.restaurants?.map(r => r._id) || []

      // Kullanıcının belirli şubeleri varsa, sadece o şubeleri göster
      if (branchIds.length > 0) {
        filter._id = { $in: branchIds }
        if (restaurantId) {
          filter.restaurant = restaurantId
        }
      } else if (restaurantIds.length > 0) {
        // Şube kısıtlaması yoksa, restoran erişimi kontrol et
        if (restaurantId) {
          if (!restaurantIds.some(id => id.toString() === restaurantId)) {
            return res.status(403).json({ error: 'Access denied' })
          }
          filter.restaurant = restaurantId
        } else {
          filter.restaurant = { $in: restaurantIds }
        }
      } else {
        // Hiç erişim yok
        return res.json([])
      }
    }
    
    const branches = await Branch.find(filter)
      .populate('restaurant', 'name slug logo')
      .sort({ order: 1 })
    
    const counts = await Product.aggregate([{ $group: { _id: '$branch', count: { $sum: 1 } } }])
    const countMap = {}
    counts.forEach(c => { if (c._id) countMap[c._id.toString()] = c.count })
    
    const sectionCounts = await Section.aggregate([{ $group: { _id: '$branch', count: { $sum: 1 } } }])
    const sectionCountMap = {}
    sectionCounts.forEach(c => { if (c._id) sectionCountMap[c._id.toString()] = c.count })
    
    res.json(branches.map(b => ({ 
      ...b.toObject(), id: b._id, 
      productCount: countMap[b._id.toString()] || 0,
      sectionCount: sectionCountMap[b._id.toString()] || 0,
      restaurantId: b.restaurant?._id,
      restaurantName: b.restaurant?.name,
      restaurantSlug: b.restaurant?.slug
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Belirli bir restoran için şubeler (backward compat)
app.get('/api/restaurants/:restaurantId/branches', authMiddleware, async (req, res) => {
  try {
    if (!checkRestaurantAccess(req.user, req.params.restaurantId)) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    const branches = await Branch.find({ restaurant: req.params.restaurantId }).sort({ order: 1 })
    
    const counts = await Product.aggregate([
      { $match: { restaurant: new mongoose.Types.ObjectId(req.params.restaurantId) } },
      { $group: { _id: '$branch', count: { $sum: 1 } } }
    ])
    const countMap = {}
    counts.forEach(c => { if (c._id) countMap[c._id.toString()] = c.count })
    
    res.json(branches.map(b => ({ 
      ...b.toObject(), id: b._id, 
      productCount: countMap[b._id.toString()] || 0
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('restaurant', 'name slug logo settings')
    if (!branch) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    res.json({
      id: branch._id,
      _id: branch._id,
      name: branch.name,
      slug: branch.slug,
      description: branch.description,
      image: branch.image,
      logo: branch.logo,
      banner: branch.banner,
      homepageImage: branch.homepageImage,
      address: branch.address,
      phone: branch.phone,
      whatsapp: branch.whatsapp,
      instagram: branch.instagram,
      workingHours: branch.workingHours,
      isActive: branch.isActive,
      order: branch.order,
      theme: branch.theme,
      restaurantId: branch.restaurant?._id,
      restaurantName: branch.restaurant?.name,
      restaurantSlug: branch.restaurant?.slug,
      settings: branch.restaurant?.settings,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt
    })
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
})

app.post('/api/branches', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.body
    if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' })
    if (!checkRestaurantAccess(req.user, restaurantId)) return res.status(403).json({ error: 'Access denied' })
    
    let slug = req.body.slug || createSlug(req.body.name)
    
    // Aynı restoranda aynı slug var mı kontrol et
    const existingBranch = await Branch.findOne({ restaurant: restaurantId, slug })
    if (existingBranch) slug = slug + '-' + Date.now()
    
    const branch = await Branch.create({ 
      ...req.body, 
      slug, 
      restaurant: restaurantId 
    })
    res.status(201).json({ ...branch.toObject(), id: branch._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Backward compat - restoran altında şube oluştur
app.post('/api/restaurants/:restaurantId/branches', authMiddleware, async (req, res) => {
  try {
    if (!checkRestaurantAccess(req.user, req.params.restaurantId)) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    let slug = req.body.slug || createSlug(req.body.name)
    const existingBranch = await Branch.findOne({ restaurant: req.params.restaurantId, slug })
    if (existingBranch) slug = slug + '-' + Date.now()
    
    const branch = await Branch.create({ 
      ...req.body, 
      slug, 
      restaurant: req.params.restaurantId 
    })
    res.status(201).json({ ...branch.toObject(), id: branch._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
    if (!branch) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    Object.assign(branch, req.body)
    await branch.save()
    res.json({ ...branch.toObject(), id: branch._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
    if (!branch) return res.status(404).json({ error: 'Not found' })
    if (!checkRestaurantAccess(req.user, branch.restaurant)) return res.status(403).json({ error: 'Access denied' })
    
    await Promise.all([
      Section.deleteMany({ branch: branch._id }),
      Tag.deleteMany({ branch: branch._id }),
      Category.deleteMany({ branch: branch._id }),
      CategoryLayout.deleteMany({ branch: branch._id }),
      Product.deleteMany({ branch: branch._id }),
      Announcement.deleteMany({ branch: branch._id }),
      Review.deleteMany({ branch: branch._id }),
      User.updateMany({ branches: branch._id }, { $pull: { branches: branch._id } })
    ])
    await branch.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
    if (!branch) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const field = req.query.type === 'hero' ? 'heroImage' : (req.query.type || 'image')
    const allowedFields = ['image', 'logo', 'banner', 'homepageImage', 'heroImage']
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid image type' })
    }
    
    branch[field] = req.file.filename
    await branch.save()
    
    res.json({ ...branch.toObject(), id: branch._id })
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
})

// ==================== SECTIONS ====================
app.get('/api/branches/:branchId/sections', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const sections = await Section.find({ branch: req.params.branchId }).sort({ order: 1 })
    
    const sectionsWithCounts = await Promise.all(sections.map(async s => {
      const productCount = await Product.countDocuments({ 
        branch: req.params.branchId,
        section: s._id
      })
      const categoryCount = await Category.countDocuments({ 
        branch: req.params.branchId,
        section: s._id
      })
      return { ...s.toObject(), id: s._id, productCount, categoryCount }
    }))
    
    res.json(sectionsWithCounts)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/sections', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const slug = req.body.slug || createSlug(req.body.name)
    const order = await Section.countDocuments({ branch: req.params.branchId })
    
    const section = await Section.create({ 
      ...req.body, 
      slug, 
      order, 
      branch: req.params.branchId,
      restaurant: branch.restaurant
    })
    res.status(201).json({ ...section.toObject(), id: section._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/sections/:id', authMiddleware, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
    if (!section) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, section.branch)) return res.status(403).json({ error: 'Access denied' })
    
    if (req.body.name && !req.body.slug) req.body.slug = createSlug(req.body.name)
    
    Object.assign(section, req.body)
    await section.save()
    res.json({ ...section.toObject(), id: section._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/sections/:id', authMiddleware, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
    if (!section) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, section.branch)) return res.status(403).json({ error: 'Access denied' })
    
    await Product.updateMany({ section: section._id }, { section: null })
    await Category.updateMany({ section: section._id }, { section: null })
    await Announcement.updateMany({ section: section._id }, { section: null })
    await CategoryLayout.deleteMany({ section: section._id })
    
    await section.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/sections/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
    if (!section) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, section.branch)) return res.status(403).json({ error: 'Access denied' })
    
    const type = req.query.type || 'image'
    section[type] = req.file.filename
    await section.save()
    res.json({ ...section.toObject(), id: section._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/branches/:branchId/sections/reorder', authMiddleware, async (req, res) => {
  try {
    if (!await checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const { sectionIds } = req.body
    await Promise.all(sectionIds.map((id, index) => Section.findByIdAndUpdate(id, { order: index })))
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== TAGS ====================
app.get('/api/branches/:branchId/tags', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const tags = await Tag.find({ branch: req.params.branchId }).sort({ order: 1, name: 1 })
    
    const tagsWithCount = await Promise.all(tags.map(async (tag) => {
      const productCount = await Product.countDocuments({ 
        branch: req.params.branchId,
        tags: tag._id 
      })
      return {
        id: tag._id,
        ...tag.toObject(),
        productCount
      }
    }))
    
    res.json(tagsWithCount)
  } catch (err) {
    console.error('Get tags error:', err)
    res.status(500).json({ error: 'Etiketler yüklenemedi' })
  }
})

app.post('/api/branches/:branchId/tags', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const { name, icon, color, description, isActive } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Etiket adı gerekli' })
    }
    
    const existing = await Tag.findOne({ 
      branch: req.params.branchId, 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    })
    
    if (existing) {
      return res.status(400).json({ error: 'Bu isimde bir etiket zaten var' })
    }
    
    const slug = createSlug(name)
    
    const maxOrder = await Tag.findOne({ branch: req.params.branchId })
      .sort({ order: -1 })
      .select('order')
    
    const tag = new Tag({
      branch: req.params.branchId,
      restaurant: branch.restaurant,
      name,
      slug,
      icon: icon || '🏷️',
      color: color || '#e53935',
      description: description || '',
      isActive: isActive !== false,
      order: (maxOrder?.order || 0) + 1
    })
    
    await tag.save()
    
    res.status(201).json({
      id: tag._id,
      ...tag.toObject()
    })
  } catch (err) {
    console.error('Create tag error:', err)
    res.status(500).json({ error: 'Etiket oluşturulamadı' })
  }
})

app.put('/api/tags/:id', authMiddleware, async (req, res) => {
  try {
    const { name, icon, color, description, isActive, order } = req.body
    
    const tag = await Tag.findById(req.params.id)
    if (!tag) {
      return res.status(404).json({ error: 'Etiket bulunamadı' })
    }
    
    if (!await checkBranchAccess(req.user, tag.branch)) return res.status(403).json({ error: 'Access denied' })
    
    if (name && name !== tag.name) {
      const existing = await Tag.findOne({ 
        branch: tag.branch, 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: tag._id }
      })
      
      if (existing) {
        return res.status(400).json({ error: 'Bu isimde bir etiket zaten var' })
      }
      
      tag.name = name
      tag.slug = createSlug(name)
    }
    
    if (icon !== undefined) tag.icon = icon
    if (color !== undefined) tag.color = color
    if (description !== undefined) tag.description = description
    if (isActive !== undefined) tag.isActive = isActive
    if (order !== undefined) tag.order = order
    
    await tag.save()
    
    res.json({
      id: tag._id,
      ...tag.toObject()
    })
  } catch (err) {
    console.error('Update tag error:', err)
    res.status(500).json({ error: 'Etiket güncellenemedi' })
  }
})

app.delete('/api/tags/:id', authMiddleware, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id)
    if (!tag) {
      return res.status(404).json({ error: 'Etiket bulunamadı' })
    }
    
    if (!await checkBranchAccess(req.user, tag.branch)) return res.status(403).json({ error: 'Access denied' })
    
    await Product.updateMany(
      { tags: tag._id },
      { $pull: { tags: tag._id } }
    )
    
    await Tag.findByIdAndDelete(req.params.id)
    
    res.json({ success: true, message: 'Etiket silindi' })
  } catch (err) {
    console.error('Delete tag error:', err)
    res.status(500).json({ error: 'Etiket silinemedi' })
  }
})

app.put('/api/branches/:branchId/tags/reorder', authMiddleware, async (req, res) => {
  try {
    if (!await checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    
    const { tagIds } = req.body
    
    if (!Array.isArray(tagIds)) {
      return res.status(400).json({ error: 'Geçersiz veri' })
    }
    
    await Promise.all(tagIds.map((id, index) => 
      Tag.findByIdAndUpdate(id, { order: index })
    ))
    
    res.json({ success: true })
  } catch (err) {
    console.error('Reorder tags error:', err)
    res.status(500).json({ error: 'Sıralama kaydedilemedi' })
  }
})

// ==================== DASHBOARD ====================
app.get('/api/branches/:branchId/dashboard', authMiddleware, async (req, res) => {
  try {
    const { branchId } = req.params
    const { section } = req.query
    
    const branch = await Branch.findById(branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branchId)) return res.status(403).json({ error: 'Access denied' })
    
    const sectionFilter = section ? { section: section } : {}
    const branchFilter = { branch: branchId, ...sectionFilter }
    
    const [productCount, categoryCount, sectionCount, tagCount, reviewCount, glbCount, pendingReviewCount, campaignCount] = await Promise.all([
      Product.countDocuments(branchFilter),
      Category.countDocuments(branchFilter),
      Section.countDocuments({ branch: branchId }),
      Tag.countDocuments({ branch: branchId }),
      Review.countDocuments({ branch: branchId }),
      GlbFile.countDocuments({ branch: branchId }),
      Review.countDocuments({ branch: branchId, isApproved: false }),
      Product.countDocuments({ ...branchFilter, isCampaign: true })
    ])

    const recentReviews = await Review.find({ branch: branchId }).sort({ createdAt: -1 }).limit(5).populate('product', 'name')
    
    const topProducts = await Product.find(branchFilter).sort({ viewCount: -1 }).limit(5).select('name viewCount thumbnail')
    
    const campaignProducts = await Product.find({ ...branchFilter, isCampaign: true }).select('name price campaignPrice thumbnail')
    
    const categoryStats = await Product.aggregate([
      { $match: { branch: new mongoose.Types.ObjectId(branchId), ...(section ? { section: new mongoose.Types.ObjectId(section) } : {}) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $project: { name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Kategorisiz'] }, count: 1 } }
    ])

    const avgRating = await Review.aggregate([
      { $match: { branch: new mongoose.Types.ObjectId(branchId) } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ])

    const ratingStats = await Review.aggregate([
      { $match: { branch: new mongoose.Types.ObjectId(branchId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    res.json({
      counts: { 
        products: productCount, categories: categoryCount, sections: sectionCount,
        tags: tagCount, reviews: reviewCount, glbFiles: glbCount, 
        pendingReviews: pendingReviewCount, campaigns: campaignCount
      },
      recentReviews, topProducts, categoryStats, campaignProducts,
      averageRating: avgRating[0]?.avg || 0, ratingStats
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/restaurants/:restaurantId/dashboard', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params
    
    if (!checkRestaurantAccess(req.user, restaurantId)) return res.status(403).json({ error: 'Access denied' })
    
    const [branchCount, productCount, categoryCount, reviewCount, userCount] = await Promise.all([
      Branch.countDocuments({ restaurant: restaurantId }),
      Product.countDocuments({ restaurant: restaurantId }),
      Category.countDocuments({ restaurant: restaurantId }),
      Review.countDocuments({ restaurant: restaurantId }),
      User.countDocuments({ restaurants: restaurantId })
    ])
    
    const branchStats = await Product.aggregate([
      { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
      { $group: { _id: '$branch', count: { $sum: 1 } } },
      { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branch' } },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$branch.name', count: 1 } }
    ])
    
    const recentReviews = await Review.find({ restaurant: restaurantId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('product', 'name')
      .populate('branch', 'name')
    
    res.json({
      counts: { branches: branchCount, products: productCount, categories: categoryCount, reviews: reviewCount, users: userCount },
      branchStats,
      recentReviews
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/dashboard/global', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    
    const [restaurantCount, branchCount, productCount, categoryCount, reviewCount, userCount] = await Promise.all([
      Restaurant.countDocuments(),
      Branch.countDocuments(), 
      Product.countDocuments(), 
      Category.countDocuments(), 
      Review.countDocuments(), 
      User.countDocuments()
    ])
    
    const restaurantStats = await Product.aggregate([
      { $group: { _id: '$restaurant', count: { $sum: 1 } } },
      { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
      { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$restaurant.name', count: 1 } }
    ])
    
    const recentRestaurants = await Restaurant.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name slug logo createdAt')
    
    res.json({ 
      counts: { restaurants: restaurantCount, branches: branchCount, products: productCount, categories: categoryCount, reviews: reviewCount, users: userCount }, 
      restaurantStats,
      recentRestaurants
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== CATEGORIES ====================
app.get('/api/branches/:branchId/categories', authMiddleware, async (req, res) => {
  try {
    const { section } = req.query
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const filter = { branch: req.params.branchId }
    if (section) filter.section = section
    
    const categories = await Category.find(filter).populate('section', 'name').sort({ order: 1 })
    const counts = await Product.aggregate([
      { $match: { branch: new mongoose.Types.ObjectId(req.params.branchId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    const countMap = {}
    counts.forEach(c => { if (c._id) countMap[c._id.toString()] = c.count })
    res.json(categories.map(c => ({ 
      ...c.toObject(), 
      id: c._id,
      nameEN: c.nameEN || '',
      productCount: countMap[c._id.toString()] || 0,
      sectionName: c.section?.name
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/categories', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const order = await Category.countDocuments({ branch: req.params.branchId })
    const category = await Category.create({ 
      ...req.body, 
      order, 
      branch: req.params.branchId,
      restaurant: branch.restaurant
    })
    res.status(201).json({ ...category.toObject(), id: category._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Kategori sıralama - :id route'undan ÖNCE olmalı
app.put('/api/categories/reorder', authMiddleware, async (req, res) => {
  try {
    const { orders } = req.body
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: 'Orders array required' })
    }

    for (const item of orders) {
      await Category.findByIdAndUpdate(item.id, { order: item.order })
    }

    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, category.branch)) return res.status(403).json({ error: 'Access denied' })

    Object.assign(category, req.body)
    await category.save()
    res.json({ ...category.toObject(), id: category._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, category.branch)) return res.status(403).json({ error: 'Access denied' })

    await Product.updateMany({ category: category._id }, { category: null })
    await category.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/categories/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, category.branch)) return res.status(403).json({ error: 'Access denied' })
    
    category.image = req.file.filename
    await category.save()
    res.json({ ...category.toObject(), id: category._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== CATEGORY LAYOUTS ====================
app.get('/api/branches/:branchId/category-layouts', authMiddleware, async (req, res) => {
  try {
    const { section } = req.query
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const filter = { branch: req.params.branchId }
    if (section) filter.section = section
    
    const layouts = await CategoryLayout.find(filter)
      .populate('categories.category', 'name nameEN icon image')
      .sort({ rowOrder: 1 })
    res.json(layouts.map(l => ({ ...l.toObject(), id: l._id })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/category-layouts', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const layout = await CategoryLayout.create({ 
      ...req.body, 
      branch: req.params.branchId,
      restaurant: branch.restaurant
    })
    res.status(201).json({ ...layout.toObject(), id: layout._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/category-layouts/:id', authMiddleware, async (req, res) => {
  try {
    const layout = await CategoryLayout.findById(req.params.id)
    if (!layout) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, layout.branch)) return res.status(403).json({ error: 'Access denied' })
    
    Object.assign(layout, req.body)
    await layout.save()
    res.json({ ...layout.toObject(), id: layout._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/category-layouts/:id', authMiddleware, async (req, res) => {
  try {
    const layout = await CategoryLayout.findById(req.params.id)
    if (!layout) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, layout.branch)) return res.status(403).json({ error: 'Access denied' })
    
    await CategoryLayout.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/branches/:branchId/category-layouts/bulk', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const { layouts, section } = req.body
    
    const filter = { branch: req.params.branchId }
    filter.section = section || null
    await CategoryLayout.deleteMany(filter)
    
    if (layouts && layouts.length > 0) {
      const layoutsToInsert = layouts.map((l, index) => ({
        branch: req.params.branchId,
        restaurant: branch.restaurant,
        section: section || null,
        rowOrder: l.rowOrder !== undefined ? l.rowOrder : index,
        categories: l.categories.map(c => ({
          category: c.category?.id || c.category?._id || c.category,
          size: c.size || 'half'
        }))
      }))
      
      await CategoryLayout.insertMany(layoutsToInsert)
    }
    
    const newLayouts = await CategoryLayout.find(filter)
      .populate('categories.category', 'name nameEN icon image')
      .sort({ rowOrder: 1 })
    
    res.json(newLayouts.map(l => ({ 
      ...l.toObject(), 
      id: l._id 
    })))
  } catch (err) { 
    console.error('Layout kaydetme hatası:', err)
    res.status(500).json({ error: err.message }) 
  }
})

// ==================== PRODUCTS ====================
app.get('/api/branches/:branchId/products', authMiddleware, async (req, res) => {
  try {
    const { category, section, search, isActive, isFeatured, isCampaign, hasGlb, page = 1, limit = 50 } = req.query
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const filter = { branch: req.params.branchId }
    
    if (category) filter.category = category
    if (section) filter.section = section
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true'
    if (isCampaign !== undefined) filter.isCampaign = isCampaign === 'true'
    if (hasGlb === 'true') filter.glbFile = { $ne: null }
    if (hasGlb === 'false') filter.glbFile = null
    if (search) filter.name = { $regex: search, $options: 'i' }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name nameEN icon')
        .populate('section', 'name icon')
        .populate('tags', 'name slug icon color')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter)
    ])
    
    res.json({
      products: products.map(p => ({
        ...p.toObject(), id: p._id, 
        categoryId: p.category?._id, 
        categoryName: p.category?.name, 
        categoryNameEN: p.category?.nameEN || '',
        categoryIcon: p.category?.icon,
        sectionId: p.section?._id, sectionName: p.section?.name,
        hasGlb: !!p.glbFile,
        tags: p.tags?.map(t => ({
          id: t._id,
          name: t.name,
          slug: t.slug,
          icon: t.icon,
          color: t.color
        })) || []
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/products', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const data = { ...req.body, branch: req.params.branchId, restaurant: branch.restaurant }
    if (data.categoryId) { data.category = data.categoryId; delete data.categoryId }
    if (data.sectionId) { data.section = data.sectionId; delete data.sectionId }
    
    const product = await Product.create(data)
    res.status(201).json({ ...product.toObject(), id: product._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Ürün sıralama - :id route'undan ÖNCE olmalı
app.put('/api/products/reorder', authMiddleware, async (req, res) => {
  try {
    const { orders } = req.body
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: 'Orders array required' })
    }

    for (const item of orders) {
      await Product.findByIdAndUpdate(item.id, { order: item.order })
    }

    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, product.branch)) return res.status(403).json({ error: 'Access denied' })
    
    const data = { ...req.body }
    if (data.categoryId !== undefined) { data.category = data.categoryId || null; delete data.categoryId }
    if (data.sectionId !== undefined) { data.section = data.sectionId || null; delete data.sectionId }
    
    Object.assign(product, data)
    await product.save()
    res.json({ ...product.toObject(), id: product._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, product.branch)) return res.status(403).json({ error: 'Access denied' })
    
    if (product.glbFile) await GlbFile.findOneAndUpdate({ filename: product.glbFile }, { assignedTo: null })
    await product.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/products/:id/thumbnail', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, product.branch)) return res.status(403).json({ error: 'Access denied' })
    
    product.thumbnail = req.file.filename
    await product.save()
    res.json({ ...product.toObject(), id: product._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/products/:id/assign-glb', authMiddleware, async (req, res) => {
  try {
    const { glbFile } = req.body
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, product.branch)) return res.status(403).json({ error: 'Access denied' })
    
    if (product.glbFile && product.glbFile !== glbFile) {
      await GlbFile.findOneAndUpdate({ filename: product.glbFile }, { assignedTo: null })
    }
    if (glbFile) {
      await GlbFile.findOneAndUpdate(
        { filename: glbFile }, 
        { assignedTo: product._id, branch: product.branch, restaurant: product.restaurant }
      )
    }
    product.glbFile = glbFile || null
    await product.save()
    res.json({ ...product.toObject(), id: product._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/products/:id/section-prices', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, product.branch)) return res.status(403).json({ error: 'Access denied' })
    
    product.sectionPrices = req.body.sectionPrices || []
    await product.save()
    res.json({ ...product.toObject(), id: product._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/products/bulk', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const { action, ids, data } = req.body
    if (action === 'delete') await Product.deleteMany({ _id: { $in: ids }, branch: req.params.branchId })
    else if (action === 'update') await Product.updateMany({ _id: { $in: ids }, branch: req.params.branchId }, data)
    res.json({ success: true, affected: ids.length })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== GLB FILES ====================
app.get('/api/branches/:branchId/glb', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const outputsDir = path.join(__dirname, 'outputs')
    
    if (!fs.existsSync(outputsDir)) {
      fs.mkdirSync(outputsDir, { recursive: true })
      return res.json([])
    }

    const files = fs.readdirSync(outputsDir).filter(f => f.toLowerCase().endsWith('.glb'))
    
    const products = await Product.find({ 
      branch: req.params.branchId, 
      glbFile: { $ne: null } 
    }).select('name glbFile')
    
    const assignedMap = {}
    products.forEach(p => {
      if (p.glbFile) assignedMap[p.glbFile] = p.name
    })

    const result = files.map(filename => {
      const filePath = path.join(outputsDir, filename)
      let stats = { size: 0, mtime: new Date() }
      try {
        stats = fs.statSync(filePath)
      } catch (e) {}
      
      return {
        filename,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        uploadedAt: stats.mtime,
        isAssigned: !!assignedMap[filename],
        assignedTo: assignedMap[filename] || null
      }
    })

    res.json(result)
  } catch (err) {
    console.error('GLB listesi hatası:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/glb/list', apiKeyMiddleware, async (req, res) => {
  try {
    const outputsDir = path.join(__dirname, 'outputs')
    
    if (!fs.existsSync(outputsDir)) {
      return res.json({ files: [] })
    }

    const files = fs.readdirSync(outputsDir).filter(f => f.toLowerCase().endsWith('.glb'))
    
    const products = await Product.find({ glbFile: { $ne: null } }).select('name glbFile')
    const assignedMap = {}
    products.forEach(p => {
      if (p.glbFile) assignedMap[p.glbFile] = p.name
    })

    const result = files.map(filename => {
      const filePath = path.join(outputsDir, filename)
      let stats = { size: 0, mtime: new Date() }
      try {
        stats = fs.statSync(filePath)
      } catch (e) {}
      
      return {
        name: filename,
        filename,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        uploadedAt: stats.mtime,
        assignedTo: assignedMap[filename] || null
      }
    })

    res.json({ files: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/glb/upload', apiKeyMiddleware, upload.single('file'), async (req, res) => {
  try {
    const filename = req.body.name || req.file.filename
    const finalPath = path.join(__dirname, 'outputs', filename)
    if (req.body.name && req.body.name !== req.file.filename) fs.renameSync(req.file.path, finalPath)
    
    let glbFile = await GlbFile.findOne({ filename })
    if (glbFile) { 
      glbFile.size = req.file.size
      await glbFile.save() 
    } else {
      // Restaurant ID header'dan veya body'den alınabilir
      const restaurantId = req.body.restaurantId || req.headers['x-restaurant-id']
      glbFile = await GlbFile.create({ 
        filename, 
        originalName: req.file.originalname, 
        size: req.file.size,
        restaurant: restaurantId || null
      })
    }
    res.json({ success: true, filename, size: req.file.size })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/glb/:filename', apiKeyMiddleware, async (req, res) => {
  try {
    const glbFile = await GlbFile.findOne({ filename: req.params.filename })
    if (glbFile) {
      if (glbFile.assignedTo) await Product.findByIdAndUpdate(glbFile.assignedTo, { glbFile: null })
      await glbFile.deleteOne()
    }
    const filePath = path.join(__dirname, 'outputs', req.params.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    await Product.updateMany({ glbFile: req.params.filename }, { glbFile: null })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== ANNOUNCEMENTS ====================
app.get('/api/branches/:branchId/announcements', authMiddleware, async (req, res) => {
  try {
    const { section } = req.query
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const filter = { branch: req.params.branchId }
    if (section) filter.section = section
    
    const announcements = await Announcement.find(filter)
      .populate('section', 'name icon')
      .sort({ order: 1 })
    res.json(announcements.map(a => ({ 
      ...a.toObject(), 
      id: a._id,
      sectionName: a.section?.name
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/announcements', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const announcement = await Announcement.create({ 
      ...req.body, 
      branch: req.params.branchId,
      restaurant: branch.restaurant
    })
    res.status(201).json({ ...announcement.toObject(), id: announcement._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/announcements/:id', authMiddleware, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
    if (!announcement) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, announcement.branch)) return res.status(403).json({ error: 'Access denied' })
    
    Object.assign(announcement, req.body)
    await announcement.save()
    res.json({ ...announcement.toObject(), id: announcement._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/announcements/:id', authMiddleware, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
    if (!announcement) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, announcement.branch)) return res.status(403).json({ error: 'Access denied' })
    
    await Announcement.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== REVIEWS ====================
app.get('/api/branches/:branchId/reviews', authMiddleware, async (req, res) => {
  try {
    const { isApproved, page = 1, limit = 50 } = req.query
    const branch = await Branch.findById(req.params.branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    if (!await checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    
    const filter = { branch: req.params.branchId }
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true'
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [reviews, total] = await Promise.all([
      Review.find(filter).populate('product', 'name thumbnail').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Review.countDocuments(filter)
    ])
    res.json({
      reviews: reviews.map(r => ({ ...r.toObject(), id: r._id, productName: r.product?.name })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/reviews/:id/approve', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, review.branch)) return res.status(403).json({ error: 'Access denied' })
    
    review.isApproved = true
    await review.save()
    res.json({ ...review.toObject(), id: review._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/reviews/:id/reply', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, review.branch)) return res.status(403).json({ error: 'Access denied' })
    
    review.reply = req.body.reply
    review.repliedAt = new Date()
    await review.save()
    res.json({ ...review.toObject(), id: review._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/reviews/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ error: 'Not found' })
    if (!await checkBranchAccess(req.user, review.branch)) return res.status(403).json({ error: 'Access denied' })
    
    await Review.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== USERS ====================
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const { restaurant: restaurantId } = req.query
    
    let filter = {}
    if (req.user.role === 'superadmin') {
      if (restaurantId) {
        filter.restaurants = restaurantId
      }
    } else {
      // Admin sadece kendi restoranlarındaki kullanıcıları görebilir
      const userRestaurantIds = req.user.restaurants.map(r => r._id)
      filter.restaurants = { $in: userRestaurantIds }
    }
    
    const users = await User.find(filter)
      .select('-password')
      .populate('restaurants', 'name slug')
      .populate('branches', 'name slug')
      .sort({ createdAt: -1 })
    res.json(users.map(u => ({ ...u.toObject(), id: u._id })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Restoran için kullanıcılar
app.get('/api/restaurants/:restaurantId/users', authMiddleware, async (req, res) => {
  try {
    if (!checkRestaurantAccess(req.user, req.params.restaurantId)) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    const users = await User.find({ restaurants: req.params.restaurantId })
      .select('-password')
      .populate('restaurants', 'name slug')
      .populate('branches', 'name slug')
      .sort({ createdAt: -1 })
    
    res.json(users.map(u => ({ ...u.toObject(), id: u._id })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users', authMiddleware, async (req, res) => {
  try {
    const { username, email, password, role, fullName, phone, restaurants, branches } = req.body
    
    // Sadece superadmin her yerde kullanıcı oluşturabilir
    // Admin sadece kendi restoranlarına kullanıcı ekleyebilir
    if (req.user.role !== 'superadmin') {
      if (role === 'superadmin') {
        return res.status(403).json({ error: 'Cannot create superadmin' })
      }
      
      // Gelen restaurant ID'lerin hepsine erişimi var mı kontrol et
      const userRestaurantIds = req.user.restaurants.map(r => r._id.toString())
      const hasAccess = restaurants?.every(rId => userRestaurantIds.includes(rId.toString()))
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to some restaurants' })
      }
    }
    
    const user = await User.create({ 
      username, 
      email, 
      password: await bcrypt.hash(password, 10), 
      role: role || 'staff', 
      fullName,
      phone,
      restaurants: restaurants || [],
      branches: branches || []
    })
    res.status(201).json({ id: user._id, username, email, role: user.role })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Restoran için kullanıcı oluştur
app.post('/api/restaurants/:restaurantId/users', authMiddleware, async (req, res) => {
  try {
    if (!checkRestaurantAccess(req.user, req.params.restaurantId)) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    const { username, email, password, role, fullName, phone, branches } = req.body
    
    if (role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot create superadmin' })
    }
    
    const user = await User.create({ 
      username, 
      email, 
      password: await bcrypt.hash(password, 10), 
      role: role || 'staff', 
      fullName,
      phone,
      restaurants: [req.params.restaurantId],
      branches: branches || []
    })
    
    res.status(201).json({ id: user._id, username, email, role: user.role })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id)
    if (!targetUser) return res.status(404).json({ error: 'User not found' })
    
    // Kendi profilini düzenleyebilir
    const isOwnProfile = req.user._id.toString() === req.params.id
    
    if (!isOwnProfile) {
      // Başkasını düzenlemek için yetki kontrolü
      if (req.user.role !== 'superadmin') {
        // Admin sadece kendi restoranlarındaki kullanıcıları düzenleyebilir
        const userRestaurantIds = req.user.restaurants.map(r => r._id.toString())
        const targetRestaurantIds = targetUser.restaurants.map(r => r.toString())
        const hasAccess = targetRestaurantIds.some(id => userRestaurantIds.includes(id))
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' })
        }
      }
    }
    
    const data = { ...req.body }
    
    // Şifre değişikliği
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    } else {
      delete data.password
    }
    
    // Superadmin olmayan biri superadmin yapamaz
    if (req.user.role !== 'superadmin' && data.role === 'superadmin') {
      delete data.role
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true })
      .select('-password')
      .populate('restaurants', 'name slug')
      .populate('branches', 'name slug')
    
    res.json({ ...user.toObject(), id: user._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Kullanıcı şifresini sıfırla (Admin için)
app.put('/api/users/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id)
    if (!targetUser) return res.status(404).json({ error: 'User not found' })
    
    // Yetki kontrolü
    if (req.user.role !== 'superadmin') {
      const userRestaurantIds = req.user.restaurants.map(r => r._id.toString())
      const targetRestaurantIds = targetUser.restaurants.map(r => r.toString())
      const hasAccess = targetRestaurantIds.some(id => userRestaurantIds.includes(id))
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }
    
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    
    targetUser.password = await bcrypt.hash(newPassword, 10)
    await targetUser.save()
    
    res.json({ success: true, message: 'Password reset successfully' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Kullanıcı avatar yükle
app.post('/api/users/:id/avatar', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id)
    if (!targetUser) return res.status(404).json({ error: 'User not found' })

    // Yetki kontrolü - sadece superadmin veya aynı restoran admini
    if (req.user.role !== 'superadmin' && req.user._id.toString() !== req.params.id) {
      const userRestaurantIds = req.user.restaurants.map(r => r._id.toString())
      const targetRestaurantIds = targetUser.restaurants.map(r => r.toString())
      const hasAccess = targetRestaurantIds.some(id => userRestaurantIds.includes(id))
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    targetUser.avatar = req.file.filename
    await targetUser.save()

    res.json({ ...targetUser.toObject(), id: targetUser._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id)
    if (!targetUser) return res.status(404).json({ error: 'User not found' })
    
    // Kendini silemez
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' })
    }
    
    // Superadmin'i sadece superadmin silebilir
    if (targetUser.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete superadmin' })
    }
    
    // Admin sadece kendi restoranlarındaki kullanıcıları silebilir
    if (req.user.role !== 'superadmin') {
      const userRestaurantIds = req.user.restaurants.map(r => r._id.toString())
      const targetRestaurantIds = targetUser.restaurants.map(r => r.toString())
      const hasAccess = targetRestaurantIds.some(id => userRestaurantIds.includes(id))
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }
    
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== MIGRATION HELPER ====================
// Mevcut verileri yeni yapıya taşımak için (bir kez çalıştırılır)
app.post('/api/admin/migrate-to-multi-tenant', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    
    // Mevcut branch'leri kontrol et
    const branchesWithoutRestaurant = await Branch.find({ restaurant: { $exists: false } })
    
    if (branchesWithoutRestaurant.length === 0) {
      return res.json({ message: 'Migration not needed or already completed' })
    }
    
    const results = {
      restaurantsCreated: 0,
      branchesUpdated: 0,
      productsUpdated: 0,
      categoriesUpdated: 0,
      errors: []
    }
    
    // Her branch için bir restaurant oluştur (veya mevcut olanı kullan)
    for (const branch of branchesWithoutRestaurant) {
      try {
        // Aynı isimde restaurant var mı?
        let restaurant = await Restaurant.findOne({ slug: branch.slug })
        
        if (!restaurant) {
          restaurant = await Restaurant.create({
            name: branch.name,
            slug: branch.slug,
            description: branch.description,
            logo: branch.logo,
            contactPhone: branch.phone,
            address: branch.address
          })
          results.restaurantsCreated++
        }
        
        // Branch'i güncelle
        branch.restaurant = restaurant._id
        await branch.save()
        results.branchesUpdated++
        
        // İlişkili verileri güncelle
        await Promise.all([
          Product.updateMany({ branch: branch._id }, { restaurant: restaurant._id }),
          Category.updateMany({ branch: branch._id }, { restaurant: restaurant._id }),
          Section.updateMany({ branch: branch._id }, { restaurant: restaurant._id }),
          Tag.updateMany({ branch: branch._id }, { restaurant: restaurant._id }),
          CategoryLayout.updateMany({ branch: branch._id }, { restaurant: restaurant._id }),
          Announcement.updateMany({ branch: branch._id }, { restaurant: restaurant._id }),
          Review.updateMany({ branch: branch._id }, { restaurant: restaurant._id }),
          GlbFile.updateMany({ branch: branch._id }, { restaurant: restaurant._id })
        ])
        
        results.productsUpdated += await Product.countDocuments({ branch: branch._id })
        results.categoriesUpdated += await Category.countDocuments({ branch: branch._id })
        
      } catch (err) {
        results.errors.push({ branch: branch.name, error: err.message })
      }
    }
    
    // Kullanıcıları güncelle - branches -> restaurants
    const usersWithBranches = await User.find({ 
      branches: { $exists: true, $ne: [] },
      restaurants: { $exists: false }
    })
    
    for (const user of usersWithBranches) {
      const branches = await Branch.find({ _id: { $in: user.branches } })
      const restaurantIds = [...new Set(branches.map(b => b.restaurant).filter(Boolean))]
      user.restaurants = restaurantIds
      await user.save()
    }
    
    res.json({ success: true, results })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== START ====================
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server: http://localhost:${PORT}`)
      console.log('📱 Multi-tenant AR Menu Backend Ready')
    })
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1) })