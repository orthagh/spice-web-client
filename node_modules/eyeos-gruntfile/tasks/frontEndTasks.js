/*
    Copyright (c) 2016 eyeOS

    This file is part of Open365.

    Open365 is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';
module.exports = function(grunt) {

	var tasks = {

		// Inject the grunt-requirejs output file (compiled into one file)
		// into the generated index.html
		injector: {
			options: {
				ignorePath: 'build',
				addRootSlash: false,
				destFile: '<%= dirs.dist %>/index.html'
			},
			debug: {
				files: {
					'index.html': ['<%= dirs.dist %>/<%= pkg.name %>.js']
				}
			},
			release: {
				files: {
					'index.html': ['<%= dirs.dist %>/<%= pkg.name %>.min.js']
				}
			}
		},

		// Automatically inject Bower components into the app
		wiredep: {
			options: {
				cwd: './'
			},
			app: {
				src: ['<%= dirs.app %>/index.html']
			}
		},

		copy: {
			html: {
				src: '<%= dirs.app %>/index.html',
				dest: '<%= dirs.dist %>/index.html'
			},
			all: {
				expand: true,
				cwd: '',
				src: '<%= dirs.app %>/**',
				dest: '<%= dirs.dist %>/'
			},
			customScripts: {
			}
		},

		// Reads HTML for usemin blocks to enable smart builds that automatically
		// concat, minify and revision files. Creates configurations in memory so
		// additional tasks can operate on them
		useminPrepare: {
			html: '<%= dirs.app %>/index.html',
			options: {
				dest: '<%= dirs.dist %>',
				flow: {
					html: {
						steps: {
							js: ['concat']
						},
						post: {}
					}
				}
			}
		},

		// Performs rewrites based on filerev and the useminPrepare configuration
		usemin: {
			html: ['<%= dirs.dist %>/**/*.html'],
			css: ['<%= dirs.dist %>/styles/{,*/}*.css'],
			options: {
				assetsDirs: ['<%= dirs.dist %>', '<%= dirs.dist %>/images']
			}
		},

        clean: {
            build: ['<%= dirs.dist %>']
        }

	};

	//Add configs to parent gruntfile
	for(var taskname in tasks) {
		grunt.config.set(taskname, tasks[taskname]);
	}


	grunt.registerTask('build-client-package', function (target) {
		//target: release or debug
		//Clean build folder and copy development index.html
		grunt.task.run([
			'clean:build',
			'copy:html',
			'copy:customScripts'
		]);

		// Generate build singe file from scripts and inject it inside generated index.html
		grunt.task.run([
			'build-client:'+target,
			'injector:'+target
		]);

		//inject bower dependencies and concatenate them
		grunt.task.run([
			'wiredep',
			'useminPrepare',
			'concat:generated',
			//'filerev',
			'usemin'
			//'htmlmin'
		]);

	});

};
