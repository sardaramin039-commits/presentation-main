import { Request, Response, NextFunction } from 'express';
import { sanitizePromptInput, detectPromptInjection } from '../../app/core/utils/prompt-injection-defense.utils';

export function promptGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const payload = JSON.stringify(req.body || {});

    // ١. پشکنینی بوونی هێرشی Prompt Injection لەناو داواکارییەکەدا
    const inspection = detectPromptInjection(payload);
    if (inspection.isMalicious) {
      res.status(400).json({
        error: 'Security Violation: Prompt injection pattern detected.',
        reason: inspection.reason
      });
      return;
    }

    // ٢. خاوێنکردنەوەی دەقە نێردراوەکان پێش چوونە ناو کۆنترۆڵەر
    if (req.body && typeof req.body.prompt === 'string') {
      req.body.prompt = sanitizePromptInput(req.body.prompt);
    }

    next();
  } catch {
    res.status(500).json({ error: 'Failed to validate request security.' });
  }
}
