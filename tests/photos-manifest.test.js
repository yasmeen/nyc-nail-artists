import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = resolve(root, 'photos/manifest.json');
const photoFilePattern = /^photos\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.(jpg|jpeg|webp|png)$/;
const postPattern = /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+\/?(?:\?[^\s#]*)?(?:#[^\s]*)?$/i;

test('photos manifest entries reference small local images and Instagram posts', async () => {
  let raw;
  try {
    raw = await readFile(manifestPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  const manifest = JSON.parse(raw);
  assert.ok(manifest && typeof manifest === 'object' && !Array.isArray(manifest));

  for (const [name, entry] of Object.entries(manifest)) {
    assert.ok(name.trim(), 'manifest place name');
    assert.ok(entry && typeof entry === 'object' && !Array.isArray(entry), `${name} entry`);
    assert.ok(typeof entry.handle === 'string' && entry.handle.trim(), `${name} handle`);
    assert.match(entry.checked, /^\d{4}-\d{2}-\d{2}$/, `${name} checked`);
    assert.ok(Array.isArray(entry.photos), `${name} photos`);
    assert.ok(entry.photos.length <= 4, `${name} has at most four photos`);

    for (const photo of entry.photos) {
      assert.ok(photo && typeof photo === 'object' && !Array.isArray(photo), `${name} photo`);
      assert.match(photo.file, photoFilePattern, `${name} photo file`);
      assert.ok(!['.', '..'].includes(photo.file.split('/')[1]), `${name} photo directory`);
      assert.match(photo.post, postPattern, `${name} Instagram post URL`);
      const file = resolve(root, photo.file);
      assert.ok(file.startsWith(resolve(root, 'photos') + '/'), `${name} photo stays under photos/`);
      const info = await stat(file);
      assert.ok(info.isFile(), `${name} photo exists`);
      assert.ok(info.size <= 150 * 1024, `${name} photo is at most 150 KB`);
    }
  }
});
