var Docker, docker, header, spaces;

Docker = require('dockerode');

docker = new Docker({
    socketPath: '/var/run/docker.sock'
});

spaces = function (text, length) {
    var i;
    return ((function () {
        var j, ref, results;
        results = [];
        for (i = j = 0, ref = length - text.length; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
            results.push(' ');
        }
        return results;
    })()).join('');
};

header = function (container) {
    return "\r\n" + " ###############################################################\r\n" + " ## Docker SSH ~ Because every container should be accessible ##\r\n" + " ###############################################################\r\n" + (" ## container | " + container + (spaces(container, 45)) + "##\r\n") + " ###############################################################\r\n" + "\r\n";
};

module.exports = function (container, shell) {
    return {
        instance: function () {
            var channel, closeChannel, resizeTerm, session, stopTerm, stream, username;
            session = null;
            channel = null;
            stream = null;
            resizeTerm = null;
            username = null;
            closeChannel = function () {
                if (channel) {
                    channel.exit(0);
                }
                if (channel) {
                    return channel.end();
                }
            };
            stopTerm = function () {
                if (stream) {
                    return stream.end();
                }
            };
            return {
                sessdata: {},
                close: function () {
                    return stopTerm();
                },
                myhandler: function (accept, reject) {
                    console.log({
                        u: this.sessdata.username,
                        container: this.sessdata.container
                    }, 'myhandler - data in session');
                    container = this.sessdata.container;

                    var termInfo;
                    return () => {
                        session = accept();
                        termInfo = null;
                        session.once('exec', function (accept, reject, info) {
                            var _container;
                            console.log({
                                container: container,
                                command: info.command
                            }, 'Exec');
                            channel = accept();
                            _container = docker.getContainer(container);
                            return _container.exec({
                                Cmd: ["bash", '-c'],
                                AttachStdin: true,
                                AttachStdout: true,
                                AttachStderr: true,
                                Tty: false
                            }, function (err, exec) {
                                if (err) {
                                    console.error({
                                        container: container
                                    }, 'Exec error', err);
                                    return closeChannel();
                                }
                                return exec.start({
                                    stdin: true,
                                    Tty: true
                                }, function (err, _stream) {
                                    stream = _stream;
                                    stream.on('data', function (data) {
                                        return channel.write(data.toString());
                                    });
                                    stream.on('error', function (err) {
                                        console.error({
                                            container: container
                                        }, 'Exec error', err);
                                        return closeChannel();
                                    });
                                    stream.on('end', function () {
                                        console.log({
                                            container: container
                                        }, 'Exec ended');
                                        return closeChannel();
                                    });
                                    channel.on('data', function (data) {
                                        return stream.write(data);
                                    });
                                    channel.on('error', function (e) {
                                        return console.error({
                                            container: container
                                        }, 'Channel error', e);
                                    });
                                    return channel.on('end', function () {
                                        console.log({
                                            container: container
                                        }, 'Channel exited');
                                        return stopTerm();
                                    });
                                });
                            });
                        });
                        session.on('err', function (err) {
                            return console.error({
                                container: container
                            }, err);
                        });
                        session.on('shell', function (accept, reject) {
                            var _container;
                            console.log({
                                container: container
                            }, 'Opening shell');
                            channel = accept();
                            channel.write("" + (header(container)));
                            _container = docker.getContainer(container);
                            return _container.exec({
                                Cmd: ["bash"],
                                AttachStdin: true,
                                AttachStdout: true,
                                Tty: true
                            }, function (err, exec) {
                                if (err) {
                                    console.error({
                                        container: container
                                    }, 'Exec error', err);
                                    return closeChannel();
                                }
                                return exec.start({
                                    stdin: true,
                                    Tty: true
                                }, function (err, _stream) {
                                    var forwardData;
                                    stream = _stream;
                                    forwardData = false;
                                    setTimeout((function () {
                                        forwardData = true;
                                        return stream.write('\n');
                                    }), 500);
                                    stream.on('data', function (data) {
                                        if (forwardData) {
                                            return channel.write(data.toString());
                                        }
                                    });
                                    stream.on('error', function (err) {
                                        console.error({
                                            container: container
                                        }, 'Terminal error', err);
                                        return closeChannel();
                                    });
                                    stream.on('end', function () {
                                        console.log({
                                            container: container
                                        }, 'Terminal exited');
                                        return closeChannel();
                                    });
                                    stream.write('export TERM=linux;\n');
                                    stream.write('export PS1="\\w $ ";\n\n');
                                    channel.on('data', function (data) {
                                        return stream.write(data);
                                    });
                                    channel.on('error', function (e) {
                                        return console.error({
                                            container: container
                                        }, 'Channel error', e);
                                    });
                                    channel.on('end', function () {
                                        console.log({
                                            container: container
                                        }, 'Channel exited');
                                        return stopTerm();
                                    });
                                    resizeTerm = function (termInfo) {
                                        if (termInfo) {
                                            return exec.resize({
                                                h: termInfo.rows,
                                                w: termInfo.cols
                                            }, function () {
                                                return void 0;
                                            });
                                        }
                                    };
                                    return resizeTerm(termInfo);
                                });
                            });
                        });
                        session.on('pty', function (accept, reject, info) {
                            var x;
                            x = accept();
                            return termInfo = info;
                        });
                    }
                }
            };
        }
    };
};

// ---
// generated by coffee-script 1.9.2