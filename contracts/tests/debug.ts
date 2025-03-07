const tests = import.meta.glob("./**/*.ts");
const ignoreFiles = ["./mocks.ts", "./debug.ts", "./vite-env.d.ts"];

await Promise.all(
  Object.entries(tests).map(async ([path, module]) => {
    if (ignoreFiles.includes(path)) {
      return;
    }
    await module();
  })
);

export {};
