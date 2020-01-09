import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import { API } from "./types";

export class Backend<APIDefinitions extends API> {
  declare app: Koa;
  private declare definitions: APIDefinitions;

  constructor(definitions: APIDefinitions) {
    this.definitions = definitions;
    this.app = new Koa();
    this.app.use(cors());
    this.app.use(bodyParser());
    this.app.use(async ctx => {
      const { name, args } = ctx.request.body;

      if (!this.definitions[name]) {
        ctx.status = 404;
        return;
      }

      ctx.body = {
        res: await this.definitions[name](...args)
      };
    });
  }

  start(port: number) {
    this.app.listen(port, () => {
      console.log(`🔮 Magic API: Started on port ${port}`);
    });

    return this;
  }
}

export default function backend<T extends API>(defs: T): Backend<T> {
  return new Backend(defs);
}
