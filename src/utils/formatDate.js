export function formatDate(timestamp) {
  if (!timestamp) {
    return 'Unavailable';
  }

  const numericTimestamp = Number(timestamp);
  const date = Number.isFinite(numericTimestamp)
    ? new Date(numericTimestamp < 10000000000 ? numericTimestamp * 1000 : numericTimestamp)
    : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}
