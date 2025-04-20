'use client';

import { useState, useEffect } from 'react'; // Added useEffect
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // State for login errors

  const router = useRouter();
  const searchParams = useSearchParams(); // To read query params like ?message=
  const { signIn } = useAuth(); // Get signIn from the updated hook

  // Show message if redirected from registration
  useEffect(() => {
    const message = searchParams?.get('message');
    if (message === 'check-email') {
      toast({
        title: "Check Your Email",
        description: "Please click the confirmation link we sent you to activate your account.",
        duration: 7000,
      });
      // Optional: Clear the query param after showing the message
      // router.replace('/login', { scroll: false }); // Avoid adding to history
    }
    // Add other message checks if needed
    const errorParam = searchParams?.get('error_description');
    if (errorParam) {
      setError(errorParam);
      toast({
        title: "Authentication Error",
        description: errorParam,
        variant: "destructive",
      });
      // router.replace('/login', { scroll: false });
    }

  }, [searchParams, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      // ONLY call the signIn function from the useAuth hook.
      // It handles Supabase auth and triggers profile check via onAuthStateChange.
      const { error: signInError, user } = await signIn(email, password);

      if (signInError) {
        console.error('Login page: signIn error:', signInError);
        const message = signInError.message || 'Authentication failed. Please check your credentials.';
        setError(message); // Set error state to display below form
        toast({
          title: 'Login failed',
          description: message,
          variant: 'destructive',
        });
      } else {
        // Success! User is logged in.
        // The AuthProvider's onAuthStateChange listener handles profile check and redirects.
        // No explicit redirect needed here unless you want custom logic.
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        // AuthProvider should handle redirect to /admin/dashboard or appropriate page
        // If redirect doesn't happen automatically, you might need: router.push('/admin/dashboard');
      }
    } catch (error) {
      // Catch unexpected errors during the process
      console.error('Login page: Unexpected login error:', error);
      const message = 'An unexpected error occurred during login.';
      setError(message);
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Sign in to your account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {/* Optional: Forgot Password Link */}
                {/* <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </Link> */}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Link to Register */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}