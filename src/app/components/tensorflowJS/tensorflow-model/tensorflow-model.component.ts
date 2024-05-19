
import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { Activation, ActivationLabelMapping, Basic_options, Classifier, Constraint, ConstraintLabelMapping, Convolutional_options, DataFormat, DataFormatMapping, Layer, LayerType, Model, ModelType, ModelTypeMapping, Normalization_options, Options, Padding, PaddingMapping, Pooling_options, Recurrent_options, Regularizer, RegularizerLabelMapping } from 'src/app/models/tensorflow.model';
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

@Component({
  selector: 'app-tensorflow-model',
  templateUrl: 'tensorflow-model.component.html',
  styleUrls: ['../../windows/effects/effects.component.css','./../tensorflow.component.scss'],
})
export class TensorflowModelComponent implements OnInit {

  public d: TensorFlowData;

  public ActivationLabelMapping = ActivationLabelMapping;
  public activationOptions = Object.values(Activation);

  public RegularizerLabelMapping = RegularizerLabelMapping;
  public regularizerOptions = Object.values(Regularizer);

  public ModelTypeMapping = ModelTypeMapping;
  public modelTypeOptions = Object.values(ModelType).filter(value => typeof value === 'number');

  public ConstraintLabelMapping = ConstraintLabelMapping;
  public constraintOptions = Object.values(Constraint);

  public DataFormatMapping = DataFormatMapping;
  public dataFormatOptions = Object.values(DataFormat);

  public PaddingMapping = PaddingMapping;
  public paddingOptions = Object.values(Padding);


  public LayerTypes = [
    new LayerType('dense', 'basic', 'Creates a dense (fully connected) layer.', tf.layers.dense),

    new LayerType('conv1d', 'convolutional', 'This layer creates a convolution kernel that is convolved with the layer input over a single spatial (or temporal) dimension to produce a tensor of outputs.', tf.layers.conv1d),
    new LayerType('conv2d', 'convolutional', 'This layer creates a convolution kernel that is convolved with the layer input to produce a tensor of outputs.', tf.layers.conv2d),
    new LayerType('conv2dTranspose', 'convolutional', 'This layer creates a convolution kernel that is convolved with the layer input to produce a tensor of outputs.', tf.layers.conv2dTranspose),
    new LayerType('conv3d', 'convolutional', '3D convolution layer (e.g. spatial convolution over volumes).', tf.layers.conv3d),
    new LayerType('cropping2D', 'convolutional', 'Cropping layer for 2D input', tf.layers.cropping2D),
    new LayerType('depthwiseConv2d', 'convolutional', 'Depthwise separable 2D convolution.', tf.layers.depthwiseConv2d),
    new LayerType('separableConv2d', 'convolutional', 'Depthwise separable 2D convolution.', tf.layers.separableConv2d),
    new LayerType('upSampling2d', 'convolutional', 'Upsampling layer for 2D inputs.', tf.layers.upSampling2d),

    new LayerType('convLstm2d', 'recurrent', 'Convolutional LSTM layer.', tf.layers.convLstm2d),
    new LayerType('convLstm2dCell', 'recurrent', 'Cell class for ConvLSTM2D.', tf.layers.convLstm2dCell),
    new LayerType('gru', 'recurrent', 'Gated Recurrent Unit', tf.layers.gru),
    new LayerType('gruCell', 'recurrent', 'Cell class for GRU.', tf.layers.gruCell),
    new LayerType('lstm', 'recurrent', 'Long-Short Term Memory layer', tf.layers.lstm),
    new LayerType('lstmCell', 'recurrent', 'Cell class for LSTM.', tf.layers.lstmCell),
    new LayerType('rnn', 'recurrent', 'Base class for recurrent layers.', tf.layers.rnn),
    new LayerType('simpleRNN', 'recurrent', 'Fully-connected RNN where the output is to be fed back to input.', tf.layers.simpleRNN),
    new LayerType('simpleRNNCell', 'recurrent', 'Cell class for SimpleRNN.', tf.layers.simpleRNNCell),
    new LayerType('stackedRNNCells', 'recurrent', 'Wrapper allowing a stack of RNN cells to behave as a single cell. For efficient stacked RNNs.', tf.layers.stackedRNNCells),

    new LayerType('averagePooling1d', 'pooling', 'Average pooling operation for spatial data.', tf.layers.averagePooling1d),
    new LayerType('averagePooling2d', 'pooling', 'Average pooling operation for spatial data.', tf.layers.averagePooling2d),
    new LayerType('averagePooling3d', 'pooling', 'Average pooling operation for 3D data.', tf.layers.averagePooling3d),
    new LayerType('globalAveragePooling1d', 'pooling', 'Global average pooling operation for temporal data.', tf.layers.globalAveragePooling1d),
    new LayerType('globalAveragePooling2d', 'pooling', 'Global average pooling operation for spatial data.', tf.layers.globalAveragePooling2d),
    new LayerType('globalMaxPooling1d', 'pooling', 'Global max pooling operation for temporal data.', tf.layers.globalMaxPooling1d),
    new LayerType('globalMaxPooling2d', 'pooling', 'Global max pooling operation for spatial data.', tf.layers.globalMaxPooling2d),
    new LayerType('maxPooling1d', 'pooling', 'Max pooling operation for temporal data.', tf.layers.maxPooling1d),
    new LayerType('maxPooling2d', 'pooling', 'Max pooling operation for spatial data.', tf.layers.maxPooling2d),
    new LayerType('maxPooling3d', 'pooling',  'Max pooling operation for 3D data.', tf.layers.maxPooling3d),

    new LayerType('layerNormalization', 'normalization', 'Layer-normalization layer', tf.layers.layerNormalization),
    new LayerType('batchNormalization', 'normalization', 'Batch normalization layer', tf.layers.batchNormalization)
  ];



  constructor(@Inject(DOCUMENT) private document: Document, private tensorflowService: TensorFlowMainService, private tensorflowModelDrawService: TensorFlowModelDrawService, private electronService: ElectronService,
    public hardwareService: HardwareService, private uploadService: UploadService) {

      this.d = this.tensorflowService.d;

      this.electronService.ipcRenderer.on('save-model', (event: Event, copy: boolean) => {
        this.tensorflowService.saveModel(copy);
      });

      this.electronService.ipcRenderer.on('export-model', (event: Event) => {
        this.tensorflowService.exportModel();
      });

      this.electronService.ipcRenderer.on('new-model', (event: Event) => {
        this.d.selectedModel = new Model(uuid(), 'model', ModelType.custom);
        this.tensorflowService.updateModelSettings(this.d.selectedModel);
      });

      this.electronService.ipcRenderer.on('checkPorts',  (event: Event, portlist: any) => {
        console.log(portlist);
        this.hardwareService.checkPorts(portlist);
      });


      this.electronService.ipcRenderer.on('comports', (event: Event, comports: any) => {
        console.log(comports);
        if (this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === comports[0].serialPort).length === 0) {
          const mcu = this.hardwareService.microcontrollers.filter(m => m.serialPort.path === comports[0].serialPort)[0];
          console.log(mcu);
          if (mcu) {
            this.d.selectOptionMicrocontroller = mcu;
            this.tensorflowService.addMicrocontroller(mcu, false);
          }
        }
      });

      this.hardwareService.connectWithMicrocontroller.subscribe(res => {
        console.log(res);
        this.tensorflowService.addMicrocontroller(res, true);
      });

  }



  ngOnInit(): void {
    this.d.selectedModel.outputs.push(new Classifier(uuid(), 'Classifier-' + (this.d.selectedModel.outputs.length + 1)));
    this.d.selectedModel.outputs[0].active = true;
    this.tensorflowService.addLabelToClassifier(0);

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


  updateNetworkVisualization() {
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  updateModelType() {
    this.tensorflowService.updateModelType();
  }

  addInputItem() {
    this.tensorflowService.addInputItem();
    this.updateInputUnits();
  }

  updateInput(index: number) {
    this.tensorflowService.updateInput(index);
  }

  addClassifier() {
    this.tensorflowService.addClassifier();
    this.updateOutputUnits();
  }

  deleteClassifier(index: number) {
    this.tensorflowService.deleteClassifier(index);
  }

  selectClassifier(id: string) {
    this.tensorflowService.selectClassifier(id);
    this.updateOutputUnits();
  }

  updateOutputUnits() {
    const nrOfActiveClassifiers = this.tensorflowService.getNrOfActiveClassifiers();
    this.d.selectedModel.layers[this.d.selectedModel.layers.length - 1].options.units.value = nrOfActiveClassifiers > 1 ? nrOfActiveClassifiers : 1;
    this.updateNetworkVisualization();
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


  toggleRecordMotor(serialPath: string, motor: Motor) {
    for (const set of this.d.dataSets) {
      for (const m of set.m) {
        if (m.mcu.serialPath === serialPath && m.id === motor.id) {
          m.record = motor.record;
          m.visible = true;
        }
      }
    }
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
    const newLayer = new Layer('hidden layer ' + (index + 1));
    this.d.selectedModel.layers.splice((index + 1), 0, newLayer);
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  deleteLayer(index: number) {
    this.d.selectedModel.layers.splice(index, 1);
    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }

  updateLayerOptions(index: number) {

    const layer = this.d.selectedModel.layers[index];
    console.log(layer);

    switch(layer.type.subgroup) {
      case 'convolutional':
        layer.options = new Convolutional_options();
        break;
      case 'recurrent':
        layer.options = new Recurrent_options();
        break;
      case 'pooling':
        layer.options = new Pooling_options();
        break;
      case 'basic':
        layer.options = new Basic_options();
        break;
      case 'normalization':
        layer.options = new Normalization_options();
        break;
      default:
        layer.options = new Options();
    }

  }

}
