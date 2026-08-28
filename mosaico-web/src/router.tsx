import { createHashHistory, createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const pages = (import.meta.env.BASE_URL || "/").includes("/Dragon/v2");
  const browser = typeof document !== "undefined";
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    ...(pages && browser ? { history: createHashHistory() } : {}),
  });
}