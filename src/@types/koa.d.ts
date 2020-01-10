import { Context } from "koa";
import WebSocket from 'ws';

declare module "koa" {
    interface Context {
        ws(): Promise<WebSocket>;
    }
}
