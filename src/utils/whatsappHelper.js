export const buildReminderMessage = (
  studentName, batchName, month, amount, businessName
) =>
  `Hello ${studentName}! 🙏\n\nFee reminder for *${batchName}*\n` +
  `📅 Month: ${month}\n💰 Amount: ₹${amount}\n\n` +
  `Please pay at the earliest.\n\n— ${businessName}`;

export const openWhatsApp = (phone, message) =>
  window.open(
    `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
