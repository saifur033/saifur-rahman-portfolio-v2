export type ContentKind =
  | 'club'
  | 'activity'
  | 'project'
  | 'publication'
  | 'certificate'
  | 'crest'
  | 'gallery'
  | 'skill'
  | 'career'
  | 'category'
  | 'block';

export interface Profile {
  name: string;
  tagline: string;
  role: string;
  company: string;
  degree: string;
  university: string;
  about: string;
  interests?: string;
  professional_summary?: string;
  education_summary?: string;
  email: string;
  phone: string;
  website: string;
  linkedin: string;
  github: string;
  welcome_text: string;
  guide_dialogue: string;
  theme: 'light' | 'dark';
  location_label: string;
  location_address: string;
  map_url: string;
  map_lat: string;
  map_lng: string;
  contact_intro: string;
  photo_filename?: string;
  cv_filename?: string;
}

export interface WebsiteSettings {
  id?: string;
  site_title: string;
  meta_description: string;
  social_image_url: string;
  default_language: 'en' | 'bn';
  default_theme: 'light' | 'dark';
  enable_3d_studio: boolean;
  contact_recipient_email: string;
}

export interface ContentItem {
  id: number;
  kind: ContentKind;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'hidden';
  sort_order: number;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  name: string;
  email: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  mime: string;
  is_private: boolean;
  size_bytes?: number;
  content_id?: number | null;
  content_title?: string;
  content_kind?: string;
  data_url?: string;
  created_at: string;
}

export interface AdminAccount {
  id: number;
  email: string;
  password_hash: string;
  salt: string;
  recovery_question: string;
  recovery_answer_hash: string;
  recovery_token: string;
  created_at: string;
  updated_at?: string;
}
