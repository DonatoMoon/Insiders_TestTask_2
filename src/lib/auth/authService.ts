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
  try {
    await createUserProfile(credential.user.uid, email, name);
  } catch {
    // Transient blip guard: one immediate retry so the Auth account isn't
    // left without a Firestore profile doc. If this also fails, propagate.
    await createUserProfile(credential.user.uid, email, name);
  }
}

export async function loginUser(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
