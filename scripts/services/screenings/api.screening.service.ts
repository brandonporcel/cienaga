import { ApiConfig } from "../../types/api.types";

export class ScreeningApiService {
  private config: ApiConfig;

  constructor(baseUrl: string, secretKey: string) {
    this.config = {
      baseUrl,
      secretKey,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    };
  }
}
