const fs = require('fs');
const colors = require('colors');
const CruParser = require('./CruParser.js');
const packageJson = require('./package.json');

const vg = require('vega');
const vegalite = require('vega-lite');

const cli = require("@caporal/core").default;

cli
	.version('cru-parser-cli v' + packageJson.version)


	// check
	.command('check', 'Check if <file> or <folder> is a valid Cru file or folder of Cru files')
	.argument('<path>', 'The file or folder to check with Cru parser')
	.option('-s, --showSymbols', 'log the analyzed symbol at each step', { validator: cli.BOOLEAN, default: false })
	.option('-t, --showTokenize', 'log the tokenization results', { validator: cli.BOOLEAN, default: false })
	.action(({ args, options, logger }) => {
		const path = args.path;
		
		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			if (stats.isDirectory()) {
				// Process folder: find all .cru files recursively
				const getAllCruFiles = (dir) => {
					let files = [];
					const items = fs.readdirSync(dir);
					
					items.forEach(item => {
						const itemPath = require('path').join(dir, item);
						const itemStats = fs.statSync(itemPath);
						
						if (itemStats.isDirectory()) {
							files = files.concat(getAllCruFiles(itemPath));
						} else if (item.endsWith('.cru')) {
							files.push(itemPath);
						}
					});
					
					return files;
				};

				const cruFiles = getAllCruFiles(path);
				
				if (cruFiles.length === 0) {
					logger.warn('No .cru files found in the folder');
					return;
				}

				let validCount = 0;
				let errorCount = 0;

				cruFiles.forEach(file => {
					fs.readFile(file, 'utf8', function (err, data) {
						if (err) {
							logger.warn(`Error reading ${file}: ${err}`);
							errorCount++;
							return;
						}

						var analyzer = new CruParser(options.showTokenize, options.showSymbols);
						analyzer.parse(data);

						if (analyzer.errorCount === 0) {
							logger.info(`${file}`.green);
							validCount++;
						} else {
							logger.info(`${file} (${analyzer.errorCount} errors)`.red);
							errorCount++;
						}
					});
				});

				setTimeout(() => {
					logger.info(`\nResults: ${validCount} valid, ${errorCount} with errors`.cyan);
				}, 100);

			} else {
				// Process single file
				fs.readFile(path, 'utf8', function (err, data) {
					if (err) {
						return logger.warn(err);
					}

					var analyzer = new CruParser(options.showTokenize, options.showSymbols);
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						logger.info("The .cru file is a valid cru file".green);
					} else {
						logger.info("The .cru file contains error".red);
					}

					logger.debug(analyzer.parsedCourse);
				});
			}
		});
	})


	// readme
	.command('readme', 'Display the README.md file')
	.action(({ args, options, logger }) => {
		fs.readFile("./README.md", 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			logger.info(data);
		});

	})


	// search for rooms used by a specfic course
	.command('search-rooms', 'Search for the rooms used for a course\' name')
	.argument('<path>', 'The Cru file or directory to search')
	.option('-s, --showSymbols', 'log the analyzed symbol at each step', { validator: cli.BOOLEAN, default: false })
	.option('-t, --showTokenize', 'log the tokenization results', { validator: cli.BOOLEAN, default: false })
	.argument('<needle>', 'The text to look for in courses name\' names')
	.action(({ args, options, logger }) => {
		const path = args.path;
		
		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			if (stats.isDirectory()) {
				// Process folder: find all .cru files recursively
				const getAllCruFiles = (dir) => {
					let files = [];
					const items = fs.readdirSync(dir);
					
					items.forEach(item => {
						const itemPath = require('path').join(dir, item);
						const itemStats = fs.statSync(itemPath);
						
						if (itemStats.isDirectory()) {
							files = files.concat(getAllCruFiles(itemPath));
						} else if (item.endsWith('.cru')) {
							files.push(itemPath);
						}
					});
					
					return files;
				};

				const cruFiles = getAllCruFiles(path);
				
				if (cruFiles.length === 0) {
					logger.warn('No .cru files found in the folder');
					return;
				}

				
				
				cruFiles.forEach(file => {
					fs.readFile(file, 'utf8', function (err, data) {

						

						if (err) {
							logger.warn(`Error reading ${file}: ${err}`);
							errorCount++;
							return;
						}

						var analyzer = new CruParser(options.showTokenize, options.showSymbols);
						analyzer.parse(data);

						

						if (analyzer.errorCount === 0) {
							const matches = analyzer.parsedCourse.filter(course => course.name.includes(args.needle));
							

							for (const match of matches) {
								var rooms = match.getRooms();
								rooms = rooms.filter((value, index, self) => self.indexOf(value) === index); // fitler out duplicates
								logger.info(`Course: ${match.name}`.green);
								logger.info(`Rooms: ${rooms.join(', ')} \n`.cyan);
							}
						}
					});
				});

				

				

			} else {
				// Process single file
				fs.readFile(path, 'utf8', function (err, data) {
					if (err) {
						return logger.warn(err);
					}

					var analyzer = new CruParser(options.showTokenize, options.showSymbols);
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						const matches = analyzer.parsedCourse.filter(course => course.name.includes(args.needle));
						

						for (const match of matches) {
							var rooms = match.getRooms();
							rooms = rooms.filter((value, index, self) => self.indexOf(value) === index); // fitler out duplicates
							logger.info(`Course: ${match.name}`.green);
							logger.info(`Rooms: ${rooms.join(', ')} \n`.cyan);
						}
					}

					logger.debug(analyzer.parsedCourse);
				});
			}
		});
	})


	// export
	.command('export', 'Export parsed Cru file to iCalendar .ics format')
	.argument('<file>', 'The Cru file to export')
	.argument('<output>', 'The output .ics file')
	.option('-sd, --startDate <startDate>', 'The start date of the semester in YYYY-MM-DD format', { default: '2025-12-08' })
	.option('-ed, --endDate <endDate>', 'The end date of the semester in YYYY-MM-DD format', { default: '2025-12-13' })
	.action(({ args, options, logger }) => {
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}
			
			var analyzer = new CruParser();
			analyzer.parse(data);
			
			if (analyzer.errorCount === 0) {
				const icsData = analyzer.exportToICS(options.startDate, options.endDate);
				fs.writeFile(args.output, icsData, (err) => {
					if (err) {
						return logger.warn(err);
					}
					logger.info(`Exported to ${args.output}`.green);
				});
			} else {
				logger.info("The .cru file contains error".red);
			}
		});
	})


	// visualize-occupancy
	.command('stats', 'Visualize room occupancy rates as SVG')
	.argument('<file>', 'The Cru file to analyze')
	.argument('<output>', 'The output .svg file')
	.action(({ args, options, logger }) => {
		
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}
			
			var analyzer = new CruParser();
			analyzer.parse(data);
			
			if (analyzer.errorCount === 0) {
				const occupancyData = analyzer.getOccupancyStats();
				
				const spec = {
					$schema: 'https://vega.github.io/schema/vega-lite/v5.json',
					title: 'Taux d\'occupation des salles',
					description: 'Visualisation du taux d\'occupation des salles sur la période choisie',
					width: 1600,
					height: 800,
					data: { values: occupancyData },
					mark: 'bar',
					encoding: {
						x: {
							field: 'room',
							type: 'nominal',
							title: 'Salle',
							axis: { labelAngle: -45 }
						},
						y: {
							field: 'occupancyRate',
							type: 'quantitative',
							title: 'Taux d\'occupation (%)',
							scale: { domain: [0, 100] }
						},
						color: {
							field: 'occupancyRate',
							type: 'quantitative',
							scale: {
								scheme: 'redyellowgreen',
								domain: [0, 50, 100]
							},
							title: 'Taux (%)'
						},
						tooltip: [
							{ field: 'room', type: 'nominal', title: 'Salle' },
							{ field: 'occupancyRate', type: 'quantitative', title: 'Taux d\'occupation (%)', format: '.2f' },
							{ field: 'totalSlots', type: 'quantitative', title: 'Créneaux' },
							{ field: 'maxCapacity', type: 'quantitative', title: 'Capacité max' }
						]
					}
				};
				
				try {
					const vegaSpec = vegalite.compile(spec).spec;
					
					const view = new vg.View(vg.parse(vegaSpec), {
						loader: vg.loader(),
						renderer: 'svg'
					});
					
					view.runAsync().then(() => view.toSVG()).then(svg => {
						fs.writeFile(args.output, svg, (err) => {
							if (err) {
								return logger.warn(err);
							}
							logger.info(`Room occupancy visualization exported to ${args.output}`.green);
							logger.info(`Occupancy data: ${occupancyData.length} rooms analyzed`.cyan);
						});
					}).catch(err => {
						logger.warn(`Error rendering visualization: ${err}`);
					});
				} catch (err) {
					logger.warn(`Error compiling specification: ${err}`);
				}
			} else {
				logger.info("The .cru file contains error".red);
			}
		});
	})



    .command('get-room-capacity', 'Display room max capacity\' name')
    .argument('<path>', 'The Cru file or directory to search')
    .option('-s, --showSymbols', 'log the analyzed symbol at each step', { validator: cli.BOOLEAN, default: false })
    .option('-t, --showTokenize', 'log the tokenization results', { validator: cli.BOOLEAN, default: false })
    .argument('<needle>', 'The text to look for in rooms names')
    .action(({ args, options, logger }) => {
        const path = args.path;

        fs.stat(path, (err, stats) => {
            if (err) {
                return logger.warn(err);
            }

            if (stats.isDirectory()) {
                // Process folder: find all .cru files recursively
                const getAllCruFiles = (dir) => {
                    let files = [];
                    const items = fs.readdirSync(dir);

                    items.forEach(item => {
                        const itemPath = require('path').join(dir, item);
                        const itemStats = fs.statSync(itemPath);

                        if (itemStats.isDirectory()) {
                            files = files.concat(getAllCruFiles(itemPath));
                        } else if (item.endsWith('.cru')) {
                            files.push(itemPath);
                        }
                    });

                    return files;
                };

                const cruFiles = getAllCruFiles(path);

                if (cruFiles.length === 0) {
                    logger.warn('No .cru files found in the folder');
                    return;
                }


                const capacities = []
                const maxCapacities = []
                cruFiles.forEach((file) => {
                    fs.readFile(file , 'utf8', function (err, data) {



                        if (err) {
                            logger.warn(`Error reading ${file}: ${err}`);
                            errorCount++;
                            return;
                        }

                        var analyzer = new CruParser(options.showTokenize, options.showSymbols);
                        analyzer.parse(data);



                        if (analyzer.errorCount === 0) {
                            const matches = analyzer.parsedCourse.map(function(match) {
                                for (room of match.getRooms()){
                                    if (room === args.needle){
                                        return match.getSlotsByRoom(room)
                                    }
                                }
                            });


                            for (let match of matches) {
                                    if (match !== undefined) {
                                        match.forEach((slot) => !capacities.includes(slot.capacity) ? capacities.push(slot.capacity) : null)
                                    }
                            }
                            capacities.forEach((capacity) => maxCapacities.push(Math.max(capacity)))

                        }
                    })
                });



            } else {
                // Process single file
                fs.readFile(path, 'utf8', function (err, data) {
                    if (err) {
                        return logger.warn(err);
                    }

                    var analyzer = new CruParser(options.showTokenize, options.showSymbols);
                    analyzer.parse(data);

                    if (analyzer.errorCount === 0) {
                        const matches = analyzer.parsedCourse.filter(course => course.name.includes(args.needle));


                        for (const match of matches) {
                            var rooms = match.getRooms();
                            rooms = rooms.filter((value, index, self) => self.indexOf(value) === index); // fitler out duplicates
                            logger.info(`Course: ${match.name}`.green);
                            logger.info(`Rooms: ${rooms.join(', ')} \n`.cyan);
                        }
                    }

                    logger.debug(analyzer.parsedCourse);
                });
            }
        });
    })
	
cli.run(process.argv.slice(2));
