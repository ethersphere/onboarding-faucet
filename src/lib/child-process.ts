import util from 'util'
import { execFile as execFileCallback } from 'child_process'

export const execFile = util.promisify(execFileCallback)
