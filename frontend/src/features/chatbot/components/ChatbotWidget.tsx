import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { streamChatMessage, fetchChatHistory, type ChatMessage, type CardEvent } from '@/features/chatbot/api/chatbot.api';
import ChatCards, { type BookRequest } from '@/features/chatbot/components/ChatCards';
import { useAuth } from '@/app/providers/AuthProvider';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    'Xin chào! Mình là trợ lý ảo của VietSkin 👋. Mình có thể giúp bạn về đặt lịch khám, dịch vụ, bác sĩ và giờ làm việc. Bạn cần hỗ trợ gì ạ?',
};

const SUGGESTIONS = [
  'Đặt lịch khám thế nào?',
  'Có những bác sĩ nào?',
  'Có những dịch vụ gì?',
  'Bảng giá dịch vụ?',
  'Giờ làm việc?',
];

/**
 * Widget chatbot nổi ở góc dưới bên phải — tự chứa, không phụ thuộc layout.
 * Mount 1 lần trong App.tsx là dùng được trên toàn site.
 */
export default function ChatbotWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const conversationId = useRef<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Điều hướng tới trang đặt lịch kèm thông tin đã chọn sẵn (doctorId, date, time). */
  const handleBook = useCallback(
    (req: BookRequest) => {
      const params = new URLSearchParams();
      if (req.doctorId) params.set('doctorId', String(req.doctorId));
      if (req.date) params.set('date', req.date);
      if (req.time) params.set('time', req.time);
      setOpen(false);
      navigate(`/patient/booking?${params.toString()}`);
    },
    [navigate],
  );

  // Khôi phục lịch sử chat trong ngày theo trạng thái đăng nhập:
  // đăng nhập → tải hội thoại hôm nay; đăng xuất → xóa khung chat.
  useEffect(() => {
    if (!user) {
      conversationId.current = null;
      setMessages([WELCOME]);
      return;
    }
    fetchChatHistory()
      .then((h) => {
        conversationId.current = h.conversationId;
        setMessages(h.messages.length ? [WELCOME, ...h.messages] : [WELCOME]);
      })
      .catch(() => {});
  }, [user]);

  // Tự cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Focus ô nhập khi mở
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;

      // Thêm tin user + 1 bong bóng assistant rỗng để stream chữ vào dần
      setMessages((prev) => [...prev, { role: 'user', content }, { role: 'assistant', content: '' }]);
      setInput('');
      setLoading(true);

      const appendToLast = (chunk: string) =>
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });

      // Gắn 1 card (do tool trả về) vào bong bóng assistant đang stream
      const attachCard = (card: CardEvent) =>
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, cards: [...(last.cards ?? []), card] };
          return copy;
        });

      try {
        await streamChatMessage(content, conversationId.current, {
          onMeta: (id) => {
            conversationId.current = id;
          },
          onDelta: appendToLast,
          onCard: attachCard,
        });
      } catch {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: 'Xin lỗi, hiện mình chưa kết nối được. Bạn thử lại sau nhé!',
          };
          return copy;
        });
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return (
    <>
      {/* Nút mở/đóng */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Đóng trợ lý ảo' : 'Mở trợ lý ảo'}
        className="fixed bottom-6 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #6EC1B4 100%)' }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#6EC1B4]" />
        )}
      </button>

      {/* Cửa sổ chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[9998] flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-3rem))] animate-chat-in flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #245078 100%)' }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">Trợ lý VietSkin</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-green-400" /> Đang trực tuyến
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/15"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Danh sách tin nhắn */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] p-4">
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              const hasCards = !!m.cards?.length;
              // Bỏ qua bong bóng assistant rỗng (placeholder chờ stream, chưa có chữ & chưa có card)
              if (!isUser && m.content === '' && !hasCards) return null;
              return (
                <div key={i} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                      isUser ? 'bg-[#1a3a5c] text-white' : 'bg-[#6EC1B4]/20 text-[#1a3a5c]'
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`flex min-w-0 max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    {m.content !== '' && (
                      <div
                        className={`w-fit max-w-full whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          isUser
                            ? 'rounded-tr-sm bg-[#1a3a5c] text-white'
                            : 'rounded-tl-sm border border-gray-100 bg-white text-gray-700'
                        }`}
                      >
                        {m.content}
                      </div>
                    )}
                    {hasCards && <ChatCards cards={m.cards!} onBook={handleBook} />}
                  </div>
                </div>
              );
            })}

            {/* Hiệu ứng đang gõ — chỉ khi chưa có chữ nào stream về */}
            {loading &&
              (messages[messages.length - 1]?.content ?? '') === '' &&
              !messages[messages.length - 1]?.cards?.length && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#6EC1B4]/20 text-[#1a3a5c]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3">
                  <span className="h-2 w-2 animate-typing rounded-full bg-gray-400" />
                  <span className="h-2 w-2 animate-typing rounded-full bg-gray-400 [animation-delay:0.2s]" />
                  <span className="h-2 w-2 animate-typing rounded-full bg-gray-400 [animation-delay:0.4s]" />
                </div>
              </div>
            )}

          </div>

          {/* Gợi ý câu hỏi cố định để người dùng luôn có thể hỏi tiếp */}
          <div className="border-t border-gray-100 bg-white px-4 py-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="rounded-full border border-[#6EC1B4]/30 bg-white px-2.5 py-1 text-xs text-[#1a3a5c] transition-colors hover:bg-[#6EC1B4]/10 disabled:opacity-50 disabled:pointer-events-none"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Ô nhập */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-gray-100 bg-white p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 rounded-xl border border-gray-200 bg-[#F8FAFC] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#6EC1B4] focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition-opacity disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #6EC1B4 100%)' }}
              aria-label="Gửi"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes chat-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-chat-in { animation: chat-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%           { transform: translateY(-4px); opacity: 1; }
        }
        .animate-typing { animation: typing 1.2s infinite ease-in-out; }
      `}</style>
    </>
  );
}
