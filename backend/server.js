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
const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ar-menu'
const JWT_SECRET = process.env.JWT_SECRET || 'ar-menu-secret-key-change-in-production'
const API_KEY = process.env.API_KEY || 'your-secret-api-key'

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
  image: { type: String, default: null },           // Şube ana görseli
  logo: { type: String, default: null },            // Şube logosu
  banner: { type: String, default: null },          // Banner görseli
  homepageImage: { type: String, default: null },   // YENİ: Menü sayfası üst görsel
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

// Category
const categorySchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  icon: { type: String, default: '📁' },
  image: { type: String, default: null },           // Kategori görseli
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  description: { type: String, default: '' },
  layoutSize: { type: String, enum: ['full', 'half', 'third'], default: 'half' }  // YENİ: Yerleşim boyutu
}, { timestamps: true })

// CategoryLayout (YENİ) - Satır bazlı kategori düzeni
const categoryLayoutSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  rowOrder: { type: Number, default: 0 },           // Satır sırası
  categories: [{                                     // Bu satırdaki kategoriler
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    size: { type: String, enum: ['full', 'half', 'third'], default: 'half' }
  }]
}, { timestamps: true })

// Product
const productSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  thumbnail: { type: String, default: null },       // Ürün görseli
  images: [{ type: String }],                       // Ek görseller
  glbFile: { type: String, default: null },         // 3D model dosyası
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },    // Öne çıkan ürün
  isCampaign: { type: Boolean, default: false },    // Kampanyalı mı?
  campaignPrice: { type: Number, default: null },   // Kampanya fiyatı
  calories: { type: Number, default: null },
  preparationTime: { type: Number, default: null },
  allergens: [{ type: String }],
  tags: [{ type: String }],
  viewCount: { type: Number, default: 0 }
}, { timestamps: true })

// Announcement
const announcementSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: { type: String, default: '📢' },
  type: { type: String, enum: ['info', 'warning', 'success', 'promo'], default: 'info' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true })

// Review (Görüş ve Yorumlar)
const reviewSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  contact: { type: String, default: '' },           // İletişim bilgisi (telefon/email)
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  customerName: { type: String, default: 'Anonim' },
  isApproved: { type: Boolean, default: false },    // Onay durumu
  reply: { type: String, default: '' },             // İşletme yanıtı
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
const Category = mongoose.model('Category', categorySchema)
const CategoryLayout = mongoose.model('CategoryLayout', categoryLayoutSchema)  // YENİ
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

// ==================== MIDDLEWARE ====================
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

// Get branch details
app.get('/api/public/branches/:slug', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug, isActive: true })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    res.json({
      id: branch._id, name: branch.name, slug: branch.slug, description: branch.description,
      image: branch.image, logo: branch.logo, banner: branch.banner,
      homepageImage: branch.homepageImage,  // YENİ
      address: branch.address, phone: branch.phone, whatsapp: branch.whatsapp, 
      instagram: branch.instagram, workingHours: branch.workingHours, theme: branch.theme
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get categories with layout info
app.get('/api/public/branches/:slug/categories', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    const categories = await Category.find({ branch: branch._id, isActive: true }).sort({ order: 1 })
    res.json(categories.map(c => ({ 
      id: c._id, name: c.name, icon: c.icon, image: c.image, 
      description: c.description, layoutSize: c.layoutSize  // YENİ
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get category layouts
app.get('/api/public/branches/:slug/category-layouts', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    const layouts = await CategoryLayout.find({ branch: branch._id })
      .populate('categories.category', 'name icon image description')
      .sort({ rowOrder: 1 })
    res.json(layouts)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get products
app.get('/api/public/branches/:slug/products', async (req, res) => {
  try {
    const branch = await Branch.findOne({ slug: req.params.slug })
    if (!branch) return res.status(404).json({ error: 'Branch not found' })
    const filter = { branch: branch._id, isActive: true }
    if (req.query.category) filter.category = req.query.category
    if (req.query.isCampaign === 'true') filter.isCampaign = true  // YENİ: Kampanya filtresi
    if (req.query.isFeatured === 'true') filter.isFeatured = true  // YENİ: Öne çıkan filtresi
    const products = await Product.find(filter).populate('category', 'name icon').sort({ isFeatured: -1, name: 1 })
    res.json(products.map(p => ({
      id: p._id, name: p.name, price: p.price, description: p.description,
      thumbnail: p.thumbnail, glbFile: p.glbFile, hasGlb: !!p.glbFile,
      isFeatured: p.isFeatured, isCampaign: p.isCampaign, campaignPrice: p.campaignPrice,
      calories: p.calories, preparationTime: p.preparationTime,
      category: p.category ? { id: p.category._id, name: p.category.name, icon: p.category.icon } : null
    })))
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

// Get approved reviews (YENİ - Public)
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
    
    res.json(branches.map(b => ({ ...b.toObject(), id: b._id, productCount: countMap[b._id.toString()] || 0 })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
    if (!branch) return res.status(404).json({ error: 'Not found' })
    res.json({ ...branch.toObject(), id: branch._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    let slug = req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
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
      Category.deleteMany({ branch: branch._id }),
      CategoryLayout.deleteMany({ branch: branch._id }),  // YENİ
      Product.deleteMany({ branch: branch._id }),
      Announcement.deleteMany({ branch: branch._id }),
      Review.deleteMany({ branch: branch._id })
    ])
    await branch.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Branch image upload - tüm görsel tipleri için
app.post('/api/branches/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const field = req.query.type || 'image'  // image, logo, banner, homepageImage
    const allowedFields = ['image', 'logo', 'banner', 'homepageImage']
    if (!allowedFields.includes(field)) return res.status(400).json({ error: 'Invalid image type' })
    
    const branch = await Branch.findByIdAndUpdate(req.params.id, { [field]: req.file.filename }, { new: true })
    res.json({ ...branch.toObject(), id: branch._id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== DASHBOARD ====================
app.get('/api/branches/:branchId/dashboard', authMiddleware, async (req, res) => {
  try {
    const { branchId } = req.params
    if (!checkBranchAccess(req.user, branchId)) return res.status(403).json({ error: 'Access denied' })
    
    const [productCount, categoryCount, reviewCount, glbCount, pendingReviewCount, campaignCount] = await Promise.all([
      Product.countDocuments({ branch: branchId }),
      Category.countDocuments({ branch: branchId }),
      Review.countDocuments({ branch: branchId }),
      GlbFile.countDocuments({ branch: branchId }),
      Review.countDocuments({ branch: branchId, isApproved: false }),
      Product.countDocuments({ branch: branchId, isCampaign: true })  // YENİ
    ])

    const recentReviews = await Review.find({ branch: branchId }).sort({ createdAt: -1 }).limit(5).populate('product', 'name')
    const topProducts = await Product.find({ branch: branchId }).sort({ viewCount: -1 }).limit(5).select('name viewCount thumbnail')
    const campaignProducts = await Product.find({ branch: branchId, isCampaign: true }).select('name price campaignPrice thumbnail')  // YENİ
    
    const categoryStats = await Product.aggregate([
      { $match: { branch: new mongoose.Types.ObjectId(branchId) } },
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
        products: productCount, categories: categoryCount, reviews: reviewCount, 
        glbFiles: glbCount, pendingReviews: pendingReviewCount, campaigns: campaignCount  // YENİ
      },
      recentReviews, topProducts, categoryStats, campaignProducts,  // YENİ
      averageRating: avgRating[0]?.avg || 0, ratingStats
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/dashboard/global', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' })
    const [branchCount, productCount, categoryCount, reviewCount, userCount] = await Promise.all([
      Branch.countDocuments(), Product.countDocuments(), Category.countDocuments(), Review.countDocuments(), User.countDocuments()
    ])
    const branchStats = await Product.aggregate([
      { $group: { _id: '$branch', count: { $sum: 1 } } },
      { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branch' } },
      { $unwind: '$branch' },
      { $project: { name: '$branch.name', count: 1 } }
    ])
    res.json({ counts: { branches: branchCount, products: productCount, categories: categoryCount, reviews: reviewCount, users: userCount }, branchStats })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== CATEGORIES ====================
app.get('/api/branches/:branchId/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find({ branch: req.params.branchId }).sort({ order: 1 })
    const counts = await Product.aggregate([
      { $match: { branch: new mongoose.Types.ObjectId(req.params.branchId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    const countMap = {}
    counts.forEach(c => { if (c._id) countMap[c._id.toString()] = c.count })
    res.json(categories.map(c => ({ 
      ...c.toObject(), id: c._id, productCount: countMap[c._id.toString()] || 0 
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/categories', authMiddleware, async (req, res) => {
  try {
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const category = await Category.create({ ...req.body, branch: req.params.branchId })
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

// ==================== CATEGORY LAYOUTS (YENİ) ====================
app.get('/api/branches/:branchId/category-layouts', authMiddleware, async (req, res) => {
  try {
    const layouts = await CategoryLayout.find({ branch: req.params.branchId })
      .populate('categories.category', 'name icon image')
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

// Tüm layout'ları tek seferde kaydet
app.put('/api/branches/:branchId/category-layouts/bulk', authMiddleware, async (req, res) => {
  try {
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const { layouts } = req.body
    
    // Mevcut layout'ları sil
    await CategoryLayout.deleteMany({ branch: req.params.branchId })
    
    // Yeni layout'ları ekle
    if (layouts && layouts.length > 0) {
      await CategoryLayout.insertMany(layouts.map(l => ({ ...l, branch: req.params.branchId })))
    }
    
    const newLayouts = await CategoryLayout.find({ branch: req.params.branchId })
      .populate('categories.category', 'name icon image')
      .sort({ rowOrder: 1 })
    res.json(newLayouts)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== PRODUCTS ====================
app.get('/api/branches/:branchId/products', authMiddleware, async (req, res) => {
  try {
    const { category, search, isActive, isFeatured, isCampaign, hasGlb, page = 1, limit = 50 } = req.query
    const filter = { branch: req.params.branchId }
    if (category) filter.category = category
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true'
    if (isCampaign !== undefined) filter.isCampaign = isCampaign === 'true'
    if (hasGlb === 'true') filter.glbFile = { $ne: null }
    if (hasGlb === 'false') filter.glbFile = null
    if (search) filter.name = { $regex: search, $options: 'i' }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [products, total] = await Promise.all([
      Product.find(filter).populate('category', 'name icon').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(filter)
    ])
    
    res.json({
      products: products.map(p => ({
        ...p.toObject(), id: p._id, categoryId: p.category?._id, categoryName: p.category?.name,
        categoryIcon: p.category?.icon, hasGlb: !!p.glbFile
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/branches/:branchId/products', authMiddleware, async (req, res) => {
  try {
    if (!checkBranchAccess(req.user, req.params.branchId)) return res.status(403).json({ error: 'Access denied' })
    const data = { ...req.body, branch: req.params.branchId }
    if (data.categoryId) { data.category = data.categoryId; delete data.categoryId }
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
    const files = await GlbFile.find({ $or: [{ branch: req.params.branchId }, { branch: null }] }).populate('assignedTo', 'name')
    res.json(files.map(f => ({
      filename: f.filename, size: f.size, sizeFormatted: formatBytes(f.size),
      isAssigned: !!f.assignedTo, assignedTo: f.assignedTo?.name || null,
      assignedToId: f.assignedTo?._id || null, uploadedAt: f.createdAt
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/glb/list', apiKeyMiddleware, async (req, res) => {
  try {
    const files = await GlbFile.find().populate('assignedTo', 'name')
    res.json({ files: files.map(f => ({ name: f.filename, filename: f.filename, size: f.size, uploadedAt: f.createdAt, assignedTo: f.assignedTo?.name || null })) })
  } catch (err) { res.status(500).json({ error: err.message }) }
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
    if (!glbFile) return res.status(404).json({ error: 'Not found' })
    if (glbFile.assignedTo) await Product.findByIdAndUpdate(glbFile.assignedTo, { glbFile: null })
    const filePath = path.join(__dirname, 'outputs', req.params.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    await glbFile.deleteOne()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== ANNOUNCEMENTS ====================
app.get('/api/branches/:branchId/announcements', authMiddleware, async (req, res) => {
  try {
    const announcements = await Announcement.find({ branch: req.params.branchId }).sort({ order: 1, createdAt: -1 })
    res.json(announcements.map(a => ({ ...a.toObject(), id: a._id })))
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