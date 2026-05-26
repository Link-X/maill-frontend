// 评价图片
export interface ShowReviewImage {
  id: number;
  reviewId: number;
  url: string;
  sort?: number;
}

// 演出评价
export interface ShowReview {
  id: number;
  showId: number;
  userId: number;
  orderId?: number;
  parentId?: number;
  replyToUserId?: number;
  content: string;
  rating?: number;
  likeCount?: number;
  replyCount?: number;
  /** 0=正常 1=举报中 2=被隐藏 */
  status?: 0 | 1 | 2;
  createTime?: string;
  updateTime?: string;
  images?: ShowReviewImage[];
  username?: string;
  replyToUsername?: string;
  liked?: boolean;
}

// 评价举报
export interface ShowReviewReport {
  id: number;
  reviewId: number;
  reporterId: number;
  reason: string;
  status?: 0 | 1 | 2;
  handlerId?: number;
  handledAt?: string;
  createTime?: string;
}
