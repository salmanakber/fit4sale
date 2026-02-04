interface BenchmarkData {
  questionName: string
  score: number
  benchmark: number
}

/**
 * Generate a benchmark chart as SVG string
 * Creates a black-themed chart showing IST (actual) vs Potential (benchmark)
 */
export async function generateBenchmarkChartSVG(
  benchmarks: BenchmarkData[],
  companyName: string = 'Musterfirma'
): Promise<string> {
  const width = 1200
  const height = 700
  const chartLeft = 250
  const chartRight = width - 50
  const chartTop = 80
  const chartBottom = height - 80
  const chartWidth = chartRight - chartLeft
  const chartHeight = chartBottom - chartTop
  const itemHeight = chartHeight / benchmarks.length

  const xMin = -3
  const xMax = 2
  const xRange = xMax - xMin

  // Generate grid lines
  let gridLines = ''
  benchmarks.forEach((_, index) => {
    const y = chartTop + itemHeight * (index + 1)
    gridLines += `<line x1="${chartLeft}" y1="${y}" x2="${chartRight}" y2="${y}" stroke="#333333" stroke-width="1"/>`
  })

  // Vertical grid lines
  for (let i = xMin; i <= xMax; i++) {
    const x = chartLeft + ((i - xMin) / xRange) * chartWidth
    gridLines += `<line x1="${x}" y1="${chartTop}" x2="${x}" y2="${chartBottom}" stroke="#333333" stroke-width="1"/>`
  }

  // Y-axis labels
  let yLabels = ''
  benchmarks.forEach((bench, index) => {
    const y = chartTop + itemHeight * (index + 0.5)
    const truncatedName = bench.questionName.substring(0, 30)
    yLabels += `<text x="${chartLeft - 20}" y="${y + 5}" text-anchor="end" font-size="14" fill="#999999">${truncatedName}</text>`
  })

  // X-axis labels
  let xLabels = ''
  for (let i = xMin; i <= xMax; i++) {
    const x = chartLeft + ((i - xMin) / xRange) * chartWidth
    xLabels += `<text x="${x}" y="${chartBottom + 25}" text-anchor="middle" font-size="12" fill="#999999">${i}</text>`
  }

  // Generate IST line
  let istPath = ''
  benchmarks.forEach((bench, index) => {
    const y = chartTop + itemHeight * (index + 0.5)
    const x = chartLeft + ((bench.score - xMin) / xRange) * chartWidth
    istPath += `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })

  // Generate Potential line
  let potentialPath = ''
  benchmarks.forEach((bench, index) => {
    const y = chartTop + itemHeight * (index + 0.5)
    const x = chartLeft + ((bench.benchmark - xMin) / xRange) * chartWidth
    potentialPath += `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })

  // Generate data points
  let istPoints = ''
  let potentialPoints = ''
  benchmarks.forEach((bench, index) => {
    const y = chartTop + itemHeight * (index + 0.5)
    const istX = chartLeft + ((bench.score - xMin) / xRange) * chartWidth
    const potX = chartLeft + ((bench.benchmark - xMin) / xRange) * chartWidth

    istPoints += `<circle cx="${istX}" cy="${y}" r="5" fill="#ff4444"/>`
    potentialPoints += `<circle cx="${potX}" cy="${y}" r="5" fill="#44ff44"/>`
  })

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background: #1a1a1a;">
  <!-- Grid -->
  ${gridLines}
  
  <!-- X-axis -->
  <line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="#666666" stroke-width="2"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="40" text-anchor="middle" font-size="28" font-weight="bold" fill="#ffffff">Verkaufsattraktivität ${companyName}</text>
  
  <!-- Y-axis labels -->
  ${yLabels}
  
  <!-- X-axis labels -->
  ${xLabels}
  
  <!-- IST line -->
  <path d="${istPath}" stroke="#ff4444" stroke-width="2" fill="none"/>
  
  <!-- Potential line -->
  <path d="${potentialPath}" stroke="#44ff44" stroke-width="2" fill="none"/>
  
  <!-- Data points -->
  ${istPoints}
  ${potentialPoints}
  
  <!-- Legend -->
  <rect x="${chartLeft + 100}" y="${chartBottom + 60}" width="15" height="15" fill="#ff4444"/>
  <text x="${chartLeft + 125}" y="${chartBottom + 72}" font-size="14" fill="#ffffff">IST</text>
  
  <rect x="${chartLeft + 250}" y="${chartBottom + 60}" width="15" height="15" fill="#44ff44"/>
  <text x="${chartLeft + 270}" y="${chartBottom + 72}" font-size="14" fill="#ffffff">Potential</text>
</svg>`

  return svg
}

/**
 * Convert SVG to PNG buffer using a simple approach
 */
export async function generateBenchmarkChartPNG(
  benchmarks: BenchmarkData[],
  companyName: string = 'Musterfirma'
): Promise<Buffer> {
  const svg = await generateBenchmarkChartSVG(benchmarks, companyName)

  // For production, you might want to use a service like https://api.cloudconvert.com or similar
  // For now, we'll return the SVG as a data URL that can be used directly
  // If you need actual PNG, you'll need to install and use 'sharp' library

  // Alternative: Use Sharp library if available
  try {
    const sharp = require('sharp')
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer()
    return buffer
  } catch (error) {
    // Fallback: return SVG as buffer (can be converted to PNG on client side)
    console.warn('[v0] Sharp library not available, returning SVG as fallback')
    return Buffer.from(svg, 'utf8')
  }
}
