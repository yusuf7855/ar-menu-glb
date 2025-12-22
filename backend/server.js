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
const PORT = 3001;
const MONGODB_URI =  'mongodb://localhost:27017/ar-menu-remi';
const JWT_SECRET =  'ar-menu-secret-key-change-in-production';
const API_KEY = "test123";

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

// Branch (Şube)
const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  image: { type: String, default: null },
  logo: { type: String, default: null },
  banner: { type: String, default: null },
  homepageImage: { type: String, default: null },
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

// Section (Bölüm) - Restoran içi alanlar (Bahçe, Teras, VIP vb.)
const sectionSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '📍' },
  image: { type: String, default: null },
  homepageImage: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  color: { type: String, default: '#e53935' }
}, { timestamps: true })

// Tag (Etiket)
const tagSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  slug: { type: String },
  icon: { type: String, default: '🏷️' },
  color: { type: String, default: '#e53935' },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true })

// Category - nameEN eklendi
const categorySchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
  name: { type: String, required: true },
  nameEN: { type: String, default: '' },  // İngilizce isim
  icon: { type: String, default: '' },
  image: { type: String, default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  description: { type: String, default: '' },
  layoutSize: { type: String, enum: ['full', 'half', 'third'], default: 'half' }
}, { timestamps: true })

// CategoryLayout
const categoryLayoutSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
  rowOrder: { type: Number, default: 0 },
  categories: [{
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    size: { type: String, enum: ['full', 'half', 'third'], default: 'half' }
  }]
}, { timestamps: true })

// Product - tags artık ObjectId array
const productSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
  name: { type: String, required: true },
  nameEN: { type: String, default: '' },           // YENİ
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
  allergensEN: [{ type: String }],                 // YENİ
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  viewCount: { type: Number, default: 0 },
  sectionPrices: [{
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    price: { type: Number, required: true },
    campaignPrice: { type: Number, default: null },
    isActive: { type: Boolean, default: true }
  }]
}, { timestamps: true })

// Announcement
const announcementSchema = new mongoose.Schema({
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
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  filename: { type: String, required: true, unique: true },
  originalName: { type: String },
  size: { type: Number },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }
}, { timestamps: true })

// User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'manager', 'staff'], default: 'staff' },
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  avatar: { type: String, default: null },
  fullName: { type: String, default: '' }
}, { timestamps: true })

// Models
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
    const user = await User.findById(decoded.userId).populate('branches')
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

const checkBranchAccess = (user, branchId) => {
  if (user.role === 'superadmin') return true
  if (!branchId) return false
  return user.branches.some(b => b._id.toString() === branchId.toString())
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

// ==================== TRANSLATE API ====================
app.post('/api/translate', authMiddleware, async (req, res) => {
  try {
    const { text, targetLang = 'en', sourceLang = 'tr' } = req.body
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' })
    }

    // MyMemory Translation API (Ücretsiz, günlük 5000 kelime)
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

// Toplu çeviri endpoint'i
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

// Get all branches for selection screen
app.get('/api/public/branches', async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ order: 1, name: 1 })
    res.json(branches.map(b => ({
      id: b._id, name: b.name, slug: b.slug, description: b.description,
      image: b.image, logo: b.logo, address: b.address, phone: b.phone
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get branch details with sections
app.get('/api/public/branches/:slug', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug, isActive: true })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    
    const sections = await Section.find({ branch: branch._id, isActive: true }).sort({ order: 1 })
    
    res.json({
      id: branch._id,
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
      theme: branch.theme,
      sections: sections.map(s => ({
        id: s._id, name: s.name, slug: s.slug, description: s.description,
        icon: s.icon, image: s.image, homepageImage: s.homepageImage, color: s.color
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
      icon: s.icon, image: s.image, homepageImage: s.homepageImage, color: s.color
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUBLIC: Get all tags for a branch
app.get('/api/public/branches/:slug/tags', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug, isActive: true })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    
    const tags = await Tag.find({ branch: branch._id, isActive: true }).sort({ order: 1, name: 1 })
    
    // Her etiket için aktif ürün sayısını hesapla
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
    
    // Ürünü olan etiketleri döndür
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

// Get categories with layout info - nameEN eklendi
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
      layoutSize: c.layoutSize
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get category layouts (PUBLIC) - nameEN eklendi
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

// Get menu with section filter - nameEN eklendi
app.get('/api/public/branches/:slug/menu', async (req, res) => {
  try {
    const { section: sectionSlug } = req.query
    const branch = await Branch.findOne({ slug: req.params.slug, isActive: true })
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

    // Etiketleri de getir
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
        id: branch._id, name: branch.name, logo: branch.logo,
        banner: branch.banner, homepageImage: homepageImage,
        phone: branch.phone, whatsapp: branch.whatsapp,
        instagram: branch.instagram, address: branch.address,
        workingHours: branch.workingHours, theme: branch.theme
      },
      categories: categories.map(c => ({ 
        id: c._id, 
        name: c.name, 
        nameEN: c.nameEN || '',
        icon: c.icon, 
        image: c.image, 
        description: c.description
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
    const review = await Review.create({ ...req.body, branch: branch._id })
    res.status(201).json({ id: review._id, message: 'Review submitted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ $or: [{ username }, { email: username }] }).populate('branches')
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' })
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' })
    user.lastLogin = new Date()
    await user.save()
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      token,
      user: {
        id: user._id, username: user.username, email: user.email, role: user.role,
        fullName: user.fullName, avatar: user.avatar,
        branches: user.branches.map(b => ({ id: b._id, name: b.name, slug: b.slug }))
      }
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id).populate('branches')
  res.json({
    id: user._id, username: user.username, email: user.email, role: user.role,
    fullName: user.fullName, avatar: user.avatar,
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
    res.json({ token, user: { id: admin._id, username, email, role: 'superadmin', fullName, branches: [] } })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/auth/check-setup', async (req, res) => {
  res.json({ needsSetup: !await User.exists({ role: 'superadmin' }) })
})

// ==================== BRANCHES ====================
app.get('/api/branches', authMiddleware, async (req, res) => {
  try {
    let branches = req.user.role === 'superadmin' 
      ? await Branch.find().sort({ order: 1 })
      : await Branch.find({ _id: { $in: req.user.branches } }).sort({ order: 1 })
    
    const counts = await Product.aggregate([{ $group: { _id: '$branch', count: { $sum: 1 } } }])
    const countMap = {}
    counts.forEach(c => { if (c._id) countMap[c._id.toString()] = c.count })
    
    const sectionCounts = await Section.aggregate([{ $group: { _id: '$branch', count: { $sum: 1 } } }])
    const sectionCountMap = {}
    sectionCounts.forEach(c => { if (c._id) sectionCountMap[c._id.toString()] = c.count })
    
    res.json(branches.map(b => ({ 
      ...b.toObject(), id: b._id, 
      productCount: countMap[b._id.toString()] || 0,
      sectionCount: sectionCountMap[b._id.toString()] || 0
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
    if (!branch) return res.status(404).json({ error: 'Not found' })
    
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
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt
    })
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
})

app.post('/api/branches', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    let slug = req.body.slug || createSlug(req.body.name)
    if (await Branch.findOne({ slug })) slug = slug + '-' + Date.now()
    const branch = await Branch.create({ ...req.body, slug })
    res.status(201).json({ ...branch.toObject(), id: branch._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
    if (!branch) return res.status(404).json({ error: 'Not found' })
    if (!checkBranchAccess(req.user, branch._id)) return res.status(403).json({ error: 'Access denied' })
    Object.assign(branch, req.body)
    await branch.save()
    res.json({ ...branch.toObject(), id: branch._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    const branch = await Branch.findById(req.params.id)
    if (!branch) return res.status(404).json({ error: 'Not found' })
    await Promise.all([
      Section.deleteMany({ branch: branch._id }),
      Tag.deleteMany({ branch: branch._id }),
      Category.deleteMany({ branch: branch._id }),
      CategoryLayout.deleteMany({ branch: branch._id }),
      Product.deleteMany({ branch: branch._id }),
      Announcement.deleteMany({ branch: branch._id }),
      Review.deleteMany({ branch: branch._id })
    ])
    await branch.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const field = req.query.type || 'image'
    const allowedFields = ['image', 'logo', 'banner', 'homepageImage']
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid image type' })
    }
    
    const branch = await Branch.findByIdAndUpdate(
      req.params.id, 
      { [field]: req.file.filename }, 
      { new: true }
    )
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' })
    }
    
    res.json({ 
      ...branch.toObject(), 
      id: branch._id 
    })
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
})

// ==================== SECTIONS ====================
app.get('/api/branches/:branchId/sections', authMiddleware, async (req, res) => {
  try {
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
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    
    const slug = req.body.slug || createSlug(req.body.name)
    const order = await Section.countDocuments({ branch: req.params.branchId })
    
    const section = await Section.create({ 
      ...req.body, slug, order, branch: req.params.branchId 
    })
    res.status(201).json({ ...section.toObject(), id: section._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/sections/:id', authMiddleware, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
    if (!section) return res.status(404).json({ error: 'Not found' })
    if (!checkBranchAccess(req.user, section.branch)) return res.status(403).json({ error: 'Access denied' })
    
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
    if (!checkBranchAccess(req.user, section.branch)) return res.status(403).json({ error: 'Access denied' })
    
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
    const type = req.query.type || 'image'
    const section = await Section.findByIdAndUpdate(req.params.id, { [type]: req.file.filename }, { new: true })
    res.json({ ...section.toObject(), id: section._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/branches/:branchId/sections/reorder', authMiddleware, async (req, res) => {
  try {
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const { sectionIds } = req.body
    await Promise.all(sectionIds.map((id, index) => Section.findByIdAndUpdate(id, { order: index })))
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== TAGS ====================
app.get('/api/branches/:branchId/tags', authMiddleware, async (req, res) => {
  try {
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
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    
    const { name, icon, color, description, isActive } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Etiket adı gerekli' })
    }
    
    // Aynı isimde etiket var mı kontrol et
    const existing = await Tag.findOne({ 
      branch: req.params.branchId, 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    })
    
    if (existing) {
      return res.status(400).json({ error: 'Bu isimde bir etiket zaten var' })
    }
    
    // Slug oluştur
    const slug = createSlug(name)
    
    // Sıra numarası
    const maxOrder = await Tag.findOne({ branch: req.params.branchId })
      .sort({ order: -1 })
      .select('order')
    
    const tag = new Tag({
      branch: req.params.branchId,
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
    
    if (!checkBranchAccess(req.user, tag.branch)) return res.status(403).json({ error: 'Access denied' })
    
    // İsim değiştiyse, aynı isimde başka etiket var mı kontrol et
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
    
    if (!checkBranchAccess(req.user, tag.branch)) return res.status(403).json({ error: 'Access denied' })
    
    // Bu etiketi kullanan ürünlerden kaldır
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
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    
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
    
    if (!checkBranchAccess(req.user, branchId)) return res.status(403).json({ error: 'Access denied' })
    
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

app.get('/api/dashboard/global', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    const [branchCount, productCount, categoryCount, sectionCount, tagCount, reviewCount, userCount] = await Promise.all([
      Branch.countDocuments(), Product.countDocuments(), Category.countDocuments(), 
      Section.countDocuments(), Tag.countDocuments(), Review.countDocuments(), User.countDocuments()
    ])
    const branchStats = await Product.aggregate([
      { $group: { _id: '$branch', count: { $sum: 1 } } },
      { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branch' } },
      { $unwind: '$branch' },
      { $project: { name: '$branch.name', count: 1 } }
    ])
    res.json({ 
      counts: { branches: branchCount, products: productCount, categories: categoryCount, sections: sectionCount, tags: tagCount, reviews: reviewCount, users: userCount }, 
      branchStats 
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== CATEGORIES ==================== (nameEN eklendi)
app.get('/api/branches/:branchId/categories', authMiddleware, async (req, res) => {
  try {
    const { section } = req.query
    const filter = { branch: req.params.branchId }
    
    if (section) {
      filter.section = section
    }
    
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
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const order = await Category.countDocuments({ branch: req.params.branchId })
    const category = await Category.create({ ...req.body, order, branch: req.params.branchId })
    res.status(201).json({ ...category.toObject(), id: category._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: 'Not found' })
    if (!checkBranchAccess(req.user, category.branch)) return res.status(403).json({ error: 'Access denied' })
    Object.assign(category, req.body)
    await category.save()
    res.json({ ...category.toObject(), id: category._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: 'Not found' })
    if (!checkBranchAccess(req.user, category.branch)) return res.status(403).json({ error: 'Access denied' })
    await Product.updateMany({ category: category._id }, { category: null })
    await category.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/categories/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { image: req.file.filename }, { new: true })
    res.json({ ...category.toObject(), id: category._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== CATEGORY LAYOUTS ==================== (nameEN populate eklendi)
app.get('/api/branches/:branchId/category-layouts', authMiddleware, async (req, res) => {
  try {
    const { section } = req.query
    const filter = { branch: req.params.branchId }
    
    if (section) {
      filter.section = section
    }
    
    const layouts = await CategoryLayout.find(filter)
      .populate('categories.category', 'name nameEN icon image')
      .sort({ rowOrder: 1 })
    res.json(layouts.map(l => ({ ...l.toObject(), id: l._id })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/category-layouts', authMiddleware, async (req, res) => {
  try {
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const layout = await CategoryLayout.create({ ...req.body, branch: req.params.branchId })
    res.status(201).json({ ...layout.toObject(), id: layout._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/category-layouts/:id', authMiddleware, async (req, res) => {
  try {
    const layout = await CategoryLayout.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json({ ...layout.toObject(), id: layout._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/category-layouts/:id', authMiddleware, async (req, res) => {
  try {
    await CategoryLayout.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/branches/:branchId/category-layouts/bulk', authMiddleware, async (req, res) => {
  try {
    if (!checkBranchAccess(req.user, req.params.branchId)) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    const { layouts, section } = req.body
    
    const filter = { branch: req.params.branchId }
    filter.section = section || null
    await CategoryLayout.deleteMany(filter)
    
    if (layouts && layouts.length > 0) {
      const layoutsToInsert = layouts.map((l, index) => ({
        branch: req.params.branchId,
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
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const data = { ...req.body, branch: req.params.branchId }
    if (data.categoryId) { data.category = data.categoryId; delete data.categoryId }
    if (data.sectionId) { data.section = data.sectionId; delete data.sectionId }
    // tags zaten ObjectId array olarak geliyor
    const product = await Product.create(data)
    res.status(201).json({ ...product.toObject(), id: product._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    if (!checkBranchAccess(req.user, product.branch)) return res.status(403).json({ error: 'Access denied' })
    const data = { ...req.body }
    if (data.categoryId !== undefined) { data.category = data.categoryId || null; delete data.categoryId }
    if (data.sectionId !== undefined) { data.section = data.sectionId || null; delete data.sectionId }
    // tags zaten ObjectId array olarak geliyor
    Object.assign(product, data)
    await product.save()
    res.json({ ...product.toObject(), id: product._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    if (!checkBranchAccess(req.user, product.branch)) return res.status(403).json({ error: 'Access denied' })
    if (product.glbFile) await GlbFile.findOneAndUpdate({ filename: product.glbFile }, { assignedTo: null })
    await product.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/products/:id/thumbnail', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { thumbnail: req.file.filename }, { new: true })
    res.json({ ...product.toObject(), id: product._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/products/:id/assign-glb', authMiddleware, async (req, res) => {
  try {
    const { glbFile } = req.body
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    if (product.glbFile && product.glbFile !== glbFile) {
      await GlbFile.findOneAndUpdate({ filename: product.glbFile }, { assignedTo: null })
    }
    if (glbFile) {
      await GlbFile.findOneAndUpdate({ filename: glbFile }, { assignedTo: product._id, branch: product.branch })
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
    if (!checkBranchAccess(req.user, product.branch)) return res.status(403).json({ error: 'Access denied' })
    product.sectionPrices = req.body.sectionPrices || []
    await product.save()
    res.json({ ...product.toObject(), id: product._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/products/bulk', authMiddleware, async (req, res) => {
  try {
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const { action, ids, data } = req.body
    if (action === 'delete') await Product.deleteMany({ _id: { $in: ids }, branch: req.params.branchId })
    else if (action === 'update') await Product.updateMany({ _id: { $in: ids }, branch: req.params.branchId }, data)
    res.json({ success: true, affected: ids.length })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== GLB FILES ====================
app.get('/api/branches/:branchId/glb', authMiddleware, async (req, res) => {
  try {
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
    if (glbFile) { glbFile.size = req.file.size; await glbFile.save() }
    else glbFile = await GlbFile.create({ filename, originalName: req.file.originalname, size: req.file.size })
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
    const filter = { branch: req.params.branchId }
    
    if (section) {
      filter.section = section
    }
    
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
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const announcement = await Announcement.create({ ...req.body, branch: req.params.branchId })
    res.status(201).json({ ...announcement.toObject(), id: announcement._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/announcements/:id', authMiddleware, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json({ ...announcement.toObject(), id: announcement._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/announcements/:id', authMiddleware, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== REVIEWS ====================
app.get('/api/branches/:branchId/reviews', authMiddleware, async (req, res) => {
  try {
    const { isApproved, page = 1, limit = 50 } = req.query
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
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true })
    res.json({ ...review.toObject(), id: review._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/reviews/:id/reply', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { reply: req.body.reply, repliedAt: new Date() }, { new: true })
    res.json({ ...review.toObject(), id: review._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/reviews/:id', authMiddleware, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== USERS ====================
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    const users = await User.find().select('-password').populate('branches', 'name slug').sort({ createdAt: -1 })
    res.json(users.map(u => ({ ...u.toObject(), id: u._id })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    const { username, email, password, role, fullName, branches } = req.body
    const user = await User.create({ username, email, password: await bcrypt.hash(password, 10), role, fullName, branches })
    res.status(201).json({ id: user._id, username, email, role })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user._id.toString() !== req.params.id) return res.status(403).json({ error: 'Access denied' })
    const data = { ...req.body }
    if (data.password) data.password = await bcrypt.hash(data.password, 10)
    else delete data.password
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password')
    res.json({ ...user.toObject(), id: user._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    if (req.user._id.toString() === req.params.id) return res.status(400).json({ error: 'Cannot delete yourself' })
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== START ====================
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server: http://localhost:${PORT}`)
    })
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1) })