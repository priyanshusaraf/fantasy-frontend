import nodemailer from "nodemailer";

// EmailService is kept here for general email notifications,
// but password reset emails are no longer supported.
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    try {
      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Your App" <noreply@yourapp.com>',
        ...options,
      });

      logEvent("Email Sent", {
        to: options.to,
        subject: options.subject,
      });

      return result;
    } catch (error) {
      logger.error("Email sending failed", {
        error: error,
        recipient: options.to,
        subject: options.subject,
      });
      throw new Error("Failed to send email");
    }
  }
}

// Comprehensive configuration utility
export class ConfigManager {
  // Load configuration with environment-specific overrides
  static getConfig(key: string, defaultValue?: any): any {
    // Priority: Environment variable > default value
    return process.env[key] || defaultValue;
  }

  // Validate critical configuration
  static validateConfig() {
    const criticalKeys = ["DATABASE_URL", "JWT_SECRET", "SMTP_HOST", "APP_URL"];

    const missingKeys = criticalKeys.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
      logger.error("Missing critical configuration", { missingKeys });
      throw new Error(
        `Missing critical configuration: ${missingKeys.join(", ")}`
      );
    }
  }
}
