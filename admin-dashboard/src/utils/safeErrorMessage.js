const SENSITIVE_PATTERNS = /mongodb|mongoose|ENOTFOUND|ECONNREFUSED|getaddrinfo|connection string|password|token|jwt|tls|certificate|srv|replica|URI|atlas|shard|2dsphere/i;

const safeErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  const raw = err?.response?.data?.error
    || err?.response?.data?.errors?.[0]?.msg
    || err?.message
    || '';
  if (SENSITIVE_PATTERNS.test(raw)) return fallback;
  return raw || fallback;
};

export default safeErrorMessage;
