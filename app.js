console.log('starting');
const fs = require("fs");

const five = require("johnny-five");
const board = new five.Board({
  port: "/dev/ttyACM0"
});
const SerialPort = require('serialport');
const Printer = require('thermalprinter');

const nodeWebcam = require( "node-webcam" );
const player = require('play-sound')(opts = {});
// const play = require('audio-play');
// const load = require('audio-loader');

const gm = require("gm");

const pixel = require("node-pixel");

let ledState = 0;
let snapshotDirectory = 'public/snapshots/';

const moment = require('moment');
moment.locale('nl');

var printer;
var strip;
let button;
let led;
var servo;
const numLeds = 4*7;

let printerOpts = {
  maxPrintingDots: 7,
  heatingTime: 190,
  heatingInterval: 2,
  commandDelay: 0
};

let webcamOpts = {
    width: 1280,
    height: 1024,
    quality: 100,
    skip: 60,
};

// const servoClosedAngle = 8;
const servoClosedAngle = 15;
const servoOpenAngle = 160;

let state;
const STATES = {
  IDLE: 'IDLE',
  CAPTURING: 'CAPTURING',
  PRINTING: 'PRINTING',
  SUCCESS: 'SUCCESS'
}
var stripShiftingInterval;
var ledAnimationInterval;

const webcam = nodeWebcam.create(webcamOpts);

/**
 * how many frames per second do you want to try?
 */
var fps = 10;

const imagesFolder = 'public/images/'
const partyFolder = 'public/images/04-politiekepartijen/';
const partyFiles = fs.readdirSync(partyFolder);
console.log('partyFiles: ', partyFiles);
const thankYouFolder = 'public/images/05-dankteksten/';
const thankYouFiles = fs.readdirSync(thankYouFolder);
console.log('thankYouFiles: ', thankYouFiles);

// let capturingSoundBuffer;
// let capturingSoundPause;
// load('data/audio/capturing.wav').then(audioBuffer => {
//   capturingSoundBuffer = audioBuffer;
// });
// let successSoundBuffer;
// let successSoundPause;
// load('data/audio/success.wav').then(audioBuffer => {
//   successSoundBuffer = audioBuffer;
// });


let serialPort = new SerialPort('/dev/ttyUSB0', {
  baudRate: 9600
});

serialPort.once('open',function() {
  printer = new Printer(serialPort, printerOpts);

  printer.once('ready', function() {
    console.log("Printer ready");

    board.once("ready", function() {
      console.log("Board ready");

      button = new five.Button(2);
      led = new five.Led(3);
      servo = new five.Servo({
        controller: "PCA9685",
        pin: 0,
        startAt: servoClosedAngle
      });

      strip = new pixel.Strip({
        board: this,
        controller: "FIRMATA",
        strips: [ {pin: 6, length: 7}, {pin: 9, length: 7}, {pin: 10, length: 7}, {pin: 11, length: 7}],
      });

      strip.once("ready", function() {
        console.log("Strip ready");
        console.log("Waiting for button release");

        setState(STATES.IDLE);

        // setState(STATES.PRINTING);
        // setState(STATES.CAPTURING);

        button.on("release", function() {
          console.log('button release');

          setState(STATES.CAPTURING);

          servo.to(servoOpenAngle, 200)
          .once("move:complete", function() {
            console.log("camera omhoog");
            // takePicture(servo);
            // servo.to(0, 1000).on("move:complete", function() {
            //   console.log("camera omlaag");
            // });
            let timestamp = Date.now();
            webcam.capture(snapshotDirectory + timestamp, function( err, data ) {
              servo.to(servoClosedAngle, 500);
              console.log(data);

              setState(STATES.PRINTING);
              printReceipt(data, snapshotDirectory + timestamp, () => {
                setState(STATES.SUCCESS);
                setTimeout(() => {
                  setState(STATES.IDLE);
                }, 2000)
              });
              // setState(STATES.IDLE);
            });
          });

          // player.play('data/audio/soviet2.wav', { timeout: 30000 }, function(err){
          //   if (err) throw err
          // });
        });
      });
    }); 
  });
});

function setState(newState) {
  if (state === newState) return;
  console.log("setState: ", newState);
  switch(newState) {
    case STATES.IDLE: 
      clearInterval(ledAnimationInterval);
      led.strobe(700);

      for(var i = 0;i < numLeds;i++) {
        strip.pixel(i).color(colorWheel( Math.floor(Math.random() * 255) ));
      }
      strip.show();
      
      clearInterval(stripShiftingInterval);
      stripShiftingInterval = setInterval(function() {

          // strip.color(colorWheel( Math.floor(Math.random() * 255) ));
          strip.shift(1, pixel.FORWARD, true);
          strip.show();
      }, 1000/fps);

      break;
    case STATES.CAPTURING: 
      // led.stop().off();
      clearInterval(ledAnimationInterval);
      led.strobe(50);
      player.play('data/audio/capturing.wav', function(err){
        if (err) throw err
      });
      // capturingSoundPause = play(capturingSoundBuffer, {
      //   loop: true
      // });
      clearInterval(stripShiftingInterval);
      strip.off();
      // strip.color("#FF0000");
      strip.color("#ffffff");
      strip.show();
      break;
    case STATES.PRINTING:
      // led.stop().off();
      led.stop();
      // led.pulse({
      //   easing: "linear",
      //   duration: 50,
      //   cuePoints: [0, 0.2, 0.4, 0.6, 0.8, 1],
      //   keyFrames: [0, 10, 0, 50, 0, 255],
      //   onstop: function() {
      //     console.log("Animation stopped");
      //   },
      //   loop: true
      // });
      clearInterval(ledAnimationInterval);
      ledAnimationInterval = setInterval(() => {
        led.brightness(Math.random()*255);
      }, 1000/fps);

      strip.off();
      // strip.color("#00ff00");
      // strip.show();
      // const step = 255 / numLeds;
      // for(var i = 0;i < numLeds;i++) {
      //   const color = `rgb(0,${Math.round(i*step)}, 0)`;
      //   console.log('color: ', color);
      //   strip.pixel(i).color(color);
      // }
      // strip.show();
      // clearInterval(stripShiftingInterval);
      // stripShiftingInterval = setInterval(function() {

      //     // strip.color(colorWheel( Math.floor(Math.random() * 255) ));
      //     strip.shift(1, pixel.FORWARD, true);
      //     strip.show();
      // }, 1000/fps);
      // const step = 255 / numLeds;
      // for(var i = 0;i < numLeds;i++) {
      //   const color = ;
      //   console.log('color: ', color);
      //   strip.pixel(i).color(color);
      // }
      // strip.show();
      clearInterval(stripShiftingInterval);
      stripShiftingInterval = setInterval(function() {
          // strip.color(colorWheel( Math.floor(Math.random() * 255) ));
          // strip.shift(1, pixel.FORWARD, true);
          // for(var i = 0;i < numLeds;i++) {
          //   strip.pixel(i).color(`rgb(${Math.round(Math.random()*255)}, 0, 0)`);
          // }
          strip.color(colorWheel( Math.floor(Math.random() * 255) ));
          strip.show();
      }, 1000/fps);

      break;
    case STATES.SUCCESS: 
      clearInterval(ledAnimationInterval);
      led.on();

      // capturingSoundPause();
      player.play('data/audio/success.wav', { timeout: 30000 }, function(err){
      // // player.play('data/audio/soviet2.wav', { timeout: 30000 }, function(err){
        if (err) throw err
      });
      // play(successSoundBuffer);
      // led.pulse(2000);
      clearInterval(stripShiftingInterval);
      strip.off();
      strip.color("#00ff00");
      strip.show();
      break;
  }
  state = newState;
}

function printReceipt(source, fileName, callback) {

  createDateImage((dateImage) => {
    const alteredFilename = fileName + '-altered.png';
    // Create monochrome image from snapshot
    gm(source)
    .resize(384)
    // .modulate(130) //brightness
    // .contrast(+3)
    .monochrome()
    // .fill('#FFFFFF')
    // .font("data/fonts/circular-medium.otf", 60)
    // .drawText(0, 0, randomPartij(), 'Center')
    
    .write(alteredFilename, () => {
      // Image created
      printer
        .printImage(imagesFolder + '01-randommachine.png')
        .printImage(alteredFilename)
        .printImage(imagesFolder + '03-u-stemt-op.png')
        .printImage(getRandomPartyFileName())
        .printImage(getRandomThanksFileName())
        .printImage(dateImage)
        .printImage(imagesFolder + '07-copyright.png')
        .lineFeed(2)
        .print(function() {
          console.log('done printing');
          callback();
        });
    });
  })


  // printer
  //   // .printImage('time.png')
  //   // .printImage(fileName + '-altered.png')
  //   .printLine(randomPartij())
  //   .lineFeed('1')
  //   .print(function() {
  //     console.log('done');
  //     // process.exit();
  //   });
  // create watermark with party logo
  // gm(source)
  // .command('composite')
  // .gravity('SouthEast')
  // .out('-geometry', '+20+10') // offset
  // .in('watermark.png')
  // .stream()
  // .pipe(dest);
}

function getRandomPartyFileName() {
  const randomIndex = Math.floor(Math.random()*partyFiles.length);
  const fileName = partyFiles[randomIndex];
  const path = partyFolder + fileName;
  console.log('random party file: ', path);
  return path;
}

function getRandomThanksFileName() {
  const randomIndex = Math.floor(Math.random()*thankYouFiles.length);
  const fileName = thankYouFiles[randomIndex];
  const path = thankYouFolder + fileName;
  console.log('random thank you file: ', path);
  return path;
}
/**
 * When connected to internet or internal clock print date and time
 */

// function createDateImage(callback) {
//   let date = moment().format("DD-MM-Y [OM] HH:mm:ss");
//   const path = imagesFolder+'time.png';
//   gm(384, 100, '#fff')
//     // // .modulate(130) //brightness
//     // // .contrast(+3)
//    //  .monochrome()
//     // .fill('#000000')
//     // .font("din.ttf", 10)
//     .font("data/fonts/din.ttf", '24')
//     .fill("#000")
//     .drawText(0, 0, 'ADVIES GEGEVEN OP ' + date, "Center")
//     .write(path, () => {
//       console.log('created date image: ', path);
//       callback(path);
//   });
// }

function createDateImage(callback) {
  // let date = moment().format("DD-MM-Y [OM] HH:mm:ss");
  const path = imagesFolder+'time.png';
  gm(384, 100, '#fff')
    // // .modulate(130) //brightness
    // // .contrast(+3)
   //  .monochrome()
    // .fill('#000000')
    // .font("din.ttf", 10)
    .font("data/fonts/din.ttf", '24')
    .fill("#000")
    .drawText(0, 0, 'ADVIES GEGEVEN OP 21 MAART 2018', "Center")
    .write(path, () => {
      console.log('created date image: ', path);
      callback(path);
  });
}

function dynamicGreen(delay) {
        // strip.pixel(0).color("#300");
        // strip.pixel(1).color("#330");
        // strip.pixel(2).color("#303");
        // strip.pixel(5).color("#003");
        // strip.pixel(6).color("#003F");
        // strip.pixel(7).color("#FF0000");
        // strip.pixel(8).color("#FFF000");
        // strip.pixel(9).color("#FFF333");
        // strip.pixel(9).color("#0000FF");
        // strip.pixel(10).color("#FFFF00");
        // strip.pixel(11).color("#FFFF00");
        // strip.pixel(12).color("#FF00FF");
        // strip.pixel(13).color("#FF00FF");
        // strip.pixel(14).color("#FF00FF");
        strip.show();
        var blinker = setInterval(function() {
            strip.color(colorWheel( Math.floor(Math.random() * 255) ));
            // strip.shift(1, pixel.FORWARD, true);
            strip.show();
        }, 1000/fps);
}

function dynamicRainbow( delay){
    console.log( 'dynamicRainbow' );

    var showColor;
    var cwi = 0; // colour wheel index (current position on colour wheel)
    var foo = setInterval(function(){
        if (++cwi > 255) {
            cwi = 0;
        }

        for(var i = 0; i < strip.length; i++) {
            showColor = colorWheel( ( cwi+i ) & 255 );
            strip.pixel( i ).color( showColor );
            // strip1.pixel( i ).color( showColor );
            // strip2.pixel( i ).color( showColor );
            // strip3.pixel( i ).color( showColor );
        }
        strip.show();
        // strip1.show();
        // strip2.show();
        // strip3.show();
    }, 1000/delay);
}

// Input a value 0 to 255 to get a color value.
// The colors are a transition r - g - b - back to r.
function colorWheel( WheelPos ){
    var r,g,b;
    WheelPos = 255 - WheelPos;

    if ( WheelPos < 85 ) {
        r = 255 - WheelPos * 3;
        g = 0;
        b = WheelPos * 3;
    } else if (WheelPos < 170) {
        WheelPos -= 85;
        r = 0;
        g = WheelPos * 3;
        b = 255 - WheelPos * 3;
    } else {
        WheelPos -= 170;
        r = WheelPos * 3;
        g = 255 - WheelPos * 3;
        b = 0;
    }
    // returns a string with the rgb value to be used as the parameter
    return "rgb(" + r +"," + g + "," + b + ")";
}