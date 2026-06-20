import { useEffect, useRef } from 'react';

/**
 * Hook kết nối SSE tới backend.
 *
 * @param url   Endpoint SSE (không cần token — hook tự lấy từ localStorage)
 * @param onMessage  Callback nhận { type, payload } mỗi khi có event
 * @param enabled    Chỉ kết nối khi true (mặc định true)
 *
 * Token được truyền qua query param ?token=... vì EventSource
 * không hỗ trợ Authorization header.
 *
 * Tự động cleanup (đóng connection) khi component unmount.
 */
export function useSSE(
  url: string,
  onMessage: (data: { type: string; payload: any }) => void,
  enabled = true,
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const apiBase =
      (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080/api';
    const separator = url.includes('?') ? '&' : '?';
    const es = new EventSource(
      `${apiBase}${url}${separator}token=${token}`,
    );

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // Bỏ qua ping "connected"
        if (data.type !== 'connected') {
          onMessageRef.current(data);
        }
      } catch {
        // ignore malformed
      }
    };

    es.onerror = () => {
      // Trình duyệt tự reconnect, không cần xử lý thêm
    };

    return () => es.close();
  }, [url, enabled]);
}
