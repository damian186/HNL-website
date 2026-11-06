import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import routeHandler from './api/routes.mjs';

export default defineConfig({
  plugins: [react(), {
    name: 'hln-route-api-preview',
    configureServer(server) {
      server.middlewares.use('/api/routes', (req, res) => {
        const response = {
          status(code: number) { res.statusCode = code; return response; },
          setHeader(name: string, value: string) { res.setHeader(name, value); },
          json(body: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); },
        };
        void routeHandler(req, response);
      });
    },
  }],
});
