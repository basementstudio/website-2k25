import assert from "node:assert/strict"
import test from "node:test"
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js"
import { RendererKTX2Loader } from "../../src/lib/graphics/ktx2-loader"

test("coalesced downloads cannot share backend-specific KTX2 transcode tasks", (t) => {
  const inputs: ArrayBuffer[] = []
  t.mock.method(KTX2Loader.prototype, "parse", (buffer: ArrayBuffer) => {
    inputs.push(buffer)
  })
  const source = new Uint8Array([1, 2, 3]).buffer
  new RendererKTX2Loader().parse(source)
  new RendererKTX2Loader().parse(source)
  assert.notEqual(inputs[0], source)
  assert.notEqual(inputs[0], inputs[1])
  assert.deepEqual(new Uint8Array(inputs[0]), new Uint8Array(source))
  assert.deepEqual(new Uint8Array(inputs[1]), new Uint8Array(source))
})

test("retired KTX2 loaders reject late parsing and dispose their worker pool once", (t) => {
  const parse = t.mock.method(KTX2Loader.prototype, "parse", () => {})
  const dispose = t.mock.method(KTX2Loader.prototype, "dispose", () => {})
  const loader = new RendererKTX2Loader()
  const signal = loader.manager.abortController.signal
  loader.dispose()
  loader.dispose()
  let error: unknown
  loader.parse(
    new ArrayBuffer(0),
    () => assert.fail("Retired loader completed"),
    (e) => {
      error = e
    }
  )
  assert.equal(signal.aborted, true)
  assert.equal(parse.mock.callCount(), 0)
  assert.equal(dispose.mock.callCount(), 1)
  assert.ok(error instanceof Error)
})
