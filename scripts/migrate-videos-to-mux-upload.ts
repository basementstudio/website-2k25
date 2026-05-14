import { createClient } from '@sanity/client';
import Mux from '@mux/mux-node';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import 'dotenv/config';

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

const DRY_RUN = process.argv.includes('--dry-run');
const PROGRESS_FILE = './migration-progress.json';
const CONCURRENCY = 3;
const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

type VideoAsset = {
  _id: string;
  url: string;
  originalFilename: string;
  mimeType: string;
  size: number;
};

type ProgressEntry = {
  sanityAssetId: string;
  filename: string;
  size: number;
  muxAssetId: string;
  muxPlaybackId: string;
  status: 'preparing' | 'ready' | 'errored';
  duration?: number;
  aspectRatio?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
};

type Progress = Record<string, ProgressEntry>;

function loadProgress(): Progress {
  if (!existsSync(PROGRESS_FILE)) return {};
  return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
}

function saveProgress(progress: Progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
) {
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      await fn(items[i]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
}

async function findReferencedVideoAssets(): Promise<VideoAsset[]> {
  return sanity.fetch<VideoAsset[]>(
    `*[_type == "sanity.fileAsset"
      && mimeType match "video/*"
      && count(*[references(^._id) && _type in ["project", "post", "homepage"]]) > 0]
      | order(size desc) {
        _id, url, originalFilename, mimeType, size
      }`
  );
}

async function createMuxAsset(sanityUrl: string, filename: string) {
  const asset = await mux.video.assets.create({
    inputs: [{ url: sanityUrl }],
    playback_policies: ['public'],
    video_quality: 'basic',
    passthrough: filename,
  });
  const playbackId = asset.playback_ids?.[0]?.id;
  if (!playbackId) {
    throw new Error(`Mux asset ${asset.id} created without playback_id`);
  }
  return { assetId: asset.id, playbackId };
}

async function waitForMuxReady(muxAssetId: string) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const asset = await mux.video.assets.retrieve(muxAssetId);
    if (asset.status === 'ready') return asset;
    if (asset.status === 'errored') {
      throw new Error(`Mux errored: ${JSON.stringify(asset.errors)}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Timeout after ${POLL_TIMEOUT_MS / 1000}s for ${muxAssetId}`);
}

async function processAsset(asset: VideoAsset, progress: Progress) {
  const existing = progress[asset._id];
  if (existing?.status === 'ready') {
    console.log(`  ⏭️  ${asset.originalFilename} (already ready)`);
    return;
  }

  const sizeMb = (asset.size / 1024 / 1024).toFixed(1);
  console.log(`  ⬆️  ${asset.originalFilename} (${sizeMb} MB)`);

  try {
    let muxAssetId = existing?.muxAssetId;
    let muxPlaybackId = existing?.muxPlaybackId;

    if (!muxAssetId || !muxPlaybackId) {
      const created = await createMuxAsset(asset.url, asset.originalFilename);
      muxAssetId = created.assetId;
      muxPlaybackId = created.playbackId;
      progress[asset._id] = {
        sanityAssetId: asset._id,
        filename: asset.originalFilename,
        size: asset.size,
        muxAssetId,
        muxPlaybackId,
        status: 'preparing',
        startedAt: new Date().toISOString(),
      };
      saveProgress(progress);
    }

    const ready = await waitForMuxReady(muxAssetId);
    progress[asset._id] = {
      ...progress[asset._id]!,
      status: 'ready',
      duration: ready.duration,
      aspectRatio: ready.aspect_ratio,
      completedAt: new Date().toISOString(),
    };
    saveProgress(progress);

    const dur = ready.duration?.toFixed(1) ?? '?';
    console.log(`  ✅ ${asset.originalFilename} → ${muxPlaybackId} (${dur}s)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ ${asset.originalFilename}: ${message}`);
    progress[asset._id] = {
      sanityAssetId: asset._id,
      filename: asset.originalFilename,
      size: asset.size,
      muxAssetId: progress[asset._id]?.muxAssetId ?? '',
      muxPlaybackId: progress[asset._id]?.muxPlaybackId ?? '',
      status: 'errored',
      error: message,
      startedAt: progress[asset._id]?.startedAt ?? new Date().toISOString(),
    };
    saveProgress(progress);
  }
}

async function main() {
  console.log(`🚀 Mux upload migration ${DRY_RUN ? '(DRY RUN)' : ''}\n`);

  const progress = loadProgress();
  const assets = await findReferencedVideoAssets();
  const toMigrate = assets.filter((a) => progress[a._id]?.status !== 'ready');

  const totalSize = assets.reduce((s, a) => s + a.size, 0);
  const remainingSize = toMigrate.reduce((s, a) => s + a.size, 0);

  console.log(`📊 Plan:`);
  console.log(`   Total referenced videos: ${assets.length}`);
  console.log(`   Already migrated:        ${assets.length - toMigrate.length}`);
  console.log(`   To migrate:              ${toMigrate.length}`);
  console.log(`   Total size:              ${(totalSize / 1024 ** 3).toFixed(2)} GB`);
  console.log(`   Remaining size:          ${(remainingSize / 1024 ** 3).toFixed(2)} GB`);
  console.log(`   Mux quality:             basic (free encoding)`);
  console.log(`   Concurrency:             ${CONCURRENCY}\n`);

  if (DRY_RUN) {
    console.log('🛑 DRY RUN — nothing will be uploaded.\n');
    toMigrate.forEach((a) => {
      console.log(`  • ${a.originalFilename} (${(a.size / 1024 / 1024).toFixed(1)} MB)`);
    });
    return;
  }

  if (toMigrate.length === 0) {
    console.log('✨ Nothing to migrate.\n');
    return;
  }

  await runWithConcurrency(toMigrate, CONCURRENCY, (a) => processAsset(a, progress));

  const final = loadProgress();
  const counts = { ready: 0, preparing: 0, errored: 0 };
  for (const entry of Object.values(final)) counts[entry.status]++;

  console.log(`\n✨ Done`);
  console.log(`   Ready:     ${counts.ready}`);
  console.log(`   Errored:   ${counts.errored}`);
  console.log(`   Preparing: ${counts.preparing} (re-run to resume)`);
  console.log(`\n📄 Progress: ${PROGRESS_FILE}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
