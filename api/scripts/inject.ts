/**
 * Feature injection script
 * Run: npm run inject -- --features='{"onlineBooking":true,"loyaltyProgram":true}'
 *
 * This script writes a features.json file that the app reads at startup
 * to determine which features are enabled for this deployment.
 */
import * as fs from 'fs'
import * as path from 'path'

const args = process.argv.slice(2)
const featuresArg = args.find((a) => a.startsWith('--features='))

if (!featuresArg) {
  console.log('Usage: npm run inject -- --features=\'{"onlineBooking":true}\'')
  process.exit(1)
}

const featuresJson = featuresArg.replace('--features=', '')

try {
  const features = JSON.parse(featuresJson)
  const outPath = path.resolve(__dirname, '../src/config/features.json')
  fs.writeFileSync(outPath, JSON.stringify(features, null, 2))
  console.log('Features injected:', features)
  console.log('Written to:', outPath)
} catch (error) {
  console.error('Invalid JSON:', error)
  process.exit(1)
}
