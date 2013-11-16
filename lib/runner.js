var Firebase = require('firebase');
var Worker = require('./worker');
module.exports = Runner;

/**
 * A runner is responsible for running many workers and restarting them when
 * they emit errors. All options passed to a runner are passed directly to
 * its workers when it creates new ones.
 */
function Runner(options) {
  this.options = options;
  this.workerId = 0;
  this.workers = [];
}

/**
 * Sets the number of workers for this runner and calls the given callback
 * when the operation is complete. When removing workers, the callback receives
 * an array of the workers being removed after they have all finished up their
 * current job. When adding workers, the callback receives an array of the
 * new workers.
 */
Runner.prototype.setNumberOfWorkers = function (numWorkers, callback) {
  numWorkers = Math.max(0, numWorkers);

  var workers = this.workers;
  var change = numWorkers - workers.length;

  if (change < 0) {
    // Remove oldest workers first.
    var removedWorkers = workers.splice(0, Math.abs(change));

    var numStoppedWorkers = 0;
    function workerStopped() {
      if (++numStoppedWorkers === removedWorkers.length && isFunction(callback)) {
        callback(removedWorkers);
      }
    }

    removedWorkers.forEach(function (worker) {
      worker.stop(workerStopped);
    });
  }

  var newWorkers = [], worker;
  for (var i = 0; i < change; ++i) {
    newWorkers.push(worker = this.createWorker(++this.workerId));
    worker.start();
  }

  workers.push.apply(workers, newWorkers);

  if (isFunction(callback)) {
    callback(newWorkers);
  }
};

/**
 * Adds the given number of workers to this runner.
 */
Runner.prototype.incrementWorkers = function (howMany, callback) {
  if (isFunction(howMany)) {
    callback = howMany;
    howMany = null;
  }

  this.setNumberOfWorkers(this.workers.length + (howMany || 1), callback);
};

/**
 * Removes the given number of workers from this runner.
 */
Runner.prototype.decrementWorkers = function (howMany, callback) {
  if (isFunction(howMany)) {
    callback = howMany;
    howMany = null;
  }

  this.setNumberOfWorkers(this.workers.length - (howMany || 1), callback);
};

/**
 * Alias for setNumberOfWorkers(0).
 */
Runner.prototype.stopAllWorkers = function (callback) {
  this.setNumberOfWorkers(0, callback);
};

/**
 * Creates a new worker that is bound to this runner.
 */
Runner.prototype.createWorker = function (id) {
  var worker = new Worker(this.options);

  worker.on('error', function (error) {
    var workers = this.workers;
    var index = workers.indexOf(worker);

    if (index !== -1) {
      // Remove this worker and add a new one. When a worker emits
      // "error" it immediately stops working so no need to stop it.
      workers.splice(index, 1);
      this.incrementWorkers(1);
    }
  }.bind(this));

  worker.on('start', function (job) {
    console.log('worker ' + id + ' started job ' + job._queueName);
  });

  worker.on('failure', function (job, error) {
    console.log('job ' + job._queueName + ' failed, error: ' + error.toString());
  });

  worker.on('idle', function () {
    console.log('worker ' + id + ' is idle');
  });

  return worker;
};

function isFunction(object) {
  return object && typeof object === 'function';
}