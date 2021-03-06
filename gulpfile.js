const { series, parellel } = require('gulp');
const gulp = require('gulp');
const { exec } = require('child_process');
const conventionalChangelog = require('gulp-conventional-changelog');
const conventionalRecommendedBump = require('conventional-recommended-bump');
const bump = require('gulp-bump');
const git = require('gulp-git');

// const runSequence = require('run-sequence');
// const git = require('gulp-git-streamed')


function clean(cb) {
    cb();
}

function build(cb) {
    exec('npm run-script build', function (error, stdout, stderr) {
        if (error) {
            console.log(stderr);
            cb(true);
        } else {
            console.log(stdout);
            cb();
        }
    });
}

function copyToDest(cb) {
    gulp.src('./build/*.*').pipe(
        gulp.dest('/home/nabla/unipiazza/unipiazza-web-landing/public', {
            overwrite: true,
        }),
    );
    cb();
}

function generateChangelog(cb) {
    gulp
        .src('Changelog.md')
        .pipe(
            conventionalChangelog({
                preset: 'angular',
                append: true,
            }),
        )
        .pipe(gulp.dest('./'))
        .on('end', () => cb());
}

function bumpVersion(cb) {
    conventionalRecommendedBump(
        {
            preset: 'angular',
        },
        function (err, result) {
            console.log(result.releaseType);
            console.log(result);
            gulp
                .src('./package.json')
                .pipe(bump({ type: result.releaseType }))
                .pipe(gulp.dest('./'))
                .on('end', () => cb());
        },
    );
}


function commitChanges(cb) {
    const packageJson = require('./package.json');
    gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit(`[Prerelease] Bumped version number to ${packageJson.version}`))
        .on('end', function () {
            git.push('origin', 'master', function(err) {
                if (err) throw (err);
                cb(err)
              });
        })
}

function createTag(cb) {
    const packageJson = require('./package.json');

    git.tag(`v${packageJson.version}`, `Created Tag for version ${packageJson.version}`, function (error) {
        if (error) cb(error)
        else {
            git.push('origin', 'master', {args: '--tags'}, cb);
        }
    })
}

// prova prova prova
exports.build = build;
exports.default = series(bumpVersion, generateChangelog, commitChanges, createTag);
