/*
 * Copyright (c) 2015 TechnologyAdvice
 */
const parsers = {
  /**
   * Parses host environment variables
   * @param {String} str The string to parse
   * @returns {String}
   */
  parseHostEnvVars: (str) => {
    // Matches any ${VAR} format vars
    const matcher = (i, match) =>  process.env.hasOwnProperty(match) ? process.env[match] : null;
    // Replace matches on ${VAR}
    return str.toString().replace(/\$\{([^}]+)\}/g, matcher);
  },
  /**
   * Process environment variables
   * @param {Array} env Array of environment variables
   * @returns {Array} env var flags and args
   */
  parseEnvVars: (env) => {
    let envs = [];
    env.map((e) => { envs = envs.concat([ '-e', parsers.parseHostEnvVars(e) ]); });
    return envs;
  },

  /**
   * Process any ports to expose
   * @param {Array} expose Array of ports to expose
   * @returns {Array} port expose flags and args
   */
  parseExpose: (expose) => {
    let ports = [];
    expose.map((p) => { ports = ports.concat([ '-p', p ]); });
    return ports;
  },

  /**
   * Process any volumes to map
   * @param {Array} volumes Array of volumes to map
   * @returns {Array} volume map flags and args
   */
  parseVolumes: (volumes) => {
    let vols = [];
    volumes.map((v) => { vols = vols.concat([ '-v', parsers.parseHostEnvVars(v) ]); });
    return vols;
  },
  /**
   * Parses the service object and ensures all required props set
   * @param {Object} svc The service object from the manifest
   * @returns {Object}
   */
  parseSvcObj: (svc) => {
    const image = Object.keys(svc)[0];
    const name = svc[image].name || image;
    const env = svc[image].env || false;
    const expose = svc[image].expose || false;
    const persist = svc[image].persist === false ? false : true;
    // Return svc object
    return { image, name, env, expose, persist };
  },
  /**
   * Strips line breaks and splits with semicolons
   * @param {String} task The task to parse
   * @returns {String}
   */
  parseTask: (task) => {
    if (task && task.indexOf('\n') >= 0) {
      let tmp = task.split('\n');
      return tmp.join('; ');
    }
    return task;
  },
  /**
   * Parses aliases to other tasks
   * @param {Object} manifest The config manifest
   * @param {String} task The task
   * @returns {String}
   */
  parseAliases: (manifest, task) => {
    const matchAliases = (i, match) => {
      if (manifest.tasks[match]) {
        return manifest.tasks[match] + ';';
      }
      return '.' + match;
    };
    return parsers.parseTask(task.toString().replace(/\.(\S+)\b/g, matchAliases));
  }
};

export default parsers;
