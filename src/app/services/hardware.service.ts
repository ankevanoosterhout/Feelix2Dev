import { Injectable } from '@angular/core';
import { MicroController, Motor, ConnectedDevice, OtherDevices, ActuatorType } from '../models/hardware.model';
import { LocalStorageService } from 'ngx-webstorage';
import { v4 as uuid } from 'uuid';
import { Subject } from 'rxjs';


@Injectable()
export class HardwareService {

  public static readonly MICROCONTROLLER_LOCATION = 'ngx-webstorage|microcontrollers';
  public static readonly DEVICE_LOCATION = 'ngx-webstorage|registereddevices';

  availableCOMPortList = [];

  registeredDevices: Array<ConnectedDevice> = [];
  microcontrollers: Array<MicroController> = [];
  public microcontrollerObservable = new Subject<MicroController[]>();
  public registeredDevicesObservable = new Subject<ConnectedDevice[]>();
  public connectWithMicrocontroller = new Subject<any>();


  constructor(private localSt: LocalStorageService) {
    // retrieve files stored in local storage
    const data = this.localSt.retrieve('microcontrollers');

    if (data) {
      this.microcontrollers = data;
      this.disconnectAll();
    }

    const devices = this.localSt.retrieve('registereddevices');
    if (devices) {
      this.registeredDevices = devices;
      this.disconnectAllDevices();
    }


    window.addEventListener('storage', event => {
        if (event.storageArea === localStorage) {
          if (event.key === HardwareService.MICROCONTROLLER_LOCATION) {
            const microcontrollers: MicroController[] = JSON.parse(localStorage.getItem(HardwareService.MICROCONTROLLER_LOCATION));
            this.microcontrollers = microcontrollers;
            this.microcontrollerObservable.next(this.microcontrollers);
          }
          if (event.key === HardwareService.DEVICE_LOCATION) {
            const registeredDevices: ConnectedDevice[] = JSON.parse(localStorage.getItem(HardwareService.DEVICE_LOCATION));
            this.registeredDevices = registeredDevices;
            this.registeredDevicesObservable.next(this.registeredDevices);
          }
        }
      },
      false
    );
  }


  checkPorts(portlist: Array<any>) {
    console.log('checkPorts', portlist)
    for (const port of portlist) {
      console.log(this.microcontrollers);
      const savedItem = this.microcontrollers.filter(m => m.serialPort.path === port.serialPort.path)[0];
      console.log(savedItem);
      if (savedItem) {
        console.log(savedItem);
        savedItem.connected = true;
        this.connectWithMicrocontroller.next( savedItem );
      }
    }

  }

  addMicroController(COM: any, vendor: string, id = null) {
    if (COM && COM.serialPort) {
      if (this.microcontrollers.length > 0) {
        let controller = this.microcontrollers.filter(m => m.serialPort.path === COM.serialPort.path)[0];
        if (!controller) {
          this.microcontrollers.push(new MicroController((id ? id : uuid()), COM.serialPort, vendor));
        } else {
          controller = new MicroController(controller.id, COM.serialPort, vendor);
          controller.connected;
        }
      } else {
        this.microcontrollers.push(new MicroController((id ? id : uuid()), COM.serialPort, vendor));
      }
      this.store();

      return this.microcontrollers[this.microcontrollers.length - 1];
      // console.log(this.microcontrollers);
    }
  }

  addConnectedDevice(serialData: any) {
    if (serialData !== null) {
      if (this.registeredDevices.length > 0) {
        const device = this.registeredDevices.filter(m => m.serialPort.path === serialData.device.path);
        if (device.length === 0) {
          this.registeredDevices.push(
            new ConnectedDevice(uuid(), serialData.device, serialData.device.name));
        }

      } else {
        this.registeredDevices.push(
          new ConnectedDevice(uuid(), serialData.device, serialData.device.name));
        this.storeDevices();
      }
    }
  }

  addOtherDeviceToMicrocontroller(microcontroller: MicroController, device: any) {
    const controller = this.microcontrollers.filter(m => m.serialPort.path === microcontroller.serialPort.path)[0];
    if (controller && device) {
      const newDevice = new OtherDevices(device.serialPort);
      if (controller.dataToOtherDevices.filter(o => o.serialPort.path === newDevice.serialPort.path).length === 0) {
        controller.dataToOtherDevices.push(newDevice);
        this.store();
        return controller.dataToOtherDevices;
      }
    }
  }

  deleteOtherDeviceFromList(microcontroller: MicroController, device: any) {
    const controller = this.microcontrollers.filter(m => m.serialPort.path === microcontroller.serialPort.path)[0];
    if (controller) {
      const deviceObj = controller.dataToOtherDevices.filter(o => o.serialPort.path === device.serialPort.path)[0];
      const index = controller.dataToOtherDevices.indexOf(deviceObj);
      if (index > -1) {
        controller.dataToOtherDevices.splice(index, 1);
        this.store();
      }
    }
  }

  getRegisteredDevices() {
    return this.registeredDevices;
  }


  addActuators(microcontroller: MicroController, nrOfActuators: number) {
    const controller = this.microcontrollers.filter(m => m.serialPort.path === microcontroller.serialPort.path)[0];
    const numberOfMotors = controller.motors.length;

    const diff = nrOfActuators - numberOfMotors;
    if (diff > 0) {
      for (let n = 0; n < diff; n++) {
        const newMotor = new Motor((numberOfMotors + n), (numberOfMotors > 0 ? controller.motors[0].type : ActuatorType.bldc),
        (controller.motors[0].I2C_communication === 1 ? 2 : 0));

        controller.motors.push(newMotor);
      }
    } else if (diff < 0) {
      for (let n = diff; n < 0; n++) {
        controller.motors.pop();
      }
    }
    this.store();
  }


  updateMicroControllerDetails(microcontroller: MicroController, vendor: string) {
    const controller = this.microcontrollers.filter(m => m.serialPort.path === microcontroller.serialPort.path)[0];
    if (controller) {
      controller.vendor = vendor;
      this.store();
    }
  }

  updateMicroController(microcontroller: MicroController) {
    if (microcontroller) {
      let controller = this.microcontrollers.filter(m => m.serialPort.path === microcontroller.serialPort.path)[0];
      if (controller) {
        controller = microcontroller;
        this.store();
      }
    }
  }

  updateStatusMicroController(connected: boolean, serialPort: any) {
    const controller = this.microcontrollers.filter(m => m.serialPort.path === serialPort.path)[0];
    if (controller) {
      if (controller.connected !== connected) {
        controller.connected = connected;
        this.store();
      }
    }
  }

  updateStatusDevice(connected: boolean, serialPort: any) {
    const controller = this.registeredDevices.filter(m => m.serialPort.path === serialPort.path)[0];
    if (controller) {
      if (controller.connected !== connected) {
        controller.connected = connected;
        this.storeDevices();
      }
    }
  }

  deleteDevice(COM: string) {
    const device = this.registeredDevices.filter(m => m.serialPort.path === COM)[0];
    const index = this.registeredDevices.indexOf(device);
    if (index > -1) {
      this.registeredDevices.splice(index, 1);
      this.storeDevices();
    }
  }


  deleteMicroController(COM: string) {
    const microController = this.microcontrollers.filter(m => m.serialPort.path === COM)[0];
    if (microController) {
      const index = this.microcontrollers.indexOf(microController);
      if (index > -1) {
        this.microcontrollers.splice(index, 1);
        this.store();
      }
    }
  }



  updateMotorDetails(microcontroller: MicroController, motor: Motor) {
    const controller = this.microcontrollers.filter(m => m.serialPort.path === microcontroller.serialPort.path)[0];
    if (controller) {
      let m = controller.motors.filter(m => m.id === motor.id)[0];
      if (m) {
        m = motor;
        this.store();
      }
    }
  }

  getDataSendTime(microControllerID: string): number {
    const microController = this.microcontrollers.filter(m => m.id === microControllerID)[0];
    return microController.lastDataSend;
  }


  updateDataSendTime(microControllerID: string) {
    const microController = this.microcontrollers.filter(m => m.id === microControllerID)[0];
    microController.lastDataSend = new Date().getTime();
  }

  getAllMicroControllers() {
    return this.microcontrollers;
  }

  getActiveMicroControllers() {
    return this.microcontrollers.filter(m => m.connected);
  }

  getSelectedMicroController() {
    return this.microcontrollers.filter(m => m.selected)[0];
  }

  deviceConnected(deviceCOM: string) {
    const device = this.registeredDevices.filter(d => d.serialPort.path === deviceCOM)[0];
    return device && device.connected ? true : false;
  }

  selectMicroController(microcontroller: MicroController) {
    for (const controller of this.microcontrollers) {
      if (controller.serialPort.path !== microcontroller.serialPort.path) {
        controller.selected = false;
      } else {
        controller.selected = true;
      }
    }
    this.store();
  }

  getMicroControllerByCOM(com: string) {
    return this.microcontrollers.filter(m => m.serialPort.path === com)[0];
  }

  getMotor(com: string, id: number) {
    const microController = this.microcontrollers.filter(m => m.serialPort.path === com)[0];
    if (microController) {
      return microController.motors[id];
    }
    return;
  }

  updatePlay(com: string, vendor: string, playing: boolean) {
    const microcontroller = this.microcontrollers.filter(m => m.serialPort.path === com)[0];
    if (microcontroller) {
      microcontroller.playing = playing;
      this.store();
    } else if (com && vendor) {
      this.addMicroController(com, vendor);
    }
  }

  disconnectAll() {
    for (const controller of this.microcontrollers) {
      controller.connected = false;
    }
    this.store();
  }

  disconnectAllDevices() {
    for (const device of this.registeredDevices) {
      device.connected = false;
    }
    this.storeDevices();
  }

  clearList() {
    this.microcontrollers = [];
    this.availableCOMPortList = [];
    this.registeredDevices = [];
    this.store();
  }

  updateAvailableCOMPorts(portlist: any) {
    this.availableCOMPortList = portlist;
    this.store();
  }



  getAvailableCOMPorts(): Array<any> {
    return this.availableCOMPortList;
  }

  store() {
    this.microcontrollerObservable.next(this.microcontrollers);
    this.localSt.store('microcontrollers', this.microcontrollers);
    this.localSt.store('availablePorts', this.availableCOMPortList);
  }

  storeDevices() {
    this.registeredDevicesObservable.next(this.registeredDevices);
    this.localSt.store('registereddevices', this.registeredDevices);
  }



}
