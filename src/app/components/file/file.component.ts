import { Component } from '@angular/core';

@Component({
    selector: 'app-file',
    standalone: false,
    template: `

    `,
    styles: [``],
    // tslint:disable-next-line: no-inputs-metadata-property
    inputs: ['file'],
})

export class FileComponent {

  public file = {};

  constructor() { }

}
