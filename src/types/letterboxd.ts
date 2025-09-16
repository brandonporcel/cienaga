export interface LetterboxdMovie {
  title: string;
  year: number;
  url: string;
  rating?: number;
}

export type LetterboxdCSVRow = {
  Name: string;
  Year: string;
  Rating: string;
  "Letterboxd URI": string;
};
