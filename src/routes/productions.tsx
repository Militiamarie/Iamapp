import { createFileRoute } from "@tanstack/react-router";
import { Altar } from "@/routes/altar";

export const Route = createFileRoute("/productions")({ component: Altar });