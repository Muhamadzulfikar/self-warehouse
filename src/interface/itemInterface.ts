export interface Item {
  id: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  createdAt: Date;
}

export interface CreateItemRequest {
  name?: string;
  category?: string;
  location?: string;
  quantity?: number;
}

export interface Movement {
  id: string;
  item_name: string;
  category: string;
  from_location: string;
  to_location: string;
  quantity: number;
  createdAt: Date;
}

export interface CreateMovementRequest {
  item_name?: string;
  category?: string;
  from_location?: string;
  to_location?: string;
  quantity?: number;
}
