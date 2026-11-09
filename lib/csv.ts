export function parseCSV(source: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  const text = source.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n" || c === "\r")) {
      row.push(value);
      value = "";
      if (c !== ",") {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (c === "\r" && text[i + 1] === "\n") i++;
      }
    } else value += c;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  row.push(value);
  if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift()?.map((h) => h.trim().toLowerCase()) || [];
  if (new Set(headers).size !== headers.length)
    throw new Error("Duplicate CSV column names.");
  return rows.map((r, i) => {
    if (r.length !== headers.length)
      throw new Error(`Row ${i + 2} has a different number of columns.`);
    return Object.fromEntries(headers.map((h, n) => [h, r[n].trim()]));
  });
}
export function csv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          let value = String(cell);
          if (/^[=+@\-\t\r]/.test(value)) value = "'" + value;
          return '"' + value.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}
