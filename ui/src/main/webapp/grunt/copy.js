/* global module */

module.exports = {
    options: {
        verbose: true,
        failOnError: true,
        updateAndDelete: true
    },
    distVendorFonts: {
        files: [
            {
                expand: true,
                cwd: '<%=libDir%>/patternfly/dist/fonts/',
                src: '*',
                dest: '<%= distDir %>/vendor/fonts/',
                filter: 'isFile'
            },
            {
                expand: true,
                cwd: '<%=libDir%>/bootstrap/dist/fonts/',
                src: '*',
                dest: '<%= distDir %>/vendor/fonts/',
                filter: 'isFile'
            },
        ]
    }
};
