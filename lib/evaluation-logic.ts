export interface SurveyData {
  ageGroup: string
  currentActivityLevel: string
  fitnessExperience: string
  injuriesConditions: string
  equipmentAccess: string
  timeAvailable: string
}

export interface EvaluationScore {
  fitnessLevelScore: number
  readinessScore: number
  recommendedProgram: string
  intensityLevel: string
  programDuration: string
  specialModifications: string
  safetyConcerns: string
  personalisedRecommendations: string
}

// Activity level scoring
const activityLevelScores: Record<string, number> = {
  sedentary: 20,
  light: 40,
  moderate: 60,
  active: 80,
  'very-active': 95,
}

// Experience level scoring
const experienceScores: Record<string, number> = {
  beginner: 30,
  intermediate: 65,
  advanced: 90,
}

// Age group risk assessment
const ageGroupRisk: Record<string, { risk: string; intensity: string }> = {
  '18-25': { risk: 'low', intensity: 'high' },
  '26-35': { risk: 'low', intensity: 'high' },
  '36-45': { risk: 'moderate', intensity: 'moderate-high' },
  '46-55': { risk: 'moderate', intensity: 'moderate' },
  '56-65': { risk: 'moderate-high', intensity: 'moderate' },
  '65+': { risk: 'high', intensity: 'low-moderate' },
}

const equipmentAccessScores: Record<string, number> = {
  none: 20,
  home: 50,
  gym: 70,
  both: 100,
}

const timeAvailableScores: Record<string, number> = {
  'less-30': 25,
  '30-60': 60,
  '60-90': 80,
  '90+': 100,
}

export function calculateEvaluationScore(survey: SurveyData): EvaluationScore {
  // Calculate fitness level score (0-100)
  const activityScore = activityLevelScores[survey.currentActivityLevel] || 0
  const experienceScore = experienceScores[survey.fitnessExperience] || 0
  const equipmentScore = equipmentAccessScores[survey.equipmentAccess] || 0

  const fitnessLevelScore = Math.round((activityScore + experienceScore) / 2)

  // Calculate readiness score (0-100)
  const timeScore = timeAvailableScores[survey.timeAvailable] || 0
  const readinessScore = Math.round((fitnessLevelScore + timeScore) / 2)

  // Determine program type and intensity
  const riskData = ageGroupRisk[survey.ageGroup] || { risk: 'moderate', intensity: 'moderate' }
  const hasInjuries = survey.injuriesConditions && survey.injuriesConditions.trim().length > 0

  let recommendedProgram = 'Balanced Fitness Program'
  let intensityLevel = riskData.intensity
  let specialModifications = 'None'
  let safetyConcerns = ''
  let programDuration = '12 weeks'

  if (fitnessLevelScore < 40) {
    recommendedProgram = 'Beginner Foundation Program'
    intensityLevel = 'Low'
    programDuration = '8 weeks'
  } else if (fitnessLevelScore < 70) {
    recommendedProgram = 'Intermediate Fitness Program'
    intensityLevel = 'Moderate'
    programDuration = '12 weeks'
  } else {
    recommendedProgram = 'Advanced Strength & Conditioning Program'
    intensityLevel = 'High'
    programDuration = '16 weeks'
  }

  if (hasInjuries) {
    specialModifications = 'Program will be modified based on your injuries/conditions'
    safetyConcerns = 'Medical clearance recommended before starting program'
    if (intensityLevel === 'High') {
      intensityLevel = 'Moderate'
    }
  }

  if (riskData.risk === 'high') {
    safetyConcerns = safetyConcerns
      ? `${safetyConcerns}. Age-appropriate modifications required.`
      : 'Age-appropriate modifications required. Recommend starting with low intensity.'
    intensityLevel = 'Low-Moderate'
  } else if (riskData.risk === 'moderate-high') {
    safetyConcerns = safetyConcerns
      ? `${safetyConcerns}. Regular health monitoring recommended.`
      : 'Regular health monitoring recommended.'
  }

  if (equipmentScore < 50) {
    specialModifications = specialModifications
      ? `${specialModifications}. Program uses minimal equipment.`
      : 'Program uses minimal equipment - bodyweight and basic exercises.'
  }

  const personalisedRecommendations = generateRecommendations(survey, fitnessLevelScore)

  return {
    fitnessLevelScore,
    readinessScore,
    recommendedProgram,
    intensityLevel,
    programDuration,
    specialModifications,
    safetyConcerns,
    personalisedRecommendations,
  }
}

function generateRecommendations(survey: SurveyData, fitnessScore: number): string {
  const recommendations: string[] = []

  // Activity-based recommendations
  if (survey.currentActivityLevel === 'sedentary') {
    recommendations.push(
      'Start with 20-30 minutes of light cardio 3 times per week to build cardiovascular base.'
    )
    recommendations.push(
      'Focus on establishing a consistent workout routine before increasing intensity.'
    )
  } else if (
    survey.currentActivityLevel === 'light' ||
    survey.currentActivityLevel === 'moderate'
  ) {
    recommendations.push('Gradually increase workout frequency and duration to prevent injury.')
    recommendations.push('Incorporate strength training 2-3 times per week for balanced fitness.')
  } else {
    recommendations.push('Focus on sport-specific training and advanced techniques.')
    recommendations.push('Consider periodization to prevent overtraining.')
  }

  // Time availability recommendations
  if (survey.timeAvailable === 'less-30') {
    recommendations.push(
      'Use high-intensity interval training (HIIT) to maximize results in shorter sessions.'
    )
    recommendations.push(
      'Focus on compound movements that work multiple muscle groups simultaneously.'
    )
  } else if (survey.timeAvailable === '30-60') {
    recommendations.push(
      'Combine 20 minutes of strength training with 10-20 minutes of cardio.'
    )
    recommendations.push('Ensure 1-2 rest days per week for recovery.')
  } else {
    recommendations.push('Implement a structured training split targeting different muscle groups.')
    recommendations.push('Add flexibility and mobility work to your routine.')
  }

  // Equipment-based recommendations
  if (survey.equipmentAccess === 'none') {
    recommendations.push('Leverage bodyweight exercises: push-ups, squats, lunges, planks.')
    recommendations.push('Use resistance bands for added challenge without equipment investment.')
  } else if (survey.equipmentAccess === 'home') {
    recommendations.push('Invest in dumbbells or resistance bands for progressive overload.')
    recommendations.push('Use online resources for home workout routines.')
  } else if (survey.equipmentAccess === 'gym') {
    recommendations.push('Work with a trainer initially to learn proper form on machines and free weights.')
    recommendations.push('Utilize group fitness classes for motivation and accountability.')
  }

  // Injury/condition recommendations
  if (survey.injuriesConditions && survey.injuriesConditions.trim().length > 0) {
    recommendations.push(
      'Warm up thoroughly (10-15 minutes) before every workout to prepare your body.'
    )
    recommendations.push('Include flexibility and mobility exercises to maintain range of motion.')
    recommendations.push('Stop any exercise that causes pain and consult with a healthcare provider.')
  }

  return recommendations.join(' | ')
}
