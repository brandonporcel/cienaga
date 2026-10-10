export default interface Cinema {
  id: number;
  name: string;
  url: string;
  image_url: string;
  slug: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}