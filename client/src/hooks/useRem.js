import { useState, useEffect } from "react";

function readRem() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function useRem() {
  const [rem, setRem] = useState(readRem);

  useEffect(() => {
    const observer = new ResizeObserver(() => setRem(readRem()));
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return rem;
}
