'use strict'

const uglifyJS = require('uglify-js');

const config = require('./config');
const encoderNumber = require('./encoder-number');
const analyze = require('./analyze');

module.exports = (source, minify) => {
    // Replacing constants
    console.log('Replacing constants');

    for(let constant in config.CONSTANTS){
        let value = config.CONSTANTS[constant];
        let regex = new RegExp('\\b' + constant + '\\b', 'g');

        source = source.replace(regex, JSON.stringify(value));

        console.log(source + ' -> ' + value);
    }

    if(!minify){
        return source;
    }

    // Replacing names that are too common
    console.log('Building mangling map');

    const mangledNames = analyze(source);

    let mangleMap = {};
    let mangleIndex = 0;

    mangledNames.forEach((name) => {
        let matches;
        do{
            const mangled = encodeNumber(mangleIndex);
            mangleMap[name] = mangled;

            // Check if the mangled name is already in the original source

            const regex = new RegExp('\\b' + mangled + '\\b', 'g');
            matches = source.match(regex) || [];

            mangleIndex++;

            if(matches.length > 0){
                console.log('Skipping ' + mangled);
            }
        }while(matches.length > 0);
    });

    for(let word in mangleMap){
        const mangled = mangleMap[word];

        const regex = new RegExp('\\b' + word + '\\b', 'g');
        const lengthBefore = source.length;
        source = source.replace(regex. mangled);
        const lengthAfter = source.length;

        console.log(word + ' -> ' + ' (' + (lengthAfter - lengthBefore) + ' chars)');
    }

    let uglified = uglifyJS.minify(source, {
        fromString: true,
        mangle: false,
        mangleProperties: false,
        compress: {
            dead_code: true,
            global_defs: {
                DEbug: false
            }
        }
    });

    const packed = 
}