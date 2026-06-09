export interface VocabItem {
  id: string; // Unique identifier (UUID or local timestamp string)
  word: string;
  pos: string;
  trans: string;
  category: string;
  mastered: boolean;
  level: number; // Leitner spaced repetition level (0 to 5)
  nextReviewDate: number; // Timestamp in milliseconds when it becomes due for review
}

export type CurrentView = "mainView" | "manageView" | "reviewView";
