module.exports = function (grunt) {
    'use strict';
    grunt.initConfig({
        concat: {
            foo: {

            },
            bar: {

            }
        },
        uglyfy: {
            bar: {

            }
        }
    });
    // A very basic default task.
    grunt.registerTask('default', 'Log some stuff.', function () {
        grunt.log.write('Logging some stuff...').ok();
    });
};