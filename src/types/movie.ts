import { Director } from "./director";

export default interface Movie {
  id: string;
  title: string;
  url: string;
  rating: number | null;
  year?: number;
  poster_url?: string | null;
  background_img_url?: string | null;
  duration?: number | null;
  directors?: Director;
}
