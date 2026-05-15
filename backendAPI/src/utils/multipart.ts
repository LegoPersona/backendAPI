const generateBoundary = (): string => {
  return `boundary_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const createMultipartMixedResponse = (
  metadata: Record<string, unknown>,
  fileContent: string,
  filename: string,
): string => {
  const boundary = generateBoundary();
  const CRLF = '\r\n';
  const delimiterLine = `--${boundary}`;
  const closingDelimiterLine = `--${boundary}--`;

  const jsonPart = [
    delimiterLine,
    `Content-Type: application/json; charset=utf-8`,
    '',
    JSON.stringify(metadata, null, 2),
  ].join(CRLF);

  const filePart = [
    delimiterLine,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    fileContent,
  ].join(CRLF);

  const body = [jsonPart, filePart, closingDelimiterLine].join(CRLF) + CRLF;

  return body;
};

export const getMultipartContentType = (body: string): string => {
  const match = body.match(/^--boundary_(\d+_[a-z0-9]+)/);
  if (match) {
    return `multipart/mixed; boundary=boundary_${match[1]}`;
  }
  return 'multipart/mixed';
};
