'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _process = require('./process');

var _process2 = _interopRequireDefault(_process);

var _child_process = require('child_process');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _output = require('./output');

var _output2 = _interopRequireDefault(_output);

var _parsers = require('./parsers');

var _parsers2 = _interopRequireDefault(_parsers);

var services = {
  // Placeholder for links
  links: [],
  // Services which should not be persisted
  noPersist: [],
  /**
   * Parses the service object and ensures all required props set
   * @param {Object} svc The service object from the manifest
   * @returns {Object}
   */
  getSvcObj: function getSvcObj(svc) {
    var image = Object.keys(svc)[0];
    var name = svc[image].name || image;
    var env = svc[image].env || false;
    var expose = svc[image].expose || false;
    // Persist?
    if (svc[image].hasOwnProperty('persist') && svc[image].persist === false) services.noPersist.push(name);
    // Return svc object
    return { image: image, name: name, env: env, expose: expose };
  },
  /**
   * Breaks up service entry into object containing args
   * @param {Object} svc The service/link entry
   * @returns {Array}
   */
  getArgs: function getArgs(svc) {
    var env = svc.env ? _parsers2['default'].parseEnvVars(svc.env) : [];
    var ports = svc.expose ? _parsers2['default'].parseExpose(svc.expose) : [];
    var args = [];
    args = env.length ? args.concat(env) : args;
    args = ports.length ? args.concat(ports) : args;
    args = args.concat(['--name', svc.name]);
    args = args.concat([svc.image]);
    return args;
  },
  /**
   * Checks if service is running, if not starts it
   * @param {Object} svc The service object
   * @returns {Object} promise
   */
  startSvc: function startSvc(svc) {
    return new _bluebird2['default'](function (resolve, reject) {
      // Check if service is running
      (0, _child_process.exec)('docker ps -f name=' + svc.name + ' -q', function (err, stdout) {
        if (err) {
          // Error on check
          reject(err);
        } else if (!stdout.length) {
          // Not running; start
          _output2['default'].success('Starting service {{' + svc.name + '}}');
          // Build arguments
          var args = ['run', '-d'];
          args = args.concat(services.getArgs(svc));
          // Start service
          (0, _process2['default'])('docker', args).then(resolve)['catch'](reject);
        } else {
          // Running; resolve
          resolve();
        }
      });
    });
  },
  /**
   * Checks for non-persists services and (get this...) STOPS THEM.
   * @returns {Object} promise
   */
  stopServices: function stopServices() {
    return new _bluebird2['default'](function (resolve) {
      if (services.noPersist.length === 0) {
        // No services to stop
        resolve();
      } else {
        _output2['default'].success('Stoping service' + (services.noPersist.length > 1 ? 's' : '') + ': {{' + services.noPersist.join(', ') + '}}');
        var cmd = '';
        services.noPersist.forEach(function (name, i) {
          cmd += (i > 0 ? ' && ' : '') + 'docker stop ' + name + ' && docker rm ' + name;
        });
        (0, _child_process.exec)(cmd, function (err) {
          if (err) {
            _output2['default'].warn('Could not stop all services');
          }
          // Always resolve
          resolve();
        });
      }
    });
  },
  /**
   * Iterates over services array and starts non-running service containers
   * @param {Array} services The array of services to link
   * @returns {Object} promise
   */
  run: function run(serviceArray) {
    return new _bluebird2['default'](function (resolve, reject) {
      // Incrementor
      var i = 0;
      // Service check/start
      var startSvc = function startSvc(service) {
        var svc = services.getSvcObj(service);
        // Push to links
        services.links.push(svc.name);
        // Check service
        services.startSvc(svc).then(function () {
          _output2['default'].success('Service {{' + svc.name + '}} running');
          // Check next incremet
          i++;
          if (serviceArray[i]) {
            // Recurse
            startSvc(serviceArray[i]);
          } else {
            // Done.
            resolve(services.links);
          }
        })['catch'](function (code) {
          _output2['default'].error('Failed to start {{' + svc.name + '}}');
          reject(code);
        });
      };
      // Kick off recursion over services
      startSvc(serviceArray[i]);
    });
  }
};

exports['default'] = services;
module.exports = exports['default'];