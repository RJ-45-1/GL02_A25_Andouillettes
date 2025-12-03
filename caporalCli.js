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


	// search
	.command('search', 'Free text search on Courses\' name')
	.argument('<file>', 'The Cru file to search')
	.argument('<needle>', 'The text to look for in Courses\' names')
	.action(({ args, options, logger }) => {
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			analyzer = new VpfParser();
			analyzer.parse(data);

			if (analyzer.errorCount === 0) {
				var filtered = analyzer.parsedCourse.filter(p => p.name.includes(args.needle));
				logger.info("%s", JSON.stringify(filtered, null, 2));

			} else {
				logger.info("The .cru file contains error".red);
			}
		});
	})

	
cli.run(process.argv.slice(2));
