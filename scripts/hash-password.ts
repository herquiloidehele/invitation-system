import bcrypt from "bcrypt";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

async function main() {
  const hash = await bcrypt.hash(password!, 12);
  const escaped = hash.replace(/\$/g, "\\$");
  console.log("\nGenerated bcrypt hash:\n");
  console.log(hash);
  console.log("\nFor .env files (escaped for Next.js), use:\n");
  console.log(`ADMIN_PASSWORD_HASH='${escaped}'`);
  console.log("");
}

main();
