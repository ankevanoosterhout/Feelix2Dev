import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { Collection, Layer, ScaleLabelMapping, scaleOption } from 'src/app/models/collection.model';
import { Details, Effect } from 'src/app/models/effect.model';
import { v4 as uuid } from 'uuid';
import { MicroController } from 'src/app/models/hardware.model';
import { HardwareService } from 'src/app/services/hardware.service';
import { MotorControlService } from 'src/app/services/motor-control.service';
import { DOCUMENT } from '@angular/common';
import { CloneService } from 'src/app/services/clone.service';
import { UploadService } from 'src/app/services/upload.service';
import { ElectronService } from 'ngx-electron';
import { EffectType, EffectTypeLabelMapping } from 'src/app/models/configuration.model';

@Component({
    selector: 'app-motor-control',
    templateUrl: './motor-control.component.html',
    styleUrls: ['./motor-control.component.css'],
})
export class MotorControlComponent implements OnInit, AfterViewInit {

  public EffectTypeLabelMapping = EffectTypeLabelMapping;
  public ScaleLabelMapping = ScaleLabelMapping;

  visualizationTypes = Object.values(EffectType).filter(value => typeof value === 'number');
  scaleOptions = Object.values(scaleOption).filter(value => typeof value !== 'string');


  microcontrollers = [];

  draggingListItem = null;


  PID_Controller = [
    { name: 'P', val: 0.5 },
    { name: 'I', val: 0.25 },
    { name: 'D',  val: 0.15 }
  ];


  unitOptions = [
    { name: 'deg', PR: 360 },
    { name: 'rad', PR: 2*Math.PI }
  ];

  unitOptionsVelocity = [
    { name: 'ms', PR: 1000 },
    { name: 'sec', PR: 1 }
  ];

  unitOptionsVelocityY = [
    { name: '%', PR: 100 },
    { name: 'deg', PR: 360 }
  ];

  oldUnits = { name: 'deg', PR: 360 };

  microcontrollerUploadList = [];

  constructor(@Inject(DOCUMENT) private document: Document, public motorControlService: MotorControlService, public hardwareService: HardwareService,
              private cloneService: CloneService, private uploadService: UploadService, private electronService: ElectronService) {


    this.microcontrollers = this.hardwareService.getAllMicroControllers();

    this.motorControlService.uploadAllCollections.subscribe(res => {
      this.uploadAll();
    });

    this.motorControlService.playAllCollections.subscribe(play => {
      this.playAll(play);
    });

    this.motorControlService.playSequence.subscribe(res => {
      this.playAllInSequence();
    });

    this.motorControlService.playAll.subscribe(data => {
      this.playAll(data.play, data.d);
    });

    this.electronService.ipcRenderer.on('playDataPressure', (event: Event, data: any) => {
      // console.log(data);

      for (const item of data.list) {
        const selectedCollection = this.motorControlService.file.collections.filter(c => c.playing && c.microcontroller && c.microcontroller.serialPort.path === data.serialPath && c.motorID && c.motorID.name === item.motorID)[0];

        if (selectedCollection) {

          const motor = selectedCollection.microcontroller.motors.filter(m => m.id === selectedCollection.motorID.name)[0];
          const pressure = item.d.filter((i: { name: string; }) => i.name === 'pressure')[0].val;

          // console.log(pressure);

          selectedCollection.time = item.d.filter((i: { name: string; }) => i.name === 'time')[0].val;

          if (motor) { motor.state.pressure = pressure; }

          if (this.document.getElementById('pressure-' + selectedCollection.id) !== null) {
            (this.document.getElementById('pressure-' + selectedCollection.id) as HTMLElement).innerHTML = (Math.round(pressure * 100) / 100) + ' ';
          }

          if (this.document.getElementById('time-' + selectedCollection.id) !== null) {
            (this.document.getElementById('time-' + selectedCollection.id) as HTMLElement).innerHTML = selectedCollection.time + ' ';
          }
          this.motorControlService.drawCursor(selectedCollection);
          let i = 0;
          for (const d of item.d) {
            if (d.name !== 'target' && d.name !== 'time') {
              this.drawFeedbackDataOnPlay(selectedCollection.rotation.loop, selectedCollection, d.val * 100, i);
              i++;
            }
          }
        }
      }
    });


    this.electronService.ipcRenderer.on('playData', (event: Event, data: any) => {
      // console.log(data);
      const d_angle = data.d.filter((d: { name: string; }) => d.name === 'angle')[0];
      const d_velocity = data.d.filter((d: { name: string; }) => d.name === 'velocity')[0];
      const selectedCollection = this.motorControlService.file.collections.filter(c => c.microcontroller && c.microcontroller.serialPort.path === data.serialPath && c.playing && c.motorID && c.motorID.name === data.motorID)[0];

      if (selectedCollection && d_angle && d_velocity) {
        let angle = selectedCollection.rotation.units.name === 'deg' ? d_angle.val * (180/Math.PI) : d_angle.val;

        if (selectedCollection.rotation.loop) {

          const range = selectedCollection.rotation.end - selectedCollection.rotation.start;
          // angle = this.fmod(d_angle.val * (180/Math.PI), range)
          angle = this.fmod(angle, range);
          if (angle < selectedCollection.rotation.start) {
            angle += range;
            // if (selectedCollection.rotation.units.name === 'deg') {
            //   angle += range;
            // } else {
            //   angle += (range * (Math.PI/180));
            // }
          }
        }
        selectedCollection.microcontroller.motors.filter(m => m.id === selectedCollection.motorID.name)[0].state.position.current = angle;


        const velocity = selectedCollection.rotation.units.name === 'deg' ? d_velocity.val * (180/Math.PI) : d_velocity.val;
        selectedCollection.microcontroller.motors.filter(m => m.id === selectedCollection.motorID.name)[0].state.speed = velocity;

        selectedCollection.time = data.d.filter((d: { name: string; }) => d.name === 'time')[0].val;

        if (this.document.getElementById('position-' + selectedCollection.id) !== null && selectedCollection.rotation.units.name !== 'ms' && selectedCollection.rotation.units.name !== 'sec') {
          (this.document.getElementById('position-' + selectedCollection.id) as HTMLElement).innerHTML = (Math.round(angle * 100) / 100) + ' ';
        }

        if (this.document.getElementById('speed-' + selectedCollection.id) !== null) {
          (this.document.getElementById('speed-' + selectedCollection.id) as HTMLElement).innerHTML = (Math.round(velocity * 100) / 100) + ' ';
        }
        if (this.document.getElementById('time-' + selectedCollection.id) !== null) {
          if (selectedCollection.rotation.units.name === 'ms' ||  selectedCollection.rotation.units.name === 'sec') {
            (this.document.getElementById('time-' + selectedCollection.id) as HTMLElement).innerHTML =
              (selectedCollection.rotation.units.name === 'ms' ? selectedCollection.time : selectedCollection.time /1000)  + ' ';
          }
        }
        this.motorControlService.drawCursor(selectedCollection);


        if (selectedCollection.visualizationType === EffectType.velocity && selectedCollection.time) {
          const feedbackValue = selectedCollection.rotation.units_y.name === 'deg' ? d_angle.val * (180/Math.PI) : ((velocity / selectedCollection.microcontroller.motors[selectedCollection.motorID.index].config.velocityLimit) * 100);
          this.drawFeedbackDataOnPlay(selectedCollection.rotation.loop, selectedCollection, feedbackValue);
        }


        // const microcontroller = this.microcontrollers.filter(m => m.serialPort.path === data.serialPath)[0];
        // if (microcontroller && selectedCollection.microcontroller.motors.filter(m => m.id === selectedCollection.motorID.name)[0].config.inlineCurrentSensing) {
        //   if (this.document.getElementById('current_sense_a-' + selectedCollection.id) !== null) {
        //     const current_a = (Math.round(data.current_a * 100) / 100);
        //     const current_b = (Math.round(data.current_b * 100) / 100);
        //     (this.document.getElementById('current_sense_a-' + selectedCollection.id) as HTMLElement).innerHTML = current_a === 0 ? 'a: 0.00' : 'a: ' + current_a + ' ';
        //     (this.document.getElementById('current_sense_b-' + selectedCollection.id) as HTMLElement).innerHTML = current_b === 0 ? 'b: 0.00' : 'b: ' + current_b + ' ';
        //   }
        // }
      }
    });

    this.electronService.ipcRenderer.on('zero_electric_angle', (event: Event, data: any) => {
      const microcontroller = this.hardwareService.getMicroControllerByCOM(data.serialPath);
      if (microcontroller) {
        const motor = microcontroller.motors.filter(m => m.id === data.motorID)[0];
        if (motor) {
          motor.config.calibration.value = data.zero_electric_angle;
          motor.config.calibration.direction = data.direction === 1 ? 'CW' : 'CCW';
          this.hardwareService.updateMicroController(microcontroller);
        }
      }
    });

    // this.electronService.ipcRenderer.on('updateCurrentSenseCalibration', (event: Event, data: any) => {
    //   const microcontroller = this.hardwareService.getMicroControllerByCOM(data.serialPath);
    //   if (microcontroller) {
    //     const motor = microcontroller.motors.filter(m => m.id === data.motorID)[0];
    //     if (motor) {
    //       motor.config.current_sense_calibration = data.current_sense_calibration;
    //       this.hardwareService.updateMicroController(microcontroller);
    //     }
    //   }
    // });



    this.electronService.ipcRenderer.on('upload_succesful', (event: Event, collection: any) => {
      const selectedCollection = this.motorControlService.file.collections.filter(c => c.id === collection)[0];
      if (selectedCollection) {
        if (selectedCollection.rotation.units.name !== 'ms' && selectedCollection.rotation.units.name !== 'sec') {
          selectedCollection.playing = true;
          this.motorControlService.updateCollection(selectedCollection);
        } else {
          selectedCollection.feedbackData = [];
        }
      }
    });

    this.electronService.ipcRenderer.on('deleteMicrocontrollerCollections', (event: Event, microcontroller: any) => {
      for (const collection of this.motorControlService.file.collections) {
        if (collection.microcontroller && collection.microcontroller.id === microcontroller.id) {
          collection.microcontroller = null;
          this.motorControlService.updateCollection(collection);
        }
      }
    });

    this.electronService.ipcRenderer.on('updateStatus', (event: Event, data: any) => {
      console.log(data);
      this.hardwareService.updatePlay(data.microcontroller.port.path, data.microcontroller.type, data.connected);

      if (!data.connected) {
        for (const c of this.motorControlService.file.collections) {
          if (c.playing && c.microcontroller && c.microcontroller.serialPort.path === data.microcontroller.port.path) {
            c.playing = false;
            this.motorControlService.updateCollection(c);
          }
        }
        if (this.motorControlService.file.collections.filter(c => c.playing).length === 0) {
          (this.document.getElementById('tool-motor-control-4') as HTMLImageElement).src = this.motorControlService.toolList[4].icon;
          this.document.getElementById('tool-motor-control-5').classList.remove('disabled');
        }
      }
    });

    this.electronService.ipcRenderer.on('addCollection', (event: Event) => {
      this.motorControlService.addCollection(true);
    });

    this.electronService.ipcRenderer.on('uploadAll', (event: Event) => {
      this.uploadAll();
    });

    this.electronService.ipcRenderer.on('playAll', (event: Event, play:any) => {
      this.playAll(play);
    });

    this.electronService.ipcRenderer.on('playAllSequenceWindow', (event: Event, data:any) => {
      this.playAllInSequence();
    });
  }


  ngOnInit() {
    this.hardwareService.microcontrollerObservable.subscribe(microcontrollers => {
      this.microcontrollers = microcontrollers;

      for (const microcontroller of this.microcontrollers) {
        const microcontrollerCollections = this.motorControlService.file.collections.filter(c => c.microcontroller && c.microcontroller.serialPort.path === microcontroller.serialPort.path);

        for (const collection of microcontrollerCollections) {
          collection.microcontroller = microcontroller;
        }
      }
    });
  }

  fmod(val: number, mod: number) {
    return ((val * 100) % (mod * 100) / 100);
  }

  ngAfterViewInit(): void {
    this.motorControlService.drawCollections();
    this.updatePlayButtonsToolbar(true);
  }


  getAverage(array: Array<number>) {
    let total = 0.0;
    let count = 0;

    for (const item of array) {
      total += item;
      count++;
    }
    return total / count;
  }

  selectMicrocontroller(collectionID: string, microcontroller: MicroController) {
    this.motorControlService.file.collections.filter(c => c.id === collectionID)[0].microcontroller = microcontroller;
  }


  toggleVisibility(collection: Collection, layer: Layer) {
    collection.layers.filter(l => l.name === layer.name)[0].visible = !collection.layers.filter(l => l.name === layer.name)[0].visible;
    this.motorControlService.saveCollection(collection);
  }

  toggleLocked(collection: Collection, layer: Layer) {
    collection.layers.filter(l => l.name === layer.name)[0].locked = !collection.layers.filter(l => l.name === layer.name)[0].locked;
    this.motorControlService.saveCollection(collection);
  }

  drawFeedbackDataOnPlay(loop: boolean, collection: Collection, data: number, index = 0) {

    if (collection) {

      if (loop && collection.feedbackData.length > 0 && collection.feedbackData[index] && collection.feedbackData[index][collection.feedbackData[index].length - 1].time >= collection.time) {
        collection.feedbackData[index] = [];
      }

      if (loop || (!loop && (collection.feedbackData.length === 0 || collection.feedbackData[index] && (collection.feedbackData[index].length === 0 ||
          (collection.feedbackData[index].length > 0 && collection.feedbackData[index][collection.feedbackData[index].length - 1].time <= collection.rotation.end))))) {


        if (index < collection.feedbackData.length) {
          collection.feedbackData[index].push({ value: data, time: collection.time });
        } else {
          const newArray = [];
          newArray.push({ value: data, time: collection.time });
          collection.feedbackData.push(newArray);
        }
      }

      this.motorControlService.drawCollectionFeedbackData(collection, index);
    }
  }

  resetRenderData(collection: Collection) {
    collection.effectDataList = [];
    collection.overlappingData = [];
    collection.renderedData = [];
  }

  render(collection: Collection, upload = false) {

      if (collection.effectDataList.length > 0) {
        if (collection.playing) {
          this.play(false, collection);
        }
        this.resetRenderData(collection);

      } else {
        if (this.motorControlService.file.effects.length > 0) {
          this.uploadService.renderCollection(collection, this.motorControlService.file.effects);
        }
      }
      this.motorControlService.updateCollection(collection);
      if (upload && collection.effectDataList.length > 0) {
        this.upload(collection);
      }
  }



  send_collection(collection: Collection) {
    this.electronService.ipcRenderer.send('send_collection_data', collection);
  }

  upload(collection: Collection, newMCU = true) {
    if (collection.effectDataList.length > 0) {
      const microcontroller = this.hardwareService.getMicroControllerByCOM(collection.microcontroller.serialPort.path);
      const uploadModel = this.uploadService.createUploadModel(collection, microcontroller);

      // turn active (playing) collections off on the same port/motor
      const playingCollections = this.motorControlService.file.collections.filter(c => c.playing && c.microcontroller && c.microcontroller.serialPort.path === collection.microcontroller.serialPort.path && c.motorID.name === collection.motorID.name);
      for (let pC of playingCollections) {
        pC.playing = false;
        this.motorControlService.updateCollection(pC);
      }
      uploadModel.newMCU = newMCU;

      this.electronService.ipcRenderer.send('upload', uploadModel);

    } else {
      this.render(collection, true);
    }
  }

  uploadAll() {
    this.microcontrollerUploadList = [];
    for (const collection of this.motorControlService.file.collections) {

      if (collection.microcontroller) {
        if (this.microcontrollerUploadList.filter(m => m.mcu === collection.microcontroller.id && m.motorID === collection.motorID.name).length === 0) {
          // upload collection check if the microcontroller already appears in upload list
          this.upload(collection, (this.microcontrollerUploadList.filter(m => m.mcu === collection.microcontroller.id).length === 0 ? true : false));

          this.microcontrollerUploadList.push({ id: collection.id, mcu: collection.microcontroller.id, motorID: collection.motorID.name, name: collection.name, time: 0, type: collection.visualizationType });
        } else {
          collection.playing = false;
        }
      }
    }
    if (this.microcontrollerUploadList.length === 0) {
      this.electronService.ipcRenderer.send('showMessage', 'Unable to upload, no microcontroller selected');
    }

    const buttonDisabled = this.microcontrollerUploadList.filter(m => m.type >= 2).length > 0 ? false : true;
    this.updatePlayButtonsToolbar(buttonDisabled);
  }


  updatePlayButtonsToolbar(buttonDisabled: boolean) {

    this.motorControlService.toolList[4].disabled = buttonDisabled;
    this.motorControlService.toolList[5].disabled = buttonDisabled;

    const toolbarHidden = this.document.getElementById('toolbar-motor-control').classList.contains('hide');

    if (!toolbarHidden) {
      if (!buttonDisabled) {
        this.document.getElementById('tool-motor-control-4').classList.remove('disabled');
        this.document.getElementById('tool-motor-control-5').classList.remove('disabled');
      } else {
        this.document.getElementById('tool-motor-control-4').classList.add('disabled');
        this.document.getElementById('tool-motor-control-5').classList.add('disabled');
      }
    } else {
      this.electronService.ipcRenderer.send('updateMotorControlToolbarButton', buttonDisabled);
    }
  }


  play(play: boolean, collection: Collection) {
    if (collection.effects.length > 0) {
      if (collection.effectDataList.length > 0) {
        this.electronService.ipcRenderer.send('play_collection', { play: play, motor_id: collection.motorID.name, collection_name: collection.name, port: collection.microcontroller.serialPort.path });
        if (play) {
          if (collection.time > collection.rotation.end || collection.time == undefined) {
            collection.time = 0;
          }
          collection.playing = true;
        } else {
          collection.playing = false;
        }
        collection.feedbackData = [];
        this.motorControlService.saveCollection(collection);
      } else {
        this.upload(collection);
      }
    } else {
      this.electronService.ipcRenderer.send('showMessage', 'Add effects to the collection');
    }
  }


  playAll(play: boolean, sequence = null) {
    if (this.microcontrollerUploadList.filter(m => m.type >= 2).length > 0) {
      // const play = this.motorControlService.file.collections.filter(c => c.id === this.microcontrollerUploadList.filter(m => m.type >= 2)[0].id)[0].playing ? false : true;
      // // console.log(play);
      for (const collection of this.motorControlService.file.collections) {
        if (collection.visualizationType >= 2 && collection.playing != play) {
          if (this.microcontrollerUploadList.filter(m => m.mcu === collection.microcontroller.id).length !== 0) {
            if (sequence) {
              const seq = sequence.filter((s: { id: string; }) => s.id === collection.id)[0];
              if (seq) {
                setTimeout(() => {
                  this.play(play, collection);
                }, seq.time);
              }
            } else {
              this.play(play, collection);
            }
          }
        }
      }
      if (play) {
        (this.document.getElementById('tool-motor-control-4') as HTMLImageElement).src = this.motorControlService.toolList[4].icon2;
        this.document.getElementById('tool-motor-control-5').classList.add('disabled');
      } else {
        (this.document.getElementById('tool-motor-control-4') as HTMLImageElement).src = this.motorControlService.toolList[4].icon;
        this.document.getElementById('tool-motor-control-5').classList.remove('disabled');
      }
    } else {
      this.uploadAll();
    }
  }

  playAllInSequence() {
    if (this.microcontrollerUploadList.length > 0) {
      this.motorControlService.playAllInSequence.next(this.microcontrollerUploadList);
    } else {
      this.uploadAll();
    }
  }

  returnToStart(collection: Collection) {
    if (collection && collection.microcontroller) {
      if (collection.motorID.name) {
        this.electronService.ipcRenderer.send('return_to_start', { motor_id: collection.motorID.name, collection_name: collection.name, port: collection.microcontroller.serialPort.path });
      }
    }
  }

  loop(collectionID: string) {
    const collection = this.motorControlService.file.collections.filter(c => c.id === collectionID)[0];
    collection.rotation.loop = !collection.rotation.loop;
    if (collection.rotation.units.name !== 'ms' && collection.rotation.units.name !== 'sec') {

      for (const effect of collection.effects) {
        effect.infinite = collection.rotation.loop;
      }
    }
    this.smallScale(collection);
  }

  constrain(collectionID: string) {
    const collection = this.motorControlService.file.collections.filter(c => c.id === collectionID)[0];
    collection.rotation.constrain = !collection.rotation.constrain;
    this.smallScale(collection);
  }

  smallScale(collection: Collection) {
    if (collection.rotation.loop || collection.rotation.constrain) {
      collection.config.scale.graphD3 = null;
      collection.config.scale.value = scaleOption.scale75;
    }
    this.motorControlService.updateScale(collection);
  }

  copy(collection: Collection) {
    this.motorControlService.copyCollection(collection);
  }

  delete(collection: Collection) {
    this.motorControlService.deleteCollection(collection);
  }

  toggleMidi(collection: Collection) {
    collection.config.midi = !collection.config.midi;
    this.motorControlService.updateCollection(collection);
    this.motorControlService.drawCollection(collection);
  }

  changeUnits(collection: Collection) {
    const multiply = (collection.rotation.units.PR/this.oldUnits.PR);
    if (multiply !== 1) {

      collection.rotation.start *= multiply;
      collection.rotation.end *= multiply;

      if (collection.rotation.units.name === 'ms') {
        collection.rotation.start = 0;
        if (collection.rotation.end < collection.rotation.start) {
          const range = collection.rotation.start - collection.rotation.end;
          collection.rotation.end = collection.rotation.start + range;
        }
      }

      for (const effect of collection.effects) {
        effect.position.x *= multiply;
        effect.position.width *= multiply;
        for (const instance of effect.repeat.repeatInstances) {
          instance.x *= multiply;
        }
      }
      this.oldUnits = collection.rotation.units;
      this.motorControlService.updateCollection(collection);
    }
  }


  changeUnitsY(collection: Collection) {
    if (collection.rotation.units_y.name === '%') {
      collection.rotation.start_y = -100;
      collection.rotation.end_y = 100;
    } else if (collection.rotation.units_y.name === 'deg') {
      for (const collEffect of collection.effects) {
        const effect = this.motorControlService.file.effects.filter(e => e.id === collEffect.effectID)[0];
        if (effect) {
          if (effect.range_y.start < collection.rotation.start_y) { collection.rotation.start_y = effect.range_y.start; }
          if (effect.range_y.end > collection.rotation.end_y) { collection.rotation.end_y = effect.range_y.end; }
        }
      }
    }
    this.motorControlService.updateCollection(collection);
  }

  compareValue(val1: any, val2: any) {
    return val1 && val2 ? val1.value === val2.value : val1 === val2;
  }

  compareCOM(port1: any, port2: any) {
    return port1 && port2 ? port1.serialPort.path === port2.serialPort.path : port1 === port2;
  }
  compareID(el1: any, el2: any) {
    return el1 && el2 ? el1.id === el2.id : el1 === el2;
  }

  compareName(el1: any, el2: any) {
    return el1 && el2 ? el1.name === el2.name : el1 === el2;
  }

  focusInputField(focus: boolean) {
    this.motorControlService.deselectCollectionEffects();
    this.motorControlService.updateInputFieldFocus(focus);
  }

  // updateRangeValues(collection: Collection) {
  //   collection.rotation.start = collection.rotation.units.name !== 'ms' ? parseFloat((this.document.getElementById('range-start') as HTMLInputElement).value) : 0;
  //   collection.rotation.end = parseFloat((this.document.getElementById('range-end') as HTMLInputElement).value);
  //   this.motorControlService.updateCollection(collection);
  // }

  // updateRangeYValues(collection: Collection) {
    // this.motorControlService.updateCollection(collection);
  // }


  updateVisualizationType(collection: Collection) {
    if (collection.visualizationType === EffectType.position) {

      collection.rotation.start_y = 0;
      collection.rotation.end_y = 100;

      if (collection.rotation.units.name === 'ms' || collection.rotation.units.name === 'sec') {
        this.oldUnits = collection.rotation.units;
        collection.rotation.units = { name: 'deg', PR: 360 };
        this.changeUnits(collection);

        collection.rotation.units_y = { name: '%', PR: 100 };
      }
    } else if (collection.visualizationType === EffectType.torque) {
      collection.rotation.start_y = -100;
      collection.rotation.end_y = 100;

      if (collection.rotation.units.name === 'ms' || collection.rotation.units.name === 'sec') {
        this.oldUnits = collection.rotation.units;
        collection.rotation.units = { name: 'deg', PR: 360 };
        this.changeUnits(collection);
        collection.rotation.units_y = { name: '%', PR: 100 };
      }
    } else if (collection.visualizationType === EffectType.velocity) {
        collection.rotation.start_y = -100;
        collection.rotation.end_y = 100;
        this.oldUnits = collection.rotation.units;
        collection.rotation.units = { name: 'ms', PR: 1000 };
        this.changeUnits(collection);
        collection.rotation.units_y = { name: '%', PR: 100 };
        this.changeUnitsY(collection);

    } else if (collection.visualizationType === EffectType.pneumatic) {
        collection.rotation.start_y = 0; //0
        collection.rotation.end_y = 100;
        this.oldUnits = collection.rotation.units;
        collection.rotation.units = { name: 'sec', PR: 1 };
        this.changeUnits(collection);
        collection.rotation.units_y = { name: '%', PR: 100 };
    }
    this.motorControlService.drawCollection(collection);
  }

  updateMotorID(collection: Collection) {
    let _index = 0;
    for (const motor of collection.microcontroller.motors) {
      if (collection.motorID.name === motor.id) {
        collection.motorID.index = _index;
        this.saveCollection(collection);
        break;
      }
      _index++;
    }
  }

  saveCollection(collection: Collection) {
    this.motorControlService.updateCollection(collection);
  }

  saveMotorData(collection: Collection, datatype = null, data = null) {

    const coll_microcontroller = this.hardwareService.getMicroControllerByCOM(collection.microcontroller.serialPort.path);
    if (coll_microcontroller) {
      if (collection.visualizationType === EffectType.position || collection.rotation.units_y.name === 'deg') {
        coll_microcontroller.motors.filter(m => m.id === collection.motorID.name)[0].config.position_pid = collection.microcontroller.motors[collection.motorID.index].config.position_pid;
      }
      if (collection.visualizationType === EffectType.velocity && collection.rotation.units_y.name !== 'deg') {
        coll_microcontroller.motors.filter(m => m.id === collection.motorID.name)[0].config.velocity_pid = collection.microcontroller.motors[collection.motorID.index].config.velocity_pid;
        coll_microcontroller.motors.filter(m => m.id === collection.motorID.name)[0].config.velocityLimit = collection.microcontroller.motors[collection.motorID.index].config.velocityLimit;
      }
      if (collection.visualizationType === EffectType.torque) {
        coll_microcontroller.motors.filter(m => m.id === collection.motorID.name)[0].config.voltageLimit = collection.microcontroller.motors[collection.motorID.index].config.voltageLimit;
      }
      if (collection.visualizationType === EffectType.pneumatic) {
        coll_microcontroller.motors.filter(m => m.id === collection.motorID.name)[0].config.inflate_pid = collection.microcontroller.motors[collection.motorID.index].config.inflate_pid;
        coll_microcontroller.motors.filter(m => m.id === collection.motorID.name)[0].config.deflate_pid = collection.microcontroller.motors[collection.motorID.index].config.deflate_pid;
        coll_microcontroller.motors.filter(m => m.id === collection.motorID.name)[0].config.pressureLimit = collection.microcontroller.motors[collection.motorID.index].config.pressureLimit;
      }

      this.hardwareService.updateMicroController(coll_microcontroller);

      if (datatype && data && collection.playing) {
        const dataStr = data.length > 1 ? ':' + data.join(":") : data[0];
        this.electronService.ipcRenderer.send('update_motor_variable', { char: datatype, d: dataStr, motor_id: collection.motorID.name, port: collection.microcontroller.serialPort.path });
        // this.motorControlService.drawCollection(collection);
      }
    }
  }

  getCollectionFromClassName(id: string) {
    if (id) {
      const collectionID = id.substring(4);
      if (collectionID) {
        const collection = this.motorControlService.file.collections.filter(c => c.id === collectionID)[0];
        return collection;
      }
    }
    return;
  }

  public allowDrop(e: any) {

    e.preventDefault();
    if (this.draggingListItem === null) {
      const id = e.target.id;
      const tmpEffect = this.motorControlService.getTmpEffect();
      // console.log(tmpEffect);
      if (tmpEffect && ((tmpEffect.type === EffectType.midi && tmpEffect.data) || tmpEffect.paths.length > 0)) {

        const collection = this.getCollectionFromClassName(id);
        const dropEffect = tmpEffect.storedIn === 'library' && this.motorControlService.file.effects.filter(e => e.id === tmpEffect.id).length > 0 ?
          this.motorControlService.file.effects.filter(e => e.id === tmpEffect.id)[0] : tmpEffect;

        if (collection && tmpEffect) {
          const multiply = collection.rotation.units.PR / dropEffect.grid.xUnit.PR;
          const effectDetails = new Details(uuid(), dropEffect.id, dropEffect.name + '-' + collection.name, dropEffect.grid.xUnit.name);
          // console.log(multiply, effectDetails);
          effectDetails.position.width = dropEffect.size.width * multiply;
          effectDetails.position.x = collection.config.newXscale.invert(e.offsetX) - (effectDetails.position.width / 2);
          effectDetails.position.height = dropEffect.size.height;
          effectDetails.position.y = 0;
          effectDetails.position.top = dropEffect.size.top;
          effectDetails.position.bottom = dropEffect.size.bottom;


          this.motorControlService.drawTmpEffect(effectDetails, collection, dropEffect);
        }
      }
    }
  }

  public removeTmpEffect(e: any) {
    e.preventDefault();
    this.motorControlService.deleteTmpEffect();
  }

  public resetTmpEffect() {
    this.motorControlService.config.tmpEffect = null;
  }

  // this function checks wheter there is a tmpEffect being dragged onto the collection
  // when an effect is detected its details are copied into array of effects of the collection item it is dropped upon
  public drop(e: any) {
    e.preventDefault();
    if (this.draggingListItem === null) {
      const id = e.target.id;
      const tmpEffect = this.motorControlService.getTmpEffect();
      if (tmpEffect && tmpEffect.paths.length > 0) {

        if (id) {
          const collection = this.getCollectionFromClassName(id);
          if (collection) {

            if (collection.effects.length === 0 && collection.visualizationType !== tmpEffect.type) {
              collection.visualizationType = tmpEffect.type;

              if (collection.rotation.units.name !== tmpEffect.grid.xUnit.name) {
                collection.rotation.units = tmpEffect.grid.xUnit;
                collection.rotation.start = tmpEffect.range.start;
                collection.rotation.end = tmpEffect.range.end;
              }
              collection.rotation.units_y = tmpEffect.grid.yUnit;
              collection.rotation.start_y = tmpEffect.range_y.start;
              collection.rotation.end_y = tmpEffect.range_y.end;
            }
            const multiply = collection.rotation.units.PR / tmpEffect.grid.xUnit.PR;


            if (collection && tmpEffect && !(tmpEffect.type === EffectType.velocity && collection.visualizationType !== EffectType.velocity)) {

              const copyTmpEffect = this.cloneService.deepClone(tmpEffect);

              if (tmpEffect.storedIn === 'library') {
                copyTmpEffect.storedIn = 'file';
                copyTmpEffect.date.modified = new Date().getTime();
                copyTmpEffect.id = uuid();
                const instances = this.motorControlService.file.effects.filter(e => e.name.includes(copyTmpEffect.name + '-copy') && e.date.created === copyTmpEffect.date.created).length;
                copyTmpEffect.name += instances > 0 ? '-copy-' + instances : '-copy';

                this.motorControlService.file.effects.push(copyTmpEffect);
              }

              const effectDetails = new Details(uuid(), copyTmpEffect.id, copyTmpEffect.name + '-' + collection.name, copyTmpEffect.grid.xUnit.name);
              effectDetails.position.width = tmpEffect.size.width * multiply;
              effectDetails.position.x = collection.config.newXscale.invert(e.offsetX) - (effectDetails.position.width / 2);
              effectDetails.position.height = tmpEffect.size.height;
              effectDetails.position.y = 0;
              effectDetails.position.top = tmpEffect.size.top;
              effectDetails.position.bottom = tmpEffect.size.bottom;
              if (tmpEffect.grid.xUnit.name === 'ms') { effectDetails.quality = Math.ceil(effectDetails.position.width / 100); }
              else if (tmpEffect.grid.xUnit.name === 'sec') { effectDetails.quality = Math.ceil((effectDetails.position.width * 1000)/ 500); }
              else { effectDetails.quality = Math.ceil(effectDetails.position.width / 20); }

              if (collection.rotation.loop && collection.visualizationType < 2 && tmpEffect.type < 2) {
                effectDetails.infinite = true;
              }

              collection.effects.push(effectDetails);

              collection.renderedData = [];
              collection.effectDataList = [];

              if (collection.visualizationType >= 2 && tmpEffect.type >= 2) {
                if (tmpEffect.grid.yUnit.name === 'deg') {
                  if (collection.rotation.start_y > tmpEffect.range_y.start) { collection.rotation.start_y = tmpEffect.range_y.start; }
                  if (collection.rotation.end_y < tmpEffect.range_y.end) { collection.rotation.end_y = tmpEffect.range_y.end; }
                }

                if (collection.rotation.end - collection.rotation.start < tmpEffect.size.width * multiply ) {
                  collection.rotation.end = collection.rotation.start + (tmpEffect.size.width * multiply);
                }
              }

              this.motorControlService.drawCollection(collection);
            }
          }
        }
      }
      this.motorControlService.deleteTmpEffect();
      this.motorControlService.config.tmpEffect = null;
    }
  }

  moveCollection(id: string, direction: number) {
    const collectionObject = this.motorControlService.file.collections.filter(c => c.id === id)[0];
    if (collectionObject) {
      const index = this.motorControlService.file.collections.indexOf(collectionObject);
      const collectionCopy = this.cloneService.deepClone(collectionObject);
      let newIndex = direction < 0 ? index - 1 : index + 1;
      if (newIndex < 0) { newIndex = this.motorControlService.file.collections.length - 1; }
      if (newIndex >= this.motorControlService.file.collections.length) { newIndex = 0; }
      this.motorControlService.file.collections.splice(index, 1);
      this.motorControlService.file.collections.splice(newIndex, 0, collectionCopy);

      setTimeout(() => {
        this.motorControlService.drawCollections(this.motorControlService.file.collections);
      }, 50);
    }
  }


}
