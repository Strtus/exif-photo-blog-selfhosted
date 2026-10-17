import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import bcrypt from 'bcryptjs';

// Avoid storing the password in shell history or command-line arguments.
if (!process.stdin.isTTY) {
  throw new Error('Run this command in an interactive terminal.');
}
const silent = new Writable({ write(_chunk, _encoding, done) { done(); } });
const terminal = createInterface({ input: process.stdin, output: silent, terminal: true });
process.stdout.write('Password (hidden): ');
terminal.question('', async password => {
  terminal.close();
  process.stdout.write('\n');
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    console.error('Use at least 12 characters and no more than 72 UTF-8 bytes.');
    process.exitCode = 1;
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  console.log('Docker Compose raw env file (.env):');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('\nNext.js local development (.env.local):');
  console.log(`ADMIN_PASSWORD_HASH=${hash.replaceAll('$', '\\$')}`);
});
