var SerialPort = require('serialport'),
	serialPort = new SerialPort('/dev/tty.usbmodem143131', {
		baudRate: 9600
	}),
	Printer = require('thermalprinter');

var printerOpts = {
  maxPrintingDots: 8,
  heatingTime: 120,
  heatingInterval: 100,
  commandDelay: 0
};

var path = __dirname + '/public/snapshots/test.png';

serialPort.on('open',function() {

	var printer = new Printer(serialPort, printerOpts);
	printer.on('ready', function() {
		printer
			.lineFeed('1')
			.printImage(path)
			.printLine('Random')
			.lineFeed('2')
			.print(function() {
				console.log('done');
				// process.exit();
			});
	});
});