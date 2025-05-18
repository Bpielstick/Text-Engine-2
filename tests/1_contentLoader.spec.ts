import './_setup';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

describe('ContentLoader', () => {
  const { ContentLoader, ContentError } = require('../src/engine/contentLoader');
  const contentDir = path.join(__dirname, '../src/content');
  const scenesFile = path.join(contentDir, 'scenes.json');

  it('load valid sample JSON (no throw)', () => {
    expect(() => new ContentLoader()).to.not.throw();
  });

  it('duplicate id throws ContentError', () => {
    const original = fs.readFileSync(scenesFile, 'utf8');
    const arr = JSON.parse(original);
    arr.push({ ...arr[0] });
    fs.writeFileSync(scenesFile, JSON.stringify(arr, null, 2));
    expect(() => new ContentLoader()).to.throw(ContentError);
    fs.writeFileSync(scenesFile, original);
  });
});
