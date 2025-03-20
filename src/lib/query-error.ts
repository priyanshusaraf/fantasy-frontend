import { toast } from 'sonner';

export type ApiError = {
  code: string;
  message: string;
  details?: any;
};

export function handleQueryError(error: unknown) {
  console.error('Query Error:', error);

  if (error instanceof Response) {
    // Handle HTTP errors
    const status = error.status;
    if (status === 401) {
      toast.error('Session expired. Please log in again.');
      // You might want to redirect to login here
      return;
    }
    if (status === 403) {
      toast.error('You do not have permission to perform this action.');
      return;
    }
    if (status === 404) {
      toast.error('The requested resource was not found.');
      return;
    }
    toast.error('An error occurred while processing your request.');
    return;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    toast.error(error.message as string);
    return;
  }

  toast.error('An unexpected error occurred.');
}

export function handleMutationError(error: unknown) {
  console.error('Mutation Error:', error);

  if (error instanceof Response) {
    error.json().then((data) => {
      if (data.error?.message) {
        toast.error(data.error.message);
      } else {
        toast.error('An error occurred while saving changes.');
      }
    });
    return;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    toast.error(error.message as string);
    return;
  }

  toast.error('An unexpected error occurred while saving changes.');
} 