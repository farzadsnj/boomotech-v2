export const pteTaskTypes = ["reading-fill", "reading-writing-fill", "reorder-paragraphs", "reading-multiple-single", "reading-multiple-multiple", "summarise-written-text", "write-essay"] as const;
export type PteTaskType = typeof pteTaskTypes[number];
export type MistakeCategory = "grammar" | "collocation" | "vocabulary" | "paragraph-order" | "writing-form";

export type ExerciseDifficulty = "foundation" | "developing" | "exam-style";
export type Blank = { id: string; options: string[]; answer: string; explanation: string; explanationFa: string; optionRationales: Record<string, string>; category: Exclude<MistakeCategory, "paragraph-order" | "writing-form"> };
export type FillExercise = {
  kind: "fill";
  id: string;
  taskType: "reading-fill" | "reading-writing-fill";
  title: string;
  instruction: string;
  segments: string[];
  blanks: Blank[];
  practiceMinutes: number;
  difficulty: ExerciseDifficulty;
  tags: string[];
  lessonIds: string[];
};
export type ReorderExercise = {
  kind: "reorder";
  id: string;
  taskType: "reorder-paragraphs";
  title: string;
  instruction: string;
  paragraphs: Array<{ id: string; text: string }>;
  correctOrder: string[];
  explanation: string;
  explanationFa: string;
  practiceMinutes: number;
  difficulty: ExerciseDifficulty;
  tags: string[];
  lessonIds: string[];
};
export type ChoiceExercise = {
  kind: "choice";
  id: string;
  taskType: "reading-multiple-single" | "reading-multiple-multiple";
  title: string;
  instruction: string;
  passage: string;
  question: string;
  options: Array<{ id: string; text: string; rationale: string }>;
  answers: string[];
  explanation: string;
  explanationFa: string;
  practiceMinutes: number;
  difficulty: "foundation" | "developing" | "exam-style";
  tags: string[];
  lessonIds: string[];
};
export type WritingExercise = {
  kind: "writing";
  id: string;
  taskType: "summarise-written-text" | "write-essay";
  title: string;
  instruction: string;
  source?: string;
  prompt: string;
  sample: string;
  explanation: string;
  explanationFa: string;
  officialMinutes: number;
  wordRange: readonly [number, number];
  checklist: string[];
  keyIdeas: string[];
  structuralBreakdown: string[];
  difficulty: ExerciseDifficulty;
  tags: string[];
  lessonIds: string[];
};
export type PteExercise = FillExercise | ReorderExercise | ChoiceExercise | WritingExercise;

export const taskLabels: Record<PteTaskType, string> = {
  "reading-fill": "Reading: Fill in the Blanks",
  "reorder-paragraphs": "Re-order Paragraphs",
  "reading-writing-fill": "Reading and Writing: Fill in the Blanks",
  "reading-multiple-single": "Reading: Multiple Choice, Single Answer",
  "reading-multiple-multiple": "Reading: Multiple Choice, Multiple Answers",
  "summarise-written-text": "Summarise Written Text",
  "write-essay": "Write Essay",
};
