import Cinema from "./cinema";
import Movie from "./movie";

export default interface Screening {
  id: string;
  event_type: string;
  description: string;
  room: string;
  original_url: string;
  thumbnail_url: string;
  screening_time_text: string;
  movie_id: string;
  movies: Movie;
  cinemas: Cinema;
  screening_times: ScreeningTime[];
}

export interface ScreeningTime {
  id: string;
  screening_id: string;
  screening_datetime: string;
}
