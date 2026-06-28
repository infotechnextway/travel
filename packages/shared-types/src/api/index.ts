export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
