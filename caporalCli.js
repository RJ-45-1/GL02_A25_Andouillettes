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
	.command('check', 'Check if <file> is a valid Cru file')
	.argument('<file>', 'The file to check with Cru parser')
	.option('-s, --showSymbols', 'log the analyzed symbol at each step', { validator: cli.BOOLEAN, default: false })
	.option('-t, --showTokenize', 'log the tokenization results', { validator: cli.BOOLEAN, default: false })
	.action(({ args, options, logger }) => {

		fs.readFile(args.file, 'utf8', function (err, data) {
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
