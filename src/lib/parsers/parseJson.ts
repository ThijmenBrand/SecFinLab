export const parseJson = (fileText: string): unknown => {
  try {
    const parsed = JSON.parse(fileText);
    return parsed;
  } catch {
    throw new Error("Invalid JSON format");
  }
};
