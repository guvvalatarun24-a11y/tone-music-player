import test from 'node:test';
import assert from 'node:assert/strict';

import { extractMetadataFromFile } from './metadata.ts';

function createId3WithJpegCover(): Uint8Array {
  const imageBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);

  const title = 'Test Song';
  const artist = 'Test Artist';
  const album = 'Test Album';

  const textFrame = (frameId: string, text: string, encoding: number): Uint8Array => {
    const bytes = new TextEncoder().encode(text);
    const tagBytes = new Uint8Array(1 + bytes.length + 1);
    tagBytes[0] = encoding;
    tagBytes.set(bytes, 1);
    return tagBytes;
  };

  const titleFrame = textFrame('TIT2', title, 3);
  const artistFrame = textFrame('TPE1', artist, 3);
  const albumFrame = textFrame('TALB', album, 3);

  const mime = 'image/jpeg';
  const mimeBytes = new TextEncoder().encode(mime);
  const picDescription = new Uint8Array([0x00]);
  const pictureType = new Uint8Array([0x03]);
  const apicPayload = new Uint8Array(1 + mimeBytes.length + 1 + 1 + picDescription.length + imageBytes.length);
  apicPayload[0] = 0x03; // encoding
  apicPayload.set(mimeBytes, 1);
  apicPayload[1 + mimeBytes.length] = 0x00;
  apicPayload[1 + mimeBytes.length + 1] = 0x03;
  apicPayload[1 + mimeBytes.length + 1 + 1] = 0x00;
  apicPayload.set(imageBytes, 1 + mimeBytes.length + 1 + 1 + picDescription.length);

  const makeFrame = (frameId: string, payload: Uint8Array): Uint8Array => {
    const frameSize = payload.length;
    const header = new Uint8Array(10);
    header.set(new TextEncoder().encode(frameId), 0);
    header[4] = 0;
    header[5] = 0;
    header[6] = 0;
    header[7] = frameSize & 0xff;
    header[8] = (frameSize >> 8) & 0xff;
    header[9] = (frameSize >> 16) & 0xff;
    const out = new Uint8Array(10 + frameSize);
    out.set(header, 0);
    out.set(payload, 10);
    return out;
  };

  const titleFrameData = makeFrame('TIT2', titleFrame);
  const artistFrameData = makeFrame('TPE1', artistFrame);
  const albumFrameData = makeFrame('TALB', albumFrame);
  const apicFrameData = makeFrame('APIC', apicPayload);

  const body = new Uint8Array(
    titleFrameData.length + artistFrameData.length + albumFrameData.length + apicFrameData.length
  );
  let offset = 0;
  for (const frame of [titleFrameData, artistFrameData, albumFrameData, apicFrameData]) {
    body.set(frame, offset);
    offset += frame.length;
  }

  const tagHeader = new Uint8Array(10);
  tagHeader.set(new TextEncoder().encode('ID3'), 0);
  tagHeader[3] = 0x03;
  tagHeader[4] = 0x00;
  tagHeader[5] = 0x00;
  tagHeader[6] = 0x00;
  tagHeader[7] = 0x00;
  tagHeader[8] = 0x00;
  tagHeader[9] = body.length & 0xff;

  const bytes = new Uint8Array(tagHeader.length + body.length);
  bytes.set(tagHeader, 0);
  bytes.set(body, tagHeader.length);
  return bytes;
}

test('extractMetadataFromFile preserves embedded artwork with the correct MIME type for storage and media session use', async () => {
  const id3 = createId3WithJpegCover();
  const file = new File([id3], 'cover.mp3', { type: 'audio/mpeg' });

  const meta = await extractMetadataFromFile(file, 123);

  assert.equal(meta.title, 'Test Song');
  assert.equal(meta.artist, 'Test Artist');
  assert.equal(meta.album, 'Test Album');
  assert.equal(meta.coverArtMimeType, 'image/jpeg');
  assert.ok(meta.coverArtBlob instanceof Blob);
  assert.match(meta.coverArt, /^data:image\/jpeg;base64,/);
  assert.equal(meta.coverArtBlob.type, 'image/jpeg');
});
