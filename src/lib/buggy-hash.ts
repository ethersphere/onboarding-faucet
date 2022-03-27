import path from 'path'
import { execFile } from './child-process'

export const getBuggyHash = async (blockNumber: number): Promise<string> => {
  const { stdout: hash } = await execFile('./buggy-hash', [blockNumber.toString()], {
    cwd: path.resolve(__dirname, '../../go'),
  })

  return '0x' + hash
}
