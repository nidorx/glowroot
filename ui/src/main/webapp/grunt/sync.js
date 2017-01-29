/* global module */

module.exports = {
    options: {
        verbose: true,
        failOnError: true,
        updateAndDelete: true
    },
    distVendor: {
        files: [
            {
                cwd: 'src/vendor/bootstrap/dist/fonts/',
                src: '*',
                dest: 'dist/vendor/fonts/',
                filter: 'isFile'
            },
            {
                cwd: 'src/vendor/patternfly/dist/fonts/',
                src: '*',
                dest: 'dist/vendor/fonts/',
                filter: 'isFile'
            }
        ]
    }
};