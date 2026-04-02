export interface ParsedMpesaMessage {
  transactionReference?: string;
  contributorName?: string;
  contributorPhone?: string;
  amount?: number;
  transactionDateText?: string;
}

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();

const normalizeMpesaText = (raw: string) =>
  raw
    .replace(/\r?\n/g, ' ')
    .replace(/Confirmed\.on/gi, 'Confirmed. on')
    .replace(/(AM|PM)(KSH|Ksh)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

export const parseMpesaMessage = (rawMessage: string): ParsedMpesaMessage | null => {
  const text = normalizeMpesaText(rawMessage);
  if (!text) {
    return null;
  }

  const parsed: ParsedMpesaMessage = {};

  const referenceMatch = text.match(/^([A-Z0-9]{8,12})\b/i);
  if (referenceMatch) {
    parsed.transactionReference = referenceMatch[1].toUpperCase();
  }

  const amountMatch = text.match(/(?:KSH|Ksh)\s?([\d,]+(?:\.\d{2})?)/i);
  if (amountMatch) {
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (Number.isFinite(amount)) {
      parsed.amount = amount;
    }
  }

  const dateMatch = text.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  if (dateMatch) {
    parsed.transactionDateText = `${dateMatch[1]} ${dateMatch[2].toUpperCase()}`;
  }

  const tillPattern = /received from\s+((?:254|0)\d{9,11}|\d{10,15}|\d{4}\*{3}\d{3})\s+([A-Z][A-Z\s'.&-]+?)\.\s*(?:New|Transaction|$)/i;
  const tillMatch = text.match(tillPattern);

  const directPattern = /received\s+(?:Ksh|KSH)\s?[\d,]+(?:\.\d{2})?\s+from\s+(.+?)\s+((?:254|0)\d{2,3}\*+\d{2,4}|(?:254|0)\d{8,12})\s+on/i;
  const directMatch = text.match(directPattern);

  if (tillMatch) {
    parsed.contributorPhone = tillMatch[1];
    parsed.contributorName = toTitleCase(tillMatch[2]);
  } else if (directMatch) {
    parsed.contributorName = toTitleCase(directMatch[1]);
    parsed.contributorPhone = directMatch[2];
  }

  if (!parsed.transactionReference && !parsed.amount && !parsed.contributorName) {
    return null;
  }

  return parsed;
};

export const formatKenyaAmount = (amount: number) =>
  amount.toLocaleString('en-KE', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
