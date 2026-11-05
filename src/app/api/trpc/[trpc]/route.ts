import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/server/routers/_app";
import { isCrossSite } from "@/server/same-origin";
import { createContext } from "@/server/trpc";

function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createContext({ headers: request.headers }),
  });
}

function post(request: Request) {
  if (isCrossSite(request)) return new Response(null, { status: 403 });
  return handler(request);
}

export { handler as GET, post as POST };
