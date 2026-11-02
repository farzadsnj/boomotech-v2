import { escapeEmailHtml, preserveEmailLineBreaks } from "./resend";

type EmailField = { label: string; value: string; multiline?: boolean };
type EmailAction = { label: string; url: string };

export type BrandedEmailInput = {
  preheader: string;
  heading: string;
  greeting?: string;
  introduction: string;
  fields?: EmailField[];
  message?: { label: string; value: string };
  paragraphs?: string[];
  action?: EmailAction;
  safety?: string;
  approvedOrigin: string;
};

export type RenderedEmail = { html: string; text: string };

export function approvedEmailUrl(value: string, approvedOrigin: string) {
  const url = new URL(value);
  if (url.origin !== new URL(approvedOrigin).origin || !["https:", "http:"].includes(url.protocol)) {
    throw new Error("Email action URL must use the approved application origin.");
  }
  return url.toString();
}

const cell = (content: string, style = "") => `<td style="${style}">${content}</td>`;

function fieldRows(fields: EmailField[]) {
  return fields.map(({ label, value, multiline }) => `<tr>${cell(escapeEmailHtml(label), "padding:10px 12px;width:34%;border-bottom:1px solid #DDE7EB;color:#476777;font-size:13px;font-weight:700;vertical-align:top;")}${cell(multiline ? preserveEmailLineBreaks(value) : escapeEmailHtml(value), "padding:10px 12px;border-bottom:1px solid #DDE7EB;color:#1D3A49;font-size:14px;line-height:1.55;overflow-wrap:anywhere;word-break:break-word;vertical-align:top;")}</tr>`).join("");
}

export function renderBrandedEmail(input: BrandedEmailInput): RenderedEmail {
  const action = input.action ? { ...input.action, url: approvedEmailUrl(input.action.url, input.approvedOrigin) } : undefined;
  const paragraphs = input.paragraphs ?? [];
  const greeting = input.greeting?.trim() || "Hello,";
  const text = [
    "BOOMOTECH",
    "",
    input.heading,
    "",
    greeting,
    "",
    input.introduction,
    ...(input.fields?.length ? ["", ...input.fields.map(({ label, value }) => `${label}: ${value}`)] : []),
    ...(input.message ? ["", `${input.message.label}:`, input.message.value] : []),
    ...paragraphs.flatMap((paragraph) => ["", paragraph]),
    ...(action ? ["", `${action.label}: ${action.url}`] : []),
    ...(input.safety ? ["", input.safety] : []),
    "",
    "BoomoTech — practical technology support and smarter systems.",
  ].join("\n");

  const html = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escapeEmailHtml(input.heading)}</title></head><body style="margin:0;padding:0;background:#F1F5F6;color:#1D3A49;font-family:Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeEmailHtml(input.preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F1F5F6;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(29,58,73,.08);"><tr>${cell('<span style="display:inline-block;color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-.5px;">Boomo<span style="color:#78C8E8;">Tech</span></span>', "padding:24px 28px;background:#102F3D;")}</tr><tr>${cell(`<h1 style="margin:0 0 18px;color:#1D3A49;font-size:28px;line-height:1.18;letter-spacing:-.5px;">${escapeEmailHtml(input.heading)}</h1><p style="margin:0 0 14px;color:#1D3A49;font-size:16px;line-height:1.6;">${escapeEmailHtml(greeting)}</p><p style="margin:0;color:#365A6B;font-size:16px;line-height:1.65;">${escapeEmailHtml(input.introduction)}</p>`, "padding:30px 28px 18px;")}</tr>${input.fields?.length ? `<tr>${cell(`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid #DDE7EB;border-radius:8px;border-collapse:separate;border-spacing:0;overflow:hidden;">${fieldRows(input.fields)}</table>`, "padding:0 28px 20px;")}</tr>` : ""}${input.message ? `<tr>${cell(`<p style="margin:0 0 7px;color:#476777;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">${escapeEmailHtml(input.message.label)}</p><div style="padding:14px 16px;border-left:4px solid #0070B7;background:#EAF5FB;color:#1D3A49;font-size:15px;line-height:1.65;overflow-wrap:anywhere;word-break:break-word;">${preserveEmailLineBreaks(input.message.value)}</div>`, "padding:0 28px 20px;")}</tr>` : ""}${paragraphs.length ? `<tr>${cell(paragraphs.map((paragraph) => `<p style="margin:0 0 14px;color:#365A6B;font-size:15px;line-height:1.65;">${escapeEmailHtml(paragraph)}</p>`).join(""), "padding:0 28px 8px;")}</tr>` : ""}${action ? `<tr>${cell(`<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>${cell(`<a href="${escapeEmailHtml(action.url)}" style="display:inline-block;padding:13px 20px;border-radius:6px;background:#0070B7;color:#FFFFFF;font-size:15px;font-weight:800;line-height:1.2;text-decoration:none;">${escapeEmailHtml(action.label)}</a>`, "")}</tr></table><p style="margin:14px 0 0;color:#5B7480;font-size:12px;line-height:1.55;">If the button does not work, copy this link:<br><a href="${escapeEmailHtml(action.url)}" style="color:#005A94;overflow-wrap:anywhere;word-break:break-all;">${escapeEmailHtml(action.url)}</a></p>`, "padding:0 28px 26px;")}</tr>` : ""}${input.safety ? `<tr>${cell(`<p style="margin:0;padding:14px 16px;border-radius:6px;background:#F6F8F8;color:#476777;font-size:12px;line-height:1.6;">${escapeEmailHtml(input.safety)}</p>`, "padding:0 28px 26px;")}</tr>` : ""}<tr>${cell('<p style="margin:0;color:#C8D8DF;font-size:12px;line-height:1.55;">BoomoTech — practical technology support and smarter systems.</p>', "padding:20px 28px;background:#102F3D;")}</tr></table></td></tr></table></body></html>`;
  return { html: html.replace("<head>", '<head><meta charset="utf-8">'), text };
}
