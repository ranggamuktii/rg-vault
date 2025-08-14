export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  category: string | null;
  created_at: string;
}

export interface FileItem {
  id: number;
  filename: string;
  storage_url: string;
  mimetype: string;
  size: number;
  category: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}
