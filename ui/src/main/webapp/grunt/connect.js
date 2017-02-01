/* global module */

var rewriteModule = require('http-rewrite-middleware');

module.exports = {
    rules: [
        {from: '^/transaction/.*$', to: '/index.html'},
        {from: '^/error/.*$', to: '/index.html'},
        {from: '^/jvm/.*$', to: '/index.html'},
        {from: '^/report/.*$', to: '/index.html'},
        {from: '^/config/.*$', to: '/index.html'},
        {from: '^/admin/.*$', to: '/index.html'},
        {from: '^/profile/.*', to: '/index.html'},
        {from: '^/login$', to: '/index.html'}
    ],
    development: {
        proxies: [
            {
                context: '/backend',
                host: 'localhost',
                port: 4000
            },
            {
                context: '/export',
                host: 'localhost',
                port: 4000
            }
        ],
        options: {
            port: '<%= connectPort %>',
            hostname: 'localhost',
            livereload: '<%= connectLivereload %>',
            open: true,
            base: [
                '<%= distDir %>', // build
                '<%= srcDir %>' // fonte
            ],
            middleware: function (connect, options, middlewares) {
                // Faz redirect de arquivos SASS para o CSS compilado
                middlewares.unshift(require('grunt-connect-proxy/lib/utils').proxyRequest);
                middlewares.unshift(rewriteModule.getMiddleware([
                    {
                        from: '^(.*).scss$',
                        to: '$1.css',
                        redirect: 'temporary' // 302 Redirect
                    }
                ]));
                middlewares.unshift(function (req, res, next) {
                    // X-UA-Compatible must be set via header (as opposed to via meta tag)
                    // see https://github.com/h5bp/html5-boilerplate/blob/master/doc/html.md#x-ua-compatible
                    res.setHeader('X-UA-Compatible', 'IE=edge');
                    next();
                });
                return middlewares;
            }
        }
    },
    dist: {// Para visualizar
        options: {
            port: '<%= connectPort %>',
            hostname: 'localhost',
            open: true,
            keepalive: true,
            base: ['<%= distDir %>'],
            middleware: function (connect, options, middlewares) {
                middlewares.push(function (req, res, next) {
                    // X-UA-Compatible must be set via header (as opposed to via meta tag)
                    // see https://github.com/h5bp/html5-boilerplate/blob/master/doc/html.md#x-ua-compatible
                    res.setHeader('X-UA-Compatible', 'IE=edge');
                    next();
                });
                return middlewares;
            }
        }
    }
};
