import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/escuro")({
  component: () => <Navigate to="/noite/$slug" params={{ slug: "escuro" }} />,
});
