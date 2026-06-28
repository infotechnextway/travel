import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { OTP } from '@modules/auth/otp.model';
import { UnauthorizedError } from '@shared/errors';

export class OtpService {
  async generateSmsOtp(phone: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({
      phone,
      code,
      expiresAt,
      attempts: 0,
      isUsed: false,
    });

    return code;
  }

  async verifySmsOtp(phone: string, code: string): Promise<boolean> {
    const otp = await OTP.findOne({
      phone,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) return false;
    if (otp.attempts >= 3) {
      await OTP.updateOne({ _id: otp._id }, { isUsed: true });
      return false;
    }

    otp.attempts += 1;

    if (otp.code !== code) {
      await otp.save();
      return false;
    }

    otp.isUsed = true;
    await otp.save();
    return true;
  }

  generateTfaSecret(): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: 'India Travel Marketplace',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
    };
  }

  async generateTfaQrCode(secret: string): Promise<string> {
    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: 'India Travel Marketplace',
      issuer: 'India Travel Marketplace',
      encoding: 'base32',
    });

    return qrcode.toDataURL(otpauthUrl);
  }

  verifyTfaCode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
  }
}
