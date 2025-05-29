"use client";
import { createAboutMe } from "@/actions/AboutMe";
import { Button, Title, Textarea } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useActionState, useEffect } from "react";
const initialState = { success: false, message: "" };

export default function AboutMeForm() {
  const [state, formAction] = useActionState(createAboutMe, initialState);

  useEffect(() => {
    if (state.message) {
      notifications.show({
        position: "top-center",
        withCloseButton: true,
        autoClose: 3500,
        title: state.message ? "Success" : "Error",
        message: state.message,
        color: state.success ? "green" : "red",
        icon: state.success ? <IconCheck stroke={2} /> : <IconX stroke={2} />,
      });
    }
  }, [state.message, state.success]);

  return (
    <div className="space-y-8 border-4 rounded-xl admin-padding">
      <Title order={1}>About Me Form</Title>
      <form action={formAction}>
        <Textarea
          label="About Me"
          name="description"
          placeholder="Enter your about me info"
          description=""
          autosize
          minRows={4}
          required
        />
        <Button variant="outline" type="submit" className="mt-8" size="lg">
          Upload
        </Button>
      </form>
    </div>
  );
}
