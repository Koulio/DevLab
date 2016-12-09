const instance = {
  exec: {
    services: [
      {
        name: 'mongodb',
        args: [
          'run',
          '--rm',
          '-d',
          '--privileged',
          '-p',
          '27017:27017',
          'mongo:3.0'
        ]
      }
    ],
    primary: [
      [
        'run',
        '--rm',
        '-v',
        '/tmp:/tmp',
        '-w',
        '/tmp',
        '--privileged',
        '-p',
        '8080:8080',
        'node:6',
        '/bin/sh',
        '-c',
        '"echo "foo""'
      ]
    ]
  },
  task: {
    services: [
      {
        name: 'mongodb',
        args: [
          'run',
          '--rm',
          '-d',
          '--privileged',
          '-p',
          '27017:27017',
          'mongo:3.0'
        ]
      }
    ],
    primary: [
      [
        'run',
        '--rm',
        '-v',
        '/tmp:/tmp',
        '-w',
        '/tmp',
        '--privileged',
        '-p',
        '8080:8080',
        'node:6',
        '/bin/sh',
        '-c',
        '"env | sort"'
      ]
    ]
  }
}

module.exports = instance
