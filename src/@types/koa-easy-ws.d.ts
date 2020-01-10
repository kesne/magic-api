declare module 'koa-easy-ws' {
    import Koa from 'koa';

    const middleware: () => Koa.Middleware;

    export default middleware;
}
