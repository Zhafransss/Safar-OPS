import { z } from "zod";

import { TEAM_PALETTE } from "@/config/team-palette";
import { saveTeam } from "@/server/services/team";
import { ownerProcedure, router } from "@/server/trpc";

const colors = TEAM_PALETTE.map((entry) => entry.color) as [string, ...string[]];

// Empty values pass here on purpose: team-rules reports them with the PNG code the mockup shows.
const teamInput = z.object({
  name: z.string().max(100),
  color: z.enum(colors),
  leaderId: z.string().nullable(),
  staffIds: z.array(z.string()).max(200),
});

export const teamRouter = router({
  create: ownerProcedure.input(teamInput).mutation(({ input, ctx }) => saveTeam(null, input, ctx.user.id)),

  update: ownerProcedure
    .input(teamInput.extend({ id: z.string() }))
    .mutation(({ input: { id, ...draft }, ctx }) => saveTeam(id, draft, ctx.user.id)),
});
