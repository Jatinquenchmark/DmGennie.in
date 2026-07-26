import assert from 'node:assert/strict';
import { parseIncomingMessage } from './webhook.js';

// Real DM → parsed
assert.deepEqual(
    parseIncomingMessage({ sender: { id: '123' }, message: { text: 'hey meta' } }),
    { senderId: '123', text: 'hey meta' }
);

// Echo (message we sent) → ignored, so we never reply to ourselves in a loop
assert.equal(parseIncomingMessage({ sender: { id: '123' }, message: { text: 'hi', is_echo: true } }), null);

// Non-text events (reactions, read receipts, attachments) → ignored
assert.equal(parseIncomingMessage({ sender: { id: '123' }, reaction: { emoji: '❤️' } }), null);
assert.equal(parseIncomingMessage({ sender: { id: '123' }, message: { text: '   ' } }), null);
assert.equal(parseIncomingMessage({ message: { text: 'no sender' } }), null);
assert.equal(parseIncomingMessage(null), null);

console.log('webhook.test.mjs: all assertions passed');
