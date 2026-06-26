import Button from "@/components/common/Button";
import { IoArrowBack, IoPricetags } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

interface PricingFormHeaderProps {
  title: string;
}

export default function PricingFormHeader({ title }: PricingFormHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="relative">
      <div className="absolute h-full top-0 left-0 flex items-center">
        <Button
          type="button"
          className="!text-[#FADF4B] !size-[40px] bg-[#EE1E21] hover:bg-[#EE1E21] !rounded-full !p-0 !py-0 flex items-center justify-center !cursor-pointer"
          onClick={() => navigate("/pricing")}
        >
          <IoArrowBack className="text-[#FADF4B] text-lg" />
        </Button>
      </div>
      <div className="flex gap-5 items-center justify-center mb-6">
        <div className="flex gap-4 items-center">
          <IoPricetags className="text-[28px] text-[#EE1E21]" />
          <h1 className="text-[26px] font-medium text-gray-700">{title}</h1>
        </div>
      </div>
    </header>
  );
}
