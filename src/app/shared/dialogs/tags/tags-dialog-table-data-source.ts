import { CentralServerService } from '../../../services/central-server.service';
import { DataResult } from '../../../types/DataResult';
import { DialogTableDataSource } from '../dialog-table-data-source';
import { Injectable } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { SpinnerService } from '../../../services/spinner.service';
import { TableColumnDef } from '../../../types/Table';
import { Tag } from '../../../types/Tag';
import { TranslateService } from '@ngx-translate/core';
import { Utils } from '../../../utils/Utils';

@Injectable()
export class TagsDialogTableDataSource extends DialogTableDataSource<Tag> {
  constructor(
    public spinnerService: SpinnerService,
    public translateService: TranslateService,
    private messageService: MessageService,
    private router: Router,
    private centralServerService: CentralServerService) {
    super(spinnerService, translateService);
    // Init
    this.initDataSource();
  }

  public loadDataImpl(): Observable<DataResult<Tag>> {
    return new Observable((observer) => {
      // Get data
      this.centralServerService.getTags(this.buildFilterValues(),
        this.getPaging(), this.getSorting()).subscribe((tags) => {
          // Ok
          observer.next(tags);
          observer.complete();
        }, (error) => {
          // No longer exists!
          Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'general.error_backend');
          // Error
          observer.error(error);
        });
    });
  }

  public buildTableColumnDefs(): TableColumnDef[] {
    return [
      {
        id: 'id',
        name: 'tags.id',
        class: 'text-left col-30p',
        sorted: true,
        direction: 'asc',
        sortable: true,
      },
      {
        id: 'description',
        name: 'general.description',
        class: 'text-left',
        sortable: true,
      },
    ];
  }
}
