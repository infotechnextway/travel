import mongoose from 'mongoose';
import { UserRepository } from '@modules/users/user.repository';
import { RefreshToken, IRefreshTokenDocument } from './refresh-token.model';
import { OtpService } from '@shared/utils/otp';
import { JwtService } from '@shared/utils/jwt';
import { PasswordService } from '@shared/utils/password';
import { IUserDocument } from '@modules/users/user.model';
import { UserRole, KycStatus, Permission } from '@shared/enums';
import { TokenPair } from '@shared/types';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@shared/errors';

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private refreshTokenModel: mongoose.Model<IRefreshTokenDocument>,
    private otpService: OtpService,
    private jwtService: JwtService,
    private passwordService: PasswordService
  ) {}

  async register(dto: {
    email: string;
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    const { email, phone, password, firstName, lastName, role } = dto;

    const existsEmail = await this.userRepository.existsByEmail(email);
    if (existsEmail) {
      throw new ConflictError('Email already registered');
    }

    const existsPhone = await this.userRepository.existsByPhone(phone);
    if (existsPhone) {
      throw new ConflictError('Phone number already registered');
    }

    const passwordHash = await this.passwordService.hash(password);

    const user = await this.userRepository.create({
      email,
      phone,
      passwordHash,
      role: (role as UserRole) || UserRole.CUSTOMER,
      profile: { firstName, lastName, languagePreferences: ['en'] },
      isVerified: false,
      kycStatus: KycStatus.PENDING,
      loginAttempts: 0,
    });

    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }

  async login(dto: {
    email?: string;
    phone?: string;
    password: string;
  }): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    const { email, phone, password } = dto;

    let user: IUserDocument | null = null;

    if (email) {
      user = await this.userRepository.findByEmailWithPassword(email);
    } else if (phone) {
      user = await this.userRepository.findByPhoneWithPassword(phone);
    }

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Account has been suspended. Please contact support.');
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new ForbiddenError(
        'Account is temporarily locked due to too many failed attempts. Try again later.'
      );
    }

    const isValid = await this.passwordService.compare(password, user.passwordHash);

    if (!isValid) {
      await user.incrementLoginAttempts();
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const tokenDoc = await this.refreshTokenModel.findOne({
      token: refreshToken,
      isRevoked: false,
    });

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(tokenDoc.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    await this.refreshTokenModel.updateOne(
      { _id: tokenDoc._id },
      { isRevoked: true }
    );

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { token: refreshToken },
      { isRevoked: true }
    );
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  async sendOtp(phone: string): Promise<void> {
    const code = await this.otpService.generateSmsOtp(phone);

    // Production: Integrate Twilio here
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV OTP] ${phone}: ${code}`);
    }
  }

  async verifyOtp(
    phone: string,
    code: string
  ): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    const isValid = await this.otpService.verifySmsOtp(phone, code);
    if (!isValid) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    let user = await this.userRepository.findByPhone(phone);

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const passwordHash = await this.passwordService.hash(randomPassword);

      user = await this.userRepository.create({
        phone,
        email: `${phone.replace(/\+91/, '')}@otp.indiatravel.market`,
        passwordHash,
        role: UserRole.CUSTOMER,
        profile: {
          firstName: 'User',
          lastName: phone.slice(-4),
          languagePreferences: ['en'],
        },
        isVerified: true,
        kycStatus: KycStatus.PENDING,
        loginAttempts: 0,
      });
    }

    if (!user.isActive) {
      throw new ForbiddenError('Account has been suspended');
    }

    user.isVerified = true;
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return;

    const permissions = this.getRolePermissions(user.role);
    const resetToken = this.jwtService.generatePasswordResetToken({
      userId: user._id,
      role: user.role,
      permissions,
    });

    // Production: Send email with reset link
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV RESET] ${email}: ${resetToken}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = this.jwtService.verifyAccessToken(token);
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    await this.userRepository.update(user._id, { passwordHash });
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findByIdWithSelect(userId, '+passwordHash');

    if (!user || !user.passwordHash) {
      throw new NotFoundError('User not found');
    }

    const isValid = await this.passwordService.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    await this.userRepository.update(userId, { passwordHash });
  }

  async setupMfa(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { secret, qrCodeUrl } = this.otpService.generateTfaSecret();
    const qrCodeDataUrl = await this.otpService.generateTfaQrCode(secret);

    await this.userRepository.update(userId, {
      twoFactorSecret: secret,
      twoFactorEnabled: false,
    });

    return { secret, qrCodeUrl: qrCodeDataUrl };
  }

  async verifyMfaSetup(userId: string, code: string): Promise<void> {
    const user = await this.userRepository.findByIdWithSelect(userId, '+twoFactorSecret');
    if (!user || !user.twoFactorSecret) {
      throw new NotFoundError('MFA setup not initiated');
    }

    const isValid = this.otpService.verifyTfaCode(user.twoFactorSecret, code);
    if (!isValid) {
      throw new UnauthorizedError('Invalid MFA code');
    }

    await this.userRepository.update(userId, { twoFactorEnabled: true });
  }

  async verifyMfaLogin(userId: string, code: string): Promise<TokenPair> {
    const user = await this.userRepository.findByIdWithSelect(userId, '+twoFactorSecret');
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      throw new UnauthorizedError('MFA not enabled for this account');
    }

    const isValid = this.otpService.verifyTfaCode(user.twoFactorSecret, code);
    if (!isValid) {
      throw new UnauthorizedError('Invalid MFA code');
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: IUserDocument): Promise<TokenPair> {
    const permissions = this.getRolePermissions(user.role);
    const payload = {
      userId: user._id,
      role: user.role,
      permissions,
    };

    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenModel.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions: Record<string, string[]> = {
      [UserRole.CUSTOMER]: [Permission.VIEW_DASHBOARD],
      [UserRole.VENDOR]: [
        Permission.VIEW_DASHBOARD,
        Permission.VENDOR_CREATE_LISTING,
        Permission.VENDOR_MANAGE_BOOKINGS,
        Permission.VENDOR_VIEW_ANALYTICS,
      ],
      [UserRole.GUIDE]: [
        Permission.VIEW_DASHBOARD,
        Permission.GUIDE_VIEW_ASSIGNMENTS,
        Permission.GUIDE_UPDATE_AVAILABILITY,
      ],
      [UserRole.ADMIN]: [
        Permission.VIEW_DASHBOARD,
        Permission.MANAGE_USERS,
        Permission.MANAGE_VENDORS,
        Permission.MANAGE_GUIDES,
        Permission.MANAGE_LISTINGS,
        Permission.MANAGE_BOOKINGS,
        Permission.MANAGE_REVIEWS,
        Permission.MANAGE_SUPPORT,
        Permission.MANAGE_CMS,
      ],
      [UserRole.SUPER_ADMIN]: Object.values(Permission),
    };

    return permissions[role] || [];
  }
}
