// app/types/news.ts

export interface TweetTimestampFormatted {
  iso: string;
  date: string;
  time: string;
  dateTime: string;
  relative: string;
  display: string;
  timestamp: number;
}

export interface Tweet {
  id: string;
  author: string;
  authorHandle: string;
  avatar: string | null;
  text: string;
  images: string[];
  imageLinks: string[];
  link: string | null;
  timestamp: string;
  timestampFormatted: TweetTimestampFormatted | null;
}

export interface NewsResponse {
  tweets: Tweet[];
  source: string;
  authors: string[];
  cached: boolean;
}
