import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, KycStatus, Gender } from '../../shared/enums';

export interface IAddress {
  _id?: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: [number, number];
  isDefault: boolean;
}

export interface ISocialAccount {
  id: string;
  email?: string;
  displayName?: string;
}

export interface IFamilyMember {
  _id?: string;
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth: Date;
  gender?: string;
  passportNumber?: string;
  aadhaarNumber?: string;
  dietaryRestrictions?: string[];
  specialNeeds?: string;
  createdAt: Date;
}

export interface IUserDocument extends Document {
  _id: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    bio?: string;
    languagePreferences: string[];
    dietaryRestrictions?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  addresses: IAddress[];
  familyMembers: IFamilyMember[];
  kycStatus: KycStatus;
  kycDocuments: Array<{
    _id?: string;
    type: string;
    url: string;
    verifiedAt?: Date;
    status: KycStatus;
    rejectionReason?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
  }>;
  kycSubmittedAt?: Date;
  kycReviewedAt?: Date;
  kycReviewedBy?: string;
  kycNotes?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  socialAccounts?: {
    google?: ISocialAccount;
    apple?: ISocialAccount;
  };
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockUntil?: Date;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<void>;
}

const AddressSchema = new Schema<IAddress>(
  {
    label: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'India', trim: true },
    coordinates: {
      type: [Number],
      index: '2dsphere',
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const SocialAccountSchema = new Schema<ISocialAccount>(
  {
    id: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },
    displayName: { type: String, trim: true },
  },
  { _id: false }
);

const FamilyMemberSchema = new Schema<IFamilyMember>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    relationship: { type: String, required: true, enum: ['spouse', 'child', 'parent', 'sibling', 'friend', 'other'] },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: Object.values(Gender) },
    passportNumber: { type: String, trim: true, maxlength: 20 },
    aadhaarNumber: { type: String, trim: true, match: /^\d{12}$/ },
    dietaryRestrictions: { type: [String], default: [] },
    specialNeeds: { type: String, maxlength: 500 },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const UserSchema = new Schema<IUserDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian phone number (+91XXXXXXXXXX)'],
    },
    passwordHash: {
      type: String,
      minlength: [60, 'Password hash must be at least 60 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    profile: {
      firstName: { type: String, required: true, trim: true, maxlength: 50 },
      lastName: { type: String, required: true, trim: true, maxlength: 50 },
      avatar: { type: String, trim: true },
      dateOfBirth: { type: Date },
      gender: { type: String, enum: Object.values(Gender) },
      bio: { type: String, maxlength: 500 },
      languagePreferences: { type: [String], default: ['en'] },
      dietaryRestrictions: { type: [String] },
      emergencyContact: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        relationship: { type: String, trim: true },
      },
    },
    addresses: { type: [AddressSchema], default: [] },
    familyMembers: { type: [FamilyMemberSchema], default: [] },
    kycStatus: {
      type: String,
      enum: Object.values(KycStatus),
      default: KycStatus.PENDING,
    },
    kycDocuments: [
      {
        type: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        verifiedAt: { type: Date },
        status: { type: String, enum: Object.values(KycStatus), default: KycStatus.PENDING },
        rejectionReason: { type: String, maxlength: 500 },
        reviewedBy: { type: String, ref: 'User' },
        reviewedAt: { type: Date },
      },
    ],
    kycSubmittedAt: { type: Date },
    kycReviewedAt: { type: Date },
    kycReviewedBy: { type: String, ref: 'User' },
    kycNotes: { type: String, maxlength: 2000 },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    socialAccounts: {
      google: { type: SocialAccountSchema, sparse: true },
      apple: { type: SocialAccountSchema, sparse: true },
    },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    adminNotes: { type: String, maxlength: 2000 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for age
UserSchema.virtual('age').get(function () {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Indexes
UserSchema.index({ phone: 1 }, { unique: true, name: 'idx_user_phone' });
UserSchema.index({ email: 1 }, { unique: true, name: 'idx_user_email' });
UserSchema.index({ role: 1, createdAt: -1 }, { name: 'idx_user_role_created' });
UserSchema.index({ kycStatus: 1, createdAt: -1 }, { name: 'idx_user_kyc_status' });
UserSchema.index({ isActive: 1, role: 1 }, { name: 'idx_user_active_role' });
UserSchema.index({ isVerified: 1, createdAt: -1 }, { name: 'idx_user_verified_created' });
UserSchema.index({ 'profile.firstName': 'text', 'profile.lastName': 'text', email: 'text', phone: 'text' }, { name: 'idx_user_text_search', weights: { 'profile.firstName': 10, 'profile.lastName': 10, email: 5, phone: 3 } });
UserSchema.index({ 'socialAccounts.google.id': 1 }, { unique: true, sparse: true, name: 'idx_user_google' });
UserSchema.index({ 'socialAccounts.apple.id': 1 }, { unique: true, sparse: true, name: 'idx_user_apple' });
UserSchema.index({ createdAt: -1 }, { name: 'idx_user_created' });
UserSchema.index({ lastLoginAt: -1 }, { name: 'idx_user_last_login' });

// Pre-save password hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }
  }
  await this.save();
};

// JSON Schema Validation for MongoDB
export const UserValidationSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['email', 'phone', 'role', 'profile', 'isVerified', 'isActive', 'kycStatus', 'loginAttempts'],
    properties: {
      email: { bsonType: 'string', pattern: '^\S+@\S+\.\S+$' },
      phone: { bsonType: 'string', pattern: '^\+91[6-9]\d{9}$' },
      role: { enum: Object.values(UserRole) },
      isVerified: { bsonType: 'bool' },
      isActive: { bsonType: 'bool' },
      kycStatus: { enum: Object.values(KycStatus) },
      loginAttempts: { bsonType: 'int', minimum: 0 },
    },
  },
};

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', UserSchema);
