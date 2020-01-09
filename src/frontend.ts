import { Backend } from "./backend";

function makeCaller(apiName: string) {
  // We put this on an object to give the function a name.
  const temp = {
    async [apiName](...args: any[]) {
      const res = await fetch("http://localhost:8080", {
        method: 'POST',
        mode: 'cors',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: apiName,
          args
        })
      });

      const data = await res.json();

      return data.res;
    }
  }

  return temp[apiName];
}

interface MagicAPIConfig {
  url?: string;
}

export default function frontend<T extends Backend<any>>(
  _config?: MagicAPIConfig
): T extends Backend<infer U> ? U : never {
  const FUNCTION_CACHE = new Map<string, any>();

  const proxy = new Proxy(
    {},
    {
      get(_target, property: string) {
        if (!FUNCTION_CACHE.has(property)) {
          FUNCTION_CACHE.set(property, makeCaller(property));
        }

        return FUNCTION_CACHE.get(property);
      }
    }
  );

  // @ts-ignore The type signature is what matters, the implementation is via proxy.
  return proxy;
}
