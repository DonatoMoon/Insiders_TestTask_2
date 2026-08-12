import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Task } from "@/lib/types";

function toTask(id: string, data: DocumentData): Task {
  return {
    id,
    title: data.title,
    description: data.description,
    completed: data.completed,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    order: data.order ?? data.createdAt,
  };
}

function tasksCollection(listId: string) {
  return collection(db, "lists", listId, "tasks");
}

export function subscribeToTasks(
  listId: string,
  callback: (tasks: Task[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(tasksCollection(listId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => toTask(d.id, d.data()));
      items.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
      callback(items);
    },
    onError
  );
}

export async function createTask(listId: string, title: string, description: string): Promise<void> {
  const now = Date.now();
  await addDoc(tasksCollection(listId), {
    title,
    description,
    completed: false,
    createdAt: now,
    updatedAt: now,
    order: Date.now(),
  });
}

export async function updateTask(
  listId: string,
  taskId: string,
  data: { title: string; description: string }
): Promise<void> {
  await updateDoc(doc(db, "lists", listId, "tasks", taskId), { ...data, updatedAt: Date.now() });
}

export async function deleteTask(listId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, "lists", listId, "tasks", taskId));
}

export async function toggleTaskCompleted(listId: string, taskId: string, completed: boolean): Promise<void> {
  await updateDoc(doc(db, "lists", listId, "tasks", taskId), { completed, updatedAt: Date.now() });
}

export async function updateTasksOrder(listId: string, taskOrders: { id: string; order: number }[]): Promise<void> {
  const batch = writeBatch(db);
  taskOrders.forEach(({ id, order }) => {
    batch.update(doc(db, "lists", listId, "tasks", id), { order, updatedAt: Date.now() });
  });
  await batch.commit();
}
