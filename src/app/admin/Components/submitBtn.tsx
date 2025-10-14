import { Button } from "@mantine/core";

export function SubmitButton({
  label = "Upload",
  isPending = false,
}: {
  label?: string;
  isPending?: boolean;
}) {
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
    >
      {isPending ? "Saving…" : label}
    </Button>
  );
}