const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, code, type = 'VERIFY') => {
  let subject, title, body, color, icon;
  
  switch(type) {
    case 'DELETE':
      subject = 'Confirm Account Deletion - Focus';
      title = 'Security Alert';
      body = 'You requested to permanently delete your Focus account. Use the code below to finalize this action. If you did not request this, please secure your account immediately.';
      color = '#FF3B30'; // Apple Red
      icon = '🗑️';
      break;
    case 'RESET':
      subject = 'Reset Your Password - Focus';
      title = 'Password Reset';
      body = 'We received a request to reset your password. Enter the 6-digit code below to set a new password. This code will expire in 1 hour.';
      color = '#007AFF'; // Apple Blue
      icon = '🔑';
      break;
    default:
      subject = 'Verify Your Email - Focus';
      title = 'Welcome to Focus';
      body = 'Thank you for joining. To complete your registration and start organizing your life, please verify your email address using the code below.';
      color = '#007AFF'; // Apple Blue
      icon = '✓';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #F5F5F7; color: #1D1D1F; }
        .container { max-width: 600px; margin: 40px auto; background: #FFFFFF; border-radius: 32px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); }
        .header { padding: 40px 40px 20px; text-align: center; }
        .content { padding: 0 40px 40px; text-align: center; }
        .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px; color: #1D1D1F; }
        .title { font-size: 28px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.8px; color: #1D1D1F; }
        .body-text { font-size: 16px; line-height: 1.6; color: #86868B; margin-bottom: 32px; }
        .code-container { background: #F5F5F7; border-radius: 20px; padding: 24px; margin-bottom: 32px; border: 1px solid rgba(0,0,0,0.05); }
        .code { font-family: "SF Mono", "Fira Code", monospace; font-size: 42px; font-weight: 800; letter-spacing: 8px; color: ${color}; }
        .footer { padding: 32px 40px; background: #F5F5F7; text-align: center; border-top: 1px solid rgba(0,0,0,0.05); }
        .footer-text { font-size: 12px; color: #86868B; line-height: 1.5; }
        .icon-box { width: 64px; height: 64px; background: ${color}10; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; color: ${color}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Focus</div>
          <div class="icon-box">${icon}</div>
          <div class="title">${title}</div>
        </div>
        <div class="content">
          <p class="body-text">${body}</p>
          <div class="code-container">
            <div class="code">${code}</div>
          </div>
          <p class="body-text" style="font-size: 14px;">This code is valid for a limited time only. Please do not share this code with anyone.</p>
        </div>
        <div class="footer">
          <p class="footer-text">
            &copy; 2026 Focus App. Built for Clarity.<br>
            Privacy is built in. Standard on Focus.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({ from: `"Focus Support" <${process.env.EMAIL_USER || 'noreply@focus.app'}>`, to: email, subject, html });
  } catch (error) {
    console.error('Email send error:', error.message);
  }
};

module.exports = { sendVerificationEmail };
