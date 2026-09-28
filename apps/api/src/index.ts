import { buildApp } from "./app";
import { env } from "./config";

async function main() {
  const app = await buildApp();
  await app.listen({ port: env.port, host: env.host });
  console.log(`API listening on http://${env.host}:${env.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
