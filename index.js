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
 * @param {string} url to download docs from (optional)
 * @param {function} done callback returning html
 *
 */
CFNDocs.prototype.download = function (url, done) {
  if (!url) url = DOCS_URL;

  http.get(url, (res) => {
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
  var $ = cheerio.load(dom);
  return {
    excerpt: $('div.titlepage + p').first().text(),
    syntax: $('div.titlepage:contains("Syntax") + pre').text()
  };
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
      self.download(null, (err, html) => {
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
CFNDocs.prototype.find = function(key, done) {
  var self = this;
  var found = self._links.find((elem) => { return elem.name == key });
  if (found && (!found.excerpt || !found.syntax)) {
    self.scrapeContent(found, function (err, resource) {
      if (err) throw err;
      found = resource;
      done(found);
      write(self.cache, self._links, function (err, done) {
        if (err) throw err;
      });
    });
  } else {
    done(found);
  }
};

/**
 * Clear cache and fetch resources
 * @return {function} done callback notifying the caller that the job is done
 *
 */
CFNDocs.prototype.reload = function(done) {
  fs.unlinkSync('./' + CACHE);
  this.fetch((err, res) => done(err, res));
}

/**
 * Scrape a link and return updated reference with content
 *
 */
 CFNDocs.prototype.scrapeContent = function (reference, done) {
   var self = this;
   self.download(reference.link, function (err, html) {
     if (err) done(err);
     var content = self.extractContentFromHTML(html);
     var updated = Object.assign({}, reference, content);
     done(null, updated);
   });
 };

/**
 * Write documentation links to disk
 * @param {string} file to write to
 * @param {string|buffer} data to save to disk
 * @return {function} done callback notifying the caller that the job is done
 *
 */
function write(file, links, done) {
  if (!file) file = this.cache;
  fs.writeFile(file, JSON.stringify(links), (err) => {
    if (err) throw err;
    done(null, links);
  });
}

module.exports = new CFNDocs();
module.exports.URL = URL;
