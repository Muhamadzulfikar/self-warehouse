export interface Location {
  id: string;
  name: string;
  parent: string | null;
  createdAt: Date;
}

export interface CreateLocationRequest {
  name?: string;
  parent?: string | null;
}
