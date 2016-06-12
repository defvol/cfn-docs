const cheerio = require('cheerio');
const fs = require('fs');
const http = require('http');
const URL = 'http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide';
const DOCS_URL = URL + '/' + '/template-reference.html';
const CACHE = 'cache.json';

function CFNDocs() { return this }

/**
 * Load docs and return a client interface
 * @param {object} configuration, e.g. cache policy
 * @param {function} done callback returning a CFNDocs client
 *
 */
CFNDocs.prototype.client = function (config, done) {
  var self = this;
  self.cache = config.cache || CACHE;
  self.fetch((err, links) => {
    if (err) throw err;
    self._links = links;
    done(null, self);
  });
};

/**
 * Download docs from a site
 * @param {function} done callback returning html
 *
 */
CFNDocs.prototype.download = function (done) {
  http.get(DOCS_URL, (res) => {
    var html = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { html += chunk });
    res.on('end', () => {
      done(null, html);
    });
    res.on('error', (e) => { done(e) });
  });
};

/**
 * Parse AWS Template Reference and build a JSON of links to the docs
 * @param {object} dom tree of the website
 * @returns array of JSON per resource link found in the docs main page
 *
 */
CFNDocs.prototype.extractLinksFromHTML = function(dom) {
  var $ = cheerio.load(dom);
  var matches = [];
  $('a.awstoc').each((index, elem) => {
    matches.push({
      link: URL + '/' + $(elem).attr('href'),
      name: $(elem).text()
    });
  });
  return matches;
};

/**
 * Parse the HTML content of a documentation page
 * @param {object} dom tree of the website
 * @returns JSON { excerpt, syntax }
 *
 */
CFNDocs.prototype.extractContentFromHTML = function(dom) {
  // TODO: parse documentation page
  // e.g. http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ec2-security-group.html
  // excerpt: $($('div.titlepage + p')[0]).text()
  // syntax: $('div.titlepage:contains("Syntax") + pre').text();
}

/**
 * Load docs from cache or web
 * @param {function} done callback returning links to the docs
 *
 */
CFNDocs.prototype.fetch = function (done) {
  var self = this;

  fs.readFile(self.cache, 'utf8', (err, data) => {
    if (err) {
      self.download((err, html) => {
        if (err) throw err;
        var links = self.extractLinksFromHTML(html);
        write(self.cache, links, (err, links) => {
          done(err, links);
        });
      });
    } else {
      done(err, JSON.parse(data));
    }
  });
};

/**
 * Return the doc object for a key
 * @param {string} key to look up in the docs, e.g. AWS::EC2::SecurityGroup
 * @return {object} JSON { name, excerpt, link, syntax }
 *
 */
CFNDocs.prototype.find = function(key) {
  return this._links.find((elem) => { return elem.name == key });
};

/**
 * Write documentation links to disk
 * @param {string} file to write to
 * @param {string|buffer} data to save to disk
 * @return {function} done callback notifying the caller that the job is done
 *
 */
function write(file, links, done) {
  fs.writeFile(file, JSON.stringify(links), (err) => {
    if (err) throw err;
    done(null, links);
  });
}

module.exports = new CFNDocs();
module.exports.URL = URL;
