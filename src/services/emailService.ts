const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Omega AI <onboarding@resend.dev>',
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!response.ok) {
        return false;
      }

      return true;
    } catch (error) {
      console.warn("Email sending failed. Note: Resend API cannot be called directly from the browser due to CORS security policies. In a production environment, this should be routed through a backend API.", error);
      return false;
    }
  }

  async send2FACode(email: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000; color: #fff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 12px; padding: 40px; }
            .logo { text-align: center; font-size: 48px; color: #FF6B00; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #fff; }
            .code { background: #222; border: 2px solid #FF6B00; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #FF6B00; margin: 30px 0; letter-spacing: 8px; }
            .text { color: #aaa; line-height: 1.6; margin-bottom: 15px; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Ω</div>
            <div class="title">Your Two-Factor Authentication Code</div>
            <p class="text">Use the code below to complete your login:</p>
            <div class="code">${code}</div>
            <p class="text">This code will expire in 10 minutes.</p>
            <p class="text">If you didn't request this code, please ignore this email.</p>
            <div class="footer">
              <p>Omega - Uncensored AI Assistant</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your 2FA Code - Omega AI',
      html,
    });
  }

  async sendTeamInvitation(email: string, inviterName: string, teamName: string): Promise<boolean> {
    const inviteLink = `${window.location.origin}/signup?invite=true`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000; color: #fff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 12px; padding: 40px; }
            .logo { text-align: center; font-size: 48px; color: #FF6B00; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #fff; }
            .text { color: #aaa; line-height: 1.6; margin-bottom: 15px; }
            .button { display: inline-block; background: #FF6B00; color: #000; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 30px 0; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Ω</div>
            <div class="title">You're Invited to Join ${teamName}</div>
            <p class="text">${inviterName} has invited you to join their team on Omega AI.</p>
            <p class="text">Omega is the most advanced uncensored AI assistant. Join your team to collaborate and unlock unlimited potential.</p>
            <div style="text-align: center;">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </div>
            <p class="text">Or copy this link: ${inviteLink}</p>
            <div class="footer">
              <p>Omega - Uncensored AI Assistant</p>
              <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `You're invited to join ${teamName} on Omega AI`,
      html,
    });
  }

  async sendPasswordReset(email: string, resetLink: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000; color: #fff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 12px; padding: 40px; }
            .logo { text-align: center; font-size: 48px; color: #FF6B00; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #fff; }
            .text { color: #aaa; line-height: 1.6; margin-bottom: 15px; }
            .button { display: inline-block; background: #FF6B00; color: #000; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 30px 0; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Ω</div>
            <div class="title">Reset Your Password</div>
            <p class="text">We received a request to reset your password for your Omega AI account.</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p class="text">This link will expire in 1 hour.</p>
            <p class="text">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            <div class="footer">
              <p>Omega - Uncensored AI Assistant</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Omega AI',
      html,
    });
  }
}

export const emailService = new EmailService();
