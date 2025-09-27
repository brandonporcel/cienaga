export interface Director {
  id: number;
  name: string;
  url: string;
  image_url: string;
  user_directors?: { user_id: string }[];
  created_at: string;
}
