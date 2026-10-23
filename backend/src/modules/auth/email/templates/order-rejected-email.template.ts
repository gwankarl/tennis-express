import { escapeHtml, getGreeting } from './email-template.utils.js';

interface OrderRejectedEmailInput {
  recipientName: string;
  orderId: string;
  reason: string;
  note: string | null;
}

/** Creates the buyer notification sent when a seller rejects an order. */
export function createOrderRejectedEmailTemplate(
  input: OrderRejectedEmailInput,
) {
  const greeting = getGreeting(input.recipientName);
  const safeOrderId = escapeHtml(input.orderId);
  const safeReason = escapeHtml(input.reason);
  const noteText = input.note ? `\nAdditional detail: ${input.note}` : '';

  const text =
    `${greeting},\n\n` +
    `The seller could not fulfil order ${input.orderId}.\n` +
    `Reason: ${input.reason}${noteText}\n\n` +
    'You can review the order in your Tennis-Xpress account.';

  const html = `<!doctype html>
<html lang="en">
  <body style="font-family:Arial,Helvetica,sans-serif;color:#202938;">
    <h1 style="color:#176b45;">Tennis-Xpress</h1>
    <p>${escapeHtml(greeting)},</p>
    <p>The seller could not fulfil order <strong>${safeOrderId}</strong>.</p>
    <p><strong>Reason:</strong> ${safeReason}</p>
    ${
      input.note
        ? `<p><strong>Additional detail:</strong> ${escapeHtml(input.note)}</p>`
        : ''
    }
    <p>You can review the order in your Tennis-Xpress account.</p>
  </body>
</html>`;

  return {
    subject: 'Update about your Tennis-Xpress order',
    text,
    html,
  };
}
