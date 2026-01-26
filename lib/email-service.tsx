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

<<<<<<< HEAD
vielen Dank für Ihre Teilnahme am Fit4Sale Sales-Check.

Wir haben Ihre Angaben erhalten.

Wie geht es weiter?
- Wir erstellen automatisch eine **vorläufige Auswertung** auf Basis definierter Benchmarks
- Die **vollständige Auswertung** wird nach **manueller Freigabe** versendet
=======
Thank you for completing the Fit4Sale sales survey!

We have received your submission and our team is reviewing your responses. 

What happens next?
- We will analyze your answers against predefined benchmarks
- You will receive a preliminary report automatically
- The full report will be sent after manual approval
>>>>>>> 50dc961 (Final updates 24-jan)

Ihre Eingabenummer: ${data.submissionId}

Bei Fragen erreichen Sie uns unter aschwanden@kmu-beratungen.ch

<<<<<<< HEAD
Freundliche Grüße
=======
Best regards,
>>>>>>> 50dc961 (Final updates 24-jan)
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
<<<<<<< HEAD
      <p>Sales-Check erfolgreich eingereicht</p>
=======
      <p>Your Sales Survey Was Submitted Successfully</p>
>>>>>>> 50dc961 (Final updates 24-jan)
    </div>
    
    <div class="content">
      <p>Hallo <strong>${data.patientName}</strong>,</p>
      
<<<<<<< HEAD
      <p>vielen Dank für Ihre Teilnahme am Fit4Sale Sales-Check.</p>
      
      <p>Wir haben Ihre Angaben erhalten.</p>
=======
      <p>Thank you for completing the Fit4Sale sales survey!</p>
      
      <p>We have received your submission and our team is reviewing your responses.</p>
>>>>>>> 50dc961 (Final updates 24-jan)
      
      <h3>Wie geht es weiter?</h3>
      <ul>
<<<<<<< HEAD
        <li>Wir erstellen automatisch eine <strong>vorläufige Auswertung</strong> anhand definierter Benchmarks</li>
        <li>Die <strong>vollständige Auswertung</strong> wird nach <strong>manueller Freigabe</strong> versendet</li>
=======
        <li>We will analyze your answers against predefined benchmarks</li>
        <li>You will receive a preliminary report automatically</li>
        <li>The full report will be sent after manual approval</li>
>>>>>>> 50dc961 (Final updates 24-jan)
      </ul>
      
      <div class="highlight">
        <p><strong>Ihre Eingabenummer:</strong> ${data.submissionId}</p>
      </div>
      
      <p>Bei Fragen erreichen Sie uns unter aschwanden@kmu-beratungen.ch</p>
      
<<<<<<< HEAD
      <p>Freundliche Grüße<br>KMU-Beratungen</p>
=======
      <p>Best regards,<br>KMU-Beratungen</p>
>>>>>>> 50dc961 (Final updates 24-jan)
    </div>
    
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return {
<<<<<<< HEAD
    subject: 'Fit4Sale – Sales-Check eingereicht',
=======
    subject: 'Fit4Sale – Survey submitted',
>>>>>>> 50dc961 (Final updates 24-jan)
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

<<<<<<< HEAD
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
=======
Your Fit4Sale report is ready. Here are your results:

Summary: ${data.recommendedProgram}
Category: ${data.intensityLevel}
Timeline: ${data.programDuration}

Notes: ${data.specialModifications || 'None'}
Risks / Blockers: ${data.safetyConcerns || 'None'}

Recommendations:
${data.personalizedRecommendations}

Next Steps:
1. Review the recommendations above
2. Prioritize the biggest leverage items first
3. Reply to this email if you want to discuss the details
4. Reach out to us if you have any questions

Best regards,
>>>>>>> 50dc961 (Final updates 24-jan)
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
<<<<<<< HEAD
      <p>Ihre Auswertung</p>
=======
      <p>Your Sales Report</p>
>>>>>>> 50dc961 (Final updates 24-jan)
    </div>
    
    <div class="content">
      <p>${data.greeting || `Hallo <strong>${data.patientName}</strong>`},</p>
      
<<<<<<< HEAD
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
=======
      <p>Your Fit4Sale report is ready. Here are your results:</p>
      
      <div class="info-box">
        <div class="section-title">Summary</div>
        <p><strong>Summary:</strong> ${data.recommendedProgram}</p>
        <p><strong>Category:</strong> ${data.intensityLevel}</p>
        <p><strong>Timeline:</strong> ${data.programDuration}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Notes</div>
        ${data.specialModifications ? `<p><strong>Notes:</strong> ${data.specialModifications}</p>` : ''}
        ${data.safetyConcerns ? `<p><strong>Risks / Blockers:</strong> ${data.safetyConcerns}</p>` : ''}
      </div>
      
      <div class="recommendations">
        <div class="section-title">Recommendations</div>
>>>>>>> 50dc961 (Final updates 24-jan)
        <ul>${recommendationsList}</ul>
      </div>
      
      <div class="section">
        <div class="section-title">Nächste Schritte</div>
        <ol>
<<<<<<< HEAD
          <li>Priorisieren Sie 1–2 Hebel mit dem größten Effekt</li>
          <li>Setzen Sie die Empfehlungen um und messen Sie die Wirkung</li>
          <li>Bei Rückfragen: aschwanden@kmu-beratungen.ch</li>
        </ol>
      </div>
      
      <p>Freundliche Grüße<br>KMU-Beratungen</p>
=======
          <li>Review the recommendations above</li>
          <li>Prioritize the biggest leverage items first</li>
          <li>Reply if you want to discuss the details</li>
          <li>Reach out to us if you have any questions</li>
        </ol>
      </div>
      
      <p>Best regards,<br>KMU-Beratungen</p>
>>>>>>> 50dc961 (Final updates 24-jan)
    </div>
    
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return {
<<<<<<< HEAD
    subject: 'Fit4Sale – Vollständige Auswertung (freigegeben)',
=======
    subject: 'Fit4Sale – Your report',
>>>>>>> 50dc961 (Final updates 24-jan)
    html,
    text,
  }
}
