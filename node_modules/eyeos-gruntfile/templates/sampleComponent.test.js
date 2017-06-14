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
/**
 * Created by eyeos on 7/11/14.
 */
var chai = require('chai');
require('tdaf-node-tartare');
var expect = chai.expect;

beforeAll(function () {
	console.log(">>>>>>> before All. executed once. INIT your service here.");
});

afterAll(function () {
	console.log("<<<<<<< after All. STOP your service here.");
});

feature('Feature 1', 'As a component X user', 'I want do fancy calls', function () {
	// dataset is an array of objects that will be passed individually as variant to all scenarios.
	// This way each scenario is run once per object in the dataset.
	var dataset_one = [
		{username: 'dodon', password: '123123123', httpCode: '500'},
		{username: 'dodon', password: 'xxxxx', httpCode: '200'}
	];

	// scenarios named @smoke will be executed for the smoke tests
	// scenarios without @smoke will be considered component functional test
	scenario('Check username @smoke', dataset_one, function (variant) {
		beforeEachVariant(function () {
			// we can clear/setup databases, servers, etc to ensure each variant is executed without depending on other tests
			console.log("---> before each variant (element of data set x scenario)");
		});

		afterEachVariant(function () {
			console.log("---< after each variant");
		});

		// our test code begins here following the given, when, then paradigm.http://martinfowler.com/bliki/GivenWhenThen.html
		given.async('the username ' + variant.username + ' and password ' + variant.password, function () {
			console.log('				* Prepare your test conditions here.');
		});

		when.async('I do something', function (done) {
			console.log('				* Do things here (send requests, wait for responses, ...)');
			done();
		});

		then.async('Assert/check postconditions', function () {
			console.log('				* Do your asserts here.');
			expect(variant.username).to.equal('dodon');
		});
	});

	// no dataset passed to this scenario.
	scenario('Another test', function () {
		// this is a functional test! (no @smoke tag inside)

		given.async('some preconditions', function () {
			console.log('				* Prepare your test conditions here.');
		});

		when.async('I do another thing', function (done) {
			console.log('				* Do things here (send requests, wait for responses, ...)');
			done();
		});

		then.async('Assert/check postconditions', function () {
			console.log('				* Do your asserts here.');
			expect(undefined).to.equal(undefined);
		});
	});
})
