const docs = require('../index');
const fs = require('fs');
const nock = require('nock');
const path = __dirname + '/fixtures';
const read = fs.readFileSync;
const test = require('tape').test;

const references = {
  template: read(path + '/template-reference.html', 'utf8'),
  security: read(path + '/aws-properties-ec2-security-group.html', 'utf8')
};

var cfn = null;

const server = nock(docs.URL)
  .persist()
  .get(/template-reference/)
  .reply(200, references.template)
  .get(/aws-properties-ec2-security-group/)
  .reply(200, references.security);

test('setup', function (t) {
  t.plan(3);
  docs.client({}, (err, client) => {
    t.error(err, 'without errors');
    t.ok(client, 'we get a cfn-docs client');
    t.true(client._links.length > 500, 'with docs loaded');
    cfn = client;
  });
});

test('cfn-docs.download', function (t) {
  t.plan(2);
  cfn.download(function (err, html) {
    t.true(html.length > 1024, 'downloads thousands of bytes');
    t.true(html.match(/CloudFormation/), 'of CloudFormation docs');
  });
});

test('cfn-docs.extractLinksFromHTML', function (t) {
  var found = cfn.extractLinksFromHTML(references.template);
  var wants = {
    link: cfn.URL + '/using-cfn-updating-stacks-changesets-samples.html',
    name: 'Example Change Sets'
  };
  t.true(found.length > 500, 'finds hundreds of references');
  t.deepEqual(found[42], wants, 'ea. link contains text and href');
  t.end();
});

test('cfn-docs.extractContentFromHTML', function (t) {
  var found = cfn.extractContentFromHTML(references.security);
  var wants = found.excerpt.match(/Creates an Amazon EC2 security group/);
  t.true(wants, 'retrieves summary from documentation');
  wants = found.syntax.match(/SecurityGroupIngress/);
  t.true(wants, 'retrieves syntax');

  t.end();
});

test('cfn-docs.fetch', function (t) {
  t.plan(2);
  cfn.fetch((err, links) => {
    t.true(links.length > 100, 'hundreds of links');
    t.equal(links[42].name, 'Example Change Sets', 'to documentation');
  });
});

test('cfn-docs.find', function (t) {
  var found = cfn.find('AWS::EC2::SecurityGroup');
  var wants = {
    link: cfn.URL + '/aws-properties-ec2-security-group.html',
    name: 'AWS::EC2::SecurityGroup'
  };
  t.deepEqual(found, wants, 'returns the AWS::EC2::SecurityGroup link');
  t.end();
});
