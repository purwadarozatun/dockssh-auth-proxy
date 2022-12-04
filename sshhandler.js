const Docker = require("dockerode");



var docker = new Docker({
    socketPath: '/var/run/docker.sock'
});
var channel;
var closeChannel = function () {
    if (channel) {
        channel.exit(0);
    }
    if (channel) {
        return channel.end();
    }
};

var stream;
var stopTerm = function() {
    if (stream) {
      return stream.end();
    }
  };

var spaces = function (text, length) {
    var i;
    return ((function () {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = length - text.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
            _results.push(' ');
        }
        return _results;
    })()).join('');
};
var header = function (container) {
    return "\r\n" + " ###############################################################\r\n" + " ## Docker SSH ~ Because every container should be accessible ##\r\n" + " ###############################################################\r\n" + (" ## container | " + container + (spaces(container, 45)) + "##\r\n") + " ###############################################################\r\n" + "\r\n";
};
const execDocker = (accept, reject, username) => {

    const sessdata = {
        username: username,
        container: username
    }
    const shell = "bash"
    console.log({
        u: sessdata.username,
        container: sessdata.container
    }, 'myhandler - data in session');
    container = sessdata.container;
    var termInfo;
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
            Cmd: [shell, '-c', info.command],
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
            Cmd: [shell],
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
    return session.on('window-change', function (accept, reject, info) {
        console.log({
            container: container
        }, 'window-change', info);
        return resizeTerm(info);
    });
};





module.exports = {
    execDocker
}