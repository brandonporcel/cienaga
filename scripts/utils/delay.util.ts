export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ExecutionTimer {
  private startTime: number;
  private maxExecutionTime: number;

  constructor(maxExecutionTimeMs: number) {
    this.startTime = Date.now();
    this.maxExecutionTime = maxExecutionTimeMs;
  }

  shouldContinue(): boolean {
    return Date.now() - this.startTime < this.maxExecutionTime;
  }

  getElapsedSeconds(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  getElapsedMinutes(): number {
    return Math.round(this.getElapsedSeconds() / 60);
  }
}
