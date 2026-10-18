export interface Category {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CreateCategoryRequest {
  name?: string;
}
