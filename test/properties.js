require('typescript-require')
var model = require('../tsmodel.ts')

function buffer() {
  var b = [];
  var res = function(newValue) {
    b.push(newValue);
  };
  res.toArray = function() {
    return b;
  }
  return res;
}

exports.basic = function(test) {
    var x = model.property(3);
    var b = buffer();
    x.onChange(b);
    test.equal(3, x());

    x(5);
    test.equal(5, x());
    test.deepEqual([5], b.toArray());
    test.done();
}

exports.dynamic = function(test) {
  //  debugger;
  try {
    var x = model.property(3);
    var y = model.property(function() {
      return x();
    });
    var b = buffer();
    y.onChange(b, true);

    test.equal(3, y()); // First evaluation here..

    x(5);
    test.equal(5, y());

    test.deepEqual([3, 5], b.toArray())
    test.done();
  }
  catch(e) {
    console.log(e.stack);
  }
}

exports.dynamic2 = function(test) {
  try {
    var x = model.property(3);
    var y = model.property(function() {
      return x() * x();
    });

    test.equal(9, y());
    var b = buffer();
    y.onChange(b);

    x(5);
    test.equal(25, y());

    //no intermediate value 15!
    test.deepEqual([25], b.toArray())
    test.done();
  }
  catch(e) {
    console.log(e.stack);
  }
}

exports.readme1 = function(test) {
  try {
    var b = buffer();
    var property = model.property;

    var vat = property(0.20);
    var order = {};
    order.price = property(10);
      // Prints: New price: 24
      //in TS, just: property(() => this.price() * (1+vat()))
    order.priceWithVat = property(function() {
      return order.price() * (1+vat());
    });

    order.priceWithVat(); // TODO: should not be needed!
    order.priceWithVat.onChange(b);

    order.price(20);
    order.price(10);
    test.deepEqual([24,12],b.toArray());
    test.done();
  } catch (e) {
    console.log(e.stack); throw e;
  }
}

exports.cycle1 = function(test) {
  try {
    var p = model.property(function() { return p() * 2 }); // thats a cycle!
    p();
    test.fail(true);
  }
  catch(e) {
    console.log(e);
    test.ok(("" + e).indexOf("Cycle detected") !== -1);
    test.done();
  }
}

exports.cycle2 = function(test) {
  var z = model.property(true);
  var a = model.property(function() { return z() ? 1 : b() * 2 });
  var b = model.property(function() { return a() * 2 });

  test.equals(1, a());

  test.equals(2, b());
  try {
    z(false); // introduces a cycle!
    test.fail(true);
  }
  catch(e) {
    console.log(e);
    test.ok(("" + e).indexOf("Cycle detected") !== -1);
    test.done();
  }
}