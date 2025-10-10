import PDFDocument from "pdfkit";

import type { Resume } from "../../lib/types/resume.js";

type PdfDoc = InstanceType<typeof PDFDocument>;

export async function renderResumePdf(resume: Resume) {
  const doc = new PDFDocument({
    margin: 50,
    size: "Letter",
  });

  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    );
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    writeHeader(doc, resume);
    writeSummary(doc, resume.summary);
    writeExperience(doc, resume.sections.experience ?? []);
    writeSkills(doc, resume.sections.skills ?? []);
    writeEducation(doc, resume.sections.education ?? []);

    doc.end();
  });
}

function writeHeader(doc: PdfDoc, resume: Resume) {
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(resume.headline, { align: "center" });
  doc.moveDown(0.5);
}

function writeSummary(doc: PdfDoc, summary: string) {
  if (!summary) return;
  doc
    .fontSize(12)
    .font("Helvetica")
    .text(summary, {
      align: "left",
      lineGap: 4,
    });
  doc.moveDown();
}

function writeSectionTitle(doc: PdfDoc, title: string) {
  doc
    .moveDown(0.5)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(title.toUpperCase());
  doc.moveDown(0.3);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#dddddd")
    .lineWidth(1)
    .stroke();
  doc.strokeColor("#000000");
  doc.moveDown(0.5);
}

function writeExperience(
  doc: PdfDoc,
  experiences: Resume["sections"]["experience"]
) {
  if (!experiences.length) return;
  writeSectionTitle(doc, "Experience");

  experiences.forEach((exp) => {
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`${exp.title} — ${exp.company}`);
    doc
      .fontSize(11)
      .font("Helvetica-Oblique")
      .text(
        [exp.location, exp.dates].filter(Boolean).join(" · ") || exp.dates
      );
    doc.moveDown(0.2);
    doc.fontSize(11).font("Helvetica");
    if (exp.bullets?.length) {
      doc.list(exp.bullets, {
        bulletIndent: 12,
        textIndent: 18,
        lineGap: 2,
      });
    }
    doc.moveDown(0.8);
  });
}

function writeSkills(doc: PdfDoc, skills: string[]) {
  if (!skills.length) return;
  writeSectionTitle(doc, "Skills");
  doc
    .fontSize(11)
    .font("Helvetica")
    .text(skills.join(" • "), { lineGap: 2 });
  doc.moveDown();
}

function writeEducation(
  doc: PdfDoc,
  education: NonNullable<Resume["sections"]["education"]>
) {
  if (!education.length) return;
  writeSectionTitle(doc, "Education");
  education.forEach((edu) => {
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`${edu.credential} — ${edu.school}`);
    if (edu.year) {
      doc.fontSize(11).font("Helvetica").text(`${edu.year}`);
    }
    doc.moveDown(0.6);
  });
}
