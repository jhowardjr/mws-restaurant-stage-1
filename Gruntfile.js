module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({

        responsive_images: {
            myTask: {
                options: {
                    separator: '_',
                    sizes: [{
                            width: 280
                        }, {
                            width: 335
                        },
                        {
                            width: 385
                        },
                        {
                            width: 432
                        },
                        {
                            width: 640
                        }
                    ]
                },
                files: [{
                    expand: true,
                    src: ['**.{jpg,gif,png}'],
                    cwd: 'img/',
                    dest: 'img/scaled/'
                }]
            },
        },
    })

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-responsive-images');

    // Default task(s).
    grunt.registerTask('images', ['responsive_images']);

};