import Koa from 'koa';
import websocket from 'koa-easy-ws';
import { API } from './types';
import Observable from 'zen-observable';

interface MagicAPIBackendConfig {
    middleware?: Koa.Middleware[];
}

export class Backend<APIDefinitions extends API> {
    declare app: Koa;
    private declare definitions: APIDefinitions;

    constructor(
        definitions: APIDefinitions,
        config: MagicAPIBackendConfig = {}
    ) {
        this.definitions = definitions;
        this.app = new Koa();
        this.app.use(websocket());
        if (config.middleware) {
            config.middleware.forEach(middleware => {
                this.app.use(middleware);
            });
        }
        this.app.use(this.middleware.bind(this));
    }

    async middleware(ctx: Koa.Context, next: Koa.Next) {
        if (!ctx.ws) {
            return next();
        }

        const ws = await ctx.ws();

        ws.on('error', e => console.log('errored', e));

        ws.on('close', () => {});

        ws.on('message', (data: string) => {
            const { id, name, args } = JSON.parse(data);

            function next(next: any) {
                if (ws.readyState !== ws.OPEN) return;
                ws.send(JSON.stringify({ id, next }));
            }

            function error(error: string) {
                if (ws.readyState !== ws.OPEN) return;
                ws.send(JSON.stringify({ id, error }));
                ws.close();
            }

            function complete() {
                if (ws.readyState !== ws.OPEN) return;
                ws.send(JSON.stringify({ id, complete: true }));
                ws.close();
            }

            if (!this.definitions[name]) {
                error(`Method "${name}" not found.`);
                return;
            }

            let res: any;
            try {
                res = this.definitions[name](...args);
            } catch (e) {
                error(e.message);
                return;
            }

            if (res && res.then) {
                (res as Promise<any>).then(next, error);
            } else if (res && res.subscribe) {
                (res as Observable<any>).subscribe({
                    next,
                    error,
                    complete
                });
            } else {
                next(res);
            }
        });
    }

    start(port: number, callback?: () => void) {
        this.app.listen(port, () => {
            console.log(`🔮 Magic API: Started on port ${port}`);
            callback?.();
        });

        return this;
    }
}

export default function backend<T extends API>(
    defs: T,
    config?: MagicAPIBackendConfig
): Backend<T> {
    return new Backend(defs, config);
}
