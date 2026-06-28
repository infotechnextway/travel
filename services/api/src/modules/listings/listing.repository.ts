import { Listing, IListingDocument } from './listing.model';

export class ListingRepository {
  model = Listing;

  async findById(id: string): Promise<IListingDocument | null> {
    return this.model.findById(id).lean();
  }

  async findBySlug(slug: string): Promise<IListingDocument | null> {
    return this.model.findOne({ slug }).lean();
  }

  async findOne(query: any): Promise<IListingDocument | null> {
    return this.model.findOne(query).lean();
  }

  async find(query: any, options: any = {}): Promise<{ listings: IListingDocument[]; total: number }> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = options;
    const sortOption: any = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const [listings, total] = await Promise.all([
      this.model.find(query).sort(sortOption).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);

    return { listings, total };
  }

  async create(data: Partial<IListingDocument>): Promise<IListingDocument> {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<IListingDocument>): Promise<IListingDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id: string): Promise<IListingDocument | null> {
    return this.model.findByIdAndUpdate(id, { status: 'archived' }, { new: true }).lean();
  }
}
