import { collection, doc, getDocs, limit, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types";

export async function createUserProfile(uid: string, email: string, name: string): Promise<void> {
  const profile: UserProfile = { uid, email, name, createdAt: Date.now() };
  await setDoc(doc(db, "users", uid), profile);
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const q = query(collection(db, "users"), where("email", "==", email), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as UserProfile;
}
