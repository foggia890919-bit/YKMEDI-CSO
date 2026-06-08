// 메모리 데이터베이스 (실제로는 PostgreSQL/MongoDB 사용)
// 프로덕션에서는 이를 실제 DB로 교체하세요

export interface User {
  id: string;
  email: string;
  password: string; // bcrypt로 해시됨
  name: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    detailAddress: string;
    postalCode: string;
  };
  impUid?: string;
  merchantUid?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Review {
  id: string;
  productId: number;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// 메모리 스토어
let users: User[] = [];
let orders: Order[] = [];
let reviews: Review[] = [];

// 사용자 데이터베이스 함수
export const db = {
  users: {
    findByEmail: (email: string) => users.find((u) => u.email === email),
    findById: (id: string) => users.find((u) => u.id === id),
    create: (user: User) => {
      users.push(user);
      return user;
    },
    update: (id: string, data: Partial<User>) => {
      const user = users.find((u) => u.id === id);
      if (user) {
        Object.assign(user, data, { updatedAt: new Date() });
        return user;
      }
      return null;
    },
    delete: (id: string) => {
      users = users.filter((u) => u.id !== id);
    },
    list: () => users,
  },

  orders: {
    findById: (id: string) => orders.find((o) => o.id === id),
    findByUserId: (userId: string) => orders.filter((o) => o.userId === userId),
    create: (order: Order) => {
      orders.push(order);
      return order;
    },
    update: (id: string, data: Partial<Order>) => {
      const order = orders.find((o) => o.id === id);
      if (order) {
        Object.assign(order, data, { updatedAt: new Date() });
        return order;
      }
      return null;
    },
    list: () => orders,
  },

  reviews: {
    findByProductId: (productId: number) => reviews.filter((r) => r.productId === productId),
    create: (review: Review) => {
      reviews.push(review);
      return review;
    },
    update: (id: string, data: Partial<Review>) => {
      const review = reviews.find((r) => r.id === id);
      if (review) {
        Object.assign(review, data, { updatedAt: new Date() });
        return review;
      }
      return null;
    },
    delete: (id: string) => {
      reviews = reviews.filter((r) => r.id !== id);
    },
    list: () => reviews,
  },
};
