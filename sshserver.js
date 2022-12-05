const { readFileSync } = require('fs');

const { utils: { parseKey }, Server } = require('ssh2');
const sshhandler = require('./sshhandler');
const { authenticate } = require('ldap-authentication');


const loadSshServer = () => {
    var username = ""
    new Server({
        port: 9022,
        hostKeys: [readFileSync('id_rsa')]
    }, (client) => {
        console.log('Client connected!');

        client.on('authentication', async (ctx) => {

            let allowed = false;
            switch (ctx.method) {
                case 'password':
                    try {

                        allowed = await authenticate({
                            ldapOpts: { url: process.env.LDAP_URL },
                            adminDn: process.env.LDAP_ADMIN_DN,
                            adminPassword: process.env.LDAP_ADMIN_PASSWORD,
                            userSearchBase: process.env.LDAP_BASE_DN,
                            usernameAttribute: process.env.LDAP_USER_USERNAME_ATTRIBUTE,
                            username: ctx.username,
                            userPassword: ctx.password,
                        })
                    } catch (error) {
                        console.log(error)
                        allowed = false
                    }
                    break;
            }


            if (allowed) {

                username = ctx.username
                ctx.accept();
            }
            else
                ctx.reject();
        }).on('ready', (ctx) => {
            console.log('Client authenticated!');

            client.on('session', (accept, reject) => {
                sshhandler.execDocker(accept, reject, username)

            });
        }).on('close', () => {
            console.log('Client disconnected');
        }).on('error', (error) => {
            console.log(error)
            console.log('Client disconnected');
        });
    }).listen(process.env.SSH_PORT, '0.0.0.0', function () {
        console.log('Listening on port ' + this.address().port);
    });
}
module.exports = {
    loadSshServer
}