import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { Product, PriceRecord, PriceAlert, StoreName } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const PRODUCTS_COL = 'products';
const PRICES_COL = 'prices';
const ALERTS_COL = 'alerts';

// --- Products ---

export async function getAllProducts(): Promise<Product[]> {
  const snapshot = await getDocs(
    query(collection(getDb(), PRODUCTS_COL), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((d) => d.data() as Product);
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(getDb(), PRODUCTS_COL, id));
  return snap.exists() ? (snap.data() as Product) : null;
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const product: Product = { ...data, id, createdAt: now, updatedAt: now };
  const docData = JSON.parse(JSON.stringify(product));
  await setDoc(doc(getDb(), PRODUCTS_COL, id), docData);
  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<void> {
  await setDoc(
    doc(getDb(), PRODUCTS_COL, id),
    { ...data, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), PRODUCTS_COL, id));
}

// --- Prices ---

export async function savePriceRecord(
  record: Omit<PriceRecord, 'id'>
): Promise<PriceRecord> {
  const id = uuidv4();
  const full: PriceRecord = { ...record, id };
  const docData = JSON.parse(JSON.stringify(full));
  await setDoc(doc(getDb(), PRICES_COL, id), docData);
  return full;
}

export async function getLatestPrice(
  productId: string,
  store: StoreName
): Promise<PriceRecord | null> {
  const q = query(
    collection(getDb(), PRICES_COL),
    where('productId', '==', productId),
    where('store', '==', store),
    orderBy('scrapedAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as PriceRecord);
}

export async function getPriceHistory(
  productId: string,
  store?: StoreName,
  days: number = 30
): Promise<PriceRecord[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  let q;
  if (store) {
    q = query(
      collection(getDb(), PRICES_COL),
      where('productId', '==', productId),
      where('store', '==', store),
      where('scrapedAt', '>=', since.toISOString()),
      orderBy('scrapedAt', 'asc')
    );
  } else {
    q = query(
      collection(getDb(), PRICES_COL),
      where('productId', '==', productId),
      where('scrapedAt', '>=', since.toISOString()),
      orderBy('scrapedAt', 'asc')
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PriceRecord);
}

export async function getHistoricalLow(
  productId: string
): Promise<number | null> {
  const q = query(
    collection(getDb(), PRICES_COL),
    where('productId', '==', productId),
    where('available', '==', true),
    orderBy('currentPrice', 'asc'),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as PriceRecord).currentPrice;
}

// --- Alerts ---

export async function saveAlert(
  alert: Omit<PriceAlert, 'id'>
): Promise<PriceAlert> {
  const id = uuidv4();
  const full: PriceAlert = { ...alert, id };
  await setDoc(doc(getDb(), ALERTS_COL, id), full);
  return full;
}

export async function wasAlertSentRecently(
  productId: string,
  store: StoreName,
  price: number,
  hoursWindow: number = 24
): Promise<boolean> {
  const since = new Date();
  since.setHours(since.getHours() - hoursWindow);

  const q = query(
    collection(getDb(), ALERTS_COL),
    where('productId', '==', productId),
    where('store', '==', store),
    where('price', '==', price),
    where('sentAt', '>=', since.toISOString())
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
