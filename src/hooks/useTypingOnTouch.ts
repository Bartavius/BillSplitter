import { useEffect, useState } from "react";

const isField = (el: EventTarget | null) =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

// True while a text field has focus on a touch device, i.e. while the on-screen
// keyboard is likely open. Always false with a mouse/trackpad.
export function useTypingOnTouch(): boolean {
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const onIn = (e: FocusEvent) => setTyping(isField(e.target));
    // relatedTarget is where focus is going, so hopping between fields doesn't flicker
    const onOut = (e: FocusEvent) => setTyping(isField(e.relatedTarget));
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  return typing;
}
