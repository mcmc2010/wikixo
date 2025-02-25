"use strict";
const hexo_fs_1 = require("hexo-fs");
const picocolors_1 = require("picocolors");
function deployConsole(args) {
    let config = this.config.deploy;
    const deployers = this.extend.deployer.list();
    if (!config) {
        let help = '';
        help += 'You should configure deployment settings in _config.yml first!\n\n';
        help += 'Available deployer plugins:\n';
        help += `  ${Object.keys(deployers).join(', ')}\n\n`;
        help += `For more help, you can check the online docs: ${(0, picocolors_1.underline)('https://hexo.io/')}`;
        console.log(help);
        return;
    }
    let promise;
    if (args.g || args.generate) {
        promise = this.call('generate', args);
    }
    else {
        promise = (0, hexo_fs_1.exists)(this.public_dir).then(exist => {
            if (!exist)
                return this.call('generate', args);
        });
    }
    return promise.then(() => {
        this.emit('deployBefore');
        if (!Array.isArray(config))
            config = [config];
        return config;
    }).each(item => {
        if (!item.type)
            return;
        const { type } = item;
        if (!deployers[type]) {
            this.log.error('Deployer not found: %s', (0, picocolors_1.magenta)(type));
            return;
        }
        this.log.info('Deploying: %s', (0, picocolors_1.magenta)(type));
        // eslint-disable-next-line no-extra-parens
        return Reflect.apply(deployers[type], this, [{ ...item, ...args }]).then(() => {
            this.log.info('Deploy done: %s', (0, picocolors_1.magenta)(type));
        });
    }).then(() => {
        this.emit('deployAfter');
    });
}
module.exports = deployConsole;
//# sourceMappingURL=deploy.js.map