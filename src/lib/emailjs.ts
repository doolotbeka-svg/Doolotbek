import emailjs from '@emailjs/browser';

export interface ContactSubmission {
  name: string;
  contact: string;
  service: string;
  message: string;
  lang: 'ru' | 'kg';
}

export interface ContactResult {
  ok: boolean;
  channel: 'emailjs' | 'server-relay';
}

export async function sendContactMessage(payload: ContactSubmission): Promise<ContactResult> {
  const serviceId = (import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined)?.trim();
  const templateId = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined)?.trim();
  const publicKey = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined)?.trim();

  if (serviceId && templateId && publicKey) {
    await emailjs.send(
      serviceId,
      templateId,
      {
        from_name: payload.name,
        reply_to: payload.contact,
        service_topic: payload.service,
        message: payload.message,
        language: payload.lang,
      },
      { publicKey },
    );

    // Also record conversion event via backend
    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'contact_submit',
        path: '/#contact',
        lang: payload.lang,
        meta: { channel: 'emailjs', service: payload.service },
      }),
    }).catch(() => {});

    return { ok: true, channel: 'emailjs' };
  }

  // Fallback to built-in Express relay when EmailJS keys are not yet populated in environment
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to send contact inquiry');
  }

  return { ok: true, channel: 'server-relay' };
}
