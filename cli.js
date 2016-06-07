var argv = require('minimist')(process.argv.slice(2));
var modu = require('./index');

var usage = function() {
  var text = [];
  text.push('Find documentation for CloudFormation templates');
  text.push('usage: cfn-docs [options]');
  text.push('');
  text.push(' --find display doc for a CFN resource');
  text.push(' --help prints this message');
  text.push('');
  return text.join('\n');
};

if (argv.find) {
  modu.client({}, function (err, client) {
    var found = client.find(argv.find);
    console.log(found);
  });
} else if (argv.help) {
  console.log(usage());
} else {
  console.log('Command not found. Try any of the following:');
  console.log(usage());
}
