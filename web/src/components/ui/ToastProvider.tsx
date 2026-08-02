import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

type ToastKind = 'info' | 'success' | 'error';
export type {ToastKind};
type Toast = {id: number; kind: ToastKind; message: string};

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 1;

/**
 * Lightweight toast provider. No dependency — a small fixed-position stack
 * with auto-dismiss. Keep it minimal; this is the only feedback primitive.
 */
export function ToastProvider({children}: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextToastId;
      nextToastId += 1;
      setToasts((current) => [...current, {id, kind, message}]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({toast}), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" role="status">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast-${item.kind}`} role={item.kind === 'error' ? 'alert' : 'status'}>
            <span>{item.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => dismiss(item.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
