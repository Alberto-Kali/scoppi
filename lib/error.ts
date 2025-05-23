// lib/error.ts
type SupabaseError = {
    message: string;
    // Add other Supabase error properties if needed
  };
  
  export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'An unknown error occurred';
  }