import Fastify from 'fastify';

export async function startLocalServer() {
  const server = Fastify();
  const PORT = 3000;

  server.get('/', async (_request, _reply) => {
    return { message: 'Easy_Bill Desktop Server is Running' };
  });

  // Auth Callback Bridge
  // Supabase redirects here with #access_token=...
  // We serve a page that extracts the hash and redirects to easybill://
  server.get('/auth/callback', async (_request, reply) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authenticating...</title>
        <script>
          // Get the hash from the URL (contains access_token)
          const hash = window.location.hash;
          if (hash) {
            // Redirect to the custom protocol
            window.location.href = 'easybill://auth/callback' + hash;
            // Close the window after a short delay
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            document.body.innerHTML = 'Authentication failed. No token found.';
          }
        </script>
      </head>
      <body>
        <h1>Authenticating Easy Bill...</h1>
        <p>Please wait while we redirect you back to the application.</p>
      </body>
      </html>
    `;
    reply.type('text/html').send(html);
  });

  server.post('/mobile/order', async (request, _reply) => {
    // Handle order from mobile
    const orderData = request.body;
    console.log('Received order from mobile:', orderData);
    // TODO: Insert into SQLite DB
    return { success: true };
  });

  try {
    const address = await server.listen({ port: PORT, host: '0.0.0.0' });
    
    // Dynamic import for ESM-only module
    const { internalIpV4 } = await import('internal-ip');
    const ip = await internalIpV4();

    console.log(`Local server listening on ${address}`);
    console.log(`Mobile app should connect to: http://${ip}:${PORT}`);
    return { ip, port: PORT };
  } catch (err) {
    server.log.error(err);
    // Don't exit the whole electron app if server fails, just log it
    console.error("Failed to start local server", err);
  }
}