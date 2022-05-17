import { ObjectConstructor, SfaResponse } from "@sfajs/core";
import { CliStartup } from "../../src/cli-startup";
import { runin } from "@sfajs/testing";
import { parseInject } from "@sfajs/inject";

export function runTest<T extends object = any>(
  service: ObjectConstructor<T>,
  expectFn: (res: SfaResponse, service: T) => Promise<void>,
  args?: any,
  options?: any
) {
  test(`service ${service.name} ${!!args} ${!!options}`, async () => {
    let worked = false;
    await runin("test/services", async () => {
      let svc: any;
      const res = await new CliStartup(args, options)
        .use(async (ctx) => {
          svc = await parseInject(ctx, service);
        })
        .run();

      expect(svc).not.toBeUndefined();
      expectFn(res, svc);
      worked = true;
    });
    expect(worked).toBeTruthy();
  });
}
