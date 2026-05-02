import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api/api";

/**
 * Display URL for license/media assets: use direct URL first; on <img> error,
 * retry with the same axios client as staff detail (Bearer token).
 */
export function useAuthedImageDisplay(originalUrl: string) {
  const [displaySrc, setDisplaySrc] = useState(originalUrl);
  const [failed, setFailed] = useState(false);
  const triedBlobRef = useRef(false);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    triedBlobRef.current = false;
    setFailed(false);
    setDisplaySrc(originalUrl);
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, [originalUrl]);

  useEffect(() => {
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, []);

  const onImgError = useCallback(() => {
    if (triedBlobRef.current) {
      setFailed(true);
      return;
    }
    triedBlobRef.current = true;
    const url = originalUrl.trim();
    const path = url.startsWith("http") ? url : url.startsWith("/") ? url : `/${url}`;
    api
      .get(path, { responseType: "arraybuffer" })
      .then((res) => {
        const ct =
          (res.headers["content-type"] as string) || "application/octet-stream";
        const blob = new Blob([res.data], { type: ct });
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        const objectUrl = URL.createObjectURL(blob);
        blobRef.current = objectUrl;
        setDisplaySrc(objectUrl);
      })
      .catch(() => setFailed(true));
  }, [originalUrl]);

  return { displaySrc, onImgError, failed };
}
