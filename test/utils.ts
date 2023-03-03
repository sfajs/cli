import { Context, ObjectConstructor } from "@halsp/common";
import { parseInject } from "@halsp/inject";
import { CliStartup } from "../src/cli-startup";

export async function runin(path: string, fn: () => void | Promise<void>) {
  const cwd = process.cwd();
  process.chdir(path);
  try {
    await fn();
  } finally {
    process.chdir(cwd);
  }
}

export async function testService<T extends object = any>(
  service: ObjectConstructor<T>,
  expectFn: (ctx: Context, service: T) => Promise<void>,
  args: {
    mode?: string;
    args?: any;
    options?: any;
    cwd?: string;
  } = {}
) {
  let worked = false;
  await runin(args.cwd ?? process.cwd(), async () => {
    await new CliStartup(args.mode, args.args, args.options)
      .use(async (ctx) => {
        const svc = await parseInject(ctx, service);
        expect(svc).not.toBeUndefined();
        await expectFn(ctx, svc);
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
}