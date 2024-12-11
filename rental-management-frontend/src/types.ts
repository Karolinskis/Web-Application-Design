export interface Place {
  id: number;
  roomsCount: number;
  size: number;
  address: string;
  description?: string;
  price: number;
  averageRating?: number;
}

export interface Review {
  id: number;
  comment: string;
  rating: number;
  reservationId: number;
  user: User | undefined;
}

export interface User {
  id: string;
  userName: string;
  email: string;
}
