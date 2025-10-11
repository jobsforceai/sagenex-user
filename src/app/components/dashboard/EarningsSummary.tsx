"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the structure of the financial data based on the API response
interface FinancialData {
  investedPrincipal: number;
  referralEarnings: number;
  oneTimePromotionBonus: number;
  monthlyIncentive: number;
}

// Helper function to format numbers into USD currency format without decimals
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

type Props = {
  data: FinancialData | null;
};

const EarningsSummary = ({ data }: Props) => {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm">Invested Principal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(data.investedPrincipal)}</p>
        </CardContent>
      </Card>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm">Referral Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(data.referralEarnings)}</p>
        </CardContent>
      </Card>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm">Promotion Bonus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(data.oneTimePromotionBonus)}</p>
        </CardContent>
      </Card>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm">Monthly Incentive</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(data.monthlyIncentive)}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsSummary;