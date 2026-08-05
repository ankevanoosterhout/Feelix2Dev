import { Component, Input, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

import { FileService } from './../../services/file.service';
import { ElectronService } from './../../services/electron.service';
import { DataService } from './../../services/data.service';

import { EffectType } from './../../models/configuration.model';
import { File } from '../../models/file.model';


@Component({
    selector: 'app-effect-list',
    standalone: true,
    imports: [ CommonModule ],
    template: `
      <div class="open-tabs effects" id="effect-tabs">
        <ul class="tabs effects" id="effect-list">
          @if (file?.configuration !== undefined) {
            @for (tab of file.configuration.openTabs; track tab) {
            <li [ngClass]="{ active: tab.isActive }" (click)="selectTab(tab)">
              <div class="filename-tab">{{ tab.name }}</div>
              <div class="close closeTab effects" (click)="closeTab(tab)"><div></div></div>
            </li>
            }
          }
        </ul>
        @if (this.scrollTab) {
        <div class="scroll-arrows">
          <div (click)="scroll(-1)" class="arrow-left"><div class="arrow left"></div></div>
          <div (click)="scroll(1)" class="arrow-right"><div class="arrow right"></div></div>
        </div>
        }
      </div>
    `,
    styleUrls: ['./file-list.component.css'],
})

export class EffectListComponent implements OnInit {

  // tslint:disable-next-line: variable-name
  public _list = '';

  public file: File | undefined;
  delete: boolean | undefined;

  folder: string[] = [];
  rulerVisible = false;

  public scrollTab = false;

  constructor(@Inject(DOCUMENT) private document: Document, public fileService: FileService, private electronService: ElectronService,
    private dataService: DataService) {}

  @Input()
  set list(list: string) {
    this._list = (list && list.trim()) || '';
  }

  ngOnInit(): void {
    this.file = this.fileService.getActiveFile();
    this.scrollVisible(window.innerWidth);

    this.fileService.fileObservable.subscribe(files => {
      this.file = files.filter(f => f.isActive)[0];
      this.scrollVisible(window.innerWidth - 45);
    });
  }

  selectTab(tab: any) {
    let effect = this.getEffect(tab);
    if (effect) {
      this.fileService.setEffectActive(effect);
      this.dataService.deselectAll();
      if (this.electronService.isElectronApp) {
        this.electronService.ipcRenderer.send('updateMenu', {
          visible: effect.grid.visible,
          snap: effect.grid.snap,
          lock: effect.grid.lockGuides
        });

        this.electronService.ipcRenderer.send('updateToolbar', { type: effect.type });
      }
    }
  }

  getEffect(tab: any) {
    if (this.file) {
      for (const effect of this.file.effects) {
        if (effect.id === tab.id) {
          return effect;
        } else if (effect.type === EffectType.midi) { // && effect.dataType === MidiDataType.notes
          if (effect.data && effect.data.length > 0) {
            const midiEffect = effect.data.filter((d: { effect: { id: any; }; }) => d.effect.id === tab.id)[0];
            if (midiEffect) {
              return midiEffect.effect;
            }
          }
        }
      }
    }
    return;
  }

  closeTab(tab: any) {
    this.fileService.closeEffectTab(tab.id);
  }


  scroll(direction: number) {
    const effectObject = this.document.getElementById('effect-list');
    const offset = effectObject?.offsetLeft;
    if (offset !== undefined) {
      const newOffset = offset + (75 * direction);
      const availableSpace = Math.floor(window.innerWidth / 155);
      const length = this.file ? this.file.effects.length : 0;
      if (newOffset <= 0 && newOffset > (length - availableSpace) * -155) {
        if (effectObject) {
          effectObject.style.marginLeft = newOffset + 'px';
        }
      }
    }
  }

  scrollVisible(window: number) {
    if (this.file && (this.file.effects.length * 155) > window) {
      this.scrollTab = true;
    } else {
      this.scrollTab = false;
    }
  }

}
