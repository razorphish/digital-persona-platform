import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { PasswordResetUtils } from "../utils/passwordReset";

export class EmailService {
  private sesClient: SESClient;
  private fromEmail: string;
  private baseUrl: string;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || "us-west-1",
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined, // Use IAM role in production
    });

    this.fromEmail = process.env.FROM_EMAIL || "noreply@hibiji.com";
    this.baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    try {
      const resetUrl = PasswordResetUtils.generateResetUrl(token, this.baseUrl);

      const params = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: "Reset Your Password - Digital Persona Platform",
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: this.generatePasswordResetHtml(resetUrl),
              Charset: "UTF-8",
            },
            Text: {
              Data: this.generatePasswordResetText(resetUrl),
              Charset: "UTF-8",
            },
          },
        },
      };

      const command = new SendEmailCommand(params);
      await this.sesClient.send(command);

      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return false;
    }
  }

  /**
   * Generate HTML content for password reset email
   */
  private generatePasswordResetHtml(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reset Your Password</h1>
              <p>Digital Persona Platform</p>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>We received a request to reset your password for your Digital Persona Platform account.</p>
              
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul>
                  <li>This link will expire in 24 hours</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>For security, this link can only be used once</li>
                </ul>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>This email was sent from Digital Persona Platform</p>
              <p>If you have any questions, please contact our support team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate text content for password reset email
   */
  private generatePasswordResetText(resetUrl: string): string {
    return `
Reset Your Password - Digital Persona Platform

Hello!

We received a request to reset your password for your Digital Persona Platform account.

To reset your password, click the following link:
${resetUrl}

Important Security Information:
- This link will expire in 24 hours
- If you didn't request this reset, please ignore this email
- For security, this link can only be used once

If you have any questions, please contact our support team.

Best regards,
Digital Persona Platform Team
    `.trim();
  }

  /**
   * Send a test email to verify SES configuration
   */
  async sendTestEmail(toEmail: string): Promise<boolean> {
    try {
      const params = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [toEmail],
        },
        Message: {
          Subject: {
            Data: "Test Email - Digital Persona Platform",
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: "This is a test email to verify SES configuration.",
              Charset: "UTF-8",
            },
          },
        },
      };

      const command = new SendEmailCommand(params);
      await this.sesClient.send(command);

      console.log(`Test email sent to ${toEmail}`);
      return true;
    } catch (error) {
      console.error("Error sending test email:", error);
      return false;
    }
  }
}
