export interface Director {
  id: string;
  name: string;
  url: string;
  image_url: string;
  user_directors?: { user_id: string }[];
  created_at: string;
}
