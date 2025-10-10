"use client";
import { createAboutMe } from "@/actions/AboutMe";
import { Button, Title, Textarea } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useActionState, useEffect } from "react";

const initialState = { success: false, message: "", timestamp: 0 };

export default function AboutMeForm() {
  const [state, formAction, isPending] = useActionState(
    createAboutMe,
    initialState
  );

  useEffect(() => {
    if (state.message) {
      notifications.show({
        position: "top-center",
        withCloseButton: true,
        autoClose: 3500,
        title: state.success ? "Success" : "Error",
        message: state.message,
        color: state.success ? "green" : "red",
        icon: state.success ? <IconCheck stroke={2} /> : <IconX stroke={2} />,
      });
    }
  }, [state.message, state.success, state.timestamp]);

  return (
    <div className="space-y-6">
      <Title order={2} style={{ color: "blue" }}>
        About Me Form
      </Title>

      <form action={formAction} className="max-w-3xl space-y-6">
        <Textarea
          name="description"
          placeholder="Enter your about me info"
          autosize
          minRows={4}
        />
        <div className="mt-6 flex justify-end">
          <Button variant="outline" type="submit" size="md">
            {isPending ? "Saving..." : "Upload"}
          </Button>
        </div>
      </form>
    </div>
  );
}
