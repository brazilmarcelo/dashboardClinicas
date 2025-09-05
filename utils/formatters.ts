export const formatNumber = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined) {
    return '0';
  }
  
  // Attempt to convert string to number.
  const numericValue = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(numericValue)) {
    return num.toString(); // Return original string if it's not a parsable number (e.g., "N/A")
  }

  // Format number for pt-BR locale and limit decimals.
  return numericValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
};
