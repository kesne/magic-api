import Observable from 'zen-observable';
import backend from '../../src/backend';

export default backend({
    hello: (name: string) => `Hello, ${name}!`,
    many: () =>
        new Observable((observer) => {
            const interval = setInterval(() => {
                observer.next('hi...');
            }, 1000);

            return () => {
                clearInterval(interval);
            };
        })
}).start(8080);
