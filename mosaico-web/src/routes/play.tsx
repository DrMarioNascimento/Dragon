import { createFileRoute } from "@tanstack/react-router";
import { PartyApp } from "@/components/game/party-app";

export const Route = createFileRoute("/play")({
  component: PartyApp,
  ssr: false,
});
