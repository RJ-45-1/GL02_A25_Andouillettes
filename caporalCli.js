const fs = require('fs');
const colors = require('colors');
const CruParser = require('./CruParser.js');
const packageJson = require('./package.json');

const vg = require('vega');
const vegalite = require('vega-lite');

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

			const files = stats.isDirectory() ? getAllCruFiles(path) : [path];

			if (files.length === 0) {
				logger.warn('No .cru files found in the folder');
				return;
			}

			let validCount = 0;
			let errorCount = 0;

			files.forEach(file => {
				fs.readFile(file, 'utf8', function (err, data) {
					if (err) {
						return logger.warn(err);
					}

					var analyzer = new CruParser(options.showTokenize, options.showSymbols);
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						logger.info(`${file} is a valid cru file`.green);
						validCount++;
					} else {
						logger.info(`${file} contains ${analyzer.errorCount} error(s)`.red);
						errorCount++;
					}
					logger.debug(analyzer.parsedCourse);
				});
			});

			setTimeout(() => {
				logger.info(`\nResults: ${validCount} valid, ${errorCount} with errors`.cyan);
			}, 100);
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
	.argument('<needle>', 'The text to look for in courses name\' names')
	.action(({ args, options, logger }) => {
		const { path, needle } = args;

		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			const files = stats.isDirectory() ? getAllCruFiles(path) : [path];

			if (files.length === 0) {
				logger.warn('No .cru files found in the folder');
				return;
			}

			files.forEach(file => {
				fs.readFile(file, 'utf8', (err, data) => {
					if (err) {
						return logger.warn(err);
					}

					var analyzer = new CruParser();
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						const matches = analyzer.parsedCourse.filter(course => course.name.includes(needle));
						for (const match of matches) {
							var rooms = match.getRooms().filter((value, index, self) => self.indexOf(value) === index);
							logger.info(`Course: ${match.name}`.green);
							logger.info(`Rooms: ${rooms.join(', ')} \n`.cyan);
						}
					}
				});
			});
		});
	})


	// export
	.command('export', 'Export parsed Cru files to iCalendar .ics format')
	.argument('<path>', 'The Cru file or directory to export')
	.argument('<output>', 'The output .ics file')
	.option('-sd, --startDate <startDate>', 'The start date of the semester in YYYY-MM-DD format', { default: '2025-12-08' })
	.option('-ed, --endDate <endDate>', 'The end date of the semester in YYYY-MM-DD format', { default: '2025-12-13' })
	.action(({ args, options, logger }) => {

		const { path, output } = args;

		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			const files = stats.isDirectory() ? getAllCruFiles(path) : [path];

			if (files.length === 0) {
				logger.warn('No .cru files found in the folder');
				return;
			}

			const masterAnalyzer = new CruParser();

			var filesProcessed = 0;

			files.forEach(file => {
				fs.readFile(file, 'utf8', (err, data) => {
					if (err) {
						logger.warn(`Error reading ${file}: ${err}`);
						filesProcessed++;
						return;
					}

					var analyzer = new CruParser();
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						masterAnalyzer.parsedCourse = masterAnalyzer.parsedCourse.concat(analyzer.parsedCourse);
					} else {
						logger.warn(`${file} contains ${analyzer.errorCount} error(s)`);
					}

					filesProcessed++;

					if (filesProcessed === files.length) {
						if (masterAnalyzer.parsedCourse.length > 0) {
							const icsData = masterAnalyzer.exportToICS(options.startDate, options.endDate);
							fs.writeFile(args.output, icsData, (err) => {
								if (err) {
									return logger.warn(err);
								}
								logger.info(`Exported ${masterAnalyzer.parsedCourse.length} courses to ${args.output}`.green);
							});
						} else if (masterAnalyzer.parsedCourse.length === 0) {
							logger.warn('No valid courses found to export');
						}
					}
				});
			});
		});
	})


	// visualize-occupancy
	.command('stats', 'Visualize room occupancy rates as SVG')
	.argument('<path>', 'The Cru file or directory to analyze')
	.argument('<output>', 'The output .svg file')
	.action(({ args, options, logger }) => {

		const { path, output } = args;

		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			const files = stats.isDirectory() ? getAllCruFiles(path) : [path];

			if (files.length === 0) {
				logger.warn('No .cru files found in the folder');
				return;
			}

			const masterAnalyzer = new CruParser();

			var filesProcessed = 0;

			files.forEach(file => {
				fs.readFile(file, 'utf8', (err, data) => {
					if (err) {
						logger.warn(`Error reading ${file}: ${err}`);
						filesProcessed++;
						return;
					}

					var analyzer = new CruParser();
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						masterAnalyzer.parsedCourse = masterAnalyzer.parsedCourse.concat(analyzer.parsedCourse);
					} else {
						logger.warn(`${file} contains ${analyzer.errorCount} error(s)`);
					}

					filesProcessed++;

					if (filesProcessed === files.length) {
						if (masterAnalyzer.parsedCourse.length > 0) {

							const occupancyData = masterAnalyzer.getOccupancyStats();

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

						} else if (masterAnalyzer.parsedCourse.length === 0) {
							logger.warn('No valid courses found for analysis');
						}
					}
				});
			});
		});
	})


	// get-room-capacity
	.command('get-room-capacity', 'Display room max capacity')
	.argument('<path>', 'The Cru file or directory to search')
	.argument('<needle>', 'The text to look for in rooms names')
	.action(({ args, options, logger }) => {

		const { path, needle } = args;

		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			const files = stats.isDirectory() ? getAllCruFiles(path) : [path];

			if (files.length === 0) {
				logger.warn('No .cru files found in the folder');
				return;
			}

			const masterAnalyzer = new CruParser();

			var filesProcessed = 0;

			files.forEach(file => {
				fs.readFile(file, 'utf8', (err, data) => {
					if (err) {
						logger.warn(`Error reading ${file}: ${err}`);
						filesProcessed++;
						return;
					}

					var analyzer = new CruParser();
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						masterAnalyzer.parsedCourse = masterAnalyzer.parsedCourse.concat(analyzer.parsedCourse);
					} else {
						logger.warn(`${file} contains ${analyzer.errorCount} error(s)`);
					}

					filesProcessed++;

					if (filesProcessed === files.length) {
						if (masterAnalyzer.parsedCourse.length > 0) {
							const allRooms = masterAnalyzer.getAllRooms().filter(room => room !== null);
							const matchingRooms = allRooms.filter(room => room.includes(needle));

							matchingRooms.forEach(room => {
								const capacity = masterAnalyzer.getRoomMaxCapacity(room);
								logger.info(`Room: ${room}`.green);
								logger.info(`Max Capacity: ${capacity} \n`.cyan);
							});
						} else if (masterAnalyzer.parsedCourse.length === 0) {
							logger.warn('No valid courses found to search');
						}
					}
				});
			});
		});
	})


	// Sort rooms by capacity
	.command('sort-room-capacity', 'Sort rooms by capacity')
	.argument('<path>', 'The Cru file or directory to search')
	.action(({ args, options, logger }) => {
		const { path } = args;

		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			const files = stats.isDirectory() ? getAllCruFiles(path) : [path];

			if (files.length === 0) {
				logger.warn('No .cru files found in the folder');
				return;
			}

			const masterAnalyzer = new CruParser();

			var filesProcessed = 0;

			files.forEach(file => {
				fs.readFile(file, 'utf8', (err, data) => {
					if (err) {
						logger.warn(`Error reading ${file}: ${err}`);
						filesProcessed++;
						return;
					}

					var analyzer = new CruParser();
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						masterAnalyzer.parsedCourse = masterAnalyzer.parsedCourse.concat(analyzer.parsedCourse);
					} else {
						logger.warn(`${file} contains ${analyzer.errorCount} error(s)`);
					}

					filesProcessed++;

					if (filesProcessed === files.length) {
						if (masterAnalyzer.parsedCourse.length > 0) {
							const allRooms = masterAnalyzer.getAllRooms().filter(room => room !== null);

							const sortedRooms = allRooms.sort((a, b) => {
								const capacityA = masterAnalyzer.getRoomMaxCapacity(a);
								const capacityB = masterAnalyzer.getRoomMaxCapacity(b);
								return capacityA - capacityB;
							});

							sortedRooms.forEach(room => {
								const capacity = masterAnalyzer.getRoomMaxCapacity(room);
								logger.info(`Room: ${room}`.green + ` - Capacity: ${capacity}`.cyan);
							});
						} else if (masterAnalyzer.parsedCourse.length === 0) {
							logger.warn('No valid courses found to search');
						}
					}
				});
			});
		});
	})


	// search for when a room is used during the week
	.command('room-occupancy', 'Displays every time when a room is used during the week')
	.argument('<path>', 'The Cru file or directory to search')
	.argument('<needle>', 'Room\'s name\'')
	.action(({ args, options, logger }) => {

		const { path, needle } = args;

		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			const files = stats.isDirectory() ? getAllCruFiles(path) : [path];

			if (files.length === 0) {
				logger.warn('No .cru files found in the folder');
				return;
			}

			logger.info(`Room: ${needle}`.green);

			files.forEach(file => {
				fs.readFile(file, 'utf8', (err, data) => {
					if (err) {
						return logger.warn(err);
					}

					var analyzer = new CruParser();
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						const matches = analyzer.parsedCourse.map(match => match.getSlotsByRoom(needle));

						matches.forEach(slotArray => {
							slotArray.forEach(slot => {
								if (slot.room === needle) {
									logger.info(`Day: ${slot.day}, Hours: ${slot.start} - ${slot.end}`.cyan);
								}
							});
						});
					}
				});
			});
		});
	})


	// search for available rooms at a given time
	.command('available-rooms', 'Search for available rooms at a given time')
	.argument('<path>', 'The Cru file or directory to search')
	.argument('<needle>', 'Time to check (e.g., "L 10:00")')
	.action(({ args, options, logger }) => {

		const { path, needle } = args;

		// checking time format
		if (!/^(L|MA|ME|J|V|S) ([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(needle)) {
			logger.error('Invalid time format. Use "D HH:MM" where D is a day (L, MA, ME, J, V, S) and HH:MM is time in 24-hour format.'.red);
			return;
		}

		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			const files = stats.isDirectory() ? getAllCruFiles(path) : [path];

			if (files.length === 0) {
				logger.warn('No .cru files found in the folder');
				return;
			}

			const masterAnalyzer = new CruParser();

			var filesProcessed = 0;

			files.forEach(file => {
				fs.readFile(file, 'utf8', (err, data) => {
					if (err) {
						logger.warn(`Error reading ${file}: ${err}`);
						filesProcessed++;
						return;
					}

					var analyzer = new CruParser();
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						masterAnalyzer.parsedCourse = masterAnalyzer.parsedCourse.concat(analyzer.parsedCourse);
					} else {
						logger.warn(`${file} contains ${analyzer.errorCount} error(s)`);
					}

					filesProcessed++;

					if (filesProcessed === files.length) {
						if (masterAnalyzer.parsedCourse.length > 0) {

							const [dayPart, timePart] = needle.split(' ');
							const [hourPart, minutePart] = timePart.split(':');
							const checkMinutes = parseInt(hourPart) * 60 + parseInt(minutePart);

							const occupiedRooms = new Set();

							masterAnalyzer.parsedCourse.forEach(course => {
								course.slots.forEach(slot => {
									if (slot.day === dayPart) {
										const slotStart = slot.getStartMinutes();
										const slotEnd = slot.getEndMinutes();
										if (checkMinutes >= slotStart && checkMinutes < slotEnd) {
											occupiedRooms.add(slot.room);
										}
									}
								});
							});

							const allRooms = masterAnalyzer.getAllRooms().filter(room => room !== null);
							const availableRooms = allRooms.filter(room => !occupiedRooms.has(room));

							logger.info(`Available rooms on ${dayPart} at ${timePart}:`.green);

							availableRooms.forEach(room => {
								logger.info(`- ${room}`.cyan);
							});

						} else if (masterAnalyzer.parsedCourse.length === 0) {
							logger.warn('No valid courses found to search');
						}
					}
				});
			});
		});
	})


	// search for availability of said room at a given time
	.command('available-room', 'Search for available rooms at a given time')
	.argument('<path>', 'The Cru file or directory to search')
	.argument('<room>', 'Room to check availability for')
	.argument('<needle>', 'Time to check (e.g., "L 10:00")')
	.action(({ args, options, logger }) => {

		const { path, room, needle } = args;

		// checking time format
		if (!/^(L|MA|ME|J|V|S) ([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(needle)) {
			logger.error('Invalid time format. Use "D HH:MM" where D is a day (L, MA, ME, J, V, S) and HH:MM is time in 24-hour format.'.red);
			return;
		}

		fs.stat(path, (err, stats) => {
			if (err) {
				return logger.warn(err);
			}

			const files = stats.isDirectory() ? getAllCruFiles(path) : [path];

			if (files.length === 0) {
				logger.warn('No .cru files found in the folder');
				return;
			}

			const masterAnalyzer = new CruParser();

			var filesProcessed = 0;

			files.forEach(file => {
				fs.readFile(file, 'utf8', (err, data) => {
					if (err) {
						logger.warn(`Error reading ${file}: ${err}`);
						filesProcessed++;
						return;
					}

					var analyzer = new CruParser();
					analyzer.parse(data);

					if (analyzer.errorCount === 0) {
						masterAnalyzer.parsedCourse = masterAnalyzer.parsedCourse.concat(analyzer.parsedCourse);
					} else {
						logger.warn(`${file} contains ${analyzer.errorCount} error(s)`);
					}

					filesProcessed++;

					if (filesProcessed === files.length) {
						if (masterAnalyzer.parsedCourse.length > 0) {

							const [dayPart, timePart] = needle.split(' ');
							const [hourPart, minutePart] = timePart.split(':');
							const checkMinutes = parseInt(hourPart) * 60 + parseInt(minutePart);

							const occupiedRooms = new Set();

							masterAnalyzer.parsedCourse.forEach(course => {
								course.slots.forEach(slot => {
									if (slot.day === dayPart) {
										const slotStart = slot.getStartMinutes();
										const slotEnd = slot.getEndMinutes();
										if (checkMinutes >= slotStart && checkMinutes < slotEnd) {
											occupiedRooms.add(slot.room);
										}
									}
								});
							});

							const isRoomOccupied = occupiedRooms.has(room);

							logger.info(`Room ${room} on ${dayPart} at ${timePart}: ${isRoomOccupied ? 'Occupied'.red : 'Available'.green}`);

						} else if (masterAnalyzer.parsedCourse.length === 0) {
							logger.warn('No valid courses found to search');
						}
					}
				});
			});
		});
	})

cli.run(process.argv.slice(2));
