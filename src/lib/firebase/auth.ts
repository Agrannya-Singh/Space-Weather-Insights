import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { createUserDocument } from '@/lib/actions';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Get the ID token and send it to the server to create the user document
    const idToken = await user.getIdToken();
    await createUserDocument(idToken);

    console.log(user);
  } catch (error) {
    // Handle Errors here.
    console.error(error);
  }
};
