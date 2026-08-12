import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createUserProfile } from "@/lib/firestore/users";

export async function registerUser(name: string, email: string, password: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await createUserProfile(credential.user.uid, email, name);
}

export async function loginUser(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
