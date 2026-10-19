import { loadConfig } from './config.ts';
import { startServer } from './http.ts';

const cfg = loadConfig(process.env);
const srv = await startServer(cfg);
console.log(`nasłuch 127.0.0.1:${srv.port}`);

const stop = () => { srv.close().then(() => process.exit(0)); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
