import 'dotenv/config'

/**
 * Migration orchestrator — runs all migration scripts in dependency order.
 *
 * Order:
 * 1. Company data (departments, clients) — no dependencies
 * 2. People — depends on departments
 * 3. Projects + categories — depends on clients, people
 * 4. Blog posts + categories — depends on people, rich text
 * 5. Careers (open positions) — depends on rich text
 * 6. Awards, testimonials, values — depends on projects
 * 7. Lab projects — no dependencies
 * 8. Singleton pages — depends on projects
 * 9. 3D assets — no dependencies
 */

interface MigrationStep {
  name: string
  run: () => Promise<unknown>
}

const steps: MigrationStep[] = [
  { name: 'Company (departments, clients)', run: () => import('./migrate-company').then(m => m.default()) },
  { name: 'People', run: () => import('./migrate-people').then(m => m.default()) },
  { name: 'Projects + categories', run: () => import('./migrate-projects').then(m => m.default()) },
  { name: 'Blog posts + categories', run: () => import('./migrate-posts').then(m => m.default()) },
  { name: 'Careers', run: () => import('./migrate-careers').then(m => m.default()) },
  { name: 'Awards, testimonials, values', run: () => import('./migrate-services').then(m => m.default()) },
  { name: 'Lab projects', run: () => import('./migrate-lab').then(m => m.default()) },
  { name: 'Singleton pages', run: () => import('./migrate-singletons').then(m => m.default()) },
  { name: '3D assets', run: () => import('./migrate-3d-assets').then(m => m.default()) },
]

async function runAll(failFast = false) {
  console.log('=== Starting BaseHub → Sanity Migration ===\n')
  const startTime = Date.now()
  let failed = 0

  for (const step of steps) {
    const stepStart = Date.now()
    console.log(`▶ Starting: ${step.name}`)

    try {
      await step.run()
      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1)
      console.log(`✓ Completed: ${step.name} (${elapsed}s)\n`)
    } catch (error) {
      failed++
      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1)
      console.error(`✗ Failed: ${step.name} (${elapsed}s)`)
      console.error(error)
      console.log()

      if (failFast) {
        console.error('Stopping due to --fail-fast flag.')
        process.exit(1)
      }
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`=== Migration Complete (${totalElapsed}s) ===`)

  if (failed > 0) {
    console.log(`⚠ ${failed} step(s) failed. Re-run to retry (scripts are idempotent).`)
  }

}

const failFast = process.argv.includes('--fail-fast')
runAll(failFast)
