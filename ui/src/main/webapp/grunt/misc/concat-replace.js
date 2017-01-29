/* global module */

// Diretório de fontes
var SRC_DIR = 'src';

// Diretório de destino (build)
var DEST_DIR = 'dist';

/**
 * Configuração do grunt para permitir o concat automático de depenencias
 *
 * @param {type} grunt
 * @returns {nm$_concat-replace.module.exports.concat-replaceAnonym$0}
 */
module.exports = function (grunt) {
    return {
        files: [
            {
                expand: true,
                flatten: true,
                src: ['src/index.html'],
                dest: 'dist/'
            }
        ],
        options: {
            patterns: [
                {
                    match: /<!--\s*concat:(\S*)\[\:(\S*)\]\s+(\S*)\s*-->((\n|\r|.)*?)<!--\s*\/concat\s*-->/gi,
                    replacement: function ($0, type, target, dest, value) {

                        // Configuração para a tarefa concat para js
                        var concatConfig = grunt.config.get('concat') || {};
                        concatConfig[target] = {
                            src: [],
                            dest: DEST_DIR + '/' + dest
                        };

                        var out;
                        if (type === 'js') {
                            var reg = /(?:\s+src=['"])([^'"]+)/gi;
                            var match;
                            while (true) {
                                match = reg.exec(value);
                                if (!match) {
                                    break;
                                }
                                concatConfig[target].src.push(SRC_DIR + '/' + match[1]);
                            }
                            out = '<script src="' + dest + '"></script>';
                        } else if (type === 'css') {
                            var reg = /(?:\s+href=['"])([^'"]+)/gi;
                            var match;
                            while (true) {
                                match = reg.exec(value);
                                if (!match) {
                                    break;
                                }
                                concatConfig[target].src.push(SRC_DIR + '/' + match[1]);
                            }
                            out = '<link rel="stylesheet" href="' + dest + '" />';
                        } else {
                            return '';
                        }

                        grunt.config.set('concat', concatConfig);

                        return out;
                    }
                }
            ]
        }
    };
};