import Cinema from "./cinema";
import Movie from "./movie";

export default interface Screening {
  id: string;
  event_type: string;
  description: string;
  room: string;
  original_url: string;
  thumbnail_url: string;
  screening_time: string;
  movie_id: string;
  movies: Movie;
  cinemas: Cinema;
}
