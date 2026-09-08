import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent, AppNotFound } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: AppNotFound,
  });
}
