import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBroadcastEmail({
  to,
  companyName,
  requestText,
}) {
  await resend.emails.send({
    from: "Freight Desk <onboarding@resend.dev>",
    to,
    subject: "New Freight Rate Request",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>New Freight Rate Request</h3>
        <p><strong>Company:</strong> ${companyName}</p>
        <p>${requestText}</p>
        <br />
        <a href="http://localhost:3000/auth/login">
          Respond to this request
        </a>
      </div>
    `,
  });
}
