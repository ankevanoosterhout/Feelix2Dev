import { MicroController } from "./hardware.model";
import { DataSet, InputColor, Model, ModelType, NN_options } from "./tensorflow.model";
import { v4 as uuid } from 'uuid';

export class ML_Data {
  id: string;
  classifier: any;
  data: Array<any> = [];

  constructor(id: string) {
    this.id = id;
  }
}

export class TensorFlowData {

  selectedMicrocontrollers: Array<MicroController> = [];
  selectOptionMicrocontroller: MicroController;
  selectedModel: Model = new Model(uuid(), 'model', ModelType.neuralNetwork);

  kMeans_options = [{ name: 'k clusters', value: 3 },
                    { name: 'Max iterations', value: 4 },
                    { name: 'threshold', value: 0.5 } ];

  motorList = [];

  dataSets: Array<DataSet> = [];
  selectedDataset: DataSet = null;
  predictionDataset: DataSet = null;
  multipleSelect = { min: 0, max: 0, active: false };

  processing = false;

  classify = false;
  recording = { active: false, starttime: null };

  trimLinesVisible = false;
  trimLines = [ { id: 0, value: null }, { id: 1, value: null } ];

  colorList = [ new InputColor('angle', '#43E6D5'),
                new InputColor('velocity', '#00AEEF'),
                new InputColor('direction', '#E18257'),
                new InputColor('pressure', '#4390E6'),
                new InputColor('target', '#7778E0') ];

  colorOptions = ['#43E6D5', '#00AEEF', '#E18257', '#4390E6', '#7778E0', '#F93858', '#B533FF', '#FCFF33', '#BBFF33' ];

  size = 0;

  ML_OutputData: Array<ML_Data> = [];
}
