
import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { Activation, ActivationLabelMapping, Basic_options, Classifier, Constraint, ConstraintLabelMapping, Convolutional_options,
         DataFormat, DataFormatMapping, Layer, LayerType, Model, ModelType, ModelTypeMapping, Normalization_options, Options, Padding,
         PaddingMapping, Pooling_options, Recurrent_options, VariableType, VariableTypeMapping } from 'src/app/models/tensorflow.model';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { v4 as uuid } from 'uuid';
import { ElectronService } from 'ngx-electron';
import { TensorFlowModelDrawService } from 'src/app/services/tensorflow-model-draw.service';
import { HardwareService } from 'src/app/services/hardware.service';
import { ActuatorType, Motor } from 'src/app/models/hardware.model';
import { UploadService } from 'src/app/services/upload.service';
import * as tf from '@tensorflow/tfjs';
import { DOCUMENT } from '@angular/common';
import { TensorFlowTrainService } from 'src/app/services/tensorflow-train.service';

@Component({
  selector: 'app-tensorflow-model',
  templateUrl: 'tensorflow-model.component.html',
  styleUrls: ['../../windows/effects/effects.component.css','./../tensorflow.component.scss'],
})
export class TensorflowModelComponent implements OnInit {

  public d: TensorFlowData;

  public ActivationLabelMapping = ActivationLabelMapping;
  public activationOptions = Object.values(Activation);

  public ModelTypeMapping = ModelTypeMapping;
  public modelTypeOptions = Object.values(ModelType).filter(value => typeof value === 'number');

  public VariableTypeMapping = VariableTypeMapping;
  public variableTypeOptions = Object.values(VariableType).filter(value => typeof value === 'number');

  public ConstraintLabelMapping = ConstraintLabelMapping;
  public constraintOptions = Object.values(Constraint);

  public DataFormatMapping = DataFormatMapping;
  public dataFormatOptions = Object.values(DataFormat);

  public PaddingMapping = PaddingMapping;
  public paddingOptions = Object.values(Padding);





  public LayerTypes = [
    new LayerType('dense', 'basic', tf.layers.dense),
    new LayerType('activation', 'basic', tf.layers.activation),
    new LayerType('dropout', 'basic', tf.layers.dropout),
    new LayerType('embedding', 'basic', tf.layers.embedding),
    new LayerType('flatten', 'basic', tf.layers.flatten),
    new LayerType('permute', 'basic', tf.layers.permute),
    new LayerType('repeatVector', 'basic', tf.layers.repeatVector),
    new LayerType('reshape', 'basic', tf.layers.reshape),
    new LayerType('spatialDropout1d', 'basic', tf.layers.spatialDropout1d),

    new LayerType('layerNormalization', 'normalization', tf.layers.layerNormalization),
    new LayerType('batchNormalization', 'normalization', tf.layers.batchNormalization),

    new LayerType('conv1d', 'convolutional', tf.layers.conv1d, { dimensions: 1 }),
    new LayerType('conv2d', 'convolutional', tf.layers.conv2d, { dimensions: 2 }),
    new LayerType('conv2dTranspose', 'convolutional', tf.layers.conv2dTranspose, { dimensions: 2 }),
    new LayerType('conv3d', 'convolutional', tf.layers.conv3d, { dimensions: 3}),
    new LayerType('cropping2D', 'convolutional', tf.layers.cropping2D, { dimensions: 2 }),
    new LayerType('depthwiseConv2d', 'convolutional', tf.layers.depthwiseConv2d, { dimensions: 2 }),
    new LayerType('separableConv2d', 'convolutional', tf.layers.separableConv2d, { dimensions: 2 }),
    new LayerType('upSampling2d', 'convolutional', tf.layers.upSampling2d, { dimensions: 2 }),

    new LayerType('convLstm2d', 'recurrent', tf.layers.convLstm2d, { dimensions: 2 }),
    new LayerType('convLstm2dCell', 'recurrent', tf.layers.convLstm2dCell, { dimensions: 2 }),
    new LayerType('gru', 'recurrent', tf.layers.gru),
    new LayerType('gruCell', 'recurrent', tf.layers.gruCell),
    new LayerType('lstm', 'recurrent', tf.layers.lstm),
    new LayerType('lstmCell', 'recurrent', tf.layers.lstmCell),
    new LayerType('rnn', 'recurrent', tf.layers.rnn),
    new LayerType('simpleRNN', 'recurrent', tf.layers.simpleRNN),
    new LayerType('simpleRNNCell', 'recurrent', tf.layers.simpleRNNCell),
    new LayerType('stackedRNNCells', 'recurrent', tf.layers.stackedRNNCells),

    new LayerType('averagePooling1d', 'pooling', tf.layers.averagePooling1d, { dimensions: 1 }),
    new LayerType('averagePooling2d', 'pooling', tf.layers.averagePooling2d, { dimensions: 2 }),
    new LayerType('averagePooling3d', 'pooling', tf.layers.averagePooling3d, { dimensions: 3 }),
    new LayerType('globalAveragePooling1d', 'pooling', tf.layers.globalAveragePooling1d, { dimensions: 1 }),
    new LayerType('globalAveragePooling2d', 'pooling', tf.layers.globalAveragePooling2d, { dimensions: 2 }),
    new LayerType('globalMaxPooling1d', 'pooling', tf.layers.globalMaxPooling1d, { dimensions: 1 }),
    new LayerType('globalMaxPooling2d', 'pooling', tf.layers.globalMaxPooling2d, { dimensions: 2 }),
    new LayerType('maxPooling1d', 'pooling', tf.layers.maxPooling1d, { dimensions: 1 }),
    new LayerType('maxPooling2d', 'pooling', tf.layers.maxPooling2d, { dimensions: 2 }),
    new LayerType('maxPooling3d', 'pooling', tf.layers.maxPooling3d, { dimensions: 3 })

  ];



  constructor(@Inject(DOCUMENT) private document: Document, private tensorflowService: TensorFlowMainService, private tensorflowModelDrawService: TensorFlowModelDrawService,
    private electronService: ElectronService, public hardwareService: HardwareService, private uploadService: UploadService, private tensorflowTrainService: TensorFlowTrainService) {

      this.d = this.tensorflowService.d;

      this.electronService.ipcRenderer.on('export-model', (event: Event) => {
        this.tensorflowService.exportModel();
      });


      this.electronService.ipcRenderer.on('checkPorts',  (event: Event, portlist: any) => {
        this.hardwareService.checkPorts(portlist);
      });


      this.electronService.ipcRenderer.on('comports', (event: Event, comports: any) => {
        if (this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === comports[0].serialPort).length === 0) {
          const mcu = this.hardwareService.microcontrollers.filter(m => m.serialPort.path === comports[0].serialPort)[0];
          if (mcu) {
            this.d.selectOptionMicrocontroller = mcu;
            this.tensorflowService.addMicrocontroller(mcu, false);
          }
        }
      });

      this.hardwareService.connectWithMicrocontroller.subscribe(res => {
        this.tensorflowService.addMicrocontroller(res, true);
      });


  }



  ngOnInit(): void {
    if (this.d.selectedModel.outputs.length === 0) {
      this.tensorflowService.addOutput();
    }
    this.updateOutputUnits();

    // this.electronService.ipcRenderer.send('listSerialPorts', false);

    const activeMicrocontrollers = this.hardwareService.getActiveMicroControllers();
    // console.log(activeMicrocontrollers);
    for (const mcu of activeMicrocontrollers) {
      this.tensorflowService.addMicrocontroller(mcu);
    }
    this.updateNetworkVisualization();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateNetworkVisualization();
  }

  newModel() {
    this.d.selectedModel = new Model(uuid(), 'model', ModelType.custom);
    this.tensorflowService.updateModelSettings(this.d.selectedModel);
  }

  loadModel() {
    this.electronService.ipcRenderer.send('loadMLModel');
  }

  saveModel(copy: boolean) {
    this.tensorflowService.saveModel(copy);
  }

  updateNetworkVisualization() {
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  updateUnits(index: number) {
    const nextLayer = this.d.selectedModel.layers[index + 1];
    if (nextLayer && nextLayer.type && nextLayer.type.subgroup === 'normalization') {
      nextLayer.options.units.value = this.getUnits(index);
    }
    this.updateNetworkVisualization();
  }

  addInputItem() {
    this.tensorflowService.addInputItem();
    this.updateInputUnits();
  }

  updateInputType(index: number, event: Event) {
    if (index >= 5) {
      this.d.selectedModel.inputs[index].type += 1;
      if (this.d.selectedModel.inputs[index].type >= 3) {
        this.d.selectedModel.inputs[index].type = 0;
      }
      event.stopPropagation();
    }
  }

  updateInput(index: number) {
    this.tensorflowService.updateInput(index);

  }

  deleteInputItem(index: number) {
    this.tensorflowService.deleteInputItem(index);
  }

  addLabel(i: number) {
    this.tensorflowService.addLabelToClassifier(i);
    this.updateOutputUnits();
  }


  deleteLabel(name: string, i: number) {
    this.tensorflowService.deleteLabel(name, i);
    this.updateOutputUnits();
  }



  addOutput() {
    this.tensorflowService.addOutput();
    this.updateOutputUnits();
  }

  deleteClassifier(index: number) {
    this.tensorflowService.deleteClassifier(index);
    this.updateOutputUnits();
  }

  selectClassifier(id: string) {
    this.tensorflowService.selectClassifier(id);
    this.updateOutputUnits();
  }

  updateOutputUnits() {
    const nrOfActiveClassifiers = this.tensorflowService.getNrOfActiveClassifiers();
    if (nrOfActiveClassifiers) {
      this.d.selectedModel.layers[this.d.selectedModel.layers.length - 1].options.units.value = nrOfActiveClassifiers.total;
      this.d.labels = nrOfActiveClassifiers.labels;
      this.updateNetworkVisualization();
    }
  }

  updateInputUnits() {
    const nrOfActiveInputs = this.tensorflowService.getNrOfActiveInputs();
    this.d.selectedModel.layers[0].options.units.value = nrOfActiveInputs > 1 ? nrOfActiveInputs : 1;
    this.updateNetworkVisualization();
  }

  updateClassifier(i: number, pos: number) {
    this.tensorflowService.updateClassifier(i, pos);
  }

  compareFunction(el1: any, el2: any) {
    return el1 && el2 ? el1.name === el2.name : el1 === el2;
  }

  addMicrocontroller() {
    this.tensorflowService.addMicrocontroller();
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  deleteMicrocontroller(port: string) {
    this.tensorflowService.deleteMicrocontroller(port);
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  toggleRecordMotor(serialPath: string, motor: Motor) {
    for (const set of this.d.dataSets) {
      for (const m of set.m) {
        if (m.mcu.serialPath === serialPath && m.id === motor.id) {
          m.record = motor.record;
          m.visible = true;
        }
      }
    }
    this.d.selectedModel.layers[0].options.actuators.value = this.tensorflowService.getNrOfActiveMotors();
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  openCloseItem(id: string) {
    const item = this.document.getElementById('open_' + id);
    const section = this.document.getElementById('section_' + id);
    if (item && section) {
      if (item.classList.contains('open')) {
        item.classList.remove('open');
        section.classList.add('hidden');
      } else {
        item.classList.add('open');
        section.classList.remove('hidden');
      }
    }
  }



  updateCommunicationSpeed(serialPath: string) {
    const microcontroller = this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === serialPath)[0];
    if (microcontroller) {
      this.hardwareService.updateMicroController(microcontroller);

      // console.log(uploadModel);
      if (microcontroller.motors[0].type !== ActuatorType.pneumatic) {
        const uploadModel = this.uploadService.createUploadModel(null, microcontroller);
        uploadModel.config.motors = microcontroller.motors;
        this.electronService.ipcRenderer.send('updateMotorSetting', uploadModel);
      }

      // console.log(microcontroller.updateSpeed);
    }
  }


  addLayer(index: number) {
    const newLayer = new Layer('HL-'+ uuid());
    newLayer.type = this.LayerTypes[0];
    this.d.selectedModel.layers.splice((index + 1), 0, newLayer);
    this.updateLayerOptions(index + 1);
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  deleteLayer(index: number) {
    this.d.selectedModel.layers.splice(index, 1);
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  hideLayer(index: number) {
    this.d.selectedModel.layers[index].hidden = !this.d.selectedModel.layers[index].hidden;
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  getUnits(index: number) {
    return this.d.selectedModel.layers[index].options.units !== undefined ? this.d.selectedModel.layers[index].options.units.value :
    this.d.selectedModel.layers[index].options.kernelSize ? this.d.selectedModel.layers[index].options.kernelSize.value[0] :
    this.d.selectedModel.layers[index].options.poolSize ? this.d.selectedModel.layers[index].options.poolSize.value[0] : 1;
  }

  updateLayerOptions(index: number) {

    const layer = this.d.selectedModel.layers[index];

    switch(layer.type.subgroup) {
      case 'convolutional':
        layer.options = new Convolutional_options(layer.type);
        break;
      case 'recurrent':
        layer.options = new Recurrent_options(layer.type);
        break;
      case 'pooling':
        layer.options = new Pooling_options(layer.type);
        break;
      case 'basic':
        layer.options = new Basic_options(layer.type);
        break;
      case 'normalization': {
          layer.options = new Normalization_options(layer.type);
          layer.options.units.value = this.getUnits(index - 1);
        }
        break;
      default:
        layer.options = new Options();
    }

    this.updateNetworkVisualization();

  }


  initializeModel() {
    if (this.d.selectedModel) {
      this.tensorflowTrainService.processingModel();
    }
  }





}
