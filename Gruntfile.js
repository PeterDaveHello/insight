module.exports = function(grunt) {
    var sourceFiles = ['src/Group.js', 'src/Dimension.js', 'src/InsightCharts.Formatters.js', 'src/InsightCharts.Constants.js', 'src/ChartGroup.js', 'src/BaseChart.js', 'src/Legend.js', 'src/DataTable.js', 'src/BarChart.js', 'src/MultipleChart.js', 'src/GroupedBarChart.js', 'src/StackedBarChart.js', 'src/Timeline.js', 'src/BaseChart.js', 'src/TimelineChart.js', 'src/RowChart.js', 'src/PartitionChart.js', 'js/*.js'];


    var mountFolder = function(connect, dir) {
        return connect.static(require('path')
            .resolve(dir));
    };


    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        connect: {
            server: {
                options: {
                    port: 8999,
                    base: '.',
                    hostname: 'localhost',
                    middleware: function(connect) {
                        return [mountFolder(connect, '.')];
                    }
                }
            },

        },
        open: {
            dev: {
                path: 'http://localhost:<%= connect.server.options.port %>'
            }
        },
        jshint: {
            files: ['js/**/*.js', '!lib/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        "jsbeautifier": {
            files: ["./js/*.js", "./examples/*.js", "./**/*.html", "index.html"],
            options: {
                js: {
                    braceStyle: 'expand',
                    indentChart: ' ',
                    indentSize: 4,
                    evalCode: true,
                    breakChainedMethods: true
                },
                html: {
                    braceStyle: "collapse",
                    indentChar: " ",
                    indentScripts: "keep",
                    indentSize: 4,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    unformatted: ["a", "sub", "sup", "b", "i", "u"],
                    wrapLineLength: 0
                }
            }
        },
        watch: {
            development : {
                files: ['<%= jshint.files %>', '../insight/dist/*.js', '**/examples/*', './**/*.html', 'tests/*.spec.js'],
                tasks: ['deploy']
            },
            deployment: {
                files: ['insight.js.zip'],
                tasks: ['unzip']
            }
        },
        unzip: {
            catalog: {
                src: 'insight.js.zip',
                dest: '.'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('deploy', ['jsbeautifier', 'jshint']);
    grunt.registerTask('default', ['deploy', 'unzip', 'connect:server', 'open:dev', 'watch']);

};
