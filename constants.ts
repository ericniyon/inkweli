
import { SubscriptionTier, Article, Category, User, UserRole } from './types';

/** Fallback for img src to avoid empty string (browser re-download warning). */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23e2e8f0" width="40" height="40"/%3E%3C/svg%3E';

export const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest Reader',
  email: '',
  role: UserRole.FREE_USER,
  tier: SubscriptionTier.NONE,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=64&h=64&auto=format&fit=crop',
  following: [],
  bookmarks: [],
  followersCount: 0,
  articlesViewedThisMonth: []
};

/** Subscription plans in RWF (Rwandan Franc). Benefits per package. */
export const SUBSCRIPTION_PLANS = [
  {
    id: 'plan_annual',
    tier: SubscriptionTier.UNLIMITED,
    name: 'Annual Package',
    price: 50000,
    currency: 'RWF',
    interval: 'year',
    features: [
      'Access to 10 articles per year',
      'Ability to comment on content',
      'Topic-specific 2-hour consultancy session with the author',
    ],
    color: 'indigo',
  },
  {
    id: 'plan_per_article',
    tier: SubscriptionTier.ONE_ARTICLE,
    name: 'Per Article Package',
    price: 10000,
    currency: 'RWF',
    interval: 'article',
    features: [
      'Ability to comment at the end of the article',
      'Topic-specific 1-hour consultancy session with the author',
    ],
    color: 'slate',
  },
];

export const WRITERS = [
  {
    id: 'auth_1',
    name: 'Jean Bosco',
    role: 'Senior Correspondent',
    bio: 'Specializing in technological evolution and policy across East Africa. Former analyst at Kigali Tech Hub.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop',
    articlesCount: 42,
    socials: { twitter: '#', linkedin: '#' }
  },
  {
    id: 'auth_2',
    name: 'Marie Louise',
    role: 'Economics Editor',
    bio: 'An expert in macro-economic frameworks and regional trade agreements. Passionate about sustainable growth.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop',
    articlesCount: 38,
    socials: { twitter: '#', linkedin: '#' }
  }
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The Future of Digital Media in East Africa',
    slug: 'future-digital-media-east-africa',
    excerpt: 'Exploring the rapid transformation of the digital landscape in Rwanda and its neighbors.',
    content: `<p>Digital media is undergoing a profound transformation across East Africa. From the bustling streets of Kigali to the tech hubs in Nairobi, a new era of storytelling is emerging.</p><p>The shift from traditional print to digital-first platforms is not just about convenience; it's about accessibility and real-time engagement. As internet penetration increases, we are seeing a rise in niche publications that cater to specific interests, from fintech to modern agricultural practices.</p><p>By 2030, analysts predict that over 80% of regional media consumption will happen on mobile devices, fundamentally changing how advertisers and creators interact with their audience.</p>`,
    authorId: 'auth_1',
    authorName: 'Jean Bosco',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=64&h=64&auto=format&fit=crop',
    publishDate: '2024-05-15',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 6,
    category: 'Technology',
    claps: 1250,
    responses: [],
    highlights: [
      {
        id: 'h1',
        articleId: '1',
        userId: 'u1',
        userName: 'Sarah K.',
        userAvatar: 'https://i.pravatar.cc/150?u=sarah',
        text: 'new era of storytelling is emerging',
        comment: 'This is exactly what we need—local stories told through modern mediums!',
        createdAt: '2024-05-16'
      },
      {
        id: 'h2',
        articleId: '1',
        userId: 'u2',
        userName: 'Kevin M.',
        userAvatar: 'https://i.pravatar.cc/150?u=kevin',
        text: '80% of regional media consumption will happen on mobile devices',
        comment: 'This statistic is staggering. Infrastructure will need to scale rapidly.',
        createdAt: '2024-05-17'
      }
    ],
    tags: ['Media', 'Digital', 'Rwanda']
  },
  {
    id: '2',
    title: 'Navigating Rwandan Economic Policies for Startups',
    slug: 'rwandan-economic-policies-startups',
    excerpt: 'A comprehensive guide to leveraging government incentives for your new venture.',
    content: `<p>Rwanda has positioned itself as a "Proof of Concept" hub for the continent. With a focus on ease of doing business and significant investment in infrastructure, the nation is attracting entrepreneurs from across the globe.</p><p>Key incentives include tax holidays for export-oriented firms and a simplified registration process that takes less than six hours.</p>`,
    authorId: 'auth_2',
    authorName: 'Marie Louise',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=64&h=64&auto=format&fit=crop',
    publishDate: '2024-05-10',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 8,
    category: 'Economy',
    claps: 840,
    responses: [],
    highlights: [],
    tags: ['Business', 'Startups', 'Economy']
  }
];
