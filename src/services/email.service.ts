import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter;

  // Initialize the (fake) SMTP server
  static async init() {
    if(!this.transporter) {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host : 'smtp.ethereal.email',
        port : 587,
        secure : false,
        auth : {
          user : testAccount.user,
          pass : testAccount.pass,
        },
      });
      console.log('Ethereal Email transporter initialized');
    }
  }

  static async sendVerificationEmail(to: string, token: string) {
    await this.init();

    const verificationUrl = `http://localhost:3000/api/auth/verify-email/${token}`;

    const info = await this.transporter.sendMail({
      from: '"Auth Starter" <noreply@authstarter.com>',
      to,
      subject: 'Verify your email address',
      html : `
        <h2>Welcome to our app!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" target="_blank">Verify Email</a>
        <p>Or copy and paste this link: ${verificationUrl}</p>
      `, 
    });

    console.log(`Preview Verification Email: ${nodemailer.getTestMessageUrl(info)}`);
  }

  static async sendPasswordResetEmail(to: string, token: string) {
    await this.init();

    const resetUrl = `http://localhost:3000/api/auth/reset-password/${token}`;

    const info = await EmailService.transporter.sendMail({
      from : '"Auth Starter" <noreply@authstarter.com>',
      to,
      subject : 'Reset your password',
      html : `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to set a new one:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `
    });
    console.log(`🔑 Preview Password Reset Email: ${nodemailer.getTestMessageUrl(info)}`);
  }
}