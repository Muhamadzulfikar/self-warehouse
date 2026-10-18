export interface Todo {
  id: string;
  title: string;
  createdAt: Date;
}

export interface CreateTodoRequest {
  title?: string;
}