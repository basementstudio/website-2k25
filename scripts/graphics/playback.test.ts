import assert from "node:assert/strict"
import { test } from "node:test"

import { reconcilePlayback } from "../../src/lib/video/playback"

test("a late play promise cannot restart an inactive, hidden or unmounted preview", async () => {
  let active = true,
    finish!: () => void
  const video = {
    paused: true,
    play: () =>
      new Promise<void>((resolve) => {
        finish = () => {
          video.paused = false
          resolve()
        }
      }),
    pause: () => {
      video.paused = true
    }
  }
  reconcilePlayback(video, () => active)
  active = false
  reconcilePlayback(video, () => active)
  finish()
  await Promise.resolve()
  assert.equal(video.paused, true)
})

test("late readiness consults current intent and does not restart an already playing video", async () => {
  let active = false,
    calls = 0
  const video = {
    paused: true,
    play: async () => {
      calls++
      video.paused = false
    },
    pause: () => {
      video.paused = true
    }
  }
  reconcilePlayback(video, () => active)
  assert.equal(calls, 0)
  active = true
  reconcilePlayback(video, () => active)
  await Promise.resolve()
  reconcilePlayback(video, () => active)
  assert.equal(calls, 1)
  active = false
  reconcilePlayback(video, () => active)
  assert.equal(video.paused, true)
})
