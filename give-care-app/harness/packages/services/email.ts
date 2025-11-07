import { Resend } from 'resend';

const getClient = () => {
  const apiKey = process.env.HARNESS_RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Resend API key not configured');
  }
  return new Resend(apiKey);
};

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

export const sendEmail = async ({ to, subject, text }: EmailPayload) => {
  const from = process.env.HARNESS_EMAIL_FROM ?? 'GiveCare <care@givecare.ai>';
  const client = getClient();
  const response = await client.emails.send({ from, to, subject, text });
  return response;
};
