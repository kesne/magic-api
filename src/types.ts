import Observable from 'zen-observable';

export type JSONPrimitive = string | number | boolean | null | undefined;
export type JSONObject = { [member: string]: JSONValue };
export type JSONArray = JSONValue[];
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type APIReturn = JSONValue | Promise<JSONValue> | Observable<JSONValue>;
export type APIFunction = (...args: any[]) => APIReturn;

export type API = Record<string, APIFunction>;
