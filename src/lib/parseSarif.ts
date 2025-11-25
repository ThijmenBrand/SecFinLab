export const parseSarif = (text: string) => {
  try {
    const json = JSON.parse(text);
    console.log("Parsed JSON:", json);
    // Basic SARIF heuristic: sum results lengths across runs
    let findings = 0;
    if (Array.isArray(json.runs)) {
      for (const r of json.runs) {
        if (Array.isArray(r.results)) findings += r.results.length;
      }
    }
    return { parsed: json, findingsCount: findings };
  } catch {
    throw new Error("Invalid JSON/SARIF");
  }
};
