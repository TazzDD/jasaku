"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markRead } from "@/actions/chat";
export type Msg = { id: string; sender_id: string; message: string; created_at: string; is_read: boolean };
const add = (list: Msg[], m: Msg) => (list.some((x) => x.id === m.id) ? list : [...list, m]);
export default function ChatPanel({ conversationId, userId, initial }: { conversationId: string; userId: string; initial: Msg[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    markRead(conversationId);
    const sb = createClient();
    const ch = sb.channel(`chat:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => { const m = payload.new as Msg; setMsgs((p) => add(p, m)); if (m.sender_id !== userId) markRead(conversationId); })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [conversationId, userId]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setErr("");
    const r = await sendMessage(conversationId, text);
    setBusy(false);
    if ("error" in r && r.error) return setErr(r.error);
    if ("message" in r && r.message) { setMsgs((p) => add(p, r.message as Msg)); setText(""); }
  }
  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-brand-cyan bg-white">
      <div role="log" aria-live="polite" className="flex-1 space-y-2 overflow-y-auto p-4">
        {!msgs.length && <p className="text-center text-sm text-ink/60">Belum ada pesan. Mulai percakapan.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-brand-teal text-white" : "bg-brand-cyan/50"}`}>
                <p className="whitespace-pre-wrap break-words">{m.message}</p>
                <p className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}{mine && (m.is_read ? " · dibaca" : "")}</p>
              </div>
            </div>);
        })}
        <div ref={end} />
      </div>
      {err && <p role="alert" className="px-4 text-sm text-red-700">{err}</p>}
      <form onSubmit={submit} className="flex gap-2 border-t border-brand-cyan p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Tulis pesan…" aria-label="Pesan" className="input" />
        <button disabled={busy} className="btn">Kirim</button>
      </form>
    </div>
  );
}
