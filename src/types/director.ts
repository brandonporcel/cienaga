import { User } from "@supabase/supabase-js";

export interface Director {
  id: number;
  name: string;
  user_directors?: { user_id: string }[];
  created_at: string;
}
