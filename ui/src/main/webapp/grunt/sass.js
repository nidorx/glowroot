/* global module */

var sass = require('node-sass');

module.exports = {
    options: {
        implementation: sass,
        sourceMap: false
    },
    development: {
        options: {
            sourceMap: true,
            sourceMapContents: true
        },
        files: [
            {
                expand: true,
                cwd: '<%= srcDir %>',
                src: ['<%= mdlDir %>/**/*.scss'],
                dest: '<%= distDir %>',
                ext: '.css'
            }
        ]
    }
};
