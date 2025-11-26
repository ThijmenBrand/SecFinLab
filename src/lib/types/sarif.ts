export type BaseSarif = {
  $schema: string;
  version: string;
  runs: [];
};

export type SarifRun = {
  tool: {
    driver: {
      name: string;
      organization: string;
      semanticVersion: string;
    };
  };
  results: SarifResult[];
};

export type SarifResult = {
  ruleId: string;
  message: {
    text: string;
  };
  locations: SarifLocation[];
};

export type SarifLocation = {
  physicalLocation: {
    artifactLocation: {
      uri: string;
    };
    region: {
      startLine: string;
      startColumn?: string;
    };
  };
};
