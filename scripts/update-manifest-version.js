// scripts/update-manifest-version.js
import fs from 'fs'

const manifestPath = './public/manifest.json'
const packagePath = './package.json'

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

manifest.version = pkg.version

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`🔁 manifest.json version updated to ${pkg.version}`)
