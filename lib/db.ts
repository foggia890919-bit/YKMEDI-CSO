// 파일 기반 데이터베이스 (영구 저장)
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  password: string; // bcrypt로 해시됨
  name: string;
  phone: string;
  address: string;
  createdAt: string; // ISO 문자열로 저장
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

// 파일 경로
const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// 디렉토리 생성
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

// 파일에서 데이터 로드
const loadUsers = (): User[] => {
  try {
    ensureDataDir();
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load users:', error);
  }
  return [];
};

const loadOrders = (): Order[] => {
  try {
    ensureDataDir();
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
  return [];
};

const loadReviews = (): Review[] => {
  try {
    ensureDataDir();
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load reviews:', error);
  }
  return [];
};

// 파일에 데이터 저장
const saveUsers = (users: User[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Failed to save users:', error);
  }
};

const saveOrders = (orders: Order[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Failed to save orders:', error);
  }
};

const saveReviews = (reviews: Review[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  } catch (error) {
    console.error('Failed to save reviews:', error);
  }
};

// 초기 데이터 로드
let users: User[] = loadUsers();
let orders: Order[] = loadOrders();
let reviews: Review[] = loadReviews();

// 초기 테스트 계정 생성
const initializeTestUser = async () => {
  const existingUser = users.find((u) => u.email === 'test@example.com');
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('test123', 10);
    const testUser: User = {
      id: '1',
      email: 'test@example.com',
      password: hashedPassword,
      name: '관리자',
      phone: '010-0000-0000',
      address: '서울시',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(testUser);
    saveUsers(users);
  }
};

// 앱 초기화
initializeTestUser().catch(console.error);

// 사용자 데이터베이스 함수
export const db = {
  users: {
    findByEmail: (email: string) => users.find((u) => u.email === email),
    findById: (id: string) => users.find((u) => u.id === id),
    create: (user: User) => {
      users.push(user);
      saveUsers(users);
      return user;
    },
    update: (id: string, data: Partial<User>) => {
      const user = users.find((u) => u.id === id);
      if (user) {
        Object.assign(user, data, { updatedAt: new Date().toISOString() });
        saveUsers(users);
        return user;
      }
      return null;
    },
    delete: (id: string) => {
      users = users.filter((u) => u.id !== id);
      saveUsers(users);
    },
    list: () => users,
  },

  orders: {
    findById: (id: string) => orders.find((o) => o.id === id),
    findByUserId: (userId: string) => orders.filter((o) => o.userId === userId),
    create: (order: Order) => {
      orders.push(order);
      saveOrders(orders);
      return order;
    },
    update: (id: string, data: Partial<Order>) => {
      const order = orders.find((o) => o.id === id);
      if (order) {
        Object.assign(order, data, { updatedAt: new Date().toISOString() });
        saveOrders(orders);
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
      saveReviews(reviews);
      return review;
    },
    update: (id: string, data: Partial<Review>) => {
      const review = reviews.find((r) => r.id === id);
      if (review) {
        Object.assign(review, data, { updatedAt: new Date().toISOString() });
        saveReviews(reviews);
        return review;
      }
      return null;
    },
    delete: (id: string) => {
      reviews = reviews.filter((r) => r.id !== id);
      saveReviews(reviews);
    },
    list: () => reviews,
  },
};
