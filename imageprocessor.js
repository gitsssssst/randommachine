const gm = require("gm");
const moment = require('moment');

moment.locale('nl');

let date = moment().format("DD-MM-Y  HH:mm:ss");

gm(384, 100, '#fff')
	// // .modulate(130) //brightness
	// // .contrast(+3)
 //  .monochrome()
  // .fill('#000000')
  // .font("din.ttf", 10)
  .font("data/fonts/din.ttf", '24')
  .fill("#000")
  .drawText(0, 0, date + '  WWW.RANDOMMACHINE.NL', "Center")
  .write('time.png', () => {

  });