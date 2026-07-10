import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User,
  signInAnonymously
} from "firebase/auth";
import { 
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  orderBy
} from "firebase/firestore";
import { Trip } from "../types";

const firebaseConfig = {
  projectId: "round-premise-9224x",
  appId: "1:338932087741:web:66aa5e392ca9ed630cf0d4",
  apiKey: "AIzaSyDpQcd7BzPowQX9J66TqWdRyLwAyF6yAmg",
  authDomain: "round-premise-9224x.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-travelos-670a02a1-8ffb-4f15-9a09-263454e07166",
  storageBucket: "round-premise-9224x.firebasestorage.app",
  messagingSenderId: "338932087741"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with the custom database ID
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Helper for Google Sign-In
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google login failed, trying redirect or custom flow:", error);
    throw error;
  }
};

// Helper for Guest Login (useful for restricted iframes)
export const loginAsGuest = async (): Promise<User> => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error("Guest login failed:", error);
    throw error;
  }
};

// Logout helper
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

// --- Firestore Error Handling ---

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Firestore Trip Management ---

// Save or Update a trip for a user
export const saveTripToFirestore = async (userId: string, trip: Trip): Promise<void> => {
  try {
    const tripRef = doc(db, "trips", trip.id);
    await setDoc(tripRef, {
      ...trip,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `trips/${trip.id}`);
  }
};

// Get all trips for a specific user, sorted by creation date descending
export const fetchUserTrips = async (userId: string): Promise<Trip[]> => {
  try {
    const tripsCol = collection(db, "trips");
    const q = query(
      tripsCol, 
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const trips: Trip[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Remove userId and internal database fields from return object
      const { userId: _, updatedAt: __, ...tripData } = data;
      trips.push(tripData as Trip);
    });
    // Sort manually in client in case composite indexes are still indexing
    return trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "trips");
  }
};

// Delete a trip
export const deleteTripFromFirestore = async (tripId: string): Promise<void> => {
  try {
    const tripRef = doc(db, "trips", tripId);
    await deleteDoc(tripRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}`);
  }
};
