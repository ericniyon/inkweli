
export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  SUBSCRIBER = 'SUBSCRIBER',
  FREE_USER = 'FREE_USER'
}

export enum SubscriptionTier {
  UNLIMITED = 'UNLIMITED',
  TWO_ARTICLES = 'TWO_ARTICLES',
  ONE_ARTICLE = 'ONE_ARTICLE',
  NONE = 'NONE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: SubscriptionTier;
  articlesViewedThisMonth: string[]; // List of article IDs
}

export type Category = 'Politics' | 'Economy' | 'Culture' | 'Technology' | 'Science' | 'Opinion' | 'General';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML or Markdown
  authorId: string;
  authorName: string;
  publishDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  featuredImage: string;
  readingTime: number;
  category: Category;
}

export interface Highlight {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  text: string;
  range: {
    startContainerIndex: number;
    startOffset: number;
    endContainerIndex: number;
    endOffset: number;
  };
  comment: string;
  createdAt: string;
}

export interface Stats {
  totalRevenue: number;
  subscriberCount: number;
  articleCount: number;
  monthlyGrowth: number;
}
