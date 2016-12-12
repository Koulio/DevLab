const path = require('path')
const services = require('src/services')
const proc = require('src/proc')
const config = require('src/config')
const fixture = require('test/fixtures/service')

describe('services', () => {
  describe('get', () => {
    before(() => {
      config.defaultPath = path.resolve(__dirname, '../fixtures/devlab.yml')
    })
    it('returns false if no services are specified', () => {
      expect(services.get({})).to.be.false()
    })
    it('returns an array of services and their command arrays', () => {
      const svc = services.get(config.load())
      expect(svc[0].name).to.equal('mongodb')
      expect(svc[0].args).to.deep.equal([ 'run', '--rm', '-d', '--privileged', '-p', '27017:27017', '--name', 'dl_mongodb', 'mongo:3.0' ])
    })
  })
  describe('run', () => {
    let procRunStub
    afterEach(() => {
      procRunStub.restore()
      services.running = []
    })
    it('resloves promise(s) for all service starts', () => {
      procRunStub = sinon.stub(proc, 'run', () => Promise.resolve())
      return services.run(fixture).then(() => {
        expect(services.running).to.deep.equal([ 'dl_mongodb' ])
      })
    })
    it('rejects when a service fails to start', () => {
      procRunStub = sinon.stub(proc, 'run', () => Promise.reject())
      return services.run([ { name: 'fart', args: [ 'foo' ] } ])
        .then(() => {
          throw new Error('Should have failed')
        })
        .catch(() => {
          expect(services.running.length).to.equal(0)
        })
    })
  })
  describe('stop', () => {
    let procRunStub
    afterEach(() => {
      if (procRunStub) procRunStub.restore()
      services.running = []
    })
    it('resolves if no services are running', () => {
      services.running = []
      return expect(services.stop()).to.be.fulfilled()
    })
    it('resolves when services all stop', () => {
      procRunStub = sinon.stub(proc, 'run', () => Promise.resolve())
      services.running = [ 'foo', 'bar' ]
      return services.stop().then(() => {
        expect(services.running.length).to.equal(0)
      })
    })
    it('rejects when a service fails to stop', () => {
      procRunStub = sinon.stub(proc, 'run', (args) => Promise.reject())
      services.running = [ 'foo', 'bar' ]
      return services.stop()
        .then(() => {
          throw new Error('Should have failed')
        })
        .catch(() => {
          expect(services.running).to.deep.equal([ 'foo', 'bar' ])
        })
    })
  })
})
