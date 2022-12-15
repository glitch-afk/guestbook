import { router } from "../trpc";
import { guestbookRouter } from "./guestbook";

export const appRouter = router({
  guestbook: guestbookRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
