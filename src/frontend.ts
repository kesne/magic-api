import Observable from 'zen-observable';
import { Backend } from './backend';
import { API } from './types';

interface MagicAPIFrontendConfig {
    host: string;
    port: number;
}

const DEFAULT_OPTIONS = {
    host: 'localhost',
    port: 8080
};

type AsyncWrap<T extends (...args: any) => any> = ReturnType<T> extends Promise<
    any
>
    ? T
    : ReturnType<T> extends Observable<any>
    ? T
    : (...args: Parameters<T>) => Promise<ReturnType<T>>;

type Frontend<Methods extends API> = {
    [P in keyof Methods]: AsyncWrap<Methods[P]>;
};

let currentRequestID = 0;
const getID = () => `request-${++currentRequestID}`;

type Request = {
    next: (value: any) => void;
    error: (value: any) => void;
    complete?: () => void;
};

export default function frontend<T extends Backend<any>>(
    userConfig: Partial<MagicAPIFrontendConfig> = {}
): T extends Backend<infer U> ? Frontend<U> : never {
    const functionCache = new Map<string, any>();
    const config = { ...DEFAULT_OPTIONS, ...userConfig };
    const requests = new Map<string, Request>();

    let websocket: WebSocket;
    const wsPromise = new Promise<WebSocket>(resolve => {
        const ws = new WebSocket(`ws://${config.host}:${config.port}`, [
            'magic-api'
        ]);

        ws.addEventListener('open', () => {
            websocket = ws;
            resolve(ws);
        });

        ws.addEventListener('message', evt => {
            const { id, next, error, complete } = JSON.parse(evt.data);
            const request = requests.get(id);
            if (!request) {
                return;
            }

            if (next) {
                request.next(next);
                // If promise, next is the final state::
                if (!request.complete) {
                    requests.delete(id);
                }
            }

            if (error) {
                request.error(new Error(error));
                // Errors are a complete state:
                if (request.complete) {
                    request.complete();
                }
                requests.delete(id);
            }

            if (complete) {
                if (request.complete) {
                    request.complete();
                }
                requests.delete(id);
            }
        });
    });

    // Serialize and send JSON to the websocket, in the most optimal way possible.
    function send(obj: any) {
        const payload = JSON.stringify(obj);

        if (websocket) {
            websocket.send(payload);
        } else {
            wsPromise.then(ws => ws.send(payload));
        }
    }

    function makeCaller(apiName: string) {
        return function apiImpl(...args: any[]) {
            return {
                then(
                    onFulfilled?: (value: any) => any,
                    onRejected?: (reason: any) => any
                ) {
                    return new Promise((resolve, reject) => {
                        const id = getID();

                        requests.set(id, {
                            next: resolve,
                            error: reject
                        });

                        send({
                            id,
                            name: apiName,
                            args
                        });
                    }).then(onFulfilled, onRejected);
                },
                subscribe(observer: ZenObservable.Observer<any>) {
                    return new Observable((observer) => {
                        const id = getID();

                        requests.set(id, {
                            next: observer.next.bind(observer),
                            error: observer.error.bind(observer),
                            complete: observer.complete.bind(observer)
                        });

                        send({
                            id,
                            name: apiName,
                            args
                        });
                    }).subscribe(observer);
                }
            };
        };
    }

    const proxy = new Proxy(
        {},
        {
            get(_target, apiName: string) {
                if (!functionCache.has(apiName)) {
                    functionCache.set(apiName, makeCaller(apiName));
                }

                return functionCache.get(apiName);
            }
        }
    );

    // @ts-ignore The type signature is what matters, the implementation is via proxy.
    return proxy;
}
