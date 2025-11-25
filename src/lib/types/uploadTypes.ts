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

export type UploadedFileRaw = {
  id: string;
  name: string;
  size: number;
  text?: string;
  rawFile?: File;
  error?: string;
};

export type Finding = {
  vulnPath: string;
  vulnLine: string;
  vulnName: string;
};

export type GroundTruthFile = {
  id: string;
  name: string;
  parsed: {
    duplicates: Finding[][];
    generic: Finding[];
  };
};

export type AspmResultFile = {
  id: string;
  name: string;
  parsed: {
    results: Finding[];
  };
};
