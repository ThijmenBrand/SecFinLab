/* eslint-disable @typescript-eslint/no-explicit-any */
export type VulnerabilityPreview = {
  ruleId?: string;
  message?: string;
  uri?: string;
  region?: {
    startLine?: number;
    endLine?: number;
    startColumn?: number;
    endColumn?: number;
  };
  raw?: any;
} | null;
