type CommandName =
  | 'submitTaskProof'
  | 'approveTask'
  | 'rejectTask'
  | 'awardManualBonus'
  | 'deductReward'
  | 'requestRedemption'
  | 'approveRedemption'
  | 'generateWeeklyReport';

type CommandRequest = {
  command: CommandName;
  requestId: string;
  actorUserId: string;
  payload: Record<string, unknown>;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Only POST is supported' }, { status: 405 });
  }

  const body = (await request.json()) as CommandRequest;

  if (!body.command || !body.requestId || !body.actorUserId) {
    return Response.json({ error: 'command, requestId, and actorUserId are required' }, { status: 400 });
  }

  return Response.json({
    accepted: true,
    command: body.command,
    requestId: body.requestId,
    contract:
      'Implement each command as a role-checked Postgres transaction. Reward mutations must insert one unique request_id ledger row and update child balance atomically.',
  });
});
