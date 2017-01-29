/* global module */

module.exports = {
    options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
    },
    all: {
        src: [
            'Gruntfile.js',
            'src/**/*.js'
        ]
    }
};