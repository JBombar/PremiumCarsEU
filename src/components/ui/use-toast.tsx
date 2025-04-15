import { toast as sonnerToast, Toaster as SonnerToaster, ToasterProps } from 'sonner';

// Define your standard toast types
type ToastProps = {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  duration?: number;
  variant?: 'default' | 'destructive' | 'secondary';
  action?: React.ReactNode;
};

// Re-export sonner's Toaster component as Toaster
export const Toaster = SonnerToaster;

// Main toast function that provides a consistent API
export function toast({ title, description, duration = 3000, variant = 'default', action }: ToastProps) {
  return sonnerToast(title, {
    description,
    duration,
    action,
    style: variant === 'destructive'
      ? { backgroundColor: '#FEE2E2', borderColor: '#F87171', color: '#B91C1C' }
      : undefined
  });
}

// For compatibility with existing hook-based approach
export function useToast() {
  return { toast };
} 