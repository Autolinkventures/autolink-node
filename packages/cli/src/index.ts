const [, , command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "init": {
      const { runInit } = await import("./commands/init.js");
      await runInit();
      break;
    }
    case "verify": {
      const { runVerify } = await import("./commands/verify.js");
      await runVerify();
      break;
    }
    default: {
      console.log(`
Autolink CLI

  npx autolink init     Set up your Autolink SDK integration
  npx autolink verify   Verify your API key against the gateway
`);
      process.exit(command ? 1 : 0);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
