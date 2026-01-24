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
Hello ${data.patientName},

Thank you for completing your Fit4Sale fitness evaluation survey!

We have received your submission and our team of fitness experts is reviewing your responses. 

What happens next?
- Our team will carefully analyze your fitness background, goals, and health information
- We will create a personalized fitness program tailored to your needs
- You will receive your evaluation and recommendations within 2-3 business days via email

Your Submission ID: ${data.submissionId}

If you have any questions in the meantime, please don't hesitate to contact us.

Best regards,
The Fit4Sale Team
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
      <p>Your Fitness Evaluation Submitted Successfully</p>
    </div>
    
    <div class="content">
      <p>Hello <strong>${data.patientName}</strong>,</p>
      
      <p>Thank you for completing your Fit4Sale fitness evaluation survey!</p>
      
      <p>We have received your submission and our team of fitness experts is reviewing your responses.</p>
      
      <h3>What happens next?</h3>
      <ul>
        <li>Our team will carefully analyze your fitness background, goals, and health information</li>
        <li>We will create a personalized fitness program tailored to your needs</li>
        <li>You will receive your evaluation and recommendations within 2-3 business days via email</li>
      </ul>
      
      <div class="highlight">
        <p><strong>Your Submission ID:</strong> ${data.submissionId}</p>
      </div>
      
      <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>The Fit4Sale Team</p>
    </div>
    
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return {
    subject: 'Your Fit4Sale Fitness Evaluation Has Been Submitted',
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

  const text = `
Hello ${data.patientName},

Your Fit4Sale fitness evaluation is complete! Here are your personalized recommendations:

Recommended Program: ${data.recommendedProgram}
Intensity Level: ${data.intensityLevel}
Program Duration: ${data.programDuration}

Special Modifications: ${data.specialModifications || 'None'}
Safety Concerns: ${data.safetyConcerns || 'None'}

Personalized Recommendations:
${data.personalizedRecommendations}

Next Steps:
1. Review the recommendations above
2. Start your fitness program at the recommended intensity
3. Follow the personalized recommendations for best results
4. Reach out to us if you have any questions

Best regards,
The Fit4Sale Team
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
      <p>Your Fitness Evaluation Results</p>
    </div>
    
    <div class="content">
      <p>Hello <strong>${data.patientName}</strong>,</p>
      
      <p>Your Fit4Sale fitness evaluation is complete! Here are your personalized recommendations:</p>
      
      <div class="info-box">
        <div class="section-title">Your Program</div>
        <p><strong>Recommended Program:</strong> ${data.recommendedProgram}</p>
        <p><strong>Intensity Level:</strong> ${data.intensityLevel}</p>
        <p><strong>Duration:</strong> ${data.programDuration}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Important Notes</div>
        ${data.specialModifications ? `<p><strong>Special Modifications:</strong> ${data.specialModifications}</p>` : ''}
        ${data.safetyConcerns ? `<p><strong>Safety Considerations:</strong> ${data.safetyConcerns}</p>` : ''}
      </div>
      
      <div class="recommendations">
        <div class="section-title">Your Personalized Recommendations</div>
        <ul>${recommendationsList}</ul>
      </div>
      
      <div class="section">
        <div class="section-title">Next Steps</div>
        <ol>
          <li>Review the recommendations above</li>
          <li>Start your fitness program at the recommended intensity</li>
          <li>Follow the personalized recommendations for best results</li>
          <li>Reach out to us if you have any questions</li>
        </ol>
      </div>
      
      <p>Best regards,<br>The Fit4Sale Team</p>
    </div>
    
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return {
    subject: 'Your Fit4Sale Fitness Evaluation Results',
    html,
    text,
  }
}
