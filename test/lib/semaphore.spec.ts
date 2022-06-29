import { Semaphore } from '../../src/lib/semaphore'
import { sleep } from '../../src/lib/utils'

async function asyncTask(semaphore: Semaphore, duration: number): Promise<number> {
  const lock = await semaphore.acquire()

  await sleep(duration)

  lock.release()

  return Date.now()
}

it('should run tasks in sequence with limit 1', async () => {
  const promisses: Promise<number>[] = []
  const taskLength = 100
  const tasks = 10
  const semaphore = new Semaphore('label', 1)

  const startTime = Date.now()

  for (let i = 0; i < tasks; i++) {
    promisses.push(asyncTask(semaphore, taskLength))
  }
  const results = await Promise.all(promisses)
  results.sort()

  const totalDuration = results[results.length - 1] - startTime

  expect(totalDuration).toBeGreaterThanOrEqual(taskLength * tasks)
})

it('should run tasks in parallel', async () => {
  const promisses: Promise<number>[] = []
  const taskLength = 100
  const tasks = 10
  const semaphore = new Semaphore('label', tasks)

  for (let i = 0; i < tasks; i++) {
    promisses.push(asyncTask(semaphore, taskLength))
  }
  const results = await Promise.all(promisses)
  results.sort()

  const diff = results[0] - results[results.length - 1]

  // These don't really require any computation so should be alright with just double the task length
  expect(diff).toBeLessThanOrEqual(taskLength * 2)
})
