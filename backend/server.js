const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { exec, spawn } = require('child_process')

const app = express()
const PORT = 3001

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Static files - resimler için tam path
app.use('/images', express.static(path.join(__dirname, 'images'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Cache-Control', 'public, max-age=31536000')
  }
}))
app.use('/outputs', express.static(path.join(__dirname, 'outputs'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Cache-Control', 'public, max-age=31536000')
  }
}))
app.use('/photos', express.static(path.join(__dirname, 'photos'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Cache-Control', 'public, max-age=31536000')
  }
}))

// ==================== DIRECTORIES ====================
const dirs = ['images', 'outputs', 'photos', 'data']
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
})

// ==================== MULTER CONFIG ====================
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'images')),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
})

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productId = req.params.id
    const productDir = path.join(__dirname, 'photos', productId)
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true })
    }
    cb(null, productDir)
  },
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
})

const uploadImage = multer({ storage: imageStorage })
const uploadPhotos = multer({ storage: photoStorage })

// ==================== DATA HELPERS ====================
const DATA_FILE = path.join(__dirname, 'data', 'db.json')

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    }
  } catch (err) {
    console.error('Data load error:', err)
  }
  return {
    settings: {
      restaurantName: 'AR Menu Restaurant',
      slogan: 'Lezzetin Yeni Boyutu',
      currency: '₺',
      primaryColor: '#dc2626'
    },
    categories: [],
    products: [],
    announcements: [],
    reviews: [],
    categoryLayouts: [],
    campaignSettings: { title: 'Kampanyalar', enabled: true }
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Data save error:', err)
  }
}

let db = loadData()

// ==================== SETTINGS ====================
app.get('/api/settings', (req, res) => {
  res.json(db.settings)
})

app.put('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body }
  saveData(db)
  res.json(db.settings)
})

app.post('/api/settings/logo', uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  db.settings.logo = req.file.filename
  saveData(db)
  res.json({ filename: req.file.filename })
})

app.post('/api/settings/banner', uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  db.settings.bannerImage = req.file.filename
  saveData(db)
  res.json({ filename: req.file.filename })
})

app.post('/api/settings/homepage-image', uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  db.settings.homepageImage = req.file.filename
  saveData(db)
  res.json({ filename: req.file.filename })
})

// ==================== CATEGORIES ====================
app.get('/api/categories', (req, res) => {
  res.json(db.categories)
})

app.post('/api/categories', (req, res) => {
  const category = {
    id: uuidv4(),
    name: req.body.name,
    icon: req.body.icon || '📁',
    image: null,
    order: db.categories.length,
    createdAt: new Date().toISOString()
  }
  db.categories.push(category)
  saveData(db)
  res.json(category)
})

app.put('/api/categories/:id', (req, res) => {
  const index = db.categories.findIndex(c => c.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Category not found' })
  db.categories[index] = { ...db.categories[index], ...req.body }
  saveData(db)
  res.json(db.categories[index])
})

app.delete('/api/categories/:id', (req, res) => {
  db.categories = db.categories.filter(c => c.id !== req.params.id)
  saveData(db)
  res.json({ success: true })
})

app.post('/api/categories/:id/image', uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const category = db.categories.find(c => c.id === req.params.id)
  if (!category) return res.status(404).json({ error: 'Category not found' })
  category.image = req.file.filename
  saveData(db)
  res.json({ filename: req.file.filename })
})

// ==================== PRODUCTS ====================
app.get('/api/products', (req, res) => {
  const products = db.products.map(p => {
    const photoDir = path.join(__dirname, 'photos', p.id)
    let photoCount = 0
    if (fs.existsSync(photoDir)) {
      photoCount = fs.readdirSync(photoDir).filter(f => /\.(jpg|jpeg|png|heic|heif)$/i.test(f)).length
    }
    // GLB dosyası gerçekten var mı kontrol et
    const glbPath = path.join(__dirname, 'outputs', `${p.id}.glb`)
    const glbExists = fs.existsSync(glbPath)
    return { 
      ...p, 
      photoCount,
      glbFile: glbExists ? `${p.id}.glb` : null 
    }
  })
  res.json(products)
})

app.post('/api/products', (req, res) => {
  const product = {
    id: uuidv4(),
    name: req.body.name,
    price: req.body.price,
    description: req.body.description || '',
    categoryId: req.body.categoryId || null,
    thumbnail: null,
    glbFile: null,
    isActive: req.body.isActive !== false,
    isFeatured: req.body.isFeatured || false,
    isCampaign: req.body.isCampaign || false,
    createdAt: new Date().toISOString()
  }
  db.products.push(product)
  saveData(db)
  res.json(product)
})

app.put('/api/products/:id', (req, res) => {
  const index = db.products.findIndex(p => p.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Product not found' })
  db.products[index] = { ...db.products[index], ...req.body }
  saveData(db)
  res.json(db.products[index])
})

app.delete('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id)
  if (product) {
    // Delete product photos directory
    const photoDir = path.join(__dirname, 'photos', req.params.id)
    if (fs.existsSync(photoDir)) {
      fs.rmSync(photoDir, { recursive: true })
    }
    // Delete GLB file if exists
    const glbPath = path.join(__dirname, 'outputs', `${req.params.id}.glb`)
    if (fs.existsSync(glbPath)) {
      fs.unlinkSync(glbPath)
    }
  }
  db.products = db.products.filter(p => p.id !== req.params.id)
  saveData(db)
  res.json({ success: true })
})

app.post('/api/products/:id/thumbnail', uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const product = db.products.find(p => p.id === req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  product.thumbnail = req.file.filename
  saveData(db)
  res.json({ filename: req.file.filename })
})

app.post('/api/products/:id/photos', uploadPhotos.array('photos', 100), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' })
  }
  res.json({ 
    count: req.files.length, 
    files: req.files.map(f => f.filename) 
  })
})

app.get('/api/products/:id/photos', (req, res) => {
  const photoDir = path.join(__dirname, 'photos', req.params.id)
  if (!fs.existsSync(photoDir)) {
    return res.json([])
  }
  const photos = fs.readdirSync(photoDir)
    .filter(f => /\.(jpg|jpeg|png|heic|heif)$/i.test(f))
    .map(f => ({
      filename: f,
      url: `/photos/${req.params.id}/${f}`
    }))
  res.json(photos)
})

app.delete('/api/products/:id/photos/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'photos', req.params.id, req.params.filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  res.json({ success: true })
})

// ==================== 3D GENERATION ====================
const generationProgress = {}

// swift-cli paths - küçük harf klasör adı ile
const PHOTO_TO_3D_PATHS = [
  path.join(__dirname, '..', 'swift-cli', '.build', 'release', 'PhotoTo3D'),
  path.join(__dirname, '..', 'swift-cli', '.build', 'debug', 'PhotoTo3D'),
  path.join(__dirname, '..', 'Swift-cli', '.build', 'release', 'PhotoTo3D'),
  path.join(__dirname, '..', 'Swift-cli', '.build', 'debug', 'PhotoTo3D'),
  '/Users/yusufkerimsaritas/Desktop/ar-menu-glb/swift-cli/.build/release/PhotoTo3D',
  '/Users/yusufkerimsaritas/Desktop/ar-menu-glb/swift-cli/.build/debug/PhotoTo3D'
]

// swift-cli klasörü (build için)
const SWIFT_CLI_DIR = path.join(__dirname, '..', 'swift-cli')

function findPhotoTo3D() {
  console.log('🔍 PhotoTo3D aranıyor...')
  for (const p of PHOTO_TO_3D_PATHS) {
    if (fs.existsSync(p)) {
      console.log(`   ✅ Bulundu: ${p}`)
      return p
    }
  }
  console.log('   ❌ Bulunamadı')
  return null
}

app.post('/api/products/:id/generate', async (req, res) => {
  const product = db.products.find(p => p.id === req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })

  const photoDir = path.join(__dirname, 'photos', req.params.id)
  if (!fs.existsSync(photoDir)) {
    return res.status(400).json({ error: 'No photos found' })
  }

  const photos = fs.readdirSync(photoDir).filter(f => /\.(jpg|jpeg|png|heic|heif)$/i.test(f))
  if (photos.length < 20) {
    return res.status(400).json({ error: 'Minimum 20 photos required' })
  }

  // Initialize progress
  generationProgress[req.params.id] = {
    stage: 'queued',
    progress: 0,
    message: 'Sıraya alındı...'
  }

  res.json({ status: 'started', productId: req.params.id })

  // Start 3D generation with Swift CLI
  generate3DModel(req.params.id, product, photoDir)
})

async function generate3DModel(productId, product, photoDir) {
  const outputDir = path.join(__dirname, 'outputs')
  const usdzPath = path.join(outputDir, `${productId}.usdz`)
  const glbPath = path.join(outputDir, `${productId}.glb`)
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  try {
    generationProgress[productId] = {
      stage: 'processing',
      progress: 5,
      message: 'Fotoğraflar kontrol ediliyor...'
    }

    // Check if PhotoTo3D CLI exists
    let cliPath = findPhotoTo3D()
    
    if (!cliPath) {
      // Try to build it
      if (fs.existsSync(path.join(SWIFT_CLI_DIR, 'Package.swift'))) {
        console.log('📦 Swift-cli derleniyor...')
        generationProgress[productId] = {
          stage: 'processing',
          progress: 10,
          message: 'Swift-cli derleniyor...'
        }
        
        try {
          await runCommand('swift', ['build', '-c', 'release'], { cwd: SWIFT_CLI_DIR })
          cliPath = findPhotoTo3D()
          if (cliPath) {
            console.log('✅ Swift-cli built successfully')
          }
        } catch (buildError) {
          console.error('Build error:', buildError)
        }
      } else {
        console.log(`⚠️ Package.swift bulunamadı: ${SWIFT_CLI_DIR}`)
      }
    }

    if (!cliPath) {
      console.log('⚠️ PhotoTo3D not found, using fallback method')
      // Fallback: Create placeholder GLB
      await createPlaceholderModel(glbPath, productId)
      
      product.glbFile = `${productId}.glb`
      saveData(db)
      
      generationProgress[productId] = {
        stage: 'completed',
        progress: 100,
        message: '3D model oluşturuldu (test modu)'
      }
      return
    }

    // Run PhotoTo3D CLI
    generationProgress[productId] = {
      stage: 'generating',
      progress: 15,
      message: 'Object Capture başlatılıyor...'
    }

    console.log(`🚀 Starting PhotoTo3D: ${cliPath}`)
    console.log(`   Input: ${photoDir}`)
    console.log(`   Output: ${usdzPath}`)

    await runPhotoTo3D(cliPath, photoDir, usdzPath, productId)

    // Check if USDZ was created
    if (fs.existsSync(usdzPath)) {
      console.log(`✅ USDZ created: ${usdzPath}`)
      
      // Convert USDZ to GLB for web viewing
      generationProgress[productId] = {
        stage: 'converting',
        progress: 90,
        message: 'GLB formatına dönüştürülüyor...'
      }

      // Try to convert USDZ to GLB using Reality Converter or usdzconvert
      const converted = await convertUsdzToGlb(usdzPath, glbPath)
      
      if (converted && fs.existsSync(glbPath)) {
        product.glbFile = `${productId}.glb`
        product.usdzFile = `${productId}.usdz`
      } else {
        // Keep USDZ, also copy as GLB placeholder
        product.usdzFile = `${productId}.usdz`
        product.glbFile = `${productId}.usdz` // model-viewer can load USDZ too
      }
      
      saveData(db)

      generationProgress[productId] = {
        stage: 'completed',
        progress: 100,
        message: '3D model başarıyla oluşturuldu!'
      }
      
      const stats = fs.statSync(usdzPath)
      console.log(`✅ 3D model completed: ${usdzPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
    } else {
      throw new Error('USDZ dosyası oluşturulamadı')
    }

  } catch (error) {
    console.error('❌ 3D generation error:', error)
    generationProgress[productId] = {
      stage: 'error',
      progress: 0,
      message: `Hata: ${error.message}`
    }
  }
}

// Run PhotoTo3D Swift CLI
function runPhotoTo3D(cliPath, inputDir, outputFile, productId) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Çalıştırılıyor: ${cliPath}`)
    console.log(`   Args: ${inputDir} ${outputFile}`)
    
    const proc = spawn(cliPath, [inputDir, outputFile])

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      const output = data.toString()
      stdout += output
      console.log('PhotoTo3D:', output.trim())

      // Parse progress from output: "Ilerleme: %XX"
      const progressMatch = output.match(/Ilerleme:\s*%(\d+)/)
      if (progressMatch) {
        const percent = parseInt(progressMatch[1])
        generationProgress[productId] = {
          stage: 'generating',
          progress: 15 + Math.floor(percent * 0.7), // Map 0-100 to 15-85
          message: `3D model oluşturuluyor... %${percent}`
        }
      }

      // Check for completion
      if (output.includes('TAMAMLANDI') || output.includes('Model basariyla')) {
        generationProgress[productId] = {
          stage: 'finalizing',
          progress: 85,
          message: 'Model tamamlandı, dosya kaydediliyor...'
        }
      }

      // Check for errors
      if (output.includes('HATA:')) {
        const errorMatch = output.match(/HATA:\s*(.+)/)
        if (errorMatch) {
          console.error('PhotoTo3D Error:', errorMatch[1])
        }
      }
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
      console.error('PhotoTo3D stderr:', data.toString().trim())
    })

    proc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ PhotoTo3D completed successfully')
        resolve()
      } else {
        console.error(`❌ PhotoTo3D exited with code ${code}`)
        reject(new Error(`PhotoTo3D failed with code ${code}: ${stderr || stdout}`))
      }
    })

    proc.on('error', (error) => {
      console.error('PhotoTo3D process error:', error)
      reject(error)
    })

    // Timeout after 10 minutes (3D generation can take a while)
    setTimeout(() => {
      proc.kill('SIGTERM')
      reject(new Error('3D oluşturma zaman aşımına uğradı (10 dakika)'))
    }, 600000)
  })
}

// Convert USDZ to GLB using Blender
async function convertUsdzToGlb(usdzPath, glbPath) {
  try {
    console.log('🔄 USDZ → GLB dönüştürme başlıyor...')
    
    // Blender path
    const BLENDER_PATH = '/Applications/Blender.app/Contents/MacOS/Blender'
    
    // Check if Blender exists
    if (!fs.existsSync(BLENDER_PATH)) {
      console.log('❌ Blender bulunamadı: ' + BLENDER_PATH)
      console.log('   Blender yükleyin: https://www.blender.org/download/')
      return false
    }

    // Create Blender Python script
    const blenderScript = `
import bpy
import sys

# Get arguments
argv = sys.argv
argv = argv[argv.index("--") + 1:]
input_file = argv[0]
output_file = argv[1]

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import USDZ
bpy.ops.wm.usd_import(filepath=input_file)

# Export as GLB
bpy.ops.export_scene.gltf(
    filepath=output_file,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials='EXPORT'
)

print(f"CONVERT_SUCCESS: {output_file}")
`

    // Write temporary script
    const scriptPath = '/tmp/blender_convert_usdz.py'
    fs.writeFileSync(scriptPath, blenderScript)

    console.log(`   Input: ${usdzPath}`)
    console.log(`   Output: ${glbPath}`)

    // Run Blender in background
    await new Promise((resolve, reject) => {
      const proc = spawn(BLENDER_PATH, [
        '--background',
        '--python', scriptPath,
        '--',
        usdzPath,
        glbPath
      ])

      let output = ''
      
      proc.stdout.on('data', (data) => {
        output += data.toString()
      })

      proc.stderr.on('data', (data) => {
        // Blender often outputs to stderr, not always errors
        output += data.toString()
      })

      proc.on('close', (code) => {
        if (fs.existsSync(glbPath)) {
          const stats = fs.statSync(glbPath)
          console.log(`✅ GLB oluşturuldu: ${glbPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
          resolve()
        } else if (code === 0 && output.includes('CONVERT_SUCCESS')) {
          resolve()
        } else {
          console.log('Blender output:', output.slice(-500))
          reject(new Error('GLB dosyası oluşturulamadı'))
        }
      })

      proc.on('error', (err) => {
        reject(err)
      })

      // Timeout after 2 minutes
      setTimeout(() => {
        proc.kill()
        reject(new Error('Blender timeout'))
      }, 120000)
    })

    return fs.existsSync(glbPath)

  } catch (error) {
    console.error('❌ Blender dönüştürme hatası:', error.message)
    return false
  }
}

// Run a command and return promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { ...options, shell: true })
    let stdout = ''
    let stderr = ''
    
    proc.stdout?.on('data', (data) => { stdout += data.toString() })
    proc.stderr?.on('data', (data) => { stderr += data.toString() })
    
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(`Command failed: ${stderr || stdout}`))
    })
    
    proc.on('error', reject)
  })
}

// Create placeholder GLB model for testing
async function createPlaceholderModel(glbPath, productId) {
  console.log('📦 Creating placeholder GLB model...')
  
  generationProgress[productId] = {
    stage: 'generating',
    progress: 50,
    message: 'Test modeli oluşturuluyor...'
  }

  // Simple cube GLB
  const gltfJson = {
    asset: { version: "2.0", generator: "AR Menu" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: productId }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0
      }]
    }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorFactor: [0.86, 0.16, 0.16, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.5
      },
      doubleSided: true
    }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 24, type: "VEC3", max: [0.5,0.5,0.5], min: [-0.5,-0.5,-0.5] },
      { bufferView: 1, componentType: 5126, count: 24, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: 36, type: "SCALAR" }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 288, target: 34962 },
      { buffer: 0, byteOffset: 288, byteLength: 288, target: 34962 },
      { buffer: 0, byteOffset: 576, byteLength: 72, target: 34963 }
    ],
    buffers: [{ byteLength: 648 }]
  }

  const positions = new Float32Array([
    -0.5,-0.5,0.5, 0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,0.5,
    0.5,-0.5,-0.5, -0.5,-0.5,-0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5,
    -0.5,0.5,0.5, 0.5,0.5,0.5, 0.5,0.5,-0.5, -0.5,0.5,-0.5,
    -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,-0.5,0.5, -0.5,-0.5,0.5,
    0.5,-0.5,0.5, 0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5,0.5,
    -0.5,-0.5,-0.5, -0.5,-0.5,0.5, -0.5,0.5,0.5, -0.5,0.5,-0.5
  ])

  const normals = new Float32Array([
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    -1,0,0, -1,0,0, -1,0,0, -1,0,0
  ])

  const indices = new Uint16Array([
    0,1,2, 0,2,3, 4,5,6, 4,6,7,
    8,9,10, 8,10,11, 12,13,14, 12,14,15,
    16,17,18, 16,18,19, 20,21,22, 20,22,23
  ])

  const binary = Buffer.concat([
    Buffer.from(positions.buffer),
    Buffer.from(normals.buffer),
    Buffer.from(indices.buffer)
  ])

  const jsonStr = JSON.stringify(gltfJson)
  const jsonBuf = Buffer.from(jsonStr)
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4
  const paddedJson = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)])
  
  const binPad = (4 - (binary.length % 4)) % 4
  const paddedBin = Buffer.concat([binary, Buffer.alloc(binPad, 0x00)])

  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546C67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + paddedBin.length, 8)

  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(paddedJson.length, 0)
  jsonHeader.writeUInt32LE(0x4E4F534A, 4)

  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(paddedBin.length, 0)
  binHeader.writeUInt32LE(0x004E4942, 4)

  const glb = Buffer.concat([header, jsonHeader, paddedJson, binHeader, paddedBin])
  
  fs.writeFileSync(glbPath, glb)
  console.log(`✅ Placeholder GLB created: ${glbPath} (${glb.length} bytes)`)
}

app.get('/api/products/:id/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  let intervalId = null

  const sendProgress = () => {
    const progress = generationProgress[req.params.id] || { stage: 'unknown', progress: 0, message: 'Durum bilinmiyor' }
    res.write(`data: ${JSON.stringify(progress)}\n\n`)
    
    if (progress.stage === 'completed' || progress.stage === 'error') {
      if (intervalId) {
        clearInterval(intervalId)
      }
      res.end()
    }
  }

  // İlk progress'i hemen gönder
  sendProgress()
  
  // Sonra her saniye güncelle
  intervalId = setInterval(sendProgress, 1000)

  req.on('close', () => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })
})

// ==================== ANNOUNCEMENTS ====================
app.get('/api/announcements', (req, res) => {
  res.json(db.announcements)
})

app.post('/api/announcements', (req, res) => {
  const announcement = {
    id: uuidv4(),
    title: req.body.title,
    message: req.body.message,
    icon: req.body.icon || '📢',
    isActive: true,
    order: db.announcements.length,
    createdAt: new Date().toISOString()
  }
  db.announcements.push(announcement)
  saveData(db)
  res.json(announcement)
})

app.put('/api/announcements/:id', (req, res) => {
  const index = db.announcements.findIndex(a => a.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Announcement not found' })
  db.announcements[index] = { ...db.announcements[index], ...req.body }
  saveData(db)
  res.json(db.announcements[index])
})

app.delete('/api/announcements/:id', (req, res) => {
  db.announcements = db.announcements.filter(a => a.id !== req.params.id)
  saveData(db)
  res.json({ success: true })
})

// ==================== REVIEWS ====================
app.get('/api/reviews', (req, res) => {
  res.json(db.reviews)
})

app.post('/api/reviews', (req, res) => {
  const review = {
    id: uuidv4(),
    rating: req.body.rating,
    contact: req.body.contact || null,
    note: req.body.note || null,
    createdAt: new Date().toISOString()
  }
  db.reviews.push(review)
  saveData(db)
  res.json(review)
})

app.delete('/api/reviews/:id', (req, res) => {
  db.reviews = db.reviews.filter(r => r.id !== req.params.id)
  saveData(db)
  res.json({ success: true })
})

// ==================== CATEGORY LAYOUTS ====================
app.get('/api/category-layouts', (req, res) => {
  res.json(db.categoryLayouts || [])
})

app.put('/api/category-layouts', (req, res) => {
  db.categoryLayouts = req.body
  saveData(db)
  res.json(db.categoryLayouts)
})

// ==================== CAMPAIGN SETTINGS ====================
app.get('/api/campaign-settings', (req, res) => {
  res.json(db.campaignSettings || { title: 'Kampanyalar', enabled: true })
})

app.put('/api/campaign-settings', (req, res) => {
  db.campaignSettings = { ...db.campaignSettings, ...req.body }
  saveData(db)
  res.json(db.campaignSettings)
})

// ==================== MENU (PUBLIC) ====================
app.get('/api/menu', (req, res) => {
  // Build categories with products
  const categoriesWithProducts = db.categories.map(cat => {
    const products = db.products
      .filter(p => p.categoryId === cat.id && p.isActive !== false)
      .map(p => {
        // Check if GLB actually exists
        const glbPath = path.join(__dirname, 'outputs', `${p.id}.glb`)
        const glbExists = fs.existsSync(glbPath)
        return {
          ...p,
          glbFile: glbExists ? `${p.id}.glb` : null,
          categoryName: cat.name,
          categoryIcon: cat.icon
        }
      })
    return { ...cat, products }
  })

  // Get campaign products
  const campaignProducts = db.products
    .filter(p => p.isCampaign && p.isActive !== false)
    .map(p => {
      const cat = db.categories.find(c => c.id === p.categoryId)
      const glbPath = path.join(__dirname, 'outputs', `${p.id}.glb`)
      const glbExists = fs.existsSync(glbPath)
      return {
        ...p,
        glbFile: glbExists ? `${p.id}.glb` : null,
        categoryName: cat?.name || '',
        categoryIcon: cat?.icon || ''
      }
    })

  // Get featured products
  const featuredProducts = db.products
    .filter(p => p.isFeatured && p.isActive !== false)
    .map(p => {
      const cat = db.categories.find(c => c.id === p.categoryId)
      const glbPath = path.join(__dirname, 'outputs', `${p.id}.glb`)
      const glbExists = fs.existsSync(glbPath)
      return {
        ...p,
        glbFile: glbExists ? `${p.id}.glb` : null,
        categoryName: cat?.name || '',
        categoryIcon: cat?.icon || ''
      }
    })

  // Get active announcements
  const activeAnnouncements = db.announcements.filter(a => a.isActive)

  res.json({
    settings: db.settings,
    categories: categoriesWithProducts,
    announcements: activeAnnouncements,
    campaignProducts,
    featuredProducts,
    categoryLayouts: db.categoryLayouts || [],
    campaignSettings: db.campaignSettings || { title: 'Kampanyalar', enabled: true }
  })
})

// ==================== MANUAL USDZ → GLB CONVERSION ====================
app.post('/api/products/:id/convert', async (req, res) => {
  const product = db.products.find(p => p.id === req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })

  const usdzPath = path.join(__dirname, 'outputs', `${req.params.id}.usdz`)
  const glbPath = path.join(__dirname, 'outputs', `${req.params.id}.glb`)

  if (!fs.existsSync(usdzPath)) {
    return res.status(400).json({ error: 'USDZ dosyası bulunamadı' })
  }

  if (fs.existsSync(glbPath)) {
    return res.json({ status: 'exists', message: 'GLB zaten mevcut', glbFile: `${req.params.id}.glb` })
  }

  console.log(`🔄 Manuel dönüştürme başlatılıyor: ${req.params.id}`)

  try {
    const converted = await convertUsdzToGlb(usdzPath, glbPath)
    
    if (converted && fs.existsSync(glbPath)) {
      product.glbFile = `${req.params.id}.glb`
      saveData(db)
      
      const stats = fs.statSync(glbPath)
      res.json({ 
        status: 'success', 
        message: 'GLB oluşturuldu',
        glbFile: `${req.params.id}.glb`,
        size: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
      })
    } else {
      res.status(500).json({ error: 'GLB dönüştürme başarısız' })
    }
  } catch (error) {
    console.error('Convert error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: process.platform
  })
})

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
  // Swift-cli durumunu kontrol et
  const cliPath = findPhotoTo3D()
  const cliStatus = cliPath ? '✅ Hazır' : '❌ Derlenmemiş (swift build -c release)'
  
  console.log(`
╔════════════════════════════════════════════════════════╗
║         🍽️  AR Menu Backend Server                    ║
╠════════════════════════════════════════════════════════╣
║  Status:    ✅ Running                                 ║
║  Port:      ${PORT}                                       ║
║  URL:       http://192.168.1.2:${PORT}                    ║
║  Platform:  ${process.platform.padEnd(42)}║
║  Swift-cli: ${cliStatus.padEnd(42)}║
╚════════════════════════════════════════════════════════╝
  `)
  
  if (!cliPath) {
    console.log('⚠️  Swift-cli derlemek için:')
    console.log('    cd ~/Desktop/ar-menu-glb/Swift-cli')
    console.log('    swift build -c release')
    console.log('')
  }
})