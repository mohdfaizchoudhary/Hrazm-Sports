import { createContext, useContext, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTrash } from 'react-icons/fa';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const closeDialog = (value) => {
    if (!dialog) return;
    setDialog(null);
    dialog.resolve?.(value);
  };

  const notify = (message, options = {}) => {
    setDialog({
      kind: 'alert',
      title: options.title || (options.type === 'error' ? 'Something went wrong' : 'Notice'),
      message: String(message),
      type: options.type || 'info',
      resolve: options.resolve,
    });
  };

  const confirm = (message, options = {}) => new Promise((resolve) => {
    setDialog({
      kind: 'confirm',
      title: options.title || 'Please confirm',
      message: String(message),
      type: options.type || 'warning',
      resolve,
    });
  });

  const prompt = (message, options = {}) => new Promise((resolve) => {
    setDialog({
      kind: 'prompt',
      title: options.title || 'Add a note',
      message: String(message),
      type: options.type || 'info',
      value: '',
      resolve,
    });
  });

  const icon = dialog?.type === 'error'
    ? <FaExclamationTriangle />
    : dialog?.type === 'warning'
      ? <FaExclamationTriangle />
      : dialog?.type === 'success'
        ? <FaCheckCircle />
        : <FaInfoCircle />;

  return (
    <FeedbackContext.Provider value={{ notify, confirm, prompt }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="presentation">
          <div className="w-full max-w-md rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${dialog.type === 'error' ? 'bg-red-100 text-red-600' : dialog.type === 'warning' ? 'bg-amber-100 text-amber-700' : dialog.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {icon}
                </div>
                <div className="flex-1 pr-5">
                  <h2 id="feedback-title" className="text-base font-black uppercase tracking-tight text-gray-900">{dialog.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{dialog.message}</p>
                </div>
                <button type="button" onClick={() => closeDialog(dialog.kind === 'alert' ? undefined : false)} className="text-gray-400 hover:text-gray-900 p-1" aria-label="Close dialog">
                  <FaTimes size={15} />
                </button>
              </div>

              {dialog.kind === 'prompt' && (
                <textarea
                  autoFocus
                  rows="3"
                  value={dialog.value}
                  onChange={(event) => setDialog((current) => ({ ...current, value: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-volt-500"
                  placeholder="Type a note..."
                />
              )}

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                {dialog.kind !== 'alert' && (
                  <button type="button" onClick={() => closeDialog(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-black uppercase hover:bg-gray-200">
                    Cancel
                  </button>
                )}
                <button type="button" onClick={() => closeDialog(dialog.kind === 'prompt' ? dialog.value : true)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase ${dialog.type === 'error' ? 'bg-red-600 text-white hover:bg-red-700' : dialog.type === 'warning' ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-black text-volt-400 hover:bg-volt-500 hover:text-black'}`}>
                  {dialog.kind === 'alert' ? 'Understood' : dialog.kind === 'prompt' ? 'Save Note' : dialog.type === 'warning' ? 'Confirm' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => useContext(FeedbackContext);
