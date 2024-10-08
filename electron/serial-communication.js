const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const main = require('./main');

let activePorts = [];
let ports = [];
let port;
let receivingPort = null;
let progress = 0;

const checkSerialPortTimeInterval = 60000;


let dataSendWaitList = [];
let datalist = [];

const softwareVersion = { major: 3, minor: 1, patch: 2 };

function checkSerialPorts() {
  setInterval(getSerialConnections, checkSerialPortTimeInterval);
}


function listSerialPorts(callback) {
  let portsList = [];
  SerialPort.list().then(ports => {
    ports.forEach((item) => {
      let vendor = 'unknown';

      if (item.vendorId !== undefined && item.productId !== undefined) {
        if (item.vendorId === '0483' && (item.productId === '5740' || item.productId === '0003')) {
          vendor = 'STM32';
        } else if (item.vendorId === '16C0' && item.productId === '0483') {
          vendor = 'Teensy';
        } else if (item.vendorId === '2341' || item.vendorId === '2A03') {
          if (item.productId === '003D') {
            vendor = 'Arduino DUE';
          } else if (item.productId === '0042') {
            vendor = 'Arduino MEGA';
          } else if (item.productId === '805A') {
            vendor = 'Arduino Nano';
          } else if (item.productId === '0001') {
            vendor = 'Arduino';
          }
        } else if (item.vendorId === '10C4' && item.productId === 'EA60') {
          vendor = 'ESP32';
        }
      }
      if (!activePorts.includes(item.COM)) {
        portsList.push({ serialPort: item, vendor: vendor });
      }
    });
    // if (callback !== null) {
    callback(portsList);
    // }
  })
};


function getSerialConnections() {
  listSerialPorts(checkIfSerialPortIsKnown);
}

function checkIfSerialPortIsKnown(portsList) {
  if (portsList && portsList.length > 0) {
    main.checkPorts(portsList);
  }
}



function checkIfAvailable(serialData, callback, connect) {
  SerialPort.list().then(ports => {
    if (serialData && ports.length > 0) {
      callback(serialData, ports, connect);
    }
  });
}

function writeDataString(data, COM) {
  sp.write(data, (err) => {
      if (err) {
          main.updateSerialProgress({ progress: 0, str: err.message });
          dataSendWaitList = [];
          return;
      }
      // else {
        // console.log('write data ', data);
      // }
  });
}


function closeSerialPort(serialData) {
  checkIfAvailable(serialData, ifSerialAvailable, false);
}


function closeAllSerialPorts() {
  for (let COM of activePorts) {
    closeSerialPort(COM);
  }
}


function connectToSerialPort(serialData) {
  progress = 0;
  main.updateSerialProgress({ progress: progress, str: 'Trying to connect to ' + serialData.port.path });
  checkIfAvailable(serialData, ifSerialAvailable, true);
}



function ifSerialAvailable(serialData, portlist, connect) {
  if (portlist.length > 0) {
    main.updateAvailablePortList(portlist);
    const portAvailable = portlist.filter(p => p.path === serialData.port.path);
    let selectedPort = ports.filter(p => p.COM === serialData.port.path)[0];

    if (portAvailable.length > 0) {
      if (connect) {
        if (selectedPort) {
          // console.log("OPEN IF NOT OPEN " + selectedPort.sp.IsOpen + " or " + selectedPort.sp.opening);
          if (selectedPort.sp && !activePorts.includes(selectedPort.COM)) {
            selectedPort.sp.open();
          } //!selectedPort.sp.opening
        } else {
          updateProgress(100, (serialData.port.path + ' is connected'));
          createConnection(serialData);
        }
      } else {
        if (selectedPort) {
          if (selectedPort.sp && activePorts.includes(selectedPort.COM)) {
            selectedPort.sp.close();
          }
        } else {
          const sp = new newSerialPort(serialData, port);
          ports.push(sp);
          updateProgress(100, (serialData.port.path + ' close'));
        }
      }
    } else {
      updateProgress(0, (serialData.port.path + ' is not available'));
    }
  } else {
    updateProgress(0, (serialData.port.path + ' is not available'));
  }
}



function createConnection(serialData, data = null, callback = null) {
  // console.log(serialData);
  if (serialData && serialData.port) {
    if (ports.filter(d => d.path === serialData.port.path).length === 0) {
      const sp = new newSerialPort(serialData, port);
      sp.createSerialPort();
      ports.push(sp);

      // if (data) {
      //   console.log("data available");
      //   const intervalSendData = setInterval(() => {
      //     if (sp.connected) {
      //       callback(sp, data);
      //       console.log("CHECK IF PORT IS CONNECTED 2");
      //       clearInterval(intervalSendData);
      //     }
      //   }, 100);
      // }
    }
  }
}

function deleteDataItemsCOM(COM) {
  const dataItems = this.dataSendWaitList.filter(d => d.port === COM);
  for (const item of dataItems) {
    const index = this.dataSendWaitList.indexOf(item);
    if (index > -1) {
      this.dataSendWaitList.splice(index, 1);
    }
  }
}


class newSerialPort {
  constructor(portData, sp) {
      this.portData = portData;
      this.COM = portData.port.path;
      this.sp = sp;
      this.baudrate = portData.baudrate;
      this.connected = false;
  }


  writeData(data) {
    this.sp.write(data, (err) => {
        if (err) {
          main.updateSerialProgress({ progress: 0, str: err.message });
          return;
        }
        //uncomment to read what is printed on the serial port
        // else {
        //    console.log('written ', data);
        // }
    });
  }


  get getCOMPort() {
      return this.COM;
  }

  get getSp() {
      return this.sp;
  }


  closeConnection() {
      if (this.sp !== null) {
          this.sp.close();
      }
  }

  createSerialPort() {
      if (this.connected && this.sp) {
         this.sp.close();
      }

      this.sp = new SerialPort({
          path:this.COM,
          baudRate: this.baudrate,
          autoOpen: true
      }, (error) => {
          if (error) {
            main.updateSerialProgress({ progress: 0, str: 'Error: ' + error.message });
            deleteDataItemsCOM(this.COM);
            return;
          }
          // else {
          //   console.log("CHECK SOFTWARE VERSION1");
          //   // sendDataStr([ 'FS' ],  this.COM);
          // }
      });

      const parser = this.sp.pipe(new ReadlineParser({ delimiter: '\r\n' }))

      this.sp.on('open', (error) => {
        if (error) {
          updateProgress(0, ('Error opening ' + this.COM + ' ' + error));
          for (item of dataSendWaitList) {
            if (item.port === this.COM) {
              const index = dataSendWaitList.indexOf(item);
              dataSendWaitList.splice(index, 1);
            }
          }
          this.sp.close();
        } else {
          updateProgress(50, (this.COM + ' has been added'));

          if (this.portData.type !== 'Arduino MEGA' && this.portData.type !== 'Arduino') {
            sendDataStr([ 'FS' ],  this.COM, true);
            this.connected = true;
            main.updateSerialStatus({ microcontroller: this.portData, connected: this.connected });
            updateProgress(100, ('Connected to ' + this.COM));
          }

          if (!activePorts.includes(this.COM)) {
            activePorts.push(this.COM);
          }
        }
      });

      parser.on('data', (d) => {

        // uncomment to print incoming data
        // if (d.charAt(0) === '#') {
          // console.log('received data ', d);
        // } else
        if (d.charAt(0) === '*') {
          if (dataSendWaitList.filter(d => d.port === this.COM).length > 0) {
            uploadFromWaitList(ports.filter(p => p.COM === this.COM)[0]);
          }
        } else if (d.charAt(0) === 'A') {
          const dataArray = d.substr(1).split(':');
          let incomingData;
          const vel = parseFloat(dataArray[2]); // store velocity
          // add preset input data
          const dataList = [ { name: 'angle', val: parseFloat(dataArray[1]), slug: 'A' },
                             { name: 'velocity', val: vel, slug: 'V' },
                             { name: 'direction', val: vel === 0.0 ? 0 : vel > 0.0 ? 1 : -1, slug: 'D' },
                             { name: 'target', val: parseFloat(dataArray[4]), slug: 'G' },
                             { name: 'time', val: parseInt(dataArray[3]), slug: 'T' } ];

          // process custom input data
          if (dataArray.length > 5) {
            for (let i = 5; i < dataArray.length; i++) {
              dataList.push({ name: 'val-' + (i - 5), val: parseFloat(dataArray[i]), slug: 'V' + (i - 5) });
            }
          }
          incomingData = { d: dataList, motorID: dataArray[0], serialPath: this.COM };
          main.visualizaMotorData(incomingData);

        } else if (d.charAt(0) === 'J') { //pneumatic data
          // console.log(d);
          const dataArray = d.substr(1).split(':');

          let incomingData = {
            serialPath: this.COM,
            list: []
          };

          for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i]) {
              const subArray = dataArray[i].split('&');
              if (subArray && subArray.length > 3) {
                const pressureDataList = subArray[1].split('$');
                const dataList = [];

                for (let p = 0; p < pressureDataList.length; p++) {
                  dataList.push({ name: p === 0 ? 'pressure' : 'pressure-' + p, val: parseFloat(pressureDataList[p]), slug: p === 0 ? 'P' : 'P-' + p } );
                }

                dataList.push({ name: 'target', val: parseFloat(subArray[2]), slug: 'G' });
                dataList.push({ name: 'time', val: parseInt(subArray[3]), slug: 'T' });

                incomingData.list.push({ motorID: subArray[0], d: dataList });
              }
            }
          }

          if (incomingData.list.length > 0) {
            main.visualizaPressureMotorData(incomingData);
          }

        } else if (d.charAt(0) === 'Z') { // receive calibration values motor

          const dataArray = d.substr(1).split(':');
          const data = {
              motorID: dataArray[0],
              zero_electric_angle: parseFloat(dataArray[1]),
              direction: parseInt(dataArray[2]),
              serialPath: this.COM
          };
          main.updateZeroElectricAngle(data);

        } else if (d.charAt(0) === 'C') { // receive calibration values current sense
          const dataArray = d.substr(1).split(':');
          const data = {
              motorID: dataArray[0],
              current_sense_calibration: dataArray[1],
              serialPath: this.COM
          };
          main.updateCurrentSenseCalibration(data);

        } else if (d.charAt(0) === 'M') { // receive variable
          updateProgress(progress, 'Maximum data size reached');

        } else if (d.charAt(0) === 'V') { // receive variable
          updateProgress(progress, 'Motor stopped automatically because it reached a high velocity');

        } else if (d.charAt(0) === 'O') { // receive variable
          updateProgress(progress, 'Overheat protection activitated');

        } else if (d.charAt(0) === 'L') { // receive variable
          // console.log('listed devices ' + d.substr(1));
          updateProgress(progress, d.substr(1));

        } else if (d.charAt(0) === 'S') { // receive software version data
          const dataArray = d.substr(1).split('.');
          const data = {
              major: parseInt(dataArray[0]),
              minor: parseInt(dataArray[1]),
              patch: parseInt(dataArray[2])
          };
          if (data.major !== softwareVersion.major || data.minor !== softwareVersion.minor) {
            main.showMessageConfirmation({ msg: "The software version of Feelix does not match the software version on the microcontroller (v"
              + (data.major + '.' + data.minor + '.' + data.patch) + "), update to v" + (softwareVersion.major + '.' + softwareVersion.minor + '.X'), action:"updateVersion", type: "message", d: this.COM });
                          // this.sp.close();
          } else {
            if (dataSendWaitList.filter(d => d.port === this.COM).length > 0) {
              uploadFromWaitList(ports.filter(p => p.COM === this.COM)[0]);
            }
          }
        } else if (d.charAt(0) === 'R') {
          const dataArray = d.substr(1).split(':');
          const data = {
            motorID: dataArray[0],
            type: dataArray[1],
            value: parseFloat(dataArray[2]),
            serialPath: this.COM
          }
          main.returnData(data);
          main.updateSerialProgress({ progress: 100, str: 'value received' });

        } else if (!this.connected && (d.charAt(0) === 'H' || d === '0')) { // check if the microcontroller is using the right firmware
          sendDataStr([ 'FS' ], this.COM, true);
          this.connected = true;
          main.updateSerialStatus({ microcontroller: this.portData, connected: this.connected });
          updateProgress(100, ('Connected to ' + this.COM));
        }
        else if (this.connected && (d.charAt(0) === 'H' || d === 0)) {
          if (dataSendWaitList.filter(d => d.port === this.COM).length > 0) {
            uploadFromWaitList(ports.filter(p => p.COM === this.COM)[0]);
          }
        }

    });


    this.sp.on('close', () => {
        this.connected = false;
        dataSendWaitList = [];
        main.updateSerialStatus({ microcontroller: this.portData, connected: this.connected });
        updateProgress(0, ('Connection to ' + this.COM + ' - ' + this.portData.type + ' is closed'));
        const portIndex = activePorts.indexOf(this.COM);
        if (portIndex > -1) {
          activePorts.splice(portIndex, 1);
        }
    });


    this.sp.on('error', (error) => {
        updateProgress(0, (this.portData.port.path + ' - ' + this.portData.type + ': ' + error));
        if (!this.connected) {
          main.updateSerialStatus({ microcontroller: this.portData, connected: this.connected });
        }
        return;
        // dataSendWaitList = [];
    });
  }
}

function updateProgress(_progress, _str) {
  progress = _progress;
  main.updateSerialProgress({ progress: _progress, str: _str });
}



function prepareMotorData(uploadContent, motor, datalist, index) {
  // datalist.unshift('FM' + motor.id + 'F');

  // if (index) {
    datalist.unshift('FM' + motor.id + 'I' + index);
  // }
  // datalist.unshift('FM' + motor.id + '' + (motor.I2C_communication));
  if (motor.config.supplyVoltage) {
    datalist.unshift('FM' + motor.id + 'S' + motor.config.supplyVoltage);
  }
  if (motor.config.polepairs) {
    datalist.unshift('FM' + motor.id + 'P' + motor.config.polepairs);
  }
  datalist.unshift('FM' + motor.id + 'L' + (motor.config.voltageLimit || motor.config.supplyVoltage));

  if (motor.config.velocityLimit) {
    datalist.unshift('FM' + motor.id + 'V' + motor.config.velocityLimit);
  }
  if (motor.config.calibration.value && motor.config.calibration.value !== 0.0  && motor.config.calibration.value !== -12345.0 && motor.config.calibration.direction) {
    datalist.unshift('FM' + motor.id + 'Z' + motor.config.calibration.value.toFixed(12));
    datalist.unshift('FM' + motor.id + 'N' + (motor.config.calibration.direction === 'CW' ? 1 : -1));
  }
  // datalist.unshift('FM' + motor.id + 'E' + motor.config.encoder.part_number);
  if (motor.config.sensorOffset !== undefined) {
    datalist.unshift('FM' + motor.id + 'O' + (motor.config.sensorOffset * (Math.PI / 180)).toFixed(14));
  }
  if (motor.config.transmission) {
    datalist.unshift('FM' + motor.id + 'X' + (motor.config.transmission.toFixed(14))); //new
  }
  datalist.unshift('FM' + motor.id + 'C' + motor.config.encoder.clock_speed);
  datalist.unshift('FM' + motor.id + 'D' + (motor.config.encoder.direction ? 1 : -1));

  if (uploadContent.config) {
    datalist.unshift('FM' + motor.id + 'T' + uploadContent.config.updateSpeed);
    datalist.unshift('FM' + motor.id + 'J' + uploadContent.config.range);
    datalist.unshift('FM' + motor.id + 'H' + uploadContent.config.loop);
    datalist.unshift('FM' + motor.id + 'M' + uploadContent.config.constrain_range);
    datalist.unshift('FM' + motor.id + 'W:' + (uploadContent.config.returnToStart ? 2 : 1) + ':' + (uploadContent.config.returnToStart ? uploadContent.config.returnToStart.toFixed(6) : 0));
  }
  if (motor.state.position.start) {
    datalist.unshift('FM' + motor.id + '%' + motor.state.position.start.toFixed(14));
  }

  if (motor.config.position_pid && motor.config.velocity_pid) {
    datalist.unshift('FM' + motor.id + 'A' + ':' + motor.config.position_pid.p.toFixed(2) + ':' + motor.config.position_pid.i.toFixed(2));
    datalist.unshift('FM' + motor.id + '$' + ':' + motor.config.position_pid.output_ramp + ':' + motor.config.position_pid.Tf.toFixed(3));
    datalist.unshift('FM' + motor.id + 'Q' + ':' + motor.config.velocity_pid.p.toFixed(2) + ':' + motor.config.velocity_pid.i.toFixed(2));
    datalist.unshift('FM' + motor.id + '@' + ':' + motor.config.velocity_pid.output_ramp + ':' + motor.config.velocity_pid.Tf.toFixed(3));
  }
  datalist.unshift('FM' + motor.id + 'G' + (motor.config.inlineCurrentSensing ? 1 : 0));
  if (motor.config.calibrateCurrentSense) {
    datalist.unshift('FM' + motor.id + 'Y' + motor.config.calibrateCurrentSense.toFixed(5));
  }
  // datalist.unshift('FM' + motor.id + 'X' + (motor.config.overheatProtection ? 1 : 0));


  // datalist.unshift('FM' + motor.id + 'B' + uploadContent.baudRate);
  return datalist;
}



function preparePneumaticData(uploadContent, motor, datalist) {

  // datalist.unshift('FM' + motor.id + 'F');

  // datalist.unshift('FM' + index + 'I' + motor.id);
  if (motor.config.supplyVoltage) {
    datalist.unshift('FM' + motor.id + 'S' + motor.config.supplyVoltage);
  }
  if (motor.config.pressureLimit) {
    datalist.unshift('FM' + motor.id + 'P' + motor.config.pressureLimit);
  }

  datalist.unshift('FM' + motor.id + 'C' + (motor.config.closedLoop ? 1 : 0));

  // if (motor.config.closedLoop && motor.config.sensorCommunication === 1) {
  //   datalist.unshift('FM' + index + 'A' + parseInt(motor.config.sensorAddress, 16));
  // } else if (motor.config.closedLoop && motor.config.sensorCommunication === 0) {
  //   datalist.unshift('FM' + index + 'B' + motor.config.sensorCSS);
  // }

  // if (motor.config.closedLoop) {
  //   datalist.unshift('FM' + index + 'D' + motor.config.sensorCommunication);
  // }

  // datalist.unshift('FM' + index + 'N' + motor.config.pin);
  datalist.unshift('FM' + motor.id + 'V' + ':' + motor.config.inflate_valve.min + ':' + motor.config.inflate_valve.max);
  datalist.unshift('FM' + motor.id + 'W' + ':' + motor.config.deflate_valve.min + ':' + motor.config.deflate_valve.max);
  datalist.unshift('FM' + motor.id + 'E' + ':' + motor.config.inflate_pid.p.toFixed(2) + ':' + motor.config.inflate_pid.i.toFixed(2));
  datalist.unshift('FM' + motor.id + 'O' + ':' + motor.config.inflate_pid.output_ramp + ':' + motor.config.inflate_pid.Tf.toFixed(3));
  datalist.unshift('FM' + motor.id + 'G' + ':' + motor.config.deflate_pid.p.toFixed(2) + ':' + motor.config.deflate_pid.i.toFixed(2));
  datalist.unshift('FM' + motor.id + 'M' + ':' + motor.config.deflate_pid.output_ramp + ':' + motor.config.inflate_pid.Tf.toFixed(3));

  if (uploadContent.config) {
    datalist.unshift('FM' + motor.id + 'T' + uploadContent.config.updateSpeed);
    datalist.unshift('FM' + motor.id + 'J' + uploadContent.config.range.toFixed(5));
    datalist.unshift('FM' + motor.id + 'H' + uploadContent.config.loop);
    datalist.unshift('FM' + motor.id + 'L' + uploadContent.config.constrain_range);
  }

  // datalist.unshift('FM' + motor.id + 'B' + uploadContent.baudRate);
  return datalist;
}


function prepareEffectData(uploadContent, motor, datalist) {
  let i = 0;
  let ptr = 0;
  for (const d of uploadContent.data.overlay) {
    d.pointer = ptr;
    ptr += d.type === 1 ? d.data.length * 2 : d.data.length;
  }

  let ptr2 = 0;
  for (const d of uploadContent.data.effectData) {
    const sameEffectList = uploadContent.effects.filter(e => e.id === d.id);
    for (const sameEffect of sameEffectList) {
      sameEffect.pointer = ptr2 + ptr;
    }
    ptr2 += d.type === 1 ? d.data.length * 2 : d.data.length;
  }


  for (const d of uploadContent.data.overlay) {
    datalist.unshift('FE' + motor.id + i + 'C:' + d.position.start.toFixed(5));
    datalist.unshift('FE' + motor.id + i + 'A:' + (d.data.length - 1));
    if (d.type < 2) {
      datalist.unshift('FE' + motor.id + i + 'D:' + (d.direction.cw ? 1 : -1) + ':' + (d.direction.ccw ? 1 : -1) );
    }
    datalist.unshift('FE' + motor.id + i + 'I:' + (d.infinite ? 1 : -1));
    datalist.unshift('FE' + motor.id + i + 'R:' + d.pointer);
    let type = 0;
    if (d.type === 1) { type = 1; }
    if (d.type === 2 && d.yUnit !== 'deg') { type = 2; }
    if (d.type === 2 && d.yUnit === 'deg') { type = 3; }
    datalist.unshift('FE' + motor.id + i + 'T:' + type); //T

    if (type !== 2) {
      datalist.unshift('FE' + motor.id + i + 'E:1');
    }
    datalist.unshift('FE' + motor.id + i + 'Z:' + (d.type === 1 ? d.data.length * 2 : d.data.length));


    for (const el of d.data) {

      if (el.d && d.type === 1) {
        datalist.unshift('FDI' + motor.id + ':' + (Math.round(el.d) !== el.d ? el.d.toFixed(6) : el.d));
      }
      if (d.type === 2 && d.yUnit === 'deg') {
        datalist.unshift('FDI' + motor.id + ':' + ((el.y2 * 100) * (Math.PI / 180)).toFixed(6));
      } else {
        // console.log('overlay ' + 'FDI' + motor.id + ':' + (Math.round(el.y) !== el.y ? el.y.toFixed(6) : el.y));
        datalist.unshift('FDI' + motor.id + ':' + (Math.round(el.y) !== el.y ? el.y.toFixed(6) : el.y));
      }
    }
    i++;
  }


  for (const effect of uploadContent.effects) {
    datalist.unshift('FE' + motor.id + i + effect.position.identifier + ':' + effect.position.value[1]);
    if (effect.vis_type !== 2) {
      datalist.unshift('FE' + motor.id + i + effect.direction.identifier + ':' + effect.direction.value[0] + ':' + effect.direction.value[1]);
    }
    datalist.unshift('FE' + motor.id + i + effect.scale.identifier + ':' + effect.scale.value[0] + ':' + effect.scale.value[1]);
    datalist.unshift('FE' + motor.id + i + effect.flip.identifier + ':' + effect.flip.value[0] + ':' + effect.flip.value[1] + ':' + effect.flip.value[2]);
    datalist.unshift('FE' + motor.id + i + effect.angle.identifier + ':' + effect.angle.value);
    datalist.unshift('FE' + motor.id + i + effect.vis_type.identifier + ':' + effect.vis_type.value);
    if (effect.effect_type.value !== 2) {
      datalist.unshift('FE' + motor.id + i + effect.effect_type.identifier + ':' + effect.effect_type.value);
    }
    if (effect.vis_type === 4) {
      datalist.unshift('FE' + motor.id + i + effect.midi_config.identifier + ':' + effect.midi_config.value[0] + ':' + effect.midi_config.value[1] + ':' + effect.midi_config.value[2]);
    }
    datalist.unshift('FE' + motor.id + i + effect.datasize.identifier + ':' + effect.datasize.value);
    datalist.unshift('FE' + motor.id + i + effect.quality.identifier + ':' + effect.quality.value);
    datalist.unshift('FE' + motor.id + i + 'C:' + effect.position.value[0]);
    datalist.unshift('FE' + motor.id + i + 'R:' + effect.pointer);

    if (effect.repeat) {
      for (const repeat of effect.repeat.value) {
        datalist.unshift('FE' + motor.id + i + effect.repeat.identifier + ':' + repeat.x.toFixed(8));
      }
    }
    datalist.unshift('FE' + motor.id + i + effect.infinite.identifier + ':' + effect.infinite.value);

    i++;
  }
  for (const d of uploadContent.data.effectData) {
    for (const el of d.data) {
      if (d.type === 1) {
        datalist.unshift('FDI' + motor.id + ':' + (Math.round(el.d) !== el.d ? el.d.toFixed(6) : el.d));
      }
      if (d.type === 2 && d.yUnit === 'deg') {
        datalist.unshift('FDI' + motor.id + ':' + ((el.y * 100) * (Math.PI / 180)).toFixed(6));
      } else {
        // console.log('effect ' + 'FDI' + motor.id + ':' + (Math.round(el.y) !== el.y ? el.y.toFixed(6) : el.y));
        datalist.unshift('FDI' + motor.id + ':' + (Math.round(el.y) !== el.y ? el.y.toFixed(6) : el.y));
      }
    }
  }
  // console.log(JSON.stringify(datalist));
  return datalist;

}




function tryToEstablishConnection(receivingPort, uploadContent, callback) {
  if (!receivingPort && uploadContent && uploadContent.config) {
    createConnection({ port: uploadContent.config.serialPort, type: uploadContent.config.vendor, baudrate: uploadContent.config.baudrate });
    // receivingPort = ports.filter(p => p.COM === uploadContent.config.serialPort.path)[0];
  } else if (receivingPort) { //&& !receivingPort.sp.IsOpen

    if (!activePorts.includes(receivingPort.COM)) {
      receivingPort.sp.open();
    }
  }
  if (uploadContent && uploadContent.config) {
    callback(receivingPort, uploadContent);
  }
}


function uploadData(uploadContent) {
  receivingPort = ports.filter(p => p.COM === uploadContent.config.serialPort.path)[0];

  datalist = [];

  tryToEstablishConnection(receivingPort, uploadContent, upload_to_receivedPort);

}



function upload_to_receivedPort(port, uploadContent) {
  receivingPort = port;

  let index = 0;

  for (const motor of uploadContent.config.motors) {
    if (index === 0 && uploadContent.newMCU) {
      datalist.unshift('FR');
      // console.log("RESET");
    }
    datalist.unshift('FM' + motor.id + 'F');
    datalist = motor.type === 2 ? preparePneumaticData(uploadContent, motor, datalist, index) : prepareMotorData(uploadContent, motor, datalist);
    if (uploadContent.data) {
      datalist = prepareEffectData(uploadContent, motor, datalist);
    }
    index++;
  }

  datalist.unshift('FMK' + uploadContent.run);

  dataSendWaitList.push({ port: uploadContent.config.serialPort.path, data: datalist, totalItems: datalist.length, collection: uploadContent.config.collection });
  dataSendWaitList.filter(d => d.port === uploadContent.config.serialPort.path)[0].data.unshift('FC' + (uploadContent.config.motorID ? uploadContent.config.motorID : 'A'));
  // console.log(JSON.stringify(dataSendWaitList));
  uploadFromWaitList(receivingPort);
}


function requestData(data)  {
  // console.log(data);
  receivingPort = ports.filter(p => p.COM === data.config.serialPort.path)[0];

  if (!activePorts.includes(receivingPort.COM)) {
    tryToEstablishConnection(receivingPort, data, receivedPort);

    sendDataStr([ 'FC', 'FMK1' ], data.config.serialPort.path);
    main.updateSerialProgress({ progress: 100, str: ('Connecting to microcontroller at ' + data.config.serialPort.path) });
  } else {
    sendDataStr([ 'FC', 'FMK1' ], data.config.serialPort.path);
  }
}


function receivedPort(port, NULL) {
  receivingPort = port;
}


function uploadFromWaitList(receivingPort) {
  if (receivingPort && receivingPort.connected) {
    const datalist = dataSendWaitList.filter(d => d.port === receivingPort.COM)[0];

    if (datalist && datalist.data.length > 0) {
      let item = datalist.data[datalist.data.length - 1];
      if (item) {
        if (item.length > 19) {
          item = item.slice(0, (19 - item.length));
        }
        // console.log(item + '&');
        receivingPort.writeData(item + '&');
        datalist.data.pop();
      }

      if (datalist.data.length === 0) {
        const index = dataSendWaitList.indexOf(datalist);
        if (dataSendWaitList[index].collection) {
          main.uploadSuccesful(dataSendWaitList[index].collection);
        }
        dataSendWaitList.splice(index, 1);
        main.updateSerialProgress({ progress: 100, str: 'Ready' });
      } else {
        const progress = (100 / datalist.totalItems) * (datalist.totalItems - datalist.data.length);
        main.updateSerialProgress({ progress: progress, str: 'Writing data to ' + receivingPort.portData.type + ' at ' + receivingPort.COM });
      }
      return;
    }
  } else {
    if (!receivingPort) {
      main.updateSerialProgress({ progress: 0, str: 'Port is not available' });
    } else if (receivingPort && !receivingPort.connected) {
      setTimeout(() => {
        uploadFromWaitList(receivingPort);
      }, 100);
    }
  }
}


function play(play, motor_id, collection_name, port) {
  sendDataStr([ 'FM' + motor_id + 'K' + (play ? 1 : 0) ], port);
  main.updateSerialProgress({ progress: 100, str: (play ? 'Play ' + collection_name + ' at ' + port : 'Stop ' + collection_name + ' at ' + port) });
}

function run(motor_id, port, run) {
  sendDataStr([ 'FM' + motor_id + 'K'  + run], port);
  main.updateSerialProgress({ progress: 100, str: 'Run motor ' + motor_id + ' at ' + port });
}

function returnToStart(motor_id, collection_name, port) {
  sendDataStr([ 'FM' + motor_id + 'W:0:0' ], port);
  main.updateSerialProgress({ progress: 100, str: (play ? 'Return to start ' + collection_name + ' at ' + port : 'Stop ' + collection_name + ' at ' + port) });
}

function calibrateCurrentSense(uploadContent) {
  // sendDataStr([ 'FM' + motor_id + 'U' ], port);
  // main.updateSerialProgress({ progress: 100, str: 'Calibrate current sensors motor ' + motor_id + ' at ' + port });
  if (uploadContent.config) {
    receivingPort = ports.filter(p => p.COM === uploadContent.config.serialPort.path)[0];
    // motor = microcontroller.motors.filter(m => m.id === motor_id)[0];

    // receivingPort =
    tryToEstablishConnection(receivingPort, uploadContent, calibrate_current_sense);

  }
}

function calibrate_current_sense(port, uploadContent) {
  receivingPort = port;

  const motor = uploadContent.config.motors[0];

  if (motor) {

    datalist = [];

    datalist.unshift('FM' + motor.id + 'I' + motor.id);
    datalist.unshift('FM' + motor.id + 'S' + motor.config.supplyVoltage);
    datalist.unshift('FM' + motor.id + 'P' + motor.config.polepairs);
    datalist.unshift('FM' + motor.id + 'Z' + motor.config.calibration.value.toFixed(12));
    datalist.unshift('FM' + motor.id + 'N' + (motor.config.calibration.direction === 'CW' ? 1 : -1));
    datalist.unshift('FM' + motor.id + 'U');
    // datalist.unshift('FC' + motor.id);

    dataSendWaitList.push({ port: uploadContent.config.serialPort.path, data: datalist, totalItems: datalist.length });

    main.updateSerialProgress({ progress: 0, str: 'Calibrate current sensors motor ' + motor.id + ' at ' + receivingPort.COM });

    uploadFromWaitList(receivingPort);

    // sendDataStr([ 'FM' + motor.id + 'U' ], uploadContent.config.serialPort.path);
  } else {
    main.updateSerialProgress({ progress: 0, str: 'Error: Not able to calibrate motor at ' + receivingPort.COM });
  }
}


function calibrateMotor(uploadContent) {
  // console.log(uploadContent);
  if (uploadContent.config) {
    receivingPort = ports.filter(p => p.COM === uploadContent.config.serialPort.path)[0];
    // motor = microcontroller.motors.filter(m => m.id === motor_id)[0];

    // receivingPort =
    tryToEstablishConnection(receivingPort, uploadContent, calibrate_motor);
  }
}

function calibrate_motor(port, uploadContent) {
  receivingPort = port;

  const motor = uploadContent.config.motors[0];

  if (motor && receivingPort) {

    datalist = [];

    datalist.unshift('FM' + motor.id + 'I' + motor.id);
    datalist.unshift('FM' + motor.id + 'S' + motor.config.supplyVoltage);
    datalist.unshift('FM' + motor.id + 'P' + motor.config.polepairs);
    datalist.unshift('FM' + motor.id + 'R');
    datalist.unshift('FC' + motor.id);

    // console.log('datalist: ' + datalist);

    dataSendWaitList.push({ port: uploadContent.config.serialPort.path, data: datalist, totalItems: datalist.length });

    main.updateSerialProgress({ progress: 0, str: 'Calibrating motor at ' + receivingPort.COM });

    uploadFromWaitList(receivingPort);
  } else if (receivingPort) {
    main.updateSerialProgress({ progress: 0, str: 'Error: Not able to calibrate motor at ' + receivingPort.COM });
  }
}

function updateFilter(uploadContent) {
  if (uploadContent.config) {
    receivingPort = ports.filter(p => p.COM === uploadContent.config.serialPort.path)[0];

    // receivingPort =
    tryToEstablishConnection(receivingPort, uploadContent, update_filter);
  }
}


function update_filter(port, uploadContent) {
  receivingPort = port;

  if (receivingPort) {

    datalist = [];

    for (const filter of uploadContent.filters) {
      datalist.unshift('FF' + filter.type + ':' + filter.value.toFixed(2) + ':' + filter.smoothness);
    }
    // console.log('datalist: ' + datalist);
    // datalist.unshift('FC' + motor.id);

    dataSendWaitList.push({ port: uploadContent.config.serialPort.path, data: datalist, totalItems: datalist.length });
    main.updateSerialProgress({ progress: 0, str: 'Update filter ' + receivingPort.COM });
    uploadFromWaitList(receivingPort);

  } else {

    main.updateSerialProgress({ progress: 0, str: 'Error: Not able update filter at ' + receivingPort.COM });
  }

}


function sendDataString(uploadContent) {
  if (uploadContent.config) {
    receivingPort = ports.filter(p => p.COM === uploadContent.config.serialPort.path)[0];
    // receivingPort =
    tryToEstablishConnection(receivingPort, uploadContent, send_data_string);
  } else {
    main.updateSerialProgress({ progress: 0, str: 'Error: Not able to send data ' });
  }
}

function send_data_string(port, uploadContent) {
  receivingPort = port;

  if (receivingPort) {

    dataSendWaitList.push({ port: uploadContent.config.serialPort.path, data: [uploadContent.dataString], totalItems: 1 });
    main.updateSerialProgress({ progress: 0, str: 'Send data ' + receivingPort.COM });
    uploadFromWaitList(receivingPort);
  } else {
    main.updateSerialProgress({ progress: 0, str: 'Error: Not able to send data ' + receivingPort.COM });
  }

}




function updateMotorSetting(uploadContent) {
  // console.log('config: ' + uploadContent.config);
  if (uploadContent.config) {
    receivingPort = ports.filter(p => p.COM === uploadContent.config.serialPort.path)[0];

    // receivingPort =
    tryToEstablishConnection(receivingPort, uploadContent, updateMotorSettingCallback);
  }
}



function updateMotorSettingCallback(port, uploadContent) {
  receivingPort = port;

  datalist = [];

  if (uploadContent && uploadContent.config) {
    for (const motor of uploadContent.config.motors) {
      prepareMotorData(uploadContent, motor, datalist);
    }


    if (datalist.length > 0) {
      datalist.unshift('FC' + uploadContent.config.motorID);

      dataSendWaitList.push({ port: uploadContent.config.serialPort.path, data: datalist, totalItems: datalist.length });


      main.updateSerialProgress({ progress: 0, str: 'Updating settings at ' + receivingPort.COM });

      uploadFromWaitList(receivingPort);

    } else {
      main.updateSerialProgress({ progress: 0, str: 'Error: Not able to update settings at ' + receivingPort.COM });
    }
  }
}

// function updateStartPosition(data) {
//   console.log('config: ' + uploadContent.config);
//   if (uploadContent.config) {
//     receivingPort = ports.filter(p => p.COM === uploadContent.config.serialPort.path)[0];

//     receivingPort = tryToEstablishConnection(receivingPort, uploadContent, updateMotorSettingCallback);
//   }
// }

function listDevices(motor_id, port) {
  const datastr = 'FL' + motor_id;
  sendDataStr([ datastr ], port);
  main.updateSerialProgress({ progress: 50, str: 'list devices at ' + port + ' motor ' + motor_id });
}

function updateEffectData(char, data, effectIndex, port) {
  const datastr = 'FE' + char + effectIndex + ':' + data;
  sendDataStr([ datastr ], port);
  main.updateSerialProgress({ progress: 100, str: 'sending update effect to ' + port  });
}


function updateMotorControlVariable(char, data, motor_id, port) {
  const datastr = 'FM' + motor_id + char + data;
  sendDataStr([ datastr ], port);
  main.updateSerialProgress({ progress: 100, str: 'sending update motor control variable to ' + port });
}

function getValue(motor_id, port, char) {
  const datastr = 'FG' + motor_id + char;
  sendDataStr([ datastr ], port);
  main.updateSerialProgress({ progress: 50, str: 'request value' });
}


function sendDataStr(str, port, first = false) {
  receivingPort = ports.filter(p => p.COM === port)[0];
  if (!first) {
    dataSendWaitList.push({ port: port, data: str, totalItems: 1 });
  } else {
    dataSendWaitList.unshift({ port: port, data: str, totalItems: 1 });
  }
  uploadFromWaitList(receivingPort);
}





exports.checkSerialPorts = checkSerialPorts;
exports.listSerialPorts = listSerialPorts;
exports.writeDataString = writeDataString;
exports.createConnection = createConnection;
exports.connectToSerialPort = connectToSerialPort;
exports.closeSerialPort = closeSerialPort;
exports.closeAllSerialPorts = closeAllSerialPorts;
exports.calibrateMotor = calibrateMotor;
exports.calibrateCurrentSense = calibrateCurrentSense;
exports.updateFilter = updateFilter;
exports.updateMotorSetting = updateMotorSetting;
exports.play = play;
exports.run = run;
exports.returnToStart = returnToStart;
exports.uploadData = uploadData;
exports.updateMotorControlVariable = updateMotorControlVariable;
exports.updateEffectData = updateEffectData;
exports.requestData = requestData;
exports.sendDataString = sendDataString;
exports.getValue = getValue;
exports.listDevices = listDevices;
