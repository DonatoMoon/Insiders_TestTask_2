import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  DocumentData,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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
  };
}

export function subscribeToMyLists(uid: string, callback: (lists: TodoList[]) => void): Unsubscribe {
  const q = query(collection(db, "lists"), where(`members.${uid}`, "!=", null));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => toTodoList(d.id, d.data())));
  });
}

export function subscribeToList(listId: string, callback: (list: TodoList | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "lists", listId), (snapshot) => {
    callback(snapshot.exists() ? toTodoList(snapshot.id, snapshot.data()) : null);
  });
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
  });
  return ref.id;
}

export async function renameList(listId: string, title: string): Promise<void> {
  await updateDoc(doc(db, "lists", listId), { title, updatedAt: Date.now() });
}

export async function deleteList(listId: string): Promise<void> {
  await deleteDoc(doc(db, "lists", listId));
}

export async function addMember(listId: string, email: string, role: Exclude<Role, "owner">): Promise<void> {
  const profile = await findUserByEmail(email);
  if (!profile) {
    throw new Error("user-not-found");
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
