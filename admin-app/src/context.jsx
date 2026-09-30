import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/* სქემები, ხატულები, ბმულები — სერვერიდან ერთხელ */
export const MetaContext = createContext(null);
export const useMeta = () => useContext(MetaContext);

/* შეტყობინებები (toast) */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, type = "ok") => {
    const id = Math.random();
    setItems((x) => [...x, { id, text, type }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), type === "err" ? 6000 : 3200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={"toast toast--" + t.type}>{t.type === "err" ? "⚠ " : "✓ "}{t.text}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

/** შეუნახავი ცვლილებების გაფრთხილება ფანჯრის დახურვისას */
export function useUnsaved(dirty) {
  const ref = useRef(dirty);
  ref.current = dirty;
  useEffect(() => {
    const h = (e) => { if (ref.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);
}

/** ctrl/cmd + S → შენახვა */
export function useSaveShortcut(fn) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); ref.current(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
}
