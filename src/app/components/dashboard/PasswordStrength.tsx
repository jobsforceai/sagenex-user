import React from "react";

const PasswordStrength = ({ password }: { password: any }) => {
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length > 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabel = ["Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["#ff6b6b", "#ffa500", "#76ff03", "#00ff00"];

  return (
    <div className="flex items-center mt-2">
      <div className="w-full bg-gray-700 rounded-full h-2 mr-2">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${(strength / 4) * 100}%`,
            backgroundColor: strengthColor[strength - 1] || "transparent",
          }}
        />
      </div>
      <div className="text-sm" style={{ color: strengthColor[strength - 1] }}>
        {strengthLabel[strength - 1]}
      </div>
    </div>
  );
};

export default PasswordStrength;