import { ListingRepository } from './listing.repository';
import { IListingDocument } from './listing.model';
import { NotFoundError } from '@shared/errors';

export class ListingService {
  constructor(private listingRepo: ListingRepository) {}

  async searchListings(filters: any): Promise<{ listings: IListingDocument[]; page: number; total: number; totalPages: number }> {
    const { page = 1, limit = 20 } = filters;
    const query: any = { status: 'published' };

    if (filters.listingType) query.listingType = filters.listingType;
    if (filters.destinationId) query.destinationId = filters.destinationId;
    if (filters.vendorId) query.vendorId = filters.vendorId;
    if (filters.isVerified !== undefined) query.isVerified = filters.isVerified;
    if (filters.isInstantBook !== undefined) query.isInstantBook = filters.isInstantBook;

    const { listings, total } = await this.listingRepo.find(query, { page, limit, sort: filters.sort, order: filters.order });
    const totalPages = Math.ceil(total / limit);

    return { listings, page, total, totalPages };
  }

  async getListingById(id: string): Promise<IListingDocument | null> {
    const listing = await this.listingRepo.findById(id);
    if (!listing) throw new NotFoundError('Listing not found');
    return listing;
  }

  async getListingBySlug(slug: string): Promise<IListingDocument | null> {
    const listing = await this.listingRepo.findBySlug(slug);
    if (!listing) throw new NotFoundError('Listing not found');
    return listing;
  }

  async checkAvailability(id: string, date: Date, travelers: number): Promise<any> {
    const listing = await this.getListingById(id);
    return {
      available: true,
      date,
      travelers,
      listingId: id,
      pricePerPerson: (listing as any).pricing?.pricePerPerson || 0
    };
  }

  async getFeaturedListings(listingType?: string, limit: number = 10): Promise<IListingDocument[]> {
    const query: any = { status: 'published', isVerified: true };
    if (listingType) query.listingType = listingType;
    const { listings } = await this.listingRepo.find(query, { limit, sort: 'rating', order: 'desc' });
    return listings;
  }

  async getRelatedListings(id: string, limit: number = 6): Promise<IListingDocument[]> {
    const listing = await this.getListingById(id);
    const query: any = {
      status: 'published',
      listingType: (listing as any).listingType,
      destinationId: (listing as any).destinationId,
      _id: { $ne: id }
    };
    const { listings } = await this.listingRepo.find(query, { limit });
    return listings;
  }

  async createListing(vendorId: string, dto: any): Promise<IListingDocument> {
    return this.listingRepo.create({ ...dto, vendorId, status: 'draft' });
  }

  async updateListing(vendorId: string, id: string, dto: any): Promise<IListingDocument | null> {
    const listing = await this.getListingById(id);
    if ((listing as any).vendorId !== vendorId) throw new NotFoundError('Listing not found');
    return this.listingRepo.update(id, dto);
  }

  async deleteListing(vendorId: string, id: string): Promise<IListingDocument | null> {
    const listing = await this.getListingById(id);
    if ((listing as any).vendorId !== vendorId) throw new NotFoundError('Listing not found');
    return this.listingRepo.delete(id);
  }

  async getVendorListings(vendorId: string, filters: any): Promise<IListingDocument[]> {
    const query: any = { vendorId };
    if (filters.status) query.status = filters.status;
    if (filters.listingType) query.listingType = filters.listingType;
    const { listings } = await this.listingRepo.find(query);
    return listings;
  }

  async updateItinerary(vendorId: string, id: string, itinerary: any[]): Promise<IListingDocument | null> {
    return this.updateListing(vendorId, id, { itinerary });
  }

  async updateCalendar(vendorId: string, id: string, availableDates: any[]): Promise<IListingDocument | null> {
    return this.updateListing(vendorId, id, { 'inventory.availableDates': availableDates });
  }

  async updatePricing(vendorId: string, id: string, dto: any): Promise<IListingDocument | null> {
    return this.updateListing(vendorId, id, { pricing: dto });
  }

  async listListings(filters: any): Promise<{ listings: IListingDocument[]; page: number; total: number; totalPages: number }> {
    return this.searchListings(filters);
  }

  async getListingByIdAdmin(id: string): Promise<IListingDocument | null> {
    return this.getListingById(id);
  }

  async reviewListing(adminId: string, id: string, dto: any): Promise<IListingDocument | null> {
    return this.listingRepo.update(id, {
      isVerified: dto.isVerified,
      status: dto.status
    });
  }

  async bulkAction(dto: any): Promise<any> {
    return { success: [], failed: [] };
  }

  async getPendingReviewQueue(page: number = 1, limit: number = 20): Promise<{ listings: IListingDocument[]; page: number; total: number; totalPages: number }> {
    const query = { status: 'pending_review' };
    const { listings, total } = await this.listingRepo.find(query, { page, limit, sort: 'createdAt', order: 'desc' });
    const totalPages = Math.ceil(total / limit);
    return { listings, page, total, totalPages };
  }

  async getListingStats(): Promise<any> {
    return {
      total: 0,
      byType: {},
      byStatus: {}
    };
  }
}
