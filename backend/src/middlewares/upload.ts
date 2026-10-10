import fs from 'fs'
import path from 'path'
import multer from 'multer'

const dossierUploads = path.join(process.cwd(), 'uploads', 'produits')
if (!fs.existsSync(dossierUploads)) {
  fs.mkdirSync(dossierUploads, { recursive: true })
}

const stockage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, dossierUploads)
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const nomUnique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
    cb(null, nomUnique)
  }
})

const filtreFichier = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const typesAutorises = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (typesAutorises.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Format d image non supporté. Utiliser JPG, PNG, WEBP ou GIF.'))
  }
}

export const uploaderPhotos = multer({
  storage: stockage,
  fileFilter: filtreFichier,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo max
})