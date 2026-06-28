import { BaseRepository } from '@shared/repository';
import { Vendor, IVendorDocument } from './vendor.model';

export class VendorRepository extends BaseRepository<IVendorDocument> {
  constructor() {
    super(Vendor);
  }

  async findByUserId(userId: string): Promise<IVendorDocument | null> {
    return this.model.findOne({ userId }).exec();
  }

  async findByGstin(gstin: string): Promise<IVendorDocument | null> {
    return this.model.findOne({ gstin }).exec();
  }

  async findByBusinessName(businessName: string): Promise<IVendorDocument | null> {
    return this.model.findOne({ businessName: new RegExp(`^${businessName}$`, 'i') }).exec();
  }

  async findBySlug(slug: string): Promise<IVendorDocument | null> {
    return this.model.findOne({ slug }).exec();
  }

  async findByVerificationStatus(status: string, options: { page: number; limit: number }): Promise<{ vendors: IVendorDocument[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [vendors, total] = await Promise.all([
      this.model.find({ verificationStatus: status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .exec(),
      this.model.countDocuments({ verificationStatus: status }).exec(),
    ]);
    return { vendors, total };
  }
}
