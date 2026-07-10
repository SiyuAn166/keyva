import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { X } from "./icons";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  // `render` keeps the modal mounted during the exit animation.
  const [render, setRender] = useState(open);
  // `visible` drives the enter/leave transition (opacity + transform).
  const [visible, setVisible] = useState(false);

  // Mount / unmount around the animation.
  useEffect(() => {
    if (open) {
      setRender(true);
    } else {
      // play the leave transition, then unmount
      setVisible(false);
      const t = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Once mounted (hidden state painted), flip to visible on a later frame
  // so the browser has a painted "from" state to transition from.
  useEffect(() => {
    if (!render || !open) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [render, open]);

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [render, onClose]);

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onMouseDown={onClose}
    >
      <div
        className={`mt-10 mb-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl transition-all duration-200 ease-out ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "-translate-y-3 scale-95 opacity-0"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X width={18} height={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
