export type JSONPrimitive = string | number | boolean | null;
export type JSONObject = { [member: string]: JSONValue };
export type JSONArray = JSONValue[];
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type APIFunction = (...args: JSONValue[]) => Promise<JSONValue>
export type API = Record<string, APIFunction>;
