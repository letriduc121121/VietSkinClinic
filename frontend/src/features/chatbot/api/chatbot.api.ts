import api from '@/shared/lib/axios';

/** Loại thẻ trực quan do tool trả về (khớp cardType ở backend ChatTools). */
export type CardType =
  | 'services'
  | 'doctors'
  | 'availability'
  | 'slot_suggestions'
  | 'clinic'
  | 'appointments'
  | 'invoices';

export interface CardEvent {
  type: CardType;
  data: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  cards?: CardEvent[];
}

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080/api';

/** Định danh khách vãng lai — sinh 1 lần, lưu localStorage để gom đúng hội thoại. */
function getGuestId(): string {
  let id = localStorage.getItem('chat_guest_id');
  if (!id) {
    id = crypto.randomUUID?.() ?? `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('chat_guest_id', id);
  }
  return id;
}

export interface ChatReply {
  conversationId: number;
  reply: string;
}

/** Bản KHÔNG streaming (giữ làm dự phòng) — gọi POST /api/chat. */
export async function sendChatMessage(
  message: string,
  conversationId: number | null,
): Promise<ChatReply> {
  const { data } = await api.post('/chat', {
    message,
    conversationId,
    guestId: getGuestId(),
  });
  return data.data as ChatReply;
}

export interface ChatHistory {
  conversationId: number | null;
  messages: ChatMessage[];
}

/** Lấy hội thoại gần nhất của user đang đăng nhập để khôi phục sau khi reload. */
export async function fetchChatHistory(): Promise<ChatHistory> {
  const { data } = await api.get('/chat/history');
  const payload = data.data ?? { conversationId: null, messages: [] };
  return {
    conversationId: payload.conversationId ?? null,
    messages: (payload.messages ?? []) as ChatMessage[],
  };
}

export interface StreamHandlers {
  onMeta?: (conversationId: number) => void;
  onDelta: (chunk: string) => void;
  onCard?: (card: CardEvent) => void;
}

/**
 * Bản STREAMING + Tool Calling — gọi POST /api/chat/stream, đọc luồng SSE.
 * Các sự kiện: meta (conversationId) → delta (từng mảnh chữ) → done.
 */
export async function streamChatMessage(
  message: string,
  conversationId: number | null,
  handlers: StreamHandlers,
): Promise<{ conversationId: number | null }> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversationId, guestId: getGuestId() }),
  });

  if (!res.ok || !res.body) throw new Error(`Stream lỗi: HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let convId = conversationId;

  // Đọc luồng, tách theo từng block SSE (ngăn cách bằng dòng trống)
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? ''; // phần dư giữ lại cho vòng sau

    for (const block of blocks) {
      let event = 'message';
      let data = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;

      let json: any;
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }

      if (event === 'meta') {
        convId = json.conversationId;
        handlers.onMeta?.(json.conversationId);
      } else if (event === 'delta') {
        handlers.onDelta(json.content ?? '');
      } else if (event === 'card') {
        if (json.type) handlers.onCard?.({ type: json.type, data: json.data });
      } else if (event === 'error') {
        throw new Error(json.message ?? 'Lỗi không xác định');
      }
      // event 'done' → kết thúc, không cần xử lý thêm
    }
  }

  return { conversationId: convId };
}
