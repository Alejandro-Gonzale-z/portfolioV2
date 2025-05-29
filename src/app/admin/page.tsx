"use client";
import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Title, PasswordInput, Button } from "@mantine/core";
import { validateLogin } from "@/actions/ValidateLogin";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
const initialState = { success: false, message: "" };

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authFailed = searchParams.get("authFailed") === "true";
  const [state, formAction] = useActionState(validateLogin, initialState);

  // useEffect to run when a user tries to access admin dashboard without authenticating first
  useEffect(() => {
    if (authFailed) {
      notifications.show({
        position: "top-center",
        autoClose: 2500,
        title: "Failed to Access Admin Dashboard",
        message: "You must login to access that page",
        color: "red",
        icon: <IconX stroke={2} />,
      });
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("authFailed");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [authFailed]);

  // useEffect for when password has been entered and submitted
  useEffect(() => {
    if (state.success) {
      notifications.show({
        position: "top-center",
        autoClose: 2500,
        title: "Success",
        message: "You have successfully logged in.",
        color: "green",
        icon: <IconCheck stroke={2} />,
      });
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 2500);
    } else if (state.message && state.success === false) {
      notifications.show({
        position: "top-center",
        autoClose: 2500,
        title: "Failed",
        message: "The password entered was incorrect, please try again.",
        color: "red",
        icon: <IconX stroke={2} />,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message, state.success]);

  return (
    <div className="flex flex-col items-center w-full py-36">
      <div className="min-w-[50%] space-y-8">
        <Title>Admin Login</Title>
        <div className="bg-gray-200 min-w-[50%] rounded-md p-8">
          <form action={formAction}>
            <PasswordInput
              placeholder="Password"
              id="your-password"
              name="password"
              size="xl"
            />
            <Button
              variant="filled"
              type="submit"
              className="mt-8 items-end"
              size="lg"
            >
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
