module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metodo non consentito' });
  }

  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Nome e email sono richiesti' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFICATION_EMAIL;

  if (!apiKey || !toEmail) {
    console.error('Environment variables RESEND_API_KEY or NOTIFICATION_EMAIL are missing');
    return res.status(500).json({ 
      success: false, 
      error: 'Configurazione server incompleta (variabili d\'ambiente mancanti)' 
    });
  }

  try {
    const emailBody = {
      from: 'Pyxed Leads <onboarding@resend.dev>',
      to: toEmail,
      subject: '🚀 Nuovo Lead Acquisito - Cheat Sheet',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px;">
          <h2 style="color: #152C56; margin-bottom: 20px;">Nuovo Lead Acquisito!</h2>
          <p>Un utente ha compilato il form sulla landing page per scaricare la Cheat Sheet di Pyxed.</p>
          <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
          <p style="font-size: 0.85rem; color: #5A6E85;">Questo messaggio è stato inviato automaticamente da Pyxed Lead Funnel.</p>
        </div>
      `
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(emailBody)
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, message: 'Lead salvato con successo e notificato via email' });
    } else {
      console.error('Resend API Error:', data);
      return res.status(502).json({ success: false, error: 'Errore durante l\'invio dell\'email di notifica' });
    }
  } catch (error) {
    console.error('Server error handling lead:', error);
    return res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
};
