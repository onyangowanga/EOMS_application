export interface ParsedMpesaMessage {
  transactionReference?: string;
  contributorName?: string;
  contributorPhone?: string;
  amount?: number;
  transactionDateText?: string;
}

export interface ParsedMpesaStatementEntry extends ParsedMpesaMessage {
  transactionDateIso?: string;
  details?: string;
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

const parseCurrencyValue = (value?: string) => {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/,/g, '').trim();
  const amount = parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const parseStatementDate = (value?: string) => {
  if (!value) {
    return {};
  }

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    return { transactionDateText: value.trim() };
  }

  const [, year, month, day, hour, minute, second] = match;
  return {
    transactionDateText: `${day}/${month}/${year} ${hour}:${minute}:${second}`,
    transactionDateIso: `${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`,
  };
};

const extractStatementContributor = (details?: string) => {
  if (!details) {
    return {};
  }

  const normalized = details.replace(/\s+/g, ' ').trim();
  const match = normalized.match(
    /Merchant Payment(?: Online)?(?: received)? from\s+([^\s]+)\s+-\s+(.+)$/i,
  );

  if (!match) {
    const fallbackNameMatch = normalized.match(/-\s*([^-,][A-Za-z0-9\s'.&/-]+)$/);

    if (fallbackNameMatch) {
      return {
        contributorName: toTitleCase(fallbackNameMatch[1]),
      };
    }

    return {
      contributorName: toTitleCase(normalized),
    };
  }

  return {
    contributorPhone: match[1].trim(),
    contributorName: toTitleCase(match[2]),
  };
};

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

export const parseMpesaStatementCsv = (rawCsv: string) => {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { entries: [] as ParsedMpesaStatementEntry[], skippedRows: 0, totalRows: 0 };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const getColumnIndex = (name: string) => headers.indexOf(name.toLowerCase());

  const receiptIndex = getColumnIndex('Receipt No');
  const completionTimeIndex = getColumnIndex('Completion Time');
  const detailsIndex = getColumnIndex('Details');
  const paidInIndex = getColumnIndex('Paid in');

  if ([receiptIndex, completionTimeIndex, detailsIndex, paidInIndex].some((index) => index < 0)) {
    return { entries: [] as ParsedMpesaStatementEntry[], skippedRows: lines.length - 1, totalRows: lines.length - 1 };
  }

  const entries: ParsedMpesaStatementEntry[] = [];
  let skippedRows = 0;

  for (const line of lines.slice(1)) {
    const columns = parseCsvLine(line);
    const receiptNumber = (columns[receiptIndex] || '').trim().toUpperCase();
    const details = columns[detailsIndex] || '';
    const paidIn = parseCurrencyValue(columns[paidInIndex]);

    const isIncomingPayment = !!receiptNumber && paidIn > 0;

    if (!isIncomingPayment) {
      skippedRows += 1;
      continue;
    }

    const contributor = extractStatementContributor(details);
    if (!contributor.contributorName) {
      skippedRows += 1;
      continue;
    }

    const statementDate = parseStatementDate(columns[completionTimeIndex]);

    entries.push({
      transactionReference: receiptNumber,
      contributorName: contributor.contributorName || 'Unknown Payer',
      contributorPhone: contributor.contributorPhone,
      amount: paidIn,
      transactionDateText: statementDate.transactionDateText,
      transactionDateIso: statementDate.transactionDateIso,
      details,
    });
  }

  return {
    entries,
    skippedRows,
    totalRows: lines.length - 1,
  };
};

export const formatKenyaAmount = (amount: number) =>
  amount.toLocaleString('en-KE', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
