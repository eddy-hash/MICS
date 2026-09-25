import toast, { Toaster as HotToaster } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'logout' | 'login';

export interface ToastOptions {
  subMessage?: string;
  duration?: number;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4500,
  info: 4000,
  logout: 2000,
  login: 3000,
};

const STYLES: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: '#059669',
    border: 'border-emerald-700',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg: '#DC2626',
    border: 'border-red-700',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01" />
      </svg>
    ),
  },
  warning: {
    bg: '#D97706',
    border: 'border-amber-700',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a1 1 0 00.87 1.5h18.62a1 1 0 00.87-1.5L13.71 3.86a1 1 0 00-1.72 0z" />
      </svg>
    ),
  },
  info: {
    bg: '#2563EB',
    border: 'border-blue-700',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  logout: {
    bg: '#334155',
    border: 'border-slate-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  },
  login: {
    bg: '#059669',
    border: 'border-emerald-700',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  },
};

const ARIA_LIVE: Record<ToastType, 'polite' | 'assertive'> = {
  success: 'polite',
  error: 'assertive',
  warning: 'polite',
  info: 'polite',
  logout: 'polite',
  login: 'polite',
};

interface ToastContentProps {
  type: ToastType;
  message: string;
  subMessage?: string;
  visible: boolean;
}

function ToastContent({ type, message, subMessage, visible }: ToastContentProps) {
  const style = STYLES[type];
  return (
    <div
      role="alert"
      aria-live={ARIA_LIVE[type]}
      style={{ backgroundColor: style.bg }}
      className={`
        flex items-center gap-3 px-4 py-3 min-h-[64px] w-full max-w-sm
        rounded-xl shadow-lg border-l-4 ${style.border}
        text-white transition-all duration-300 transform
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
    >
      <div className="flex-shrink-0">{style.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{message}</p>
        {subMessage && <p className="text-xs truncate opacity-80">{subMessage}</p>}
      </div>
    </div>
  );
}

function fire(type: ToastType, message: string, options?: ToastOptions): void {
  const duration = options?.duration ?? DEFAULT_DURATIONS[type];
  toast.custom(
    (t) => (
      <ToastContent
        type={type}
        message={message}
        subMessage={options?.subMessage}
        visible={t.visible}
      />
    ),
    { duration, position: 'bottom-center' },
  );
}

export const showToast = (type: ToastType, message: string, options?: ToastOptions) =>
  fire(type, message, options);

export const notify = {
  success: (message: string, options?: ToastOptions) => fire('success', message, options),
  error: (message: string, options?: ToastOptions) => fire('error', message, options),
  warning: (message: string, options?: ToastOptions) => fire('warning', message, options),
  info: (message: string, options?: ToastOptions) => fire('info', message, options),
  logout: (message: string, options?: ToastOptions) => fire('logout', message, options),
  welcomeBack: (username: string) =>
    fire('login', `Karibu, ${username}`, { subMessage: 'NaedCredit · Loan Management' }),
};

export { HotToaster };
