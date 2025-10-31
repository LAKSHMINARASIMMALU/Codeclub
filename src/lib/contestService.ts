
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import type { Contest } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
}

/**
 * Adds a new contest via the backend service.
 */
export const addContest = async (contestData: Omit<Contest, 'id' | 'createdAt'>) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.post(`${BACKEND_URL}/api/admin/addContest`, contestData, { headers });
        return response.data;
    } catch(error: any) {
        console.error("Error adding contest:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Updates an existing contest via the backend service.
 */
export const updateContest = async (id: string, contestData: Partial<Contest>) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.put(`${BACKEND_URL}/api/admin/updateContest/${id}`, contestData, { headers });
        return response.data;
    } catch(error: any) {
        console.error("Error updating contest:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Deletes a contest via the backend service.
 */
export const deleteContest = async (id: string) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.delete(`${BACKEND_URL}/api/admin/deleteContest/${id}`, { headers });
        return response.data;
    } catch(error: any) {
        console.error("Error deleting contest:", error.response?.data || error.message);
        throw error;
    }
};


/**
 * Fetches a single contest from the backend.
 */
export const getContest = async (id: string): Promise<Contest | null> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/contests/${id}`);
    const contest = response.data;
    // Firestore timestamps are serialized, convert them back to Dates
    return {
        ...contest,
        startTime: new Date(contest.startTime._seconds * 1000),
        endTime: new Date(contest.endTime._seconds * 1000),
    };
  } catch (error: any) {
    console.error("Error fetching contest:", error.response?.data || error.message);
    if (error.response?.status === 404) {
        return null;
    }
    throw error;
  }
};


/**
 * Listens for real-time updates on all contests.
 * NOTE: This still uses Firestore client SDK for real-time updates.
 * For a full backend approach, this would be replaced with WebSockets or polling.
 */
export const listenToContests = (
  callback: (contests: Contest[]) => void
): (() => void) => {
  const contestsCollection = collection(db, 'contests');
  const q = query(contestsCollection, orderBy('startTime', 'desc'));
  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const contests = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startTime: (data.startTime as Timestamp).toDate(),
            endTime: (data.endTime as Timestamp).toDate(),
          }
      }) as Contest[];
      callback(contests);
    },
    (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: contestsCollection.path,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Error listening to contests:", serverError);
    }
  );
  return unsubscribe;
};
