export interface CodeSnippet {
  id: string;
  content: string;
  redactedContent: string;
  expiresAt: Date;
  createdAt: Date;
  language: string;
  title: string;
}

export interface DetectedSecret {
  type: 'API_KEY' | 'PASSWORD' | 'TOKEN' | 'SECRET_KEY';
  line: number;
  value: string;
}