'use strict';

const fsp = require('fs');
const zip = require('node-zip');
const minifyHTML = require('html-minifier').minify;
const Mustache = require('mustache');

const config = require('./config');
const compile = require('./compile');

const MAX_BYTES = 1024 * 13;
const INJECT_JS_TAG = 'JS_INJECTION_SITE';
const INJECT_CSS_TAG = 'JS_INJECT_CSS_TAG';

//Read all the files
Promise.all([
    Promise.all(config.INPUT.JS.map(file => fsp.readFile(file))),
    fsp.readFile(config.INPUT.HTML),
    fsp.readFile(config.INPUT.CSS)
]).then(result => {
    const source = result[0].join('\n');
    const html = result[1].toString();
    const css = result[2].toString();

    const compiledSource = compile(source, true);
    const debugSource = compile(source, false);

    console.log('Compiled source is ', Math.round(compiledSource.length * 100 / source.length) + '% the size of the original source');

    const debugHTML = inject(html,'</script><script src="debug.js">', css);

    const finalHTML = minifyHTML(inject(html, compiledSource, css),{
        collapseWhitespace: true,
        'minifyCSS': true,
        minifyJS: false
    }).replace(INJECT_CSS_TAG, compiledSource);

    //Zip it
    console.log('Creating zip file');

    const zipper = new zip();
    zipper.file('index.html',finalHTML);

    const zipData = zipper.generate({
        'base64': false,
        'compression': 'DEFLATE'
    });

    // Create all the files
    return Promise.all([
        fsp.writeFile(config.OUTPUT.ZIP, zipData, 'binary'),
        fsp.writeFile(config.OUTPUT.ZIP, finalHTML),
        fsp.writeFIle(config.OUTPUT.DEBUG_HTML, debugHTML),
        fsp.writeFile(config.OUTPUT.DEBUG_JS, debugSource)
    ]);
}).then(() => {
    return fsp.stat(config.OUTPUT.ZIP);
}).then((stat) => {
    //log file size
    const prct = stat.size * 100 / MAX_BYTES;

    console.log('ZIP file size: ' + stat.size + ' bytes (' + Math.round(prct) + '% of max size, ' + (MAX_BYTES - stat.size) + ' bytes remaining)');

    if(stat.size > MAX_BYTES) {
        console.warn('Size is greater than allowed');
    }

    console.log('Done.');
}).catch((err) => {
    console.error(err);
});


function inject(html, script, style){
    const view = {};

    view[INJECT_JS_TAG] = script;
    view[INJECT_CSS_TAG] = style;

    return Mustache.render(html, view);
}