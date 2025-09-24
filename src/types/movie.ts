import { Director } from "./director";

export default interface Movie {
  id: string;
  title: string;
  url: string;
  rating: number | null;
  year?: number;
  directors?: Director;
}
