var argv = require('minimist')(process.argv.slice(2));
var modu = require('./index');

var usage = function() {
  var text = [];
  text.push('Find documentation for AWS CloudFormation.');
  text.push('usage: cfn-docs [options]');
  text.push('');
  text.push(' --find display doc for a CFN resource');
  text.push(' --help prints this message');
  text.push(' --reload download docs and update cache');
  text.push('');
  return text.join('\n');
};

if (argv.find) {
  modu.client({}, function (err, client) {
    client.find(argv.find, function (found) {
      console.log('%j', found);
    });
  });
} else if (argv.help) {
  console.log(usage());
} else if (argv.reload) {
  modu.client({}, function (err, client) {
    client.reload((err, res) => {
      console.log('%s resources were updated', res.length);
    });
  });
} else {
  console.log('Command not found. Try any of the following:');
  console.log(usage());
}
