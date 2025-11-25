export const readFileText = (file: File) =>
  new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result ?? ""));
    fr.onerror = () => rej(new Error("Failed to read file"));
    fr.readAsText(file);
  });
