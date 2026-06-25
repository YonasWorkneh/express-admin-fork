import Button from "@/components/common/Button";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/utils/spinner";

type ActionButtonsProps = {
  isEditing: boolean;
  loading: boolean;
  /** When true, sits inside a parent card (no outer gray panel). */
  embedded?: boolean;
};

export default function ActionButtons({
  isEditing,
  loading,
  embedded = false,
}: ActionButtonsProps) {
  const navigate = useNavigate();

  return (
    <div
      className={
        embedded
          ? "mt-6 pt-6 border-t border-gray-200 space-y-4"
          : "bg-gray-50 p-6 rounded-lg space-y-4"
      }
    >
      <h2
        className={`font-medium mb-4 ${
          embedded ? "text-base text-gray-800" : "text-lg"
        }`}
      >
        {embedded ? "Save configuration" : "Complete Configuration"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          type="submit"
          className="cursor-pointer hover:bg-[#cc1a1c]"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="h-4 w-4" />
              {isEditing ? "Updating..." : "Saving..."}
            </span>
          ) : (
            isEditing ? "Update" : "Save"
          )} Configuration
        </Button>
        <Button
          type="button"
          onClick={() => navigate("/pricing")}
          className="bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300 !w-full"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
