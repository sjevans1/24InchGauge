import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { serif, serifBold } from "./pdf-fonts";
import { displayDate, type DocumentSnapshot } from "./model";
export async function renderPDF(
  s: DocumentSnapshot,
  logo?: Uint8Array,
  draft = false,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const regular = await pdf.embedFont(bytes(serif), { subset: true });
  const bold = await pdf.embedFont(bytes(serifBold), { subset: true });
  const small = regular;
  const characters = new Set(regular.getCharacterSet());
  const printable = (value: string) =>
    [...value]
      .map((c) => (c === "\n" || characters.has(c.codePointAt(0)!) ? c : "?"))
      .join("");
  const color = s.lodge.brand.color
    .match(/[a-f0-9]{2}/gi)!
    .map((v) => parseInt(v, 16) / 255);
  const accent = rgb(color[0], color[1], color[2]);
  let page = pdf.addPage([595.28, 841.89]),
    y = 785;
  const left = 52,
    width = 491,
    lineHeight = s.lodge.brand.layout === "compact" ? 15 : 18;
  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 785;
  };
  const line = (value: string, font: PDFFont, size: number, center = false) => {
    if (y < 75) newPage();
    const content = printable(value);
    page.drawText(content, {
      x: center
        ? Math.max(left, (595.28 - font.widthOfTextAtSize(content, size)) / 2)
        : left,
      y,
      size,
      font,
      color: accent,
    });
    y -= Math.max(lineHeight, size * 1.3);
  };
  const paragraph = (
    value: string,
    font = regular,
    size = 11,
    center = false,
  ) => {
    for (const part of printable(value).split("\n")) {
      let current = "";
      for (let word of part.split(/\s+/)) {
        while (font.widthOfTextAtSize(word, size) > width) {
          if (current) {
            line(current, font, size, center);
            current = "";
          }
          let cut = 1;
          while (
            cut < word.length &&
            font.widthOfTextAtSize(word.slice(0, cut + 1), size) <= width
          )
            cut++;
          line(word.slice(0, cut), font, size, center);
          word = word.slice(cut);
        }
        const candidate = current ? current + " " + word : word;
        if (font.widthOfTextAtSize(candidate, size) > width) {
          line(current, font, size, center);
          current = word;
        } else current = candidate;
      }
      line(current, font, size, center);
    }
    y -= 7;
  };
  if (logo) {
    const image = await pdf.embedPng(logo);
    const size = image.scaleToFit(64, 64);
    page.drawImage(image, {
      x: (595.28 - size.width) / 2,
      y: y - size.height,
      width: size.width,
      height: size.height,
    });
    y -= size.height + 20;
  }
  paragraph(s.lodge.name, bold, 23, true);
  paragraph(
    `No. ${s.lodge.number} · ${s.lodge.constitution} Constitution`,
    small,
    10,
    true,
  );
  y -= 10;
  paragraph(s.kind.toUpperCase() + (draft ? " · DRAFT" : ""), bold, 15, true);
  paragraph(s.meeting.title, bold, 13, true);
  paragraph(
    `${displayDate(s.meeting.date)} at ${s.meeting.time}\n${s.meeting.venue}`,
    regular,
    11,
    true,
  );
  y -= 7;
  if (s.kind === "Minutes") paragraph(s.meeting.minutes);
  else
    for (const section of s.lodge.brand.sections) {
      if (section === "Notice") paragraph(s.lodge.brand.greeting);
      if (section === "Agenda") {
        paragraph("ORDER OF BUSINESS", bold, 12);
        s.meeting.agenda.forEach((item, i) => paragraph(`${i + 1}. ${item}`));
        if (s.ceremonies.length)
          paragraph(
            "Scheduled work: " +
              s.ceremonies.map((c) => `${c.name} — ${c.degree}`).join("; "),
          );
      }
      if (section === "Officers" && s.officers.length) {
        paragraph("OFFICERS", bold, 12);
        s.officers.forEach((o) =>
          paragraph(`${o.office}: ${o.name}`, regular, 10),
        );
      }
      if (section === "Notices" && s.lodge.brand.footer)
        paragraph(s.lodge.brand.footer, regular, 10, true);
    }
  const pages = pdf.getPages();
  pages.forEach((p, i) =>
    p.drawText(
      `${draft ? "Draft for review" : "Issued " + s.issuedAt.slice(0, 10)} | ${i + 1} / ${pages.length}`,
      { x: left, y: 37, font: small, size: 8, color: accent },
    ),
  );
  pdf.setTitle(`${s.lodge.name} — ${s.kind} — ${s.meeting.date}`);
  return pdf.save();
}
