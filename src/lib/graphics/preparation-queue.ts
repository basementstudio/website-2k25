import { yieldToBrowser } from "./scheduling"

type Consumer = {
  canceled: () => boolean
  priority: () => number
  resolve: () => void
  reject: (error: unknown) => void
}
type Job = {
  key: object
  pass: string
  signature: string
  run: () => Promise<void>
  consumers: Consumer[]
}

/** One queue per renderer; cancellation belongs to callers, not shared work. */
export class PreparationQueue {
  private completed = new WeakMap<object, Map<string, string>>()
  private pending = new WeakMap<object, Map<string, Job>>()
  private jobs: Job[] = []
  private running = false
  private retired = false
  readonly stats = { compiled: 0, reused: 0, coalesced: 0 }

  constructor(private readonly onActivity?: (active: boolean) => void) {}

  private setRunning(running: boolean) {
    if (this.running === running) return
    this.running = running
    this.onActivity?.(running)
  }

  enqueue(
    key: object,
    pass: string,
    signature: string,
    run: () => Promise<void>,
    canceled: () => boolean,
    priority: () => number
  ): Promise<void> {
    if (this.retired || canceled()) return Promise.resolve()
    if (this.completed.get(key)?.get(pass) === signature) {
      this.stats.reused++
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      let requests = this.pending.get(key)
      if (!requests) this.pending.set(key, (requests = new Map()))
      const requestKey = `${pass}\0${signature}`
      let job = requests.get(requestKey)
      if (job) this.stats.coalesced++
      else {
        job = { key, pass, signature, run, consumers: [] }
        requests.set(requestKey, job)
        this.jobs.push(job)
      }
      job.consumers.push({ canceled, priority, resolve, reject })
      if (!this.running) {
        this.setRunning(true)
        // Collect overlapping requests before starting the first mesh.
        void Promise.resolve().then(() => this.drain())
      }
    })
  }

  dispose() {
    this.retired = true
    this.setRunning(false)
    this.completed = new WeakMap()
    this.pending = new WeakMap()
    for (const job of this.jobs)
      for (const consumer of job.consumers) consumer.resolve()
    this.jobs = []
  }

  private async drain() {
    let lastYield = performance.now()
    while (this.jobs.length && !this.retired) {
      // Re-evaluate intent between meshes, including navigation that began after enqueue.
      let selected = 0,
        highest = -Infinity
      for (let i = 0; i < this.jobs.length; i++) {
        for (const consumer of this.jobs[i].consumers) {
          if (consumer.canceled()) continue
          const priority = consumer.priority()
          if (priority > highest) {
            highest = priority
            selected = i
          }
        }
      }
      const [job] = this.jobs.splice(selected, 1)
      try {
        if (job.consumers.some((c) => !c.canceled())) {
          await job.run()
          if (!this.retired) {
            let passes = this.completed.get(job.key)
            if (!passes) this.completed.set(job.key, (passes = new Map()))
            passes.set(job.pass, job.signature)
            this.stats.compiled++
          }
        }
        for (const consumer of job.consumers) consumer.resolve()
      } catch (error) {
        for (const consumer of job.consumers)
          if (consumer.canceled() || this.retired) consumer.resolve()
          else consumer.reject(error)
      }
      this.pending.get(job.key)?.delete(`${job.pass}\0${job.signature}`)
      if (performance.now() - lastYield > 6) {
        await yieldToBrowser()
        lastYield = performance.now()
      }
    }
    this.setRunning(false)
  }
}
