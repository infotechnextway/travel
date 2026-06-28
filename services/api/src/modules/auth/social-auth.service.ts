import crypto from 'crypto';
import axios from 'axios';
import { UserRepository } from '@modules/users/user.repository';
import { JwtService } from '@shared/utils/jwt';
import { PasswordService } from '@shared/utils/password';
import { IUserDocument } from '@modules/users/user.model';
import { UserRole, KycStatus, Permission } from '@shared/enums';
import { TokenPair } from '@shared/types';
import { UnauthorizedError, ConflictError } from '@shared/errors';

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface AppleTokenPayload {
  sub: string;
  email?: string;
  name?: { firstName?: string; lastName?: string };
}

export class SocialAuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private passwordService: PasswordService
  ) {}

  async googleAuth(token: string): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    const googleUser = await this.verifyGoogleToken(token);

    let user = await this.userRepository.findByGoogleId(googleUser.sub);

    if (!user && googleUser.email) {
      const existing = await this.userRepository.findByEmail(googleUser.email);
      if (existing) {
        if (existing.socialAccounts?.google?.id) {
          throw new ConflictError('This Google account is already linked to another user');
        }

        existing.socialAccounts = {
          ...(existing.socialAccounts || {}),
          google: {
            id: googleUser.sub,
            email: googleUser.email,
            displayName: googleUser.name,
          },
        };
        await existing.save();
        user = existing;
      }
    }

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await this.passwordService.hash(randomPassword);

      const placeholderPhone = `+9199999${Math.floor(100000 + Math.random() * 900000)}`;

      user = await this.userRepository.create({
        email: googleUser.email,
        phone: placeholderPhone,
        passwordHash,
        role: UserRole.CUSTOMER,
        profile: {
          firstName: googleUser.given_name || 'Google',
          lastName: googleUser.family_name || 'User',
          avatar: googleUser.picture,
          languagePreferences: ['en'],
        },
        isVerified: true,
        kycStatus: KycStatus.PENDING,
        loginAttempts: 0,
        socialAccounts: {
          google: {
            id: googleUser.sub,
            email: googleUser.email,
            displayName: googleUser.name,
          },
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been suspended');
    }

    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }

  async appleAuth(token: string, idToken?: string): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    const appleUser = await this.verifyAppleToken(token, idToken);

    let user = await this.userRepository.findByAppleId(appleUser.sub);

    if (!user && appleUser.email) {
      const existing = await this.userRepository.findByEmail(appleUser.email);
      if (existing) {
        if (existing.socialAccounts?.apple?.id) {
          throw new ConflictError('This Apple ID is already linked to another user');
        }

        existing.socialAccounts = {
          ...(existing.socialAccounts || {}),
          apple: {
            id: appleUser.sub,
            email: appleUser.email,
            displayName: appleUser.name?.firstName,
          },
        };
        await existing.save();
        user = existing;
      }
    }

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await this.passwordService.hash(randomPassword);

      const placeholderPhone = `+9199999${Math.floor(100000 + Math.random() * 900000)}`;

      user = await this.userRepository.create({
        email: appleUser.email || `apple_${appleUser.sub}@indiatravel.market`,
        phone: placeholderPhone,
        passwordHash,
        role: UserRole.CUSTOMER,
        profile: {
          firstName: appleUser.name?.firstName || 'Apple',
          lastName: appleUser.name?.lastName || 'User',
          languagePreferences: ['en'],
        },
        isVerified: true,
        kycStatus: KycStatus.PENDING,
        loginAttempts: 0,
        socialAccounts: {
          apple: {
            id: appleUser.sub,
            email: appleUser.email,
            displayName: appleUser.name?.firstName,
          },
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been suspended');
    }

    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }

  private async verifyGoogleToken(token: string): Promise<GoogleUserInfo> {
    try {
      const { data } = await axios.get<GoogleUserInfo>(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch {
      throw new UnauthorizedError('Invalid Google access token');
    }
  }

  private async verifyAppleToken(_token: string, idToken?: string): Promise<AppleTokenPayload> {
    if (!idToken) {
      throw new UnauthorizedError('Apple ID token is required');
    }

    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      const payload = JSON.parse(jsonPayload);

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    } catch {
      throw new UnauthorizedError('Invalid Apple ID token');
    }
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

    return { accessToken, refreshToken, expiresIn: 900 };
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
