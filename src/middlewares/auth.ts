// Lib
import { EnvironmentVariables, getAuthConfig } from '../lib/config'

// Types
import { NextFunction, Request, Response } from 'express'

const { token } = getAuthConfig(process.env as EnvironmentVariables)

export const auth = (req: Request, res: Response, next: NextFunction) => {
  if (!token) {
    res.status(503).json({ error: 'auth token not configured' })

    return
  }

  if (req.headers.authorization === token) {
    next()
  } else {
    res.sendStatus(403)
  }
}
