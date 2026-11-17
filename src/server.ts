import express, { type NextFunction, type Request, type Response } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { aiRouter } from './server/routes/ai.routes';
import { createAuthMiddleware } from './server/middleware/auth.middleware';
import { promptGuardMiddleware } from './server/middleware/prompt-guard.middleware';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');

  server.disable('x-powered-by');
  server.use(express.json({ limit: '100kb' }));

  // All AI endpoints are authenticated and pass through the prompt-injection guard.
  server.use('/api', createAuthMiddleware(), promptGuardMiddleware, aiRouter);

  // Express 5 no longer accepts the old "*.*" / "*" path syntax.
  server.get(/\/[^?]*\.[^?/]+$/, express.static(browserDistFolder, { maxAge: '1y' }));
  server.get(/.*/, (_req: Request, res: Response, next: NextFunction) => {
    res.sendFile(join(browserDistFolder, 'index.html'), (error) => {
      if (error) next(error);
    });
  });

  return server;
}

export const reqHandler = app();

const isMainModule = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isMainModule) {
  const port = Number.parseInt(process.env['PORT'] || '3000', 10) || 3000;
  reqHandler.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}
