export const getCve = (vulnName: string): string | null => {
  const cveRegex = /CVE-\d{4}-\d{4,7}/i;
  const match = vulnName.match(cveRegex);
  return match ? match[0].toUpperCase() : null;
};
