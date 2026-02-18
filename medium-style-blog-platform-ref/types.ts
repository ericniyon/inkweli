
export interface Author {
  name: string;
  avatar: string;
  bio?: string;
}

export interface Article {
  id: string;
  author: Author;
  category: string;
  publishDate: string;
  title: string;
  summary: string;
  thumbnail: string;
  isMemberOnly: boolean;
  views: number;
}

export interface Topic {
  id: string;
  name: string;
}
