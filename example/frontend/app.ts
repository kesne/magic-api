import api from './api';

async function main() {
    console.log(await api.hello('world'));
    api.many().subscribe((data) => {
        console.log('Got data!', data);
    });
}

main();
