import { getFullSessionState } from '@/server/services/live.service';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { joinCode } = params;
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId') || null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastSignature = '';
      let isClosed = false;

      const sendState = async () => {
        if (isClosed) return;
        try {
          const state = await getFullSessionState(joinCode, playerId);
          if (state) {
            const signature = `${state.version}_${state.status}_${state.players?.length || 0}_${state.answeredCount || 0}_${state.currentQuestionIndex}_${state.currentQuestion?.id || 'none'}`;
            if (signature !== lastSignature) {
              lastSignature = signature;
              const message = `data: ${JSON.stringify(state)}\n\n`;
              controller.enqueue(encoder.encode(message));
            }
          }
        } catch (err) {
          // ignore transient db read error
        }
      };

      // Initial send
      await sendState();

      // Poll interval (every 800ms for smooth live responses)
      const intervalId = setInterval(sendState, 800);

      request.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(intervalId);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
