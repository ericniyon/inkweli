
export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  SUBSCRIBER = 'SUBSCRIBER',
  FREE_USER = 'FREE_USER',
  USER = 'USER'
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
  avatar?: string;
  bio?: string;
  following: string[]; // User IDs
  bookmarks: string[]; // Article IDs
  followersCount: number;
  articlesViewedThisMonth: string[];
}

export type Category = 'Politics' | 'Economy' | 'Culture' | 'Technology' | 'Science' | 'Opinion' | 'General' | 'Business (GTM)';

export interface Response {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  claps: number;
}

export interface Highlight {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string; // The selected text
  comment: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  publishDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  featuredImage: string;
  readingTime: number;
  category: Category;
  claps: number;
  hasClapped?: boolean;
  responses: Response[];
  highlights: Highlight[];
  tags: string[];
}

export interface Stats {
  totalRevenue: number;
  subscriberCount: number;
  articleCount: number;
  monthlyGrowth: number;
}
