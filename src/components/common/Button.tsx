import type { ButtonProps } from "../../types/ComponentTypes";

const Button = ({
  type,
  disabled = false,
  children,
  onClick,
  className = "",
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full bg-[#EE1E21] text-[#FADF4B] text-xs sm:text-sm py-3 px-4 rounded-lg ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
