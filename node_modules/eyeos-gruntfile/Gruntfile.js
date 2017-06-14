var util = require('util');
var path = require('path');

function executeCommand(command, cwd) {
    cwd=cwd||".";
    var exec = require('child_process').exec;
    var cb = this.async();
    var responseBlock = function (err, stdout, stderr) {
        console.log("======STDERR========\n" + stderr + "\n=====END STDERR=====");
        console.log("======STDOUT========\n" + stdout + "\n=====END STDOUT=====");
        if (err)
        {
            console.log("COMMAND FAILED WITH ERROR:", err);
            cb(false);
        } else {
            cb();
        }
    };
    console.log("--- EXECUTING COMMAND: " + command);
    exec(command, {cwd: cwd}, responseBlock);
}

function bumpVersion(grunt, commandName) {
	var jsonFile,
        options='';
	switch (commandName) {
		case 'npm':
			jsonFile = 'package.json';
			break;
		case 'bower':
			jsonFile = 'bower.json';
            options = '--allow-root';
			break;
		default:
			grunt.fail.warn("Unknown command " + commandName);
			break;
	}

	if (grunt.file.exists(jsonFile)) {
		// as both npm and bower create a git tag with the same name, and
		// you can't use twice the same tag name, we have to remove the
		// tag rapidly. So do the bump (+ commit + tag) and remove the
		// tag.
		// If the command is not run on the root of the git repo, they don't do
		// the commit/tag thing though.
		var commitMessage = util.format('Upgraded %s version to %s', jsonFile);
		var bumpCommand = util.format('%s --verbose version -m "%s" patch %s', commandName, commitMessage, options);
		var bumpAndDeleteTagCommand = util.format('git tag -d "$(%s)"', bumpCommand);
		var bumpAndManuallyCommitCommand = util.format('%s && git commit -m "%s" -- %s', bumpCommand, commitMessage, jsonFile);

		if (grunt.file.exists('.git')) {
			// run normal command
			executeCommand.call(this, bumpAndDeleteTagCommand);
		} else {
			// run command and commit manually
			executeCommand.call(this, bumpAndManuallyCommitCommand);
		}
	} else {
		console.log(jsonFile + " does not exist: Not bumping version");
	}
}

function getDefaultProjectName () {
	var fs = require('fs');
	var json = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
	return json.name;
}

standardGruntfileConfig = function (grunt, projectName, testFolder, testFilePattern, componentTestFolder, componentTestFilePattern, requireJSFileSettings, integrationTestFolder, integrationTestFilePattern) {
    'use strict';

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	if (!projectName) {
		console.log('No projectName set. Getting default from package.json');
		projectName = getDefaultProjectName();
	}

    //eyeOS registry where to publish npm
    var npmRegistry = "http://artifacts.eyeosbcn.com/nexus/content/repositories/npm-eyeos/";

    if (!testFolder) testFolder="src/test/";
    if (!testFilePattern) testFilePattern=testFolder+"**/*.test.js";
    componentTestFolder = componentTestFolder || "src/component-test/";
    componentTestFilePattern = componentTestFilePattern || componentTestFolder + "**/*.test.js";
	requireJSFileSettings = requireJSFileSettings || 'requirejs.json';
	integrationTestFolder = integrationTestFolder || "src/integration-test/";
	integrationTestFilePattern = integrationTestFilePattern || integrationTestFolder + "**/*.integration.test.js";

	function getRequirejsConf(requireJSFileSettings) {
		var conf = {};

		if (grunt.file.exists(requireJSFileSettings)) {
			if (path.extname(requireJSFileSettings) === ".json") {
				conf = grunt.file.readJSON(requireJSFileSettings);
			} else {
				conf = require(requireJSFileSettings);
			}
		}

		return conf;
	}

	function runComponentTests(){
		executeCommand.call(this, './component-test.sh');
	}

    function normal()
    {
        return "";
    }
    function cobertura()
    {
        return "--report cobertura";
    }
    function generateCoverageReport(reportType)
    {
        return "istanbul cover --hook-run-in-context "+reportType+" --dir build/reports/ -- node_modules/mocha/bin/_mocha --timeout 10000 --ui tdd '"+testFilePattern + "'";
    }

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-shell');
    grunt.initConfig({

		// Project settings
		dirs: {
			app: 'app',
			dist: 'build'
		},

		pkg: grunt.file.readJSON('package.json'),

		// Frontend build-client settings
		requirejs: getRequirejsConf(requireJSFileSettings),

		// Test settings
		karma: {
			unit: {
				configFile: 'test/karma.conf.js',
				singleRun: true
			}
		},
        // Configure a mochaTest task
        mochaTest: {
            unitTest: {
                options: {
                    reporter: 'xunit',
                    ui: 'tdd',
                    quiet: false,
                    timeout: 10000,
                    captureFile: 'build/reports/results.xml'
                },
                src: testFilePattern
            },
            componentTest: {
                options: {
                    reporter: 'xunit',
                    ui: 'bdd',
                    quiet: false,
                    timeout: 10000,
                    captureFile: 'build/reports/componentTestResults.xml'
                },
                src: componentTestFilePattern
            },
			integrationTest: {
                options: {
                    reporter: 'xunit',
                    ui: 'tdd',
                    quiet: false,
                    timeout: 10000,
                    captureFile: 'build/reports/results-integration.xml'
                },
                src: integrationTestFilePattern
            },
        },
        shell:
        {
            make_project_dirs:
            {
                options: {
                    stderr: false
                },
                command: 'mkdir -p \
                    src/lib \
                    src/test \
                    src/component-test \
                    build/reports \
                    doc \
                    src/test/smoke-test \
                    src/test/unit-test'
            },
            make_build_endpoints:
            {
                command: [
                    'echo -e "#!/bin/bash\\nset -e\\nset -u\\nset -x\\n" > start.sh',
                        'tee < start.sh test.sh  commit-stage.sh  deploy.sh  pre-requirements.sh  package.sh > /dev/null',
                    'echo "grunt unit-test" >> test.sh',
                    'echo "npm install\ngrunt commit-stage" >> commit-stage.sh',
                    'echo "\nnpm install" >> package.sh',
                    'echo "\ncd builder" >> package.sh',
                    'echo "\n./build.sh" >> package.sh',
                    'echo "*" > build/reports/.gitignore'
                ].join(";")
            },
            generate_clean_generated_script:
            {
                command: 'echo "#!/bin/sh -e\nrm -fr build start.sh deploy.sh commit-stage.sh sonar.properties test.sh package.sh  pre-requirements.sh ! commit.properties" > cleanGenerated.sh'
            },
			generate_builder:
			{
				command: [
					'"' + __dirname + '/replaceProjectNameInDir.sh" -f ' + projectName + ' "' + __dirname + '/templates/builder" builder',
				].join(";")
			},
			rename_builder_config_files:
			{
				command: [
					'mv builder/service.service builder/eyeos-' + projectName + '.service',
					'mv builder/logrotate.conf builder/eyeos-' + projectName + '.logrotate',
					'mv builder/nginx.conf builder/eyeos-' + projectName + '.conf'
				].join(";")
			},
            give_execution_permissions:
            {
                options: {
                    stderr: false
                },
                command: 'chmod +x start.sh commit-stage.sh deploy.sh pre-requirements.sh package.sh test.sh cleanGenerated.sh'
            },
            generate_sonar_properties:
            {
                command: '"' + __dirname + '/replaceProjectNameInFile.sh" -f ' + projectName + ' "' + __dirname + '/templates/sonar.properties.template" sonar.properties'
            },
            add_standard_dependencies:
            {
                command: 'npm install --save-dev eyeos-authentication-fake'
            }

        }
    });

	//---------------------------------------- client tasks
	//this files is growing, we need to split it
	grunt.loadTasks(__dirname + "/tasks");


	grunt.registerTask('test-client', [
		'karma'
	]);

	grunt.registerTask('build-client', 'Generating build', function (target) {
		if (!target) {
			grunt.task.run(['requirejs:release', 'requirejs:debug']);
		} else {
			grunt.task.run('requirejs:'+target); //release or debug
		}
	});

	grunt.registerTask('copy-template-files-client', 'copies template files into its definitive locations.', function(target)
	{
		var templatePath = __dirname + '/templates-client/';
		var command = [
				'"' + __dirname + '/replaceProjectNameInDir.sh" -f ' + projectName + ' "' + templatePath + '/common" .',
				'"' + __dirname + '/replaceProjectNameInDir.sh" -f ' + projectName + ' "' + templatePath + '/'+target+'" .'
		].join(";");

		executeCommand.call(this, command);
	});

	grunt.registerTask('project-client', 'prepares project structure for client projects (lib or package)', function (target)
	{
		//target = 'package or lib'
		if(!target || target === 'lib'){
			grunt.task.run(['copy-template-files-client:lib']);
		} else if(target === 'package'){
			grunt.task.run(['copy-template-files-client:package']);
			grunt.task.run(['shell:rename_builder_config_files']);
		} else {
			throw new Error('project-client:'+target+' does not exist');
		}
	});

	//-----------------------------------------

    grunt.registerTask('generate-builder', ['shell:generate_builder', 'shell:give_execution_permissions', 'shell:rename_builder_config_files']);
    grunt.registerTask('environment', 'prints environment info', function(){
        executeCommand.call(this, "node --version");
    });
    grunt.registerTask('clean-test-report', 'cleans test report from console.log', function()
    {
        executeCommand.call(this, "cat build/reports/results.xml |  sed -n '/<testsuite/,$p'  > build/reports/results-cleaned.xml");
    });
	grunt.registerTask('clean-integration-test-report', 'cleans integration test report from console.log', function()
    {
        executeCommand.call(this, "cat build/reports/results-integration.xml |  sed -n '/<testsuite/,$p'  > build/reports/results-integration-cleaned.xml");
    });

    grunt.registerTask('test-coverage', 'executes all unit tests and produces html and lcov coverage report', function()
    {
        executeCommand.call(this, generateCoverageReport(normal()));
    });
    grunt.registerTask('test-coverage-cobertura', 'executes all unit tests and produces cobertura coverage report', function()
    {
        executeCommand.call(this, generateCoverageReport(cobertura()));
    });
    grunt.registerTask('copy-template-files', 'copies template files into its definitive locations.', function()
    {
		var templatePath = __dirname + '/templates/';
		grunt.file.copy(templatePath + '/sampleComponent.test.js', 'src/component-test/sample.test.js');
		grunt.file.copy(templatePath + '/component-test.sh', 'component-test.sh');
		grunt.file.copy(templatePath + '/smoke-test.sh', 'smoke-test.sh');
		grunt.file.copy(templatePath + '/smoke-test.jmx', 'src/test/smoke-test/smoke-test.jmx');
		grunt.file.copy(templatePath + '/dummy.test.js', 'src/test/unit-test/dummy.test.js');
        grunt.file.copy(templatePath + '/installCamelCentral.sh', 'installCamelCentral.sh');
        grunt.file.copy(templatePath + '/gitignore', '.gitignore');
		executeCommand.call(this, "chmod +x component-test.sh smoke-test.sh installCamelCentral.sh");
    });
    grunt.registerTask('npm-install', 'Executes npm install', function()
    {
        executeCommand.call(this, "npm --verbose install");
    });
    grunt.registerTask('npm-publish', 'Executes npm publish in the eyeos registry', function()
    {
        executeCommand.call(this, "npm --verbose publish --registry=" + npmRegistry);
    });


	grunt.registerTask('npm-bump-version', 'Bump the package.json version', function() {
		bumpVersion.call(this, grunt, 'npm');
	});
	grunt.registerTask('bower-bump-version', 'Bump the bower.json version', function() {
		bumpVersion.call(this, grunt, 'bower');
	});
	grunt.registerTask('jenkins-commit-properties', '', function() {
		executeCommand.call(this, 'echo "commit_id=$(git rev-parse HEAD)" > commit.properties');
	});
    grunt.registerTask('bump-version', 'Checks if it is the last commit so it can continue', function()
    {
		var cb = this.async();
		var exec = require("child_process").exec;
		// checkout to master if we already are in origin/master or ahead of it
		var command = '[ "$(git show -s --format="%aN" origin/master | tr "[A-Z]" "[a-z]")" != "jenkins" ] && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/master)" -o "$(git branch -r --contains HEAD)" = "" ] && git checkout master';

		exec(command, function(error, stdout, stderr) {
			if (!error || error.code === 0) {
				grunt.task.run(['npm-bump-version', 'bower-bump-version', 'git-push']);
			} else {
				console.log("Not bumping version because we aren't in last commit or last pushed commit was from jenkins");
			}
			cb();
		});
    });
    grunt.registerTask('deprecation-notice', 'YELLS ABOUT A DEPRECATED COMMAND', function () {
        var done = this.async();
        console.error("THIS GRUNT TASK IS DEPRECATED");
        console.error("THIS GRUNT TASK IS DEPRECATED");
        console.error("THIS GRUNT TASK IS DEPRECATED");
        console.error("THIS GRUNT TASK IS DEPRECATED");
        setTimeout(done, 1000);
    });
    grunt.registerTask('publish-npm', 'Installs npm and publishes it', ["npm-install", "npm-publish"]);
	grunt.registerTask('all-test', 'executes all tests: unit and component', ["mochaTest", "clean-test-report"]);
	grunt.registerTask('test', 'executes all unit tests', ["mochaTest:unitTest", "clean-test-report"]);
	grunt.registerTask('unit-test', 'executes all unit tests', ["mochaTest:unitTest", "clean-test-report"]);
	grunt.registerTask('integration-test', 'executes all integration tests', ["mochaTest:integrationTest", "clean-integration-test-report"]);
    grunt.registerTask('component-test', 'Executes component tests', runComponentTests);
    grunt.registerTask('default', ['deprecation-notice', 'commit-stage']);
    grunt.registerTask('commit-stage', ['environment', 'unit-test', 'test-coverage', 'test-coverage-cobertura', 'bump-version']);
    grunt.registerTask('project', 'prepares project structure', ['shell', 'copy-template-files', 'log-properties']);
    grunt.registerTask('commit-stage-frontend-library', ['test-client', 'bump-version']);

    grunt.registerTask('git-push','update changes',function()
    {
        executeCommand.call(this, 'git push origin $(git symbolic-ref HEAD)');
    });

    grunt.registerTask('log-properties','creates log4js properties file',function()
    {
        var command = '"' + __dirname + '/replaceProjectNameInFile.sh" -f ' + projectName + ' "' + __dirname + '/templates/log4js.config.json.template" src/log4js.config.json';
        executeCommand.call(this, command);
    });
}
module.exports = standardGruntfileConfig;
module.exports.executeCommand = executeCommand;
