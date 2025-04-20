'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Use the updated hook
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define the allowed role types
type UserRole = 'dealer' | 'tipper' | 'admin' | 'buyer';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('buyer'); // Default role
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { signUp } = useAuth(); // Get the updated signUp function

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // --- Basic client-side validation ---
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      // 1. --- Sign up user & store role in metadata ---
      // Call the modified signUp which now accepts role
      const { error: signUpError } = await signUp(email, password, role); // Pass role

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw new Error(signUpError.message || 'Failed to sign up.');
      }

      // 2. --- DO NOT CALL /api/register-details HERE ---
      // Profile creation happens after email confirmation and first login.

      // --- Success (Signup Initiated) ---
      toast({
        title: 'Registration Initiated!',
        description: 'Please check your email for a confirmation link to complete your registration.',
        duration: 5000, // Give user time to read
      });

      // Redirect user to login page or a dedicated "check email" page
      // Adding a query param can help the login page show a message
      router.push('/login?message=check-email');

    } catch (error: any) {
      console.error('Registration process error:', error);
      const errorMessage = error.message || 'An unexpected error occurred during registration.';
      setError(errorMessage);

      toast({
        title: 'Registration failed',
        description: errorMessage,
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
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Create an account</h1>

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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="dealer">Dealer</SelectItem>
                  <SelectItem value="tipper">Tipper</SelectItem>
                  {/* <SelectItem value="admin">Admin</SelectItem> */}
                </SelectContent>
              </Select>
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
              {isLoading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          {/* Link to Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}