import type { SecurityQuestion } from "../lib/types";
import Button from "./ui/Button";
import TextInput from "./ui/TextInput";
import { Plus, Trash } from "./ui/icons";

export default function SecurityQuestions({
  value,
  onChange,
}: {
  value: SecurityQuestion[];
  onChange: (next: SecurityQuestion[]) => void;
}) {
  const update = (i: number, field: keyof SecurityQuestion, val: string) =>
    onChange(value.map((q, idx) => (idx === i ? { ...q, [field]: val } : q)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { question: "", answer: "" }]);

  return (
    <div className="space-y-3">
      {value.map((q, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Question {i + 1}
            </span>
            <Button
              type="button"
              variant="linkDanger"
              size="xs"
              onClick={() => remove(i)}
            >
              <Trash width={14} height={14} /> Remove
            </Button>
          </div>
          <div className="space-y-2">
            <TextInput
              placeholder="Question"
              value={q.question}
              onChange={(e) => update(i, "question", e.target.value)}
            />
            <TextInput
              placeholder="Answer"
              value={q.answer}
              onChange={(e) => update(i, "answer", e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
      >
        <Plus width={16} height={16} /> Add security question
      </button>
    </div>
  );
}
