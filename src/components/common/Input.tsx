import type { InputProps } from "../../types/ComponentTypes";

const Input = ({
  id,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  label,
  className,
}: InputProps) => {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs sm:text-sm text-black mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full px-3 py-2 border text-xs sm:text-sm rounded-md focus:outline-none ${className} ${
          error && touched
            ? "border-red"
            : "focus:ring-2 focus:ring-[#EE1E21]/30 focus:border-[#EE1E21] border-gray"
        }`}
      />
      {error && touched && (
        <p className="text-xs font-medium text-red mt-1 ml-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
