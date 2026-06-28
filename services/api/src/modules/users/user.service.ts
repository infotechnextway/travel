import { UserRepository } from './user.repository';
import { EncryptionService } from '@shared/utils/encryption';
import { IUserDocument } from './user.model';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '@shared/errors';
import { KycStatus, UserRole } from '@shared/enums';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private encryptionService: EncryptionService
  ) {}

  // Profile management
  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, dto: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    dateOfBirth?: string;
    gender?: string;
    languagePreferences?: string[];
    dietaryRestrictions?: string[];
    emergencyContact?: { name: string; phone: string; relationship: string };
  }): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updates: Record<string, unknown> = {};

    if (dto.firstName) updates['profile.firstName'] = dto.firstName;
    if (dto.lastName) updates['profile.lastName'] = dto.lastName;
    if (dto.bio !== undefined) updates['profile.bio'] = dto.bio;
    if (dto.dateOfBirth) updates['profile.dateOfBirth'] = new Date(dto.dateOfBirth);
    if (dto.gender) updates['profile.gender'] = dto.gender;
    if (dto.languagePreferences) updates['profile.languagePreferences'] = dto.languagePreferences;
    if (dto.dietaryRestrictions) updates['profile.dietaryRestrictions'] = dto.dietaryRestrictions;
    if (dto.emergencyContact) updates['profile.emergencyContact'] = dto.emergencyContact;

    return this.userRepository.update(userId, updates) as Promise<IUserDocument>;
  }

  // Address management
  async addAddress(userId: string, dto: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    coordinates?: [number, number];
    isDefault?: boolean;
  }): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (dto.isDefault) {
      await this.userRepository.model.updateOne(
        { _id: userId },
        { $set: { 'addresses.$[].isDefault': false } }
      );
    }

    const address = {
      label: dto.label,
      line1: dto.line1,
      line2: dto.line2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country || 'India',
      coordinates: dto.coordinates,
      isDefault: dto.isDefault || false,
    };

    return this.userRepository.model.findByIdAndUpdate(
      userId,
      { $push: { addresses: address } },
      { new: true }
    ).exec() as Promise<IUserDocument>;
  }

  async removeAddress(userId: string, addressId: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.userRepository.model.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    ).exec() as Promise<IUserDocument>;
  }

  // Family members management
  async addFamilyMember(userId: string, dto: {
    firstName: string;
    lastName: string;
    relationship: string;
    dateOfBirth: string;
    gender?: string;
    passportNumber?: string;
    aadhaarNumber?: string;
    dietaryRestrictions?: string[];
    specialNeeds?: string;
  }): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.familyMembers.length >= 10) {
      throw new ValidationError('Maximum 10 family members allowed');
    }

    const member = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      relationship: dto.relationship,
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      passportNumber: dto.passportNumber,
      aadhaarNumber: dto.aadhaarNumber,
      dietaryRestrictions: dto.dietaryRestrictions || [],
      specialNeeds: dto.specialNeeds,
    };

    return this.userRepository.model.findByIdAndUpdate(
      userId,
      { $push: { familyMembers: member } },
      { new: true }
    ).exec() as Promise<IUserDocument>;
  }

  async updateFamilyMember(userId: string, memberId: string, dto: {
    firstName?: string;
    lastName?: string;
    relationship?: string;
    dateOfBirth?: string;
    gender?: string;
    passportNumber?: string;
    aadhaarNumber?: string;
    dietaryRestrictions?: string[];
    specialNeeds?: string;
  }): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const member = user.familyMembers.find(m => m._id?.toString() === memberId);
    if (!member) {
      throw new NotFoundError('Family member not found');
    }

    const updates: Record<string, unknown> = {};
    if (dto.firstName) updates['familyMembers.$.firstName'] = dto.firstName;
    if (dto.lastName) updates['familyMembers.$.lastName'] = dto.lastName;
    if (dto.relationship) updates['familyMembers.$.relationship'] = dto.relationship;
    if (dto.dateOfBirth) updates['familyMembers.$.dateOfBirth'] = new Date(dto.dateOfBirth);
    if (dto.gender) updates['familyMembers.$.gender'] = dto.gender;
    if (dto.passportNumber !== undefined) updates['familyMembers.$.passportNumber'] = dto.passportNumber;
    if (dto.aadhaarNumber !== undefined) updates['familyMembers.$.aadhaarNumber'] = dto.aadhaarNumber;
    if (dto.dietaryRestrictions) updates['familyMembers.$.dietaryRestrictions'] = dto.dietaryRestrictions;
    if (dto.specialNeeds !== undefined) updates['familyMembers.$.specialNeeds'] = dto.specialNeeds;

    return this.userRepository.model.findOneAndUpdate(
      { _id: userId, 'familyMembers._id': memberId },
      { $set: updates },
      { new: true }
    ).exec() as Promise<IUserDocument>;
  }

  async removeFamilyMember(userId: string, memberId: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.userRepository.model.findByIdAndUpdate(
      userId,
      { $pull: { familyMembers: { _id: memberId } } },
      { new: true }
    ).exec() as Promise<IUserDocument>;
  }

  // KYC document management
  async uploadKycDocument(userId: string, dto: {
    type: string;
    url: string;
  }): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.kycDocuments.length >= 5) {
      throw new ValidationError('Maximum 5 KYC documents allowed');
    }

    const document = {
      type: dto.type,
      url: dto.url,
      status: KycStatus.PENDING,
    };

    return this.userRepository.model.findByIdAndUpdate(
      userId,
      {
        $push: { kycDocuments: document },
        $set: {
          kycStatus: KycStatus.PENDING,
          kycSubmittedAt: new Date(),
        },
      },
      { new: true }
    ).exec() as Promise<IUserDocument>;
  }

  async removeKycDocument(userId: string, documentId: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const doc = user.kycDocuments.find(d => d._id?.toString() === documentId);
    if (!doc) {
      throw new NotFoundError('KYC document not found');
    }

    if (doc.status === KycStatus.VERIFIED) {
      throw new ForbiddenError('Cannot remove verified KYC document');
    }

    return this.userRepository.model.findByIdAndUpdate(
      userId,
      { $pull: { kycDocuments: { _id: documentId } } },
      { new: true }
    ).exec() as Promise<IUserDocument>;
  }

  async uploadAvatar(userId: string, fileUrl: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.userRepository.update(userId, { 'profile.avatar': fileUrl }) as Promise<IUserDocument>;
  }

  // Admin user management
  async listUsers(filters: {
    role?: string;
    isActive?: boolean;
    isVerified?: boolean;
    kycStatus?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    hasKycPending?: boolean;
    page: number;
    limit: number;
    sort: string;
    order: 'asc' | 'desc';
  }): Promise<{ users: IUserDocument[]; total: number; page: number; totalPages: number }> {
    return this.userRepository.searchUsers(
      filters,
      filters.page,
      filters.limit,
      filters.sort,
      filters.order
    );
  }

  async getUserById(userId: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async adminUpdateUser(
    adminId: string,
    userId: string,
    dto: {
      role?: string;
      isActive?: boolean;
      kycStatus?: string;
      isVerified?: boolean;
      notes?: string;
    }
  ): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const admin = await this.userRepository.findById(adminId);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      throw new ForbiddenError('Admin access required');
    }

    if (user.role === 'super_admin') {
      throw new ForbiddenError('Cannot modify super admin account');
    }

    if (dto.role && user.role === 'super_admin') {
      throw new ForbiddenError('Cannot change super admin role');
    }

    const updates: Record<string, unknown> = {};

    if (dto.role) updates.role = dto.role;
    if (dto.isActive !== undefined) updates.isActive = dto.isActive;
    if (dto.isVerified !== undefined) updates.isVerified = dto.isVerified;
    if (dto.notes !== undefined) updates.adminNotes = dto.notes;

    if (dto.kycStatus) {
      updates.kycStatus = dto.kycStatus;
      if (dto.kycStatus === 'verified') {
        updates.kycReviewedAt = new Date();
        updates.kycReviewedBy = adminId;
      }
    }

    return this.userRepository.update(userId, updates) as Promise<IUserDocument>;
  }

  async suspendUser(adminId: string, userId: string, reason?: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'super_admin') {
      throw new ForbiddenError('Cannot suspend super admin account');
    }

    const updates: Record<string, unknown> = {
      isActive: false,
      adminNotes: reason ? `Suspended: ${reason}` : 'Account suspended by admin',
    };

    return this.userRepository.update(userId, updates) as Promise<IUserDocument>;
  }

  async activateUser(adminId: string, userId: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.userRepository.update(userId, {
      isActive: true,
      $push: { adminNotes: 'Account reactivated by admin' },
    }) as Promise<IUserDocument>;
  }

  async bulkAction(
    adminId: string,
    dto: {
      userIds: string[];
      action: 'activate' | 'deactivate' | 'verify_kyc' | 'reject_kyc';
      reason?: string;
    }
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const userId of dto.userIds) {
      try {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          failed.push(userId);
          continue;
        }

        if (user.role === 'super_admin') {
          failed.push(userId);
          continue;
        }

        switch (dto.action) {
          case 'activate':
            await this.userRepository.update(userId, { isActive: true });
            break;
          case 'deactivate':
            await this.userRepository.update(userId, { isActive: false });
            break;
          case 'verify_kyc':
            await this.userRepository.update(userId, {
              kycStatus: KycStatus.VERIFIED,
              kycReviewedAt: new Date(),
              kycReviewedBy: adminId,
            });
            break;
          case 'reject_kyc':
            await this.userRepository.update(userId, {
              kycStatus: KycStatus.REJECTED,
              kycReviewedAt: new Date(),
              kycReviewedBy: adminId,
              kycNotes: dto.reason || 'KYC rejected by admin',
            });
            break;
        }

        success.push(userId);
      } catch {
        failed.push(userId);
      }
    }

    return { success, failed };
  }

  // KYC verification workflow
  async getKycQueue(
    page: number = 1,
    limit: number = 20,
    status: string = 'pending'
  ): Promise<{ users: IUserDocument[]; total: number; page: number; totalPages: number }> {
    return this.userRepository.getKycQueue(page, limit, status);
  }

  async reviewKyc(
    adminId: string,
    userId: string,
    dto: {
      status: 'verified' | 'rejected';
      documentIds?: string[];
      rejectionReason?: string;
      notes?: string;
    }
  ): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.kycStatus !== KycStatus.PENDING) {
      throw new ValidationError('KYC has already been reviewed');
    }

    if (user.kycDocuments.length === 0) {
      throw new ValidationError('No KYC documents submitted');
    }

    const updates: Record<string, unknown> = {
      kycStatus: dto.status === 'verified' ? KycStatus.VERIFIED : KycStatus.REJECTED,
      kycReviewedAt: new Date(),
      kycReviewedBy: adminId,
    };

    if (dto.notes) {
      updates.kycNotes = dto.notes;
    }

    if (dto.status === 'rejected' && dto.rejectionReason) {
      updates.kycNotes = `${dto.notes || ''}\nRejection reason: ${dto.rejectionReason}`.trim();
    }

    // Update individual document statuses if documentIds provided
    if (dto.documentIds && dto.documentIds.length > 0) {
      for (const docId of dto.documentIds) {
        await this.userRepository.model.updateOne(
          { _id: userId, 'kycDocuments._id': docId },
          {
            $set: {
              'kycDocuments.$.status': dto.status === 'verified' ? KycStatus.VERIFIED : KycStatus.REJECTED,
              'kycDocuments.$.reviewedAt': new Date(),
              'kycDocuments.$.reviewedBy': adminId,
              ...(dto.rejectionReason && { 'kycDocuments.$.rejectionReason': dto.rejectionReason }),
            },
          }
        );
      }
    }

    return this.userRepository.update(userId, updates) as Promise<IUserDocument>;
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    byRole: Record<string, number>;
    byKycStatus: Record<string, number>;
    activeUsers: number;
    verifiedUsers: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  }> {
    return this.userRepository.getUserStats();
  }
}
