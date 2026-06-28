import { GuideRepository } from './guide.repository';
import { Guide, IGuideDocument } from './guide.model';
import { User, IUserDocument } from '@modules/users/user.model';
import { Booking, IBookingDocument } from '@modules/bookings/booking.model';
import { Review, IReviewDocument } from '@modules/reviews/review.model';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '@shared/errors';
import { VerificationStatus } from '@shared/enums';
import mongoose from 'mongoose';

export interface AssignmentResult {
  assignmentId: string;
  guideId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'auto_assigned';
  bookingId: string;
  listingId: string;
  assignedAt: Date;
  respondedAt?: Date;
  notes?: string;
  rejectionReason?: string;
}

export class GuideService {
  private assignments: Map<string, AssignmentResult> = new Map();

  constructor(
    private guideRepository: GuideRepository,
  ) {}

  // Guide registration
  async registerGuide(userId: string, dto: {
    bio: string;
    languages: string[];
    skills: string[];
    experienceYears: number;
    maxGroupSize: number;
    preferredDestinations: string[];
    emergencyContact: { name: string; phone: string };
  }): Promise<IGuideDocument> {
    const existing = await this.guideRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictError('Guide profile already exists for this user');
    }

    const guide = await this.guideRepository.create({
      userId,
      bio: dto.bio,
      languages: dto.languages,
      skills: dto.skills,
      experienceYears: dto.experienceYears || 0,
      maxGroupSize: dto.maxGroupSize || 20,
      preferredDestinations: dto.preferredDestinations || [],
      emergencyContact: dto.emergencyContact,
      availability: [],
      certifications: [],
      rating: 0,
      tripCount: 0,
      totalEarnings: 0,
      isActive: true,
      verificationStatus: VerificationStatus.PENDING,
    });

    return guide;
  }

  // Profile management
  async getGuideProfile(userId: string): Promise<IGuideDocument> {
    const guide = await this.guideRepository.findByUserId(userId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }
    return guide;
  }

  async updateGuideProfile(userId: string, dto: {
    bio?: string;
    languages?: string[];
    skills?: string[];
    experienceYears?: number;
    maxGroupSize?: number;
    preferredDestinations?: string[];
    emergencyContact?: { name?: string; phone?: string };
  }): Promise<IGuideDocument> {
    const guide = await this.guideRepository.findByUserId(userId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    const updates: Record<string, unknown> = {};

    if (dto.bio) updates.bio = dto.bio;
    if (dto.languages) updates.languages = dto.languages;
    if (dto.skills) updates.skills = dto.skills;
    if (dto.experienceYears !== undefined) updates.experienceYears = dto.experienceYears;
    if (dto.maxGroupSize !== undefined) updates.maxGroupSize = dto.maxGroupSize;
    if (dto.preferredDestinations) updates.preferredDestinations = dto.preferredDestinations;
    if (dto.emergencyContact) {
      updates.emergencyContact = {
        ...guide.emergencyContact,
        ...dto.emergencyContact,
      };
    }

    return this.guideRepository.update(guide._id, updates) as Promise<IGuideDocument>;
  }

  // Certification management
  async addCertification(userId: string, dto: {
    name: string;
    issuedBy: string;
    issuedAt: Date;
    expiresAt?: Date;
    documentUrl: string;
  }): Promise<IGuideDocument> {
    const guide = await this.guideRepository.findByUserId(userId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    if (guide.certifications.length >= 20) {
      throw new ValidationError('Maximum 20 certifications allowed');
    }

    const certification = {
      name: dto.name,
      issuedBy: dto.issuedBy,
      issuedAt: new Date(dto.issuedAt),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      documentUrl: dto.documentUrl,
      isVerified: false,
    };

    return Guide.findByIdAndUpdate(
      guide._id,
      { $push: { certifications: certification } },
      { new: true }
    ).exec() as Promise<IGuideDocument>;
  }

  async removeCertification(userId: string, certificationId: string): Promise<IGuideDocument> {
    const guide = await this.guideRepository.findByUserId(userId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    const cert = guide.certifications.find(c => c._id?.toString() === certificationId);
    if (!cert) {
      throw new NotFoundError('Certification not found');
    }

    if (cert.isVerified) {
      throw new ForbiddenError('Cannot remove verified certifications');
    }

    return Guide.findByIdAndUpdate(
      guide._id,
      { $pull: { certifications: { _id: certificationId } } },
      { new: true }
    ).exec() as Promise<IGuideDocument>;
  }

  // Availability calendar
  async updateAvailability(userId: string, dto: {
    availability: Array<{
      date: string;
      isAvailable: boolean;
      listingIds?: string[];
    }>;
  }): Promise<IGuideDocument> {
    const guide = await this.guideRepository.findByUserId(userId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    if (dto.availability.length > 365) {
      throw new ValidationError('Maximum 365 days can be updated at once');
    }

    const availability = dto.availability.map(a => ({
      date: new Date(a.date),
      isAvailable: a.isAvailable,
      listingIds: a.listingIds || [],
    }));

    // Remove existing entries for the same dates and add new ones
    const dates = availability.map(a => a.date);
    await Guide.findByIdAndUpdate(guide._id, {
      $pull: { availability: { date: { $in: dates } } },
    }).exec();

    return Guide.findByIdAndUpdate(
      guide._id,
      { $push: { availability: { $each: availability } } },
      { new: true }
    ).exec() as Promise<IGuideDocument>;
  }

  async getAvailability(userId: string, startDate: Date, endDate: Date): Promise<Array<{
    date: Date;
    isAvailable: boolean;
    listingIds: string[];
  }>> {
    const guide = await this.guideRepository.findByUserId(userId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    return guide.availability.filter(a =>
      a.date >= startDate && a.date <= endDate
    );
  }

  // Assignment workflow
  async createAssignment(vendorId: string, dto: {
    bookingId: string;
    listingId: string;
    autoAssign: boolean;
    guideId?: string;
    notes?: string;
  }): Promise<AssignmentResult> {
    const booking = await Booking.findById(dto.bookingId).exec();
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.vendorId !== vendorId) {
      throw new ForbiddenError('Booking does not belong to this vendor');
    }

    if (booking.status !== 'confirmed') {
      throw new ValidationError('Booking must be confirmed before guide assignment');
    }

    let guideId: string;

    if (dto.autoAssign) {
      // Find best matching guide
      const availableGuides = await this.guideRepository.findAvailableGuides({
        skills: [],
        maxGroupSize: booking.totalTravelers,
        date: booking.travelDates.startDate,
      }, 1, 10);

      if (availableGuides.guides.length === 0) {
        throw new ValidationError('No available guides found for this booking');
      }

      // Sort by rating and experience
      const bestGuide = availableGuides.guides.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.experienceYears - a.experienceYears;
      })[0];

      guideId = bestGuide._id.toString();
    } else if (dto.guideId) {
      const guide = await this.guideRepository.findById(dto.guideId);
      if (!guide) {
        throw new NotFoundError('Guide not found');
      }

      if (!guide.isActive || guide.verificationStatus !== VerificationStatus.VERIFIED) {
        throw new ValidationError('Guide is not available for assignment');
      }

      // Check availability
      const isAvailable = guide.availability.some(a =>
        a.date.toDateString() === new Date(booking.travelDates.startDate).toDateString() &&
        a.isAvailable
      );

      if (!isAvailable) {
        throw new ValidationError('Guide is not available on the requested date');
      }

      guideId = dto.guideId;
    } else {
      throw new ValidationError('Either autoAssign or guideId must be provided');
    }

    const assignmentId = new mongoose.Types.ObjectId().toString();
    const assignment: AssignmentResult = {
      assignmentId,
      guideId,
      status: dto.autoAssign ? 'auto_assigned' : 'pending',
      bookingId: dto.bookingId,
      listingId: dto.listingId,
      assignedAt: new Date(),
      notes: dto.notes,
    };

    this.assignments.set(assignmentId, assignment);

    // Update booking with guide assignment
    if (dto.autoAssign) {
      await Booking.findByIdAndUpdate(dto.bookingId, {
        guideId,
        status: 'confirmed',
      }).exec();
    }

    return assignment;
  }

  async respondToAssignment(guideUserId: string, assignmentId: string, dto: {
    accept: boolean;
    reason?: string;
  }): Promise<AssignmentResult> {
    const guide = await this.guideRepository.findByUserId(guideUserId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    if (assignment.guideId !== guide._id.toString()) {
      throw new ForbiddenError('This assignment is not for you');
    }

    if (assignment.status !== 'pending') {
      throw new ValidationError('Assignment has already been responded to');
    }

    assignment.status = dto.accept ? 'accepted' : 'rejected';
    assignment.respondedAt = new Date();
    if (!dto.accept && dto.reason) {
      assignment.rejectionReason = dto.reason;
    }

    this.assignments.set(assignmentId, assignment);

    // Update booking
    if (dto.accept) {
      await Booking.findByIdAndUpdate(assignment.bookingId, {
        guideId: assignment.guideId,
        status: 'confirmed',
      }).exec();
    }

    return assignment;
  }

  async getAssignments(guideUserId: string, filters: {
    status?: string;
    page: number;
    limit: number;
  }): Promise<{ assignments: AssignmentResult[]; total: number; page: number; totalPages: number }> {
    const guide = await this.guideRepository.findByUserId(guideUserId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    const guideId = guide._id.toString();
    let assignments = Array.from(this.assignments.values()).filter(a => a.guideId === guideId);

    if (filters.status) {
      assignments = assignments.filter(a => a.status === filters.status);
    }

    const total = assignments.length;
    const totalPages = Math.ceil(total / filters.limit);
    const start = (filters.page - 1) * filters.limit;
    const paginatedAssignments = assignments.slice(start, start + filters.limit);

    return {
      assignments: paginatedAssignments,
      total,
      page: filters.page,
      totalPages,
    };
  }

  // Earnings tracking
  async getEarnings(guideUserId: string, period: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalEarnings: number;
    totalTrips: number;
    avgEarningsPerTrip: number;
    byMonth: Array<{ month: string; earnings: number; trips: number }>;
    recentTrips: Array<{
      bookingId: string;
      listingTitle: string;
      date: Date;
      earnings: number;
      travelers: number;
      rating?: number;
    }>;
  }> {
    const guide = await this.guideRepository.findByUserId(guideUserId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    const bookings = await Booking.find({
      guideId: guide._id.toString(),
      status: 'completed',
      completedAt: { $gte: period.startDate, $lte: period.endDate },
    }).sort({ completedAt: -1 }).exec();

    const totalEarnings = bookings.reduce((sum, b) => sum + (b.guidePayoutAmount || 0), 0);
    const totalTrips = bookings.length;
    const avgEarningsPerTrip = totalTrips > 0 ? totalEarnings / totalTrips : 0;

    // Group by month
    const byMonthMap: Record<string, { earnings: number; trips: number }> = {};
    bookings.forEach(b => {
      const month = b.completedAt!.toISOString().slice(0, 7); // YYYY-MM
      if (!byMonthMap[month]) {
        byMonthMap[month] = { earnings: 0, trips: 0 };
      }
      byMonthMap[month].earnings += b.guidePayoutAmount || 0;
      byMonthMap[month].trips += 1;
    });

    const byMonth = Object.entries(byMonthMap).map(([month, data]) => ({
      month,
      earnings: data.earnings,
      trips: data.trips,
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Get recent trips with listing details
    const recentTrips = await Promise.all(
      bookings.slice(0, 10).map(async b => {
        const listing = await mongoose.model('Listing').findById(b.listingId).select('title').exec();
        const review = await Review.findOne({ bookingId: b._id }).select('rating').exec();
        return {
          bookingId: b._id.toString(),
          listingTitle: listing?.title || 'Unknown',
          date: b.completedAt!,
          earnings: b.guidePayoutAmount || 0,
          travelers: b.totalTravelers,
          rating: review?.rating,
        };
      })
    );

    return {
      totalEarnings,
      totalTrips,
      avgEarningsPerTrip,
      byMonth,
      recentTrips,
    };
  }

  async getEarningsSummary(guideUserId: string): Promise<{
    totalEarnings: number;
    totalTrips: number;
    avgRating: number;
    thisMonth: number;
    lastMonth: number;
    ytd: number;
    pendingPayout: number;
  }> {
    const guide = await this.guideRepository.findByUserId(guideUserId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      thisMonthBookings,
      lastMonthBookings,
      ytdBookings,
      allBookings,
      reviews,
    ] = await Promise.all([
      Booking.find({
        guideId: guide._id.toString(),
        status: 'completed',
        completedAt: { $gte: monthStart },
      }).exec(),
      Booking.find({
        guideId: guide._id.toString(),
        status: 'completed',
        completedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }).exec(),
      Booking.find({
        guideId: guide._id.toString(),
        status: 'completed',
        completedAt: { $gte: yearStart },
      }).exec(),
      Booking.find({
        guideId: guide._id.toString(),
        status: 'completed',
      }).exec(),
      Review.find({ guideId: guide._id.toString() }).exec(),
    ]);

    const thisMonth = thisMonthBookings.reduce((sum, b) => sum + (b.guidePayoutAmount || 0), 0);
    const lastMonth = lastMonthBookings.reduce((sum, b) => sum + (b.guidePayoutAmount || 0), 0);
    const ytd = ytdBookings.reduce((sum, b) => sum + (b.guidePayoutAmount || 0), 0);
    const totalEarnings = allBookings.reduce((sum, b) => sum + (b.guidePayoutAmount || 0), 0);
    const totalTrips = allBookings.length;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Pending payout from confirmed bookings not yet completed
    const pendingBookings = await Booking.find({
      guideId: guide._id.toString(),
      status: 'confirmed',
    }).exec();
    const pendingPayout = pendingBookings.reduce((sum, b) => sum + (b.guidePayoutAmount || 0), 0);

    return {
      totalEarnings,
      totalTrips,
      avgRating,
      thisMonth,
      lastMonth,
      ytd,
      pendingPayout,
    };
  }

  // Rating aggregation
  async getRatingAggregation(guideUserId: string): Promise<{
    overallRating: number;
    totalReviews: number;
    byDimension: Record<string, number>;
    distribution: Record<number, number>;
    recentReviews: IReviewDocument[];
  }> {
    const guide = await this.guideRepository.findByUserId(guideUserId);
    if (!guide) {
      throw new NotFoundError('Guide profile not found');
    }

    const reviews = await Review.find({
      guideId: guide._id.toString(),
      isApproved: true,
    }).exec();

    const totalReviews = reviews.length;
    const overallRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // By dimension
    const byDimension: Record<string, { sum: number; count: number }> = {};
    reviews.forEach(r => {
      Object.entries(r.dimensions).forEach(([key, value]) => {
        if (value !== undefined) {
          if (!byDimension[key]) {
            byDimension[key] = { sum: 0, count: 0 };
          }
          byDimension[key].sum += value;
          byDimension[key].count += 1;
        }
      });
    });

    const byDimensionAvg: Record<string, number> = {};
    Object.entries(byDimension).forEach(([key, data]) => {
      byDimensionAvg[key] = data.count > 0 ? data.sum / data.count : 0;
    });

    // Distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const rounded = Math.round(r.rating);
      if (rounded >= 1 && rounded <= 5) {
        distribution[rounded] += 1;
      }
    });

    const recentReviews = await Review.find({
      guideId: guide._id.toString(),
      isApproved: true,
    }).sort({ createdAt: -1 }).limit(5).exec();

    return {
      overallRating: Math.round(overallRating * 10) / 10,
      totalReviews,
      byDimension: byDimensionAvg,
      distribution,
      recentReviews,
    };
  }

  // Admin guide management
  async listGuides(filters: {
    skills?: string[];
    languages?: string[];
    minRating?: number;
    maxGroupSize?: number;
    isAvailable?: boolean;
    verificationStatus?: string;
    destination?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
    sort: string;
    order: 'asc' | 'desc';
  }): Promise<{ guides: IGuideDocument[]; total: number; page: number; totalPages: number }> {
    return this.guideRepository.searchGuides(
      filters,
      filters.page,
      filters.limit,
      filters.sort,
      filters.order
    );
  }

  async getGuideById(guideId: string): Promise<IGuideDocument> {
    const guide = await this.guideRepository.findById(guideId);
    if (!guide) {
      throw new NotFoundError('Guide not found');
    }
    return guide;
  }

  async reviewGuide(adminId: string, guideId: string, dto: {
    status: 'verified' | 'rejected' | 'under_review';
    notes?: string;
    rejectionReason?: string;
  }): Promise<IGuideDocument> {
    const guide = await this.guideRepository.findById(guideId);
    if (!guide) {
      throw new NotFoundError('Guide not found');
    }

    const updates: Record<string, unknown> = {
      verificationStatus: dto.status === 'verified' ? VerificationStatus.VERIFIED :
        dto.status === 'rejected' ? VerificationStatus.REJECTED :
        VerificationStatus.UNDER_REVIEW,
    };

    if (dto.status === 'verified') {
      updates.isActive = true;
    } else if (dto.status === 'rejected') {
      updates.isActive = false;
    }

    if (dto.notes) {
      updates.adminNotes = dto.notes;
    }

    if (dto.status === 'rejected' && dto.rejectionReason) {
      updates.adminNotes = `${dto.notes || ''}\nRejection reason: ${dto.rejectionReason}`.trim();
    }

    return this.guideRepository.update(guideId, updates) as Promise<IGuideDocument>;
  }

  async suspendGuide(adminId: string, guideId: string, reason?: string): Promise<IGuideDocument> {
    const guide = await this.guideRepository.findById(guideId);
    if (!guide) {
      throw new NotFoundError('Guide not found');
    }

    return this.guideRepository.update(guideId, {
      isActive: false,
      verificationStatus: VerificationStatus.SUSPENDED,
      adminNotes: reason ? `Suspended: ${reason}` : 'Guide suspended by admin',
    }) as Promise<IGuideDocument>;
  }

  async activateGuide(adminId: string, guideId: string): Promise<IGuideDocument> {
    const guide = await this.guideRepository.findById(guideId);
    if (!guide) {
      throw new NotFoundError('Guide not found');
    }

    return this.guideRepository.update(guideId, {
      isActive: true,
      verificationStatus: guide.verificationStatus === VerificationStatus.SUSPENDED
        ? VerificationStatus.VERIFIED
        : guide.verificationStatus,
    }) as Promise<IGuideDocument>;
  }

  async bulkAction(adminId: string, dto: {
    guideIds: string[];
    action: 'activate' | 'deactivate' | 'verify' | 'suspend';
    reason?: string;
  }): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const guideId of dto.guideIds) {
      try {
        const guide = await this.guideRepository.findById(guideId);
        if (!guide) {
          failed.push(guideId);
          continue;
        }

        switch (dto.action) {
          case 'activate':
            await this.guideRepository.update(guideId, { isActive: true });
            break;
          case 'deactivate':
            await this.guideRepository.update(guideId, { isActive: false });
            break;
          case 'verify':
            await this.guideRepository.update(guideId, {
              verificationStatus: VerificationStatus.VERIFIED,
              isActive: true,
            });
            break;
          case 'suspend':
            await this.guideRepository.update(guideId, {
              isActive: false,
              verificationStatus: VerificationStatus.SUSPENDED,
            });
            break;
        }

        success.push(guideId);
      } catch {
        failed.push(guideId);
      }
    }

    return { success, failed };
  }

  async getPendingVerificationQueue(
    page: number = 1,
    limit: number = 20
  ): Promise<{ guides: IGuideDocument[]; total: number; page: number; totalPages: number }> {
    return this.guideRepository.getPendingVerificationQueue(page, limit);
  }

  async getGuideStats(): Promise<{
    totalGuides: number;
    byVerificationStatus: Record<string, number>;
    bySkills: Record<string, number>;
    avgRating: number;
    totalTrips: number;
    totalEarnings: number;
    newThisMonth: number;
  }> {
    return this.guideRepository.getGuideStats();
  }

  // Public guide discovery
  async findAvailableGuides(filters: {
    skills?: string[];
    languages?: string[];
    minRating?: number;
    maxGroupSize?: number;
    destination?: string;
    date?: Date;
    page: number;
    limit: number;
  }): Promise<{ guides: IGuideDocument[]; total: number; page: number; totalPages: number }> {
    return this.guideRepository.findAvailableGuides(filters, filters.page, filters.limit);
  }
}
