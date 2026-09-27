"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  order_no: number;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
};

export default function QuizPage({ params }: PageProps<"/unit/[unitNo]/quiz">) {
  const { unitNo } = use(params);
  const router = useRouter();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz/questions?unit=${unitNo}`)
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json();
          throw new Error(j.error || "โหลดไม่สำเร็จ");
        }
        return r.json();
      })
      .then((data) => {
        setUnitId(data.unitId);
        setQuestions(data.questions);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [unitNo]);

  async function submit() {
    if (!unitId) return;
    if (Object.keys(answers).length < questions.length) {
      setError("กรุณาตอบให้ครบทุกข้อ");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId, answers }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "ส่งไม่สำเร็จ");
      return;
    }
    setResult(data);
  }

  if (loading) return <main className="max-w-2xl mx-auto p-6">กำลังโหลด...</main>;

  if (result) {
    return (
      <main className="max-w-2xl mx-auto p-6 text-center space-y-4">
        <h1 className="text-xl font-bold">ส่งแบบทดสอบสำเร็จ</h1>
        <p className="text-lg">
          คะแนนของคุณ: {result.score} / {result.total}
        </p>
        <a href={`/unit/${unitNo}`} className="text-blue-600 hover:underline">
          กลับไปหน้าหน่วยการเรียน
        </a>
      </main>
    );
  }

  if (error && questions.length === 0) {
    return (
      <main className="max-w-2xl mx-auto p-6 space-y-3">
        <p className="text-red-600">{error}</p>
        <a href={`/unit/${unitNo}`} className="text-blue-600 hover:underline">
          กลับไปหน้าหน่วยการเรียน
        </a>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-800">แบบทดสอบท้ายหน่วย</h1>
      {questions.map((q, i) => (
        <div key={q.id} className="bg-white border rounded-xl p-4">
          <p className="font-medium mb-2">
            {i + 1}. {q.question}
          </p>
          {(["a", "b", "c", "d"] as const).map((letter) => (
            <label key={letter} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === letter}
                onChange={() => setAnswers((a) => ({ ...a, [q.id]: letter }))}
              />
              <span>
                {letter}. {q[`choice_${letter}` as const]}
              </span>
            </label>
          ))}
        </div>
      ))}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
      >
        {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
      </button>
    </main>
  );
}
