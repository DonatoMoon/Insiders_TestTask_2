import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  DocumentData,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { Role, TodoList } from "@/lib/types";
import { findUserByEmail } from "@/lib/firestore/users";

function toTodoList(id: string, data: DocumentData): TodoList {
  return {
    id,
    title: data.title,
    ownerId: data.ownerId,
    members: data.members,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    order: data.order ?? data.createdAt,
  };
}

export function subscribeToMyLists(
  uid: string,
  callback: (lists: TodoList[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(
    collection(db, "lists"),
    where(`members.${uid}`, "!=", null)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => toTodoList(d.id, d.data()));
      items.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
      callback(items);
    },
    onError
  );
}

export function subscribeToList(
  listId: string,
  callback: (list: TodoList | null) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "lists", listId),
    (snapshot) => {
      callback(snapshot.exists() ? toTodoList(snapshot.id, snapshot.data()) : null);
    },
    onError
  );
}

export async function createList(title: string, ownerId: string): Promise<string> {
  const ref = doc(collection(db, "lists"));
  const now = Date.now();
  await setDoc(ref, {
    title,
    ownerId,
    members: { [ownerId]: "owner" as Role },
    createdAt: now,
    updatedAt: now,
    order: Date.now(),
  });
  return ref.id;
}

export async function renameList(listId: string, title: string): Promise<void> {
  await updateDoc(doc(db, "lists", listId), { title, updatedAt: Date.now() });
}

// Firestore does not cascade-delete subcollections, and once the parent list
// is gone the tasks' security rules can no longer resolve the parent's role
// map — leaving unreadable, undeletable orphans. So clear the tasks first.
export async function deleteList(listId: string): Promise<void> {
  const tasks = await getDocs(collection(db, "lists", listId, "tasks"));
  if (!tasks.empty) {
    // A single batch caps at 500 writes, which is well beyond this app's scale.
    const batch = writeBatch(db);
    tasks.docs.forEach((task) => batch.delete(task.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, "lists", listId));
}

export async function addMember(listId: string, email: string, role: Exclude<Role, "owner">): Promise<void> {
  const profile = await findUserByEmail(email);
  if (!profile) {
    throw new Error("user-not-found");
  }
  // Only an owner can invite, so the signed-in user is this list's owner:
  // letting them add themselves as admin/viewer would demote their own
  // membership entry and lock them out of every owner-only action.
  if (profile.uid === auth.currentUser?.uid) {
    throw new Error("self-invite");
  }
  await updateDoc(doc(db, "lists", listId), {
    [`members.${profile.uid}`]: role,
    updatedAt: Date.now(),
  });
}

export async function removeMember(listId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "lists", listId), {
    [`members.${uid}`]: deleteField(),
    updatedAt: Date.now(),
  });
}

export async function updateListsOrder(listOrders: { id: string; order: number }[]): Promise<void> {
  const batch = writeBatch(db);
  listOrders.forEach(({ id, order }) => {
    batch.update(doc(db, "lists", id), { order, updatedAt: Date.now() });
  });
  await batch.commit();
}
