import assert from 'node:assert/strict';
import test from 'node:test';

import { renderLabelContent } from '../public/3d-tour/label-content.js';

function element(tagName, ownerDocument) {
  return {
    tagName,
    ownerDocument,
    textContent: '',
    children: [],
    append(child) {
      this.children.push(child);
    },
    replaceChildren(...children) {
      this.children = children;
    },
  };
}

function fixture() {
  const ownerDocument = {
    createElement(tagName) {
      return element(tagName, ownerDocument);
    },
  };
  return element('div', ownerDocument);
}

test('renders ordinary label text and description', () => {
  const container = fixture();
  renderLabelContent(container, 'Clay vessel', 'Hand-shaped household object');

  assert.equal(container.children[0].tagName, 'strong');
  assert.equal(container.children[0].textContent, 'Clay vessel');
  assert.equal(container.children[1].tagName, 'p');
  assert.equal(container.children[1].textContent, 'Hand-shaped household object');
});

test('keeps markup-shaped label data inert', () => {
  const container = fixture();
  const attack = '<img src=x onerror="globalThis.compromised=true">';
  renderLabelContent(container, attack, `<script>alert('xss')</script>`);

  assert.equal(container.children.length, 2);
  assert.equal(container.children[0].textContent, attack);
  assert.equal(container.children[1].textContent, `<script>alert('xss')</script>`);
  assert.equal(globalThis.compromised, undefined);
});

test('omits an empty description without changing the title', () => {
  const container = fixture();
  renderLabelContent(container, 'Unlabelled object', '');

  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].textContent, 'Unlabelled object');
});
