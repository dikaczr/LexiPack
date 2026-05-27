import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_URL = process.env.APP_URL || "http://localhost:5173";

/**
 * Pošle registračný email novému používateľovi.
 * @param {{ to: string, username: string, password: string, role: string }} opts
 */
export async function sendRegistrationEmail({ to, username, password, role }) {
  const subject = "Váš účet v aplikácii LexiPack";

  const html = `
<!DOCTYPE html>
<html lang="sk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1923;font-family:Inter,Calibri,sans-serif;color:#c8d8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1923;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#1a2535;border:1px solid #2a3a50;border-radius:12px;overflow:hidden;">

        <!-- HEADER -->
        <tr>
          <td style="background:#1b1c1d;padding:24px 32px;border-bottom:1px solid #2a3a50;">
            <span style="font-size:22px;font-weight:700;color:#4a9eff;letter-spacing:1px;">LexiPack</span>
            <span style="font-size:13px;color:#6b8cae;margin-left:10px;">Vocabulary Editor</span>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#e0eeff;">
              Vitajte v LexiPack!
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#8a9ab5;line-height:1.6;">
              Bol pre vás vytvorený nový účet. Nižšie nájdete prihlasovacie údaje.
            </p>

            <!-- CREDENTIALS BOX -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#0f1923;border:1px solid #2a3a50;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 18px;border-bottom:1px solid #1e2e40;">
                  <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a8a;">Používateľské meno</span><br>
                  <span style="font-size:16px;font-weight:600;color:#c8d8f0;">${username}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 18px;border-bottom:1px solid #1e2e40;">
                  <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a8a;">Heslo</span><br>
                  <span style="font-size:16px;font-weight:600;color:#c8d8f0;font-family:monospace;">${password}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 18px;">
                  <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a8a;">Rola</span><br>
                  <span style="font-size:14px;color:#4a9eff;font-weight:600;">${role}</span>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:13px;color:#6b8cae;line-height:1.6;">
              Odporúčame vám po prvom prihlásení zmeniť heslo.<br>
              Heslo uchovávaný v systéme je uložené v zašifrovanej podobe.
            </p>

            <!-- CTA BUTTON -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1e5fcc;border-radius:6px;">
                  <a href="${APP_URL}"
                     style="display:inline-block;padding:11px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">
                    Prihlásiť sa do LexiPack →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#131e2b;padding:16px 32px;border-top:1px solid #2a3a50;">
            <span style="font-size:12px;color:#4a6a8a;">
              LexiLab ©2026 Techdoc &nbsp;·&nbsp; Tento email bol vygenerovaný automaticky.
            </span>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

/**
 * Pošle email s dočasným heslom pri obnove prístupu.
 * @param {{ to: string, username: string, tempPassword: string }} opts
 */
export async function sendPasswordResetEmail({ to, username, tempPassword }) {
  const subject = "Obnova hesla — LexiPack";

  const html = `
<!DOCTYPE html>
<html lang="sk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1923;font-family:Inter,Calibri,sans-serif;color:#c8d8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1923;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#1a2535;border:1px solid #2a3a50;border-radius:12px;overflow:hidden;">

        <!-- HEADER -->
        <tr>
          <td style="background:#1b1c1d;padding:24px 32px;border-bottom:1px solid #2a3a50;">
            <span style="font-size:22px;font-weight:700;color:#4a9eff;letter-spacing:1px;">LexiPack</span>
            <span style="font-size:13px;color:#6b8cae;margin-left:10px;">Vocabulary Editor</span>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#e0eeff;">
              Obnova hesla
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#8a9ab5;line-height:1.6;">
              Pre účet <strong style="color:#c8d8f0;">${username}</strong> bolo vygenerované
              dočasné heslo. Po prihlásení si ho prosím zmeňte.
            </p>

            <!-- TEMP PASSWORD BOX -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#0f1923;border:1px solid #2a3a50;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 18px;border-bottom:1px solid #1e2e40;">
                  <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a8a;">Používateľské meno</span><br>
                  <span style="font-size:16px;font-weight:600;color:#c8d8f0;">${username}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 18px;">
                  <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a8a;">Dočasné heslo</span><br>
                  <span style="font-size:16px;font-weight:600;color:#4adf8a;font-family:monospace;letter-spacing:1px;">${tempPassword}</span>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:13px;color:#6b8cae;line-height:1.6;">
              Ak ste o obnovu hesla nežiadali, ignorujte tento email.<br>
              Vaše pôvodné heslo zostáva v platnosti do prvého použitia dočasného hesla.
            </p>

            <!-- CTA BUTTON -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1e5fcc;border-radius:6px;">
                  <a href="${APP_URL}"
                     style="display:inline-block;padding:11px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">
                    Prihlásiť sa do LexiPack →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#131e2b;padding:16px 32px;border-top:1px solid #2a3a50;">
            <span style="font-size:12px;color:#4a6a8a;">
              LexiLab ©2026 Techdoc &nbsp;·&nbsp; Tento email bol vygenerovaný automaticky.
            </span>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

/**
 * Odošle správu od používateľa na kontaktnú adresu.
 * @param {{ to: string, fromUser: string, subject: string, message: string, replyTo?: string }} opts
 */
export async function sendContactEmail({ to, fromUser, subject, message, replyTo }) {
  const html = `
<!DOCTYPE html>
<html lang="sk">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f1923;font-family:Inter,Calibri,sans-serif;color:#c8d8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1923;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#1a2535;border:1px solid #2a3a50;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#1b1c1d;padding:24px 32px;border-bottom:1px solid #2a3a50;">
            <span style="font-size:22px;font-weight:700;color:#4a9eff;letter-spacing:1px;">LexiPack</span>
            <span style="font-size:13px;color:#6b8cae;margin-left:10px;">Správa od používateľa</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a8a;">Od</p>
            <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:#c8d8f0;">${fromUser}</p>
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a8a;">Predmet</p>
            <p style="margin:0 0 20px;font-size:15px;color:#c8d8f0;">${subject}</p>
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a8a;">Správa</p>
            <div style="background:#0f1923;border:1px solid #2a3a50;border-radius:6px;padding:14px 18px;font-size:14px;line-height:1.7;color:#b0c8e0;white-space:pre-wrap;">${message}</div>
          </td>
        </tr>
        <tr>
          <td style="background:#131e2b;padding:14px 32px;border-top:1px solid #2a3a50;">
            <span style="font-size:12px;color:#4a6a8a;">LexiLab ©2026 Techdoc &nbsp;·&nbsp; Správa odoslaná cez LexiPack.</span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject: `LexiPack: ${subject}`,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}
