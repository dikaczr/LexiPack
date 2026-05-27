import { useState, useCallback, useEffect } from "react";

function storageKey(fileName) {
  return `bookmarks_${fileName}`;
}

export function useBookmarks(fileName) {
  const [bookmarks, setBookmarks] = useState({});

  useEffect(() => {
    if (!fileName) { setBookmarks({}); return; }
    try {
      const raw = localStorage.getItem(storageKey(fileName));
      setBookmarks(raw ? JSON.parse(raw) : {});
    } catch {
      setBookmarks({});
    }
  }, [fileName]);

  function persist(next) {
    setBookmarks(next);
    if (fileName) localStorage.setItem(storageKey(fileName), JSON.stringify(next));
  }

  const toggle = useCallback((rowId, note = "") => {
    setBookmarks((prev) => {
      const next = { ...prev };
      if (next[rowId]) {
        delete next[rowId];
      } else {
        next[rowId] = { note, createdAt: new Date().toISOString() };
      }
      if (fileName) localStorage.setItem(storageKey(fileName), JSON.stringify(next));
      return next;
    });
  }, [fileName]);

  const setNote = useCallback((rowId, note) => {
    setBookmarks((prev) => {
      const next = { ...prev };
      if (next[rowId]) {
        next[rowId] = { ...next[rowId], note };
      } else {
        next[rowId] = { note, createdAt: new Date().toISOString() };
      }
      if (fileName) localStorage.setItem(storageKey(fileName), JSON.stringify(next));
      return next;
    });
  }, [fileName]);

  const remove = useCallback((rowId) => {
    setBookmarks((prev) => {
      const next = { ...prev };
      delete next[rowId];
      if (fileName) localStorage.setItem(storageKey(fileName), JSON.stringify(next));
      return next;
    });
  }, [fileName]);

  const isBookmarked = useCallback((rowId) => !!bookmarks[rowId], [bookmarks]);

  // Vráti rowIds v poradí podľa createdAt
  const orderedIds = Object.entries(bookmarks)
    .sort((a, b) => new Date(a[1].createdAt) - new Date(b[1].createdAt))
    .map(([id]) => id);

  return { bookmarks, orderedIds, toggle, setNote, remove, isBookmarked };
}
