import { Component } from '@angular/core';
import { Model, ModelType} from 'src/app/models/tensorflow.model';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { v4 as uuid } from 'uuid';
import { TensorFlowConfig } from 'src/app/models/tensorflow-config.model';

@Component({
  selector: 'app-tensorflow-default-model',
  templateUrl: 'tensorflow-default-model.component.html',
  styleUrls: ['../../windows/effects/effects.component.css','./../tensorflow.component.scss'],
})
export class TensorflowDefaultModelComponent {

  public d: TensorFlowData;
  public config: TensorFlowConfig;

  defaultModelOptions = [
    {
      slug: 'CNN',
      name: 'Convolutional Neural Network (CNN)',
      description: 'Classification involving spatial data',
      color: '#ED1A75'
    },
    {
      slug: 'RNN',
      name: 'Recurrent Neural Network (RNN)',
      description: 'Prediction problems based on sequential data',
      color: '#F2662D'
    },
    {
      slug: 'LSTM',
      name: 'Long Short-Term Memory Network (LSTM)',
      description: 'Learning long-term dependencies in sequence data',
      color: '#EBAE52'
    },
    {
      slug: 'DFNN',
      name: 'Deep Feedforward Neural Network (DFNN)',
      description: 'Quintessential deep learning models',
      color: '#F0747A'
    },
    {
      slug: 'regression',
      name: 'Regression',
      description: 'Predict a dependent variable based on one or more independent variables',
      color: '#C05BEB'
    },
    {
      slug: 'Custom',
      name: 'Custom Neural Network',
      description: 'Design your model from scratch',
      color: '#7065EB'
    }
  ]

  constructor(private tensorflowService: TensorFlowMainService) {
    this.d = this.tensorflowService.d;
  }


  createDefaultModel(modelType: string) {


    switch(modelType) {
      case 'CNN': {
          this.d.selectedModel = new Model(uuid(), 'CNN model', ModelType.CNN);
        }
        break;
      case 'RNN': {
          this.d.selectedModel = new Model(uuid(), 'RNN model', ModelType.RNN);
        }
        break;
      case 'DFNN': {
          this.d.selectedModel = new Model(uuid(), 'Deep learning model', ModelType.DFNN);
        }
        break;
      case 'LSTM': {
          this.d.selectedModel = new Model(uuid(), 'RNN model', ModelType.LSTM);
        }
        break;
      case 'regression': {
          this.d.selectedModel = new Model(uuid(), 'Regression model', ModelType.regression);
        }
        break;
      default: {
          this.d.selectedModel = new Model(uuid(), 'custom model', ModelType.custom);
        }
    }

    this.tensorflowService.createModel.next(0);

  }

}
