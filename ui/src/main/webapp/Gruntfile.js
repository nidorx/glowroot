/* global module, require */
'use strict';

var path = require('path');

// Diretório de fontes
var SRC_DIR = 'src';

// Diretório de destino (build)
var DEST_DIR = 'dist';

// Diretório de módulos da aplicação
var MOD_DIR = 'modules';

// Permite minificar ou nao o bundle (util para depuraçao da versão final)
// MARCAR COMO TRUE PARA PRODUÇÃO
var UGLIFY_BUNDLE = true;

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-config')(grunt, {
        init: true
    });

    // Configs for connect
    grunt.config.set('connectPort', 9005);
    grunt.config.set('connectLivereload', 35731);


    grunt.config.set('replace', (function (config) {
        config.concat = require('./grunt/misc/concat-replace')(grunt);
        return config;
    })(grunt.config.get('replace') || {}));

    /**
     * Tarefa para o empacotamento dos módulos da aplicação
     */
    grunt.registerTask("packModules", "Gera um pack de cada modulo, semelhate ao webpack", function () {

        grunt.file.expand(srcMod('*')).forEach(function (dir) {
            var tasksToExecute = [];
            var module = path.basename(dir);
            var moduleName = module
                    .replace(/[^a-z]/gi, ' ')
                    .replace(/(\s+(.))/g, function ($0, $1, $2) {
                        return $2.toUpperCase();
                    });

            // clean - De arquivos que podem atrapalhar o build
            configure('clean', function (config) {
                config.push(destMod(module, '*.js'));
                config.push(destMod(module, '**/*.css'));
                config.push(destMod(module, '**/*.map'));
            }, 'start');

            // sass - Geração de css
            configure('sass', function (config) {
                config.files = [
                    {
                        expand: true,
                        cwd: srcMod(module),
                        src: ['styles/*.scss'],
                        dest: destMod(module),
                        ext: '.css'
                    }
                ];
            });

            // html2js - Geraçaõ de templates angular.js
            configure('html2js', function (config) {
                config.options.module = moduleName;
                config.src = srcMod(module, '**/*.html');
                config.dest = destMod(module, 'templates.js');
            });

            // sync == copy - Imagens e outros resources que sofreram alteração
            configure('sync', function (config) {
                config.files = [
                    {// Todos os outros resources
                        expand: true,
                        cwd: srcMod(module),
                        src: ['**/*.{css,png,jpg,jpeg,ttf,ico,json,svg,woff,woff2,eot}'],
                        dest: destMod(module),
                        filter: 'isFile'
                    }
                ];
            });

            // cssUrlEmbed - Referencias para imagens no css usando base64
            configure('cssUrlEmbed', function (config) {
                config.expand = true;
                config.cwd = destMod(module);
                config.src = ['**/*.css'];
                config.dest = destMod(module);
            });

            // cssmin - Minificação do css gerado
            configure('cssmin', function (config) {
                config.files = {};
                config.files[destMod(module, 'styles.min.css')] = destMod(module, '**/*.css');
            });

            // css2js - Transforma o css minificado em js para empacotamento
            configure('css2js', function (config) {
                config.src = destMod(module, 'styles.min.css');
                config.dest = destMod(module, 'styles.js');
            });

            // concat - Concatena todos os resources .js do modulo num único arquivo
            configure('concat', function (config) {
                config.options.process = function (src, filepath) {
                    return ';(function(window){\n' + src + '\n})(window);';
                };
                config.src = [
                    srcMod(module, module + '.js'),
                    srcMod(module, '**/*.js')
                ];
                config.dest = destMod(module, 'module.js');
            }, 'JsFromSource');

            // uglify  ou concat - Do pacote final
            configure(UGLIFY_BUNDLE ? 'uglify' : 'concat', function (config) {
                config.options.banner = 'window.__BUNDLED__MODULES__ = true;';
                config.src = [
                    destMod(module, 'styles.js'),
                    destMod(module, 'module.js'),
                    destMod(module, 'templates.js')
                ];
                config.dest = destMod(module, moduleName + '.bundle.min.js');
            }, 'bundle');

            // clean - De arquivos usado no processo de build
            configure('clean', function (config) {
                config.push(
                        destMod(module, '*.js'),
                        '!' + destMod(module, '*.min.js'),
                        destMod(module, '**/*.css'),
                        destMod(module, '**/*.map')
                        );
            }, 'end');

            /**
             * Gerador de configuração por modulo
             *
             * @param {type} task
             * @param {type} callback
             * @param {type} suffix
             * @returns {undefined}
             */
            function configure(task, callback, suffix) {
                grunt.config.set(task, (function (config) {
                    var subTask = moduleName + (suffix ? ('__' + suffix) : '');
                    tasksToExecute.push(task + ':' + subTask);

                    if (task === 'clean') {
                        // A configuração do clean é diferente, um array de parametros
                        config[subTask] = [];
                    } else {
                        config[subTask] = {options: {}};
                    }
                    callback(config[subTask]);
                    return config;
                })(grunt.config.get(task) || {}));
            }

            // Finalmente, executa as tarefas do módulo
            tasksToExecute.forEach(function (task) {
                grunt.task.run(task);
            });
        });
    });
};

/**
 * Utilitario para gerar o caminhao do diretório de source
 *
 * @param {type} module
 * @param {type} filter
 * @returns {String}
 */
function srcMod(module, filter) {
    return SRC_DIR + '/' + MOD_DIR + '/' + module + (filter ? '/' + filter : '');
}

/**
 * Utilitario para gerar o caminho do diretório de destino
 *
 * @param {type} module
 * @param {type} filter
 * @returns {String}
 */
function destMod(module, filter) {
    return DEST_DIR + '/' + MOD_DIR + '/' + module + (filter ? '/' + filter : '');
}