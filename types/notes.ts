// Notes Module Types

export interface Note {
  id: string;
  title: string;
  content_html: string;
  content_text: string;
  tags: string[];
  updated_at: string;
  created_at?: string;
  pinned?: boolean;
}
