export const formatINR = (amount?: number | null) => {
  if (amount === undefined || amount === null) return "N/A";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

