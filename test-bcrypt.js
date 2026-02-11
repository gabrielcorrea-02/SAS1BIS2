const bcrypt = require('bcryptjs');

(async () => {
    const password = 'admin';

    console.log('Gerando hash...');
    const hash = await bcrypt.hash(password, 10);
    console.log('HASH GERADO:', hash);

    console.log('\nComparando...');
    const match = await bcrypt.compare(password, hash);
    console.log('RESULTADO DA COMPARAÇÃO:', match);
})();
