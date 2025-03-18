import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: any[];
}

/**
 * Send an email using nodemailer
 */
export async function sendEmail(params: EmailParams) {
  const { to, subject, text, html, from, attachments } = params;

  // For development/testing, use Ethereal mail
  if (process.env.NODE_ENV === 'development' && process.env.USE_ETHEREAL === 'true') {
    return sendTestEmail(params);
  }

  try {
    // Create transport
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Default from address
    const defaultFrom = process.env.EMAIL_FROM || 'noreply@fantasy-pickleball.com';

    // Send email
    const info = await transporter.sendMail({
      from: from || defaultFrom,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send a test email using Ethereal for development
 */
async function sendTestEmail(params: EmailParams) {
  try {
    // Create test account
    const testAccount = await nodemailer.createTestAccount();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: params.from || '"Fantasy Pickleball" <test@fantasy-pickleball.com>',
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments,
    });

    // Log Ethereal URL
    console.log(`Test email sent: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    
    return info;
  } catch (error) {
    console.error('Error sending test email:', error);
    return null;
  }
} 