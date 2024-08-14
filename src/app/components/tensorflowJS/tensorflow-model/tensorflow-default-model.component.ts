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
      icon: 'classification.svg',
      name: 'Convolutional Neural Network',
      description: 'Identifies features and patterns. Useful for tasks such as analyzing trends.',
      color: '#ED1A75'
    },
    {
      slug: 'RNN',
      icon: 'memory.svg',
      name: 'Recurrent Neural Network',
      description: 'Remembers information over time. Useful for tasks where the sequence of data matters.',
      color: '#F2662D'
    },
    {
      slug: 'FNN',
      icon: 'prediction.svg',
      name: 'Feedforward Neural Network',
      description: 'Makes predictions based on past data. Suitable for straightforward tasks like classifying data or predicting outcomes.',
      color: '#F0747A'
    },
    {
      slug: 'GAN',
      icon: 'generative.svg',
      name: 'Generative Adversarial Network',
      description: 'Creates diverse and realistic content by learning from existing data. Ideal for generating different ways to perform tasks with distinct expressions or movements.',
      color: '#C05BEB'
    },
    {
      slug: 'DQN',
      icon: 'reinforcement_learning.svg',
      name: 'Deep Q-Network',
      description: 'Learns to make decisions through trial and error. Ideal for tasks where the best action needs to be learned over time.',
      color: '#EBAE52'
    },
    {
      slug: 'Custom',
      icon: 'custom.svg',
      name: 'Custom Neural Network',
      description: 'Design your model from scratch.',
      color: '#7065EB'
    }
  ]

  constructor(private tensorflowService: TensorFlowMainService) {
    this.d = this.tensorflowService.d;
  }


  createDefaultModel(modelType: string) {
    const overwrite = this.d.selectedModel ? true : false;
    let newModel: Model;

    switch(modelType) {
      case 'CNN': {
          newModel = new Model(uuid(), 'Convolutional Neural Network', ModelType.CNN);
        }
        break;
      case 'RNN': {
          newModel = new Model(uuid(), 'Recurrent Neural Network', ModelType.RNN);
        }
        break;
      case 'FNN': {
          newModel = new Model(uuid(), 'Feedforward Neural Network', ModelType.FNN);
        }
        break;
      case 'GAN': {
          newModel = new Model(uuid(), 'Generative Adversarial Network', ModelType.GAN);
        }
        break;
      case 'DQN': {
          newModel = new Model(uuid(), 'Deep Q-Network', ModelType.DQN);
        }
        break;
      default: {
          newModel = new Model(uuid(), 'custom model', ModelType.custom);
        }
    }

    if (overwrite) {
      const firstLayer = this.d.selectedModel.layers[0];
      const inputs = this.d.selectedModel.inputs;
      const outputs = this.d.selectedModel.outputs;

      newModel.layers[0] = firstLayer;
      newModel.inputs = inputs;
      newModel.outputs = outputs;
    }

    this.d.selectedModel = newModel;

    this.tensorflowService.createModel.next(0);
  }





}
