import { toast } from 'react-toastify';

// Success notification
export const showSuccess = (message) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Error notification
export const showError = (message) => {
  toast.error(message, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Warning notification
export const showWarning = (message) => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 3500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Info notification
export const showInfo = (message) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Promise notification (for async operations)
export const showPromise = (promise, messages) => {
  return toast.promise(
    promise,
    {
      pending: messages.pending || 'Processing...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong!'
    },
    {
      position: 'top-right',
    }
  );
};

