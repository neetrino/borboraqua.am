'use client';

import { useEffect, useState } from 'react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmPayload extends ConfirmOptions {
  id: string;
}

const CONFIRM_RESULT_EVENT = 'confirm-dialog-result';

export function showConfirm(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
  const id = `confirm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const promise = new Promise<boolean>((resolve) => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ id: string; result: boolean }>;
      if (ev.detail?.id !== id) return;
      window.removeEventListener(CONFIRM_RESULT_EVENT, handler);
      resolve(ev.detail.result);
    };
    window.addEventListener(CONFIRM_RESULT_EVENT, handler);
  });

  window.dispatchEvent(
    new CustomEvent('show-confirm-dialog', { detail: { ...opts, id } as ConfirmPayload })
  );
  return promise;
}

export function ConfirmDialogContainer() {
  const [state, setState] = useState<ConfirmPayload | null>(null);

  useEffect(() => {
    const handleShow = (e: Event) => {
      const ev = e as CustomEvent<ConfirmPayload>;
      if (ev.detail?.id && ev.detail?.message) setState(ev.detail);
    };
    window.addEventListener('show-confirm-dialog', handleShow);
    return () => window.removeEventListener('show-confirm-dialog', handleShow);
  }, []);

  const close = (result: boolean) => {
    if (!state) return;
    window.dispatchEvent(
      new CustomEvent(CONFIRM_RESULT_EVENT, { detail: { id: state.id, result } })
    );
    setState(null);
  };

  if (!state) return null;

  const {
    title,
    message,
    confirmLabel = 'Այո',
    cancelLabel = 'Ոչ',
    danger = false,
  } = state;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => close(false)}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {title && (
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h2>
        )}
        <p id="confirm-dialog-desc" className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => close(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={
              danger
                ? 'px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors'
                : 'px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
