type ParsedPortalPostBody = Record<string, unknown>;

/** Payer bill validation POST (same URL as webhook when portal fixes all URLs to /). */
export function isUrubutoPayPayerValidationBody(parsed: ParsedPortalPostBody): boolean {
  const payer =
    (typeof parsed.payer_code === "string" && parsed.payer_code.trim()) ||
    (typeof parsed.payerCode === "string" && parsed.payerCode.trim());
  if (!payer) return false;

  const hasWebhookHints =
    parsed.transaction_status != null ||
    parsed.transactionStatus != null ||
    parsed.callback_type != null ||
    parsed.callbackType != null;

  return !hasWebhookHints;
}

/** UrubutoPay auth probe: { user_name, password } shape without transaction fields. */
export function isUrubutoPayPortalAuthBody(parsed: ParsedPortalPostBody): boolean {
  const user =
    typeof parsed.user_name === "string" &&
    parsed.user_name.trim().length > 0;
  const pass = typeof parsed.password === "string";
  if (!(user && pass)) return false;

  const hasTransactionHint =
    parsed.transaction_id != null ||
    parsed.transactionId != null ||
    parsed.internal_transaction_id != null ||
    parsed.internalTransactionId != null ||
    parsed.payer_code != null ||
    parsed.payerCode != null ||
    parsed.callback_type != null ||
    parsed.callbackType != null ||
    parsed.transaction_status != null ||
    parsed.transactionStatus != null;

  return !hasTransactionHint;
}
