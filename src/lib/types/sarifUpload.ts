/* eslint-disable @typescript-eslint/no-explicit-any */
export type UploadedSarif = {
  id: string;
  name: string;
  size: number;
  text?: string;
  parsed?: any;
  findingsCount?: number;
  error?: string;
};
