var expect = require('expect');
var BASE_REF = require('./BASE_REF');
var Queue = require('../Queue');

describe('A Queue', function () {

  var queue;

  beforeEach(function (done) {
    queue = new Queue(BASE_REF);
    queue.removeAllJobs(done);
  });

  describe('when a job is added', function () {
    beforeEach(function (done) {
      queue.addJob({ my: 'job' }, done);
    });

    it('has one pending job', function (done) {
      queue.getNumPendingJobs(function (n) {
        expect(n).toEqual(1);
        done();
      });
    });

    it('has no started jobs', function (done) {
      queue.getNumStartedJobs(function (n) {
        expect(n).toEqual(0);
        done();
      });
    });
  });

});
