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

var expect=require("chai").expect;
var _=require("underscore");
var cases=require("cases");

describe("version resolver", function()
{
    describe("called with sub-versions", function()
    {
        function VersionResolver() //npm_lazy_mirror, line 60, package.js
        {}
        VersionResolver.prototype.resolve=function(opts)
        {
            function ComplexVersion(name)
            {
                var nameArray=name.split("-");
                var minorVersion=nameArray.pop();
                var mainVersion=nameArray.pop();
                if (mainVersion=="beta")
                {
                    minorVersion = mainVersion + "-" + minorVersion;
                    mainVersion = nameArray.pop();
                }
                this.toVersion=function()
                {
                    return mainVersion + "-" + minorVersion;
                }
                this.toName=function()
                {
                    return nameArray.join("-");
                }
            }
            this.name = opts.name;
            var version_spl = _.compact(this.name.split('/'));

            if (version_spl.length === 1) { version_spl = version_spl[0].split('-'); }

            if (!opts.version && version_spl.length == 2 && version_spl[1].match(/\d+\.\d+\.\d+/)) {
                this.name = version_spl[0];
                this.version = version_spl[1];
            } else if (!opts.version && version_spl.length > 2 && (version_spl[version_spl.length - 1].match(/\d+\.\d+\.\d+/))){
                this.version = version_spl.pop();
                this.name = version_spl.join('-');
            } else if (!opts.version && version_spl.length > 2 && (version_spl[version_spl.length - 2].match(/\d+\.\d+\.\d+/) || version_spl[version_spl.length - 2].match(/beta|alpha/))){
                var complexVersion=new ComplexVersion(opts.name);
                this.version = complexVersion.toVersion();
                this.name = complexVersion.toName();
            } else {
                this.version = opts.version || null;
            }
        }

        it("should resolve version correctly", cases([
            ['noVersionName', '{"name":"noVersionName","version":null}'],
            ['readable-stream-1.0.26-2', '{"name":"readable-stream","version":"1.0.26-2"}'],
            ['grunt-contrib-compress-0.9.3', '{"name":"grunt-contrib-compress","version":"0.9.3"}'],
            ['karma-0.12.11-beta-3029418', '{"name":"karma","version":"0.12.11-beta-3029418"}']
        ],function(name, expected)
        {
            var sut=new VersionResolver();
            sut.resolve({ name: name });
            expect(JSON.stringify(sut)).to.eql(expected);
        }));
    })

    describe("version sort", function ()
    {
        describe("when version in semver", function()
        {
            it("should resolve correctly", cases([
                [["0.0.10", "0.0.11", "0.0.9"], ["0.0.9", "0.0.10", "0.0.11"]],
                [["0.10.10", "0.11.11", "0.9.9"], ["0.9.9", "0.10.10", "0.11.11"]]
            ],function(versions, expected) //reggie server.js line 176
            {
                var semver=require("semver");
                var sorted=versions.sort(function(a,b)
                {
                    return semver.gt(a, b);
                });
                expect(sorted).to.eql(expected);

            }))
        });
    });
});