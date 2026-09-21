import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverPath = process.env.REFHAVEN_MCP_TEST_ENTRY
  ? path.resolve(process.env.REFHAVEN_MCP_TEST_ENTRY)
  : fileURLToPath(new URL('../plugins/refhaven/scripts/mcp-server.mjs', import.meta.url));

async function connectFixture(t, handler) {
  const exportDir = await mkdtemp(path.join(tmpdir(), 'refhaven-mcp-protocol-'));
  // A local unavailable-app fixture keeps these tests away from the user's app,
  // library, network services, and Downloads folder.
  let requests = 0;
  const offline = http.createServer((req, res) => {
    requests++;
    if (handler) return handler(req, res);
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('SECRET_UPSTREAM_ERROR_NOT_FOR_MODEL');
  });
  await new Promise(resolve => offline.listen(0, '127.0.0.1', resolve));
  const client = new Client({ name: 'refhaven-protocol-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: {
      REFHAVEN_URL: `http://127.0.0.1:${offline.address().port}`,
      REFHAVEN_EXPORT_DIR: exportDir,
    },
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', chunk => { stderr += chunk.toString(); });
  t.after(async () => {
    await client.close();
    await new Promise(resolve => offline.close(resolve));
    await rm(exportDir, { recursive: true, force: true });
  });
  await client.connect(transport);
  return { client, exportDir, requests: () => requests, stderr: () => stderr };
}

function payload(result) {
  const text = result.content.find(item => item.type === 'text');
  assert.ok(text);
  const parsed = JSON.parse(text.text);
  assert.deepEqual(result.structuredContent, parsed);
  return parsed;
}

test('MCP stdio initializes and advertises tools even when Refhaven is unavailable', async t => {
  const fixture = await connectFixture(t);
  assert.equal(fixture.client.getServerVersion().name, 'refhaven');
  const { tools } = await fixture.client.listTools();
  assert.ok(tools.some(tool => tool.name === 'refhaven_status'));
  assert.ok(tools.some(tool => tool.name === 'refhaven_search_library'));
  assert.equal(new Set(tools.map(tool => tool.name)).size, tools.length);
  for (const tool of tools) assert.equal(tool.inputSchema.additionalProperties, false);
  assert.equal(fixture.requests(), 0, 'discovery should not depend on app availability');
  assert.deepEqual(await readdir(fixture.exportDir), []);
  assert.equal(fixture.stderr(), '');
});

test('MCP rejects unknown tools and malformed arguments before contacting the app', async t => {
  const fixture = await connectFixture(t);
  const cases = [
    { name: 'not_a_refhaven_tool', arguments: {} },
    { name: 'refhaven_status', arguments: { unwanted: 'SECRET_INPUT' } },
    { name: 'refhaven_search_library', arguments: {} },
    { name: 'refhaven_search_library', arguments: { query: 4 } },
    { name: 'refhaven_search_library', arguments: { query: '' } },
    { name: 'refhaven_search_library', arguments: { query: 'DNA', limit: 0 } },
    { name: 'refhaven_search_library', arguments: { query: 'DNA', limit: 1.5 } },
  ];
  for (const request of cases) {
    const result = await fixture.client.callTool(request);
    assert.equal(result.isError, true);
    assert.match(payload(result).error, /Unknown Refhaven tool|Invalid tool arguments/);
    assert.doesNotMatch(JSON.stringify(result), /SECRET_INPUT/);
  }
  assert.equal(fixture.requests(), 0);
  assert.deepEqual(await readdir(fixture.exportDir), []);
});

test('MCP app-offline calls explain recovery without leaking upstream responses', async t => {
  const fixture = await connectFixture(t);
  const status = await fixture.client.callTool({ name: 'refhaven_status', arguments: {} });
  const statusPayload = payload(status);
  assert.match(JSON.stringify(statusPayload), /Refhaven|unavailable|offline|connect/i);
  const search = await fixture.client.callTool({ name: 'refhaven_search_library', arguments: { query: 'DNA methylation' } });
  assert.equal(search.isError, true);
  assert.match(payload(search).error, /Refhaven|open|connect/i);
  assert.doesNotMatch(JSON.stringify([status, search]), /SECRET_UPSTREAM|node_modules|at async/);
  assert.ok(fixture.requests() > 0);
  assert.deepEqual(await readdir(fixture.exportDir), []);
});

test('MCP successful library search returns requested citation metadata through stdio', async t => {
  const token = 'private-test-session-token-do-not-expose';
  const routes = [];
  const fixture = await connectFixture(t, (req, res) => {
    routes.push(req.url);
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/session') return res.end(JSON.stringify({ token }));
    if (req.headers.authorization !== `Bearer ${token}`) {
      res.writeHead(401);
      return res.end('{}');
    }
    if (req.url === '/api/library') return res.end(JSON.stringify({ papers: [
      { id: 'paper-one', title: 'DNA methylation reading mechanisms', authors: 'Ada Example', year: '2025', doi: '10.1234/example', notes: 'PRIVATE_NOTE', highlights: ['PRIVATE_HIGHLIGHT'], pdfText: 'PRIVATE_PDF' },
      { id: 'paper-two', title: 'Unrelated research', authors: 'Other Author' },
    ] }));
    res.writeHead(404);
    res.end('{}');
  });
  const status = await fixture.client.callTool({ name: 'refhaven_status', arguments: {} });
  assert.notEqual(status.isError, true);
  assert.equal(payload(status).available, true);
  const search = await fixture.client.callTool({ name: 'refhaven_search_library', arguments: { query: 'DNA methylation', limit: 1 } });
  assert.notEqual(search.isError, true);
  const data = payload(search);
  assert.equal(data.total, 1);
  assert.equal(data.references.length, 1);
  assert.equal(data.references[0].title, 'DNA methylation reading mechanisms');
  assert.equal(data.references[0].citationIdentifier, 'folio:paper-one');
  assert.doesNotMatch(JSON.stringify([status, search]), /PRIVATE_NOTE|PRIVATE_HIGHLIGHT|PRIVATE_PDF|private-test-session-token/);
  assert.deepEqual(routes, ['/api/session', '/api/library']);
  assert.deepEqual(await readdir(fixture.exportDir), []);
});
