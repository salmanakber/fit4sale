export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface SubmissionConfirmationData {
  patientName: string
  patientEmail: string
  submissionId: string
}

export interface EvaluationEmailData {
  greeting?: string // Optional: if provided, use this instead of patientName
  patientName: string
  patientEmail: string
  recommendedProgram: string
  intensityLevel: string
  programDuration: string
  personalizedRecommendations: string
  safetyConcerns: string
  specialModifications: string
}

export function generateSubmissionConfirmationEmail(
  data: SubmissionConfirmationData
): EmailTemplate {
  const text = `
Hallo ${data.patientName},

vielen Dank für Ihre Teilnahme am Fit4Sale Sales-Check.

Wir haben Ihre Angaben erhalten.

Wie geht es weiter?
- Wir erstellen automatisch eine **vorläufige Auswertung** auf Basis definierter Benchmarks
- Die **vollständige Auswertung** wird nach **manueller Freigabe** versendet

Ihre Eingabenummer: ${data.submissionId}

Bei Fragen erreichen Sie uns unter aschwanden@kmu-beratungen.ch

Freundliche Grüße
KMU-Beratungen
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a6b42; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .highlight { background-color: #e8f5e9; padding: 10px; border-left: 4px solid #1a6b42; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Fit4Sale</h1>
      <p>Sales-Check erfolgreich eingereicht</p>
    </div>
    
    <div class="content">
      <p>Hallo <strong>${data.patientName}</strong>,</p>
      
      <p>vielen Dank für Ihre Teilnahme am Fit4Sale Sales-Check.</p>
      
      <p>Wir haben Ihre Angaben erhalten.</p>
      
      <h3>Wie geht es weiter?</h3>
      <ul>
        <li>Wir erstellen automatisch eine <strong>vorläufige Auswertung</strong> anhand definierter Benchmarks</li>
        <li>Die <strong>vollständige Auswertung</strong> wird nach <strong>manueller Freigabe</strong> versendet</li>
      </ul>
      
      <div class="highlight">
        <p><strong>Ihre Eingabenummer:</strong> ${data.submissionId}</p>
      </div>
      
      <p>Bei Fragen erreichen Sie uns unter aschwanden@kmu-beratungen.ch</p>
      
      <p>Freundliche Grüße<br>KMU-Beratungen</p>
    </div>
    
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return {
    subject: 'Fit4Sale – Sales-Check eingereicht',
    html,
    text,
  }
}

export function generateEvaluationEmail(
  data: EvaluationEmailData
): EmailTemplate {
  const recommendationsList = data.personalizedRecommendations
    .split(' | ')
    .map((rec) => `<li>${rec}</li>`)
    .join('')

  const greeting = data.greeting || `Hallo ${data.patientName}`
  
  const text = `
${greeting},

Ihre Fit4Sale-Auswertung ist bereit (freigegeben). Hier sind Ihre Ergebnisse:

Zusammenfassung: ${data.recommendedProgram}
Kategorie: ${data.intensityLevel}
Zeithorizont: ${data.programDuration}

Notizen: ${data.specialModifications || '—'}
Risiken / Blocker: ${data.safetyConcerns || '—'}

Empfehlungen:
${data.personalizedRecommendations}

Nächste Schritte:
1. Priorisieren Sie 1–2 Hebel mit dem größten Effekt
2. Setzen Sie die Empfehlungen um und messen Sie die Wirkung
3. Bei Rückfragen: aschwanden@kmu-beratungen.ch

Freundliche Grüße
KMU-Beratungen
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a6b42; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
    .section { margin: 20px 0; }
    .section-title { color: #1a6b42; font-weight: bold; font-size: 16px; margin-bottom: 10px; }
    .info-box { background-color: #e8f5e9; padding: 15px; border-left: 4px solid #1a6b42; margin: 10px 0; }
    .recommendations { background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 10px 0; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Fit4Sale</h1>
      <p>Ihre Auswertung</p>
    </div>
    
    <div class="content">
      <p>${data.greeting || `Hallo <strong>${data.patientName}</strong>`},</p>
      
      <p>Ihre Fit4Sale-Auswertung ist bereit (freigegeben). Hier sind Ihre Ergebnisse:</p>
      
      <div class="info-box">
        <div class="section-title">Zusammenfassung</div>
        <p><strong>Zusammenfassung:</strong> ${data.recommendedProgram}</p>
        <p><strong>Kategorie:</strong> ${data.intensityLevel}</p>
        <p><strong>Zeithorizont:</strong> ${data.programDuration}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Notizen</div>
        ${data.specialModifications ? `<p><strong>Notizen:</strong> ${data.specialModifications}</p>` : ''}
        ${data.safetyConcerns ? `<p><strong>Risiken / Blocker:</strong> ${data.safetyConcerns}</p>` : ''}
      </div>
      
      <div class="recommendations">
        <div class="section-title">Empfehlungen</div>
        <ul>${recommendationsList}</ul>
      </div>
      
      <div class="section">
        <div class="section-title">Nächste Schritte</div>
        <ol>
          <li>Priorisieren Sie 1–2 Hebel mit dem größten Effekt</li>
          <li>Setzen Sie die Empfehlungen um und messen Sie die Wirkung</li>
          <li>Bei Rückfragen: aschwanden@kmu-beratungen.ch</li>
        </ol>
      </div>
      
      <p>Freundliche Grüße<br>KMU-Beratungen</p>
    </div>
    
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return {
    subject: 'Fit4Sale – Vollständige Auswertung (freigegeben)',
    html,
    text,
  }
}
