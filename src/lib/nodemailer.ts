/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import nodemailer from "nodemailer";
import { env } from "@/env";

const transporter = nodemailer.createTransport({
  // @ts-expect-error - We know this is a valid config
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export { sendEmail };
