import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useOrderItemCategories,
  useCreateOrderItemCategory,
} from "@/hooks/useOrderItemCategories";
import toast from "react-hot-toast";

export default function OrderItemCategoriesPage() {
  const navigate = useNavigate();
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useOrderItemCategories();
  const createMutation = useCreateOrderItemCategory();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: trimmed,
        description: description.trim() || undefined,
      });
      toast.success("Category created.");
      resetForm();
      setAddOpen(false);
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message;
      toast.error(
        typeof msg === "string" && msg.trim()
          ? msg
          : "Could not create category.",
      );
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-0.5 shrink-0 rounded-full border-slate-200"
              onClick={() => navigate("/order")}
              aria-label="Back to orders"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <LayoutGrid className="h-5 w-5 text-blue-600" />

                <h1 className="text-2xl font-semibold text-gray-900">
                  Item categories
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Manage categories used when classifying order line items.
              </p>
            </div>
          </div>
          <Button
            className="bg-blue-600 text-white shadow-sm hover:bg-blue-700"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add category
          </Button>
        </div>

        <Card className="overflow-hidden border-slate-200/80 shadow-md shadow-slate-200/40">
          <CardHeader className="border-b border-slate-100 bg-white py-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              All categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <span className="text-sm">Loading categories…</span>
                </div>
              </div>
            ) : isError ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-red-600">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load categories."}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => void refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : categories.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <LayoutGrid className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-700">
                  No categories yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first item category to use it on orders.
                </p>
                <Button
                  className="mt-6 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add category
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                      <TableHead className="w-[28%] font-semibold text-slate-700">
                        Name
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Description
                      </TableHead>
                      <TableHead className="hidden w-[22%] font-semibold text-slate-700 md:table-cell">
                        Created
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((row, index) => (
                      <TableRow
                        key={row.id || `${row.name}-${index}`}
                        className="border-slate-100 transition-colors hover:bg-blue-50/40"
                      >
                        <TableCell className="font-medium text-slate-900">
                          {row.name}
                        </TableCell>
                        <TableCell className="max-w-md text-slate-600">
                          {row.description?.trim() ? (
                            <span className="line-clamp-2">
                              {row.description}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-sm text-slate-500 md:table-cell whitespace-nowrap">
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Add item category</DialogTitle>
              <DialogDescription>
                Enter a name and optional description.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="cat-name">Name *</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Electronics"
                  autoComplete="off"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details"
                  rows={3}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setAddOpen(false);
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
