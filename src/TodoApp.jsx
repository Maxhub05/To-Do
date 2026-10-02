import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, Pencil, ListTodo, Search, CalendarDays } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-400" },
  medium: { label: "กลาง", badge: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-400" },
  high: { label: "สูง", badge: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500" },
};
const NEXT = { low: "medium", medium: "high", high: "low" };

const CATS = {
  work: { label: "งาน", dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700" },
  personal: { label: "ส่วนตัว", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700" },
  shopping: { label: "ช้อปปิ้ง", dot: "bg-pink-500", chip: "bg-pink-50 text-pink-700" },
  health: { label: "สุขภาพ", dot: "bg-teal-500", chip: "bg-teal-50 text-teal-700" },
};

const FILTERS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "active", label: "ยังไม่เสร็จ" },
  { id: "completed", label: "เสร็จแล้ว" },
];

const z = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
const offset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
};
const fmt = (s) =>
  new Date(s + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });
const statusOf = (t, today) => (t.done ? "done" : t.due && t.due < today ? "overdue" : "active");

let nextId = 6;

function Donut({ parts, total }) {
  let acc = 0;
  return (
    <svg viewBox="0 0 36 36" className="h-24 w-24 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="5" />
      {total > 0 &&
        parts.map((p) => {
          const pct = (p.n / total) * 100;
          const el = pct > 0 && (
            <circle
              key={p.key}
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke={p.color}
              strokeWidth="5"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={-acc}
            />
          );
          acc += pct;
          return el;
        })}
    </svg>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high", cat: "work", due: offset(-1) },
    { id: 2, text: "ซื้อของเข้าบ้าน", done: false, priority: "low", cat: "shopping", due: offset(0) },
    { id: 3, text: "นัดหมอฟัน", done: true, priority: "medium", cat: "health", due: offset(-3) },
    { id: 4, text: "ประชุมทีมโปรเจกต์", done: false, priority: "medium", cat: "work", due: offset(2) },
    { id: 5, text: "โทรหาแม่", done: false, priority: "low", cat: "personal", due: "" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [cat, setCat] = useState("work");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [removing, setRemoving] = useState([]);
  const editRef = useRef(null);
  const today = ymd(new Date());

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus();
  }, [editingId]);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((l) => [{ id: nextId++, text: t, done: false, priority, cat, due }, ...l]);
    setText("");
    setDue("");
  };
  const toggle = (id) => setTodos((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => {
    setRemoving((r) => [...r, id]);
    setTimeout(() => {
      setTodos((l) => l.filter((t) => t.id !== id));
      setRemoving((r) => r.filter((x) => x !== id));
    }, 250);
  };
  const startEdit = (t) => {
    setEditingId(t.id);
    setEditText(t.text);
  };
  const saveEdit = () => {
    const v = editText.trim();
    if (v) setTodos((l) => l.map((t) => (t.id === editingId ? { ...t, text: v } : t)));
    setEditingId(null);
  };
  const cyclePriority = (id) =>
    setTodos((l) => l.map((t) => (t.id === id ? { ...t, priority: NEXT[t.priority] } : t)));
  const clearCompleted = () => setTodos((l) => l.filter((t) => !t.done));

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const remaining = total - doneCount;
  const overdueCount = todos.filter((t) => statusOf(t, today) === "overdue").length;
  const pending = remaining - overdueCount;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const parts = [
    { key: "done", label: "เสร็จแล้ว", n: doneCount, color: "#10b981" },
    { key: "active", label: "ค้างอยู่", n: pending, color: "#60a5fa" },
    { key: "overdue", label: "เลยกำหนด", n: overdueCount, color: "#ef4444" },
  ];

  const q = search.trim().toLowerCase();
  const visible = todos.filter(
    (t) =>
      (filter === "all" || (filter === "active" ? !t.done : t.done)) &&
      (catFilter === "all" || t.cat === catFilter) &&
      t.text.toLowerCase().includes(q)
  );

  const sideBtn = (id, label, count, dot) => (
    <button
      key={id}
      onClick={() => setCatFilter(id)}
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition ${
        catFilter === id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span className="flex items-center gap-2">
        {dot && <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />}
        {label}
      </span>
      <span className={`text-xs ${catFilter === id ? "text-slate-300" : "text-slate-400"}`}>{count}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ListTodo size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">จัดการงานที่ต้องทำในแต่ละวัน</p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <nav className="rounded-2xl bg-white p-2 shadow-md shadow-slate-200/70">
              <p className="px-3 pb-1 pt-2 text-sm font-medium text-slate-900">หมวดหมู่</p>
              <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
                {sideBtn("all", "ทั้งหมด", total)}
                {Object.entries(CATS).map(([k, c]) =>
                  sideBtn(k, c.label, todos.filter((t) => t.cat === k).length, c.dot)
                )}
              </div>
            </nav>

            <section className="rounded-2xl bg-white p-4 shadow-md shadow-slate-200/70">
              <p className="mb-3 text-sm font-medium text-slate-900">สถิติ</p>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Donut parts={parts} total={total} />
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-slate-900">
                    {percent}%
                  </span>
                </div>
                <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
                  {parts.map((p) => (
                    <li key={p.key} className="flex items-center justify-between gap-2 text-slate-600">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                        {p.label}
                      </span>
                      <span className="text-slate-900">{p.n}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                งานทั้งหมด {total} รายการ · เสร็จแล้ว {percent}%
              </p>
            </section>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-md shadow-slate-200/70">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="เพิ่มงานใหม่..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                />
                <button
                  onClick={add}
                  aria-label="เพิ่มงาน"
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white hover:bg-slate-700 active:scale-95"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-center gap-1.5">
                  {Object.entries(PRIORITIES).map(([k, p]) => (
                    <button
                      key={k}
                      onClick={() => setPriority(k)}
                      className={`rounded-full px-3 py-1 text-sm ring-1 ring-inset transition ${
                        priority === k ? p.badge + " font-medium" : "bg-white text-slate-400 ring-slate-200 hover:text-slate-600"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  aria-label="หมวดหมู่"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  {Object.entries(CATS).map(([k, c]) => (
                    <option key={k} value={k}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  aria-label="วันครบกำหนด"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="relative mb-3">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-200/60 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-lg py-2 text-sm transition ${
                    filter === f.id ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <ul className="space-y-2.5">
              {visible.length === 0 && (
                <li className="rounded-2xl bg-white py-10 text-center text-slate-400 shadow-md shadow-slate-200/70">
                  {q ? "ไม่พบงานที่ตรงกับคำค้นหา" : "ไม่มีงานในรายการ"}
                </li>
              )}
              {visible.map((t) => {
                const p = PRIORITIES[t.priority];
                const c = CATS[t.cat];
                const st = statusOf(t, today);
                const isToday = !t.done && t.due === today;
                const dueCls =
                  st === "overdue"
                    ? "bg-red-50 text-red-700 ring-red-200"
                    : isToday
                    ? "bg-yellow-50 text-yellow-800 ring-yellow-300"
                    : "bg-slate-50 text-slate-500 ring-slate-200";
                return (
                  <li
                    key={t.id}
                    className={`relative overflow-hidden rounded-2xl bg-white shadow-md shadow-slate-200/70 transition-all duration-200 ${
                      removing.includes(t.id) ? "translate-x-8 scale-95 opacity-0" : "opacity-100"
                    }`}
                  >
                    <span className={`absolute inset-y-0 left-0 w-1 ${p.bar}`} />
                    <div className="flex items-start gap-3 py-3.5 pl-5 pr-3">
                      <button
                        onClick={() => toggle(t.id)}
                        aria-label="ทำเครื่องหมายว่าเสร็จ"
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                          t.done ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {t.done && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {editingId === t.id ? (
                          <input
                            ref={editRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-slate-900 outline-none focus:border-slate-500"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => startEdit(t)}
                            title="ดับเบิลคลิกเพื่อแก้ไข"
                            className={`block cursor-text select-none break-words ${
                              t.done ? "text-slate-400 line-through" : "text-slate-800"
                            }`}
                          >
                            {t.text}
                          </span>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${c.chip}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                            {c.label}
                          </span>
                          {t.due && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${dueCls}`}>
                              <CalendarDays size={12} />
                              {st === "overdue" ? `เลยกำหนด ${fmt(t.due)}` : isToday ? "วันนี้" : fmt(t.due)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => cyclePriority(t.id)}
                        title="คลิกเพื่อเปลี่ยนความสำคัญ"
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                      >
                        {p.label}
                      </button>
                      <button
                        onClick={() => startEdit(t)}
                        aria-label="แก้ไข"
                        className="hidden shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 sm:block"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => remove(t.id)}
                        aria-label="ลบ"
                        className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center justify-between px-1 text-sm text-slate-500">
              <span>เหลืองานอีก {remaining} รายการ</span>
              <button
                onClick={clearCompleted}
                disabled={doneCount === 0}
                className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
              >
                ล้างงานที่เสร็จแล้ว ({doneCount})
              </button>
            </div>
            <p className="mt-6 text-center text-xs text-slate-400">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
