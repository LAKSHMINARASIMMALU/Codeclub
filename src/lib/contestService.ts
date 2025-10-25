
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
import { db } from '@/firebase/config';
import type { Contest } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const contestsCollection = collection(db, 'contests');

/**
 * Converts a Firestore document to a Contest object.
 * @param {DocumentData} doc - The Firestore document.
 * @returns {Contest} The contest object.
 */
const fromFirestore = (doc: DocumentData): Contest => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    startTime: (data.startTime as Timestamp).toDate(),
    endTime: (data.endTime as Timestamp).toDate(),
    levels: data.levels,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  } as Contest;
};

/**
 * Adds a new contest to Firestore.
 *
 * Example usage:
 * const newContest = { title: 'New Contest', ... };
 * const contestId = await addContest(newContest);
 */
export const addContest = (contestData: Omit<Contest, 'id' | 'createdAt'>) => {
  const newContestData = {
    ...contestData,
    startTime: Timestamp.fromDate(contestData.startTime),
    endTime: Timestamp.fromDate(contestData.endTime),
    createdAt: serverTimestamp(),
  };

  return addDoc(contestsCollection, newContestData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: contestsCollection.path,
      operation: 'create',
      requestResourceData: newContestData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // Re-throw for the caller to handle if needed
  });
};

/**
 * Updates an existing contest in Firestore.
 *
 * Example usage:
 * const updatedData = { title: 'Updated Title' };
 * await updateContest('contestId123', updatedData);
 */
export const updateContest = (id: string, contestData: Partial<Contest>) => {
  const contestRef = doc(db, 'contests', id);
  const dataToUpdate: Partial<any> = { ...contestData };

  if (contestData.startTime) {
    dataToUpdate.startTime = Timestamp.fromDate(new Date(contestData.startTime));
  }
  if (contestData.endTime) {
    dataToUpdate.endTime = Timestamp.fromDate(new Date(contestData.endTime));
  }

  return updateDoc(contestRef, dataToUpdate).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: contestRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};


/**
 * Deletes a contest from Firestore.
 *
 * Example usage:
 * await deleteContest('contestId123');
 */
export const deleteContest = (id: string) => {
    const contestRef = doc(db, 'contests', id);
    return deleteDoc(contestRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: contestRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
};


/**
 * Fetches a single contest from Firestore.
 *
 * Example usage:
 * const contest = await getContest('contestId123');
 */
export const getContest = async (id: string): Promise<Contest | null> => {
  const contestRef = doc(db, 'contests', id);
  try {
    const contestSnap = await getDoc(contestRef);
    if (contestSnap.exists()) {
      return fromFirestore(contestSnap);
    }
    return null;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
        path: contestRef.path,
        operation: 'get',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
};


/**
 * Fetches all contests from Firestore.
 *
 * Example usage:
 * const contests = await getAllContests();
 */
export const getAllContests = async (): Promise<Contest[]> => {
  const q = query(contestsCollection, orderBy('startTime', 'desc'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch(serverError: any) {
     const permissionError = new FirestorePermissionError({
        path: contestsCollection.path,
        operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
};


/**
 * Listens for real-time updates on all contests.
 *
 * Example usage:
 * const unsubscribe = listenToContests(contests => {
 *   console.log(contests);
 * });
 * // Later, to stop listening:
 * unsubscribe();
 */
export const listenToContests = (
  callback: (contests: Contest[]) => void
): (() => void) => {
  const q = query(contestsCollection, orderBy('startTime', 'desc'));
  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const contests = querySnapshot.docs.map(fromFirestore);
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
