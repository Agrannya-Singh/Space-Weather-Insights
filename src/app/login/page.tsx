import React from 'react';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';

const LoginPage = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <Button onClick={signInWithGoogle}>Login with Google</Button>
    </div>
  );
};

export default LoginPage;
