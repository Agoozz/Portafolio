import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Error de validación',
      details: err.issues,
    });
    return;
  }

  // Ocultamos detalles internos del error en producción
  console.error('[SERVER_ERROR]', err.message);

  res.status(500).json({
    error: 'Ocurrió un error interno en el servidor.',
  });
}
